import mitt, { Emitter } from 'mitt';
import {
  BookConfig,
  ReaderState,
  ReaderEvents,
  ShortcutAction,
  ReaderSettings,
  AudioPlaySettings,
  EpubViewSettings,
} from '../types';
import { EpubManager } from './epub-manager';

const SETTINGS_KEY = 'myreadcast-reader-settings';
const defaultSettings: ReaderSettings = {
  epubView: {
    fontFamily: 'sans-serif',
    fontSize: 100,
    lineHeight: 1.5,
  },
  audioPlay: {
    volume: 1,
    playbackRate: 1,
  }
};

const loadReaderSettings = (): ReaderSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Deep merge with defaults to ensure all keys are present
      return {
        epubView: { ...defaultSettings.epubView, ...(parsed.epubView || {}) },
        audioPlay: { ...defaultSettings.audioPlay, ...(parsed.audioPlay || {}) },
      }
    }
  } catch (error) {
    console.error('Failed to load reader settings:', error);
  }
  return defaultSettings;
};

const saveReaderSettings = (settings: ReaderSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save reader settings:', error);
  }
};

class AudioBookReader {
  private static instance: AudioBookReader;
  private emitter: Emitter<ReaderEvents> = mitt<ReaderEvents>();
  private state: ReaderState;

  // Manager Instances
  private epubManager: EpubManager;

  private constructor() {
    this.state = this.getInitialState();
    this.epubManager = new EpubManager(this.setState.bind(this));
  }

  public static getInstance(): AudioBookReader {
    if (!AudioBookReader.instance) {
      AudioBookReader.instance = new AudioBookReader();
    }
    return AudioBookReader.instance;
  }

  private getInitialState(): ReaderState {
    const settings = loadReaderSettings();
    return {
      isOpen: false,
      isPlaying: false,
      settings: loadReaderSettings(),
      
      currentBook: null,
      toc: [],

      error: null, // Initialize error state
    };
  }

  /**
   * 
   * @returns Return a new copy of the ReaderState
   */
  public getState(): ReaderState {
    return { ...this.state };
  }

  private setState(newState: Partial<ReaderState>) {
    // Merge the new state with the existing state
    const updatedState = { ...this.state, ...newState };
    
    // Only emit if the state has actually changed
    if (JSON.stringify(this.state) !== JSON.stringify(updatedState)) {
      this.state = updatedState;
      this.emit('state-changed', this.state);
    }
  }

  public async open(bookConfig: BookConfig) {
    console.log('Opening book:', bookConfig.title || bookConfig.path);
    // Reset state before opening a new book
    this.close();
    
    this.setState({
      isOpen: true,
      currentBook: bookConfig,
    });

    if (bookConfig.type === 'epub' || bookConfig.type === 'audible_epub') {
      await this.epubManager.load(bookConfig.path);
    }
    // TODO: Handle 'audios' type by loading AudioManager

    this.emit('book-loaded', bookConfig);
  }

  public close() {
    if (!this.state.isOpen) return;

    console.log('Closing reader.');
    this.epubManager.destroy();
    // TODO: Destroy other managers
    
    this.setState(this.getInitialState());
  }

  public nextPage() {
    this.epubManager.nextPage();
  }

  public prevPage() {
    this.epubManager.prevPage();
  }

  public getToc() {
    return this.epubManager.getToc();
  }

  public goToHref(href: string) {
    this.epubManager.goToHref(href);
  }

  public attachView(element: HTMLElement) {
    if (this.state.currentBook?.type === 'epub' || this.state.currentBook?.type === 'audible_epub') {
      this.epubManager.attachTo(element, this.state.settings.epubView);
    }
  }

  public detachView() {
    this.epubManager.detach();
  }
  
  public handleShortcut(action: ShortcutAction) {
    console.log(`Shortcut action: ${action}`);
    switch (action) {
      case 'togglePlay':
        // this.audioManager.togglePlay();
        break;
      case 'nextPage':
        this.epubManager.nextPage();
        break;
      case 'prevPage':
        this.epubManager.prevPage();
        break;
      case "closeModal":
        this.close();
        break;
    }
  }

  public updateSettings(updates: { epubView?: Partial<EpubViewSettings>, audioPlay?: Partial<AudioPlaySettings> }) {
    console.log("update reader settings:", updates);
    const currentSettings = this.state.settings;
    const newSettings: ReaderSettings = {
      epubView: { ...currentSettings.epubView, ...(updates.epubView || {}) },
      audioPlay: { ...currentSettings.audioPlay, ...(updates.audioPlay || {}) },
    };

    saveReaderSettings(newSettings);
    
    if (updates.epubView) {
      this.epubManager.applySettings(newSettings.epubView);
    }

    this.setState({ settings: newSettings });
  }

  // --- Public Event Subscription Methods ---
  public on<Key extends keyof ReaderEvents>(
    type: Key,
    handler: (event: ReaderEvents[Key]) => void
  ) {
    this.emitter.on(type, handler);
  }

  public once<Key extends keyof ReaderEvents>(
    type: Key,
    handler: (event: ReaderEvents[Key]) => void
  ) {
    const onceHandler = (event: ReaderEvents[Key]) => {
      // 首先执行原始的处理函数
      handler(event);
      // 然后立即将自己从监听器中移除
      this.off(type, onceHandler);
    };
    this.emitter.on(type, onceHandler);
  }

  public off<Key extends keyof ReaderEvents>(
    type: Key,
    handler: (event: ReaderEvents[Key]) => void
  ) {
    this.emitter.off(type, handler);
  }

  // --- Private Event Emission Method ---

  private emit<Key extends keyof ReaderEvents>(
    type: Key,
    event: ReaderEvents[Key]
  ) {
    this.emitter.emit(type, event);
  }
}

export const reader = AudioBookReader.getInstance();



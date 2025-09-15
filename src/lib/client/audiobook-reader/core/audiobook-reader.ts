"use client";

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
import { AudioManager } from './audio-manager';

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
    autoPlay: false,
    continuousPlay: true,
  }
};

const loadReaderSettings = (): ReaderSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
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

  private epubManager: EpubManager;
  private audioManager: AudioManager;

  private constructor() {
    this.state = this.getInitialState();
    this.epubManager = new EpubManager(this.setState.bind(this));
    this.audioManager = new AudioManager(this.setState.bind(this));
  }

  private getInitialState(): ReaderState {
    return {
      isOpen: false,
      isPlaying: false,
      settings: loadReaderSettings(),
      
      currentBook: null,
      toc: [],
      // currentCfi?: string;              // 当前的 EPUB CFI (阅读进度)
      // currentTrack?: number;            // 当前选中的 track idx
      // currentTrackTime?: number;        // 当前 track 播放的时间点 (播放进度)
    };
  }

  public static getInstance(): AudioBookReader {
    if (!AudioBookReader.instance) {
      AudioBookReader.instance = new AudioBookReader();
    }
    return AudioBookReader.instance;
  }

  /**
   * 
   * @returns Return the ReaderState
   */
  public getState(): ReaderState {
    // return { ...this.state };
    return this.state;
  }

  /**
   * Merge the given partial state into the current {@link ReaderState}.  
   * If the state changes, update it and emit a `"state-changed"` event.
   *
   * @param newState - Partial state update
   * @emits `state-changed` - Emitted only when the state has actually changed
   */
  private setState(newState: Partial<ReaderState>) {
    const updatedState = { ...this.state, ...newState };
    
    // TODO - 使用 JSON.stringfy 并不是一个很好的对象比较的方案
    if (JSON.stringify(this.state) !== JSON.stringify(updatedState)) {
      this.state = updatedState;
      this.emit('state-changed', this.state);
      console.log("<reader> setState, state-changed (emit)", newState);
    } else {
      console.log("<reader> setState, no-changed");
    }
  }

  public async open(bookConfig: BookConfig) {
    console.log('<reader> Opening book:', bookConfig.title || bookConfig.path);
    
    // 1. Reset state before opening a new book
    this.close();
    
    // 2. Load new book
    this.setState({
      isOpen: true,
      currentBook: bookConfig,
    });

    if (bookConfig.type === 'epub' || bookConfig.type === 'audible_epub') {
      await this.epubManager.load(bookConfig.path);
    }
    if (bookConfig.type === 'audios' || bookConfig.type === 'audible_epub') {
      if (bookConfig.playlist && bookConfig.playlist.length > 0) {
        this.audioManager.load(bookConfig.playlist);
        this.audioManager.applySettings(this.state.settings.audioPlay);
      }
    }

    this.emit('book-loaded', bookConfig);
  }

  public close() {
    if (!this.state.isOpen) return;

    console.log('<reader> Closing reader.');
    this.epubManager.destroy();
    this.audioManager.destroy();
    
    this.setState(this.getInitialState());
  }

  public nextPage() {
    this.epubManager.nextPage();
  }

  public prevPage() {
    this.epubManager.prevPage();
  }

  public nextTrack() {
    this.audioManager.next();
  }

  public prevTrack() {
    this.audioManager.prev();
  }

  public togglePlay() {
    this.audioManager.togglePlay();
  }

  public getToc() {
    return this.epubManager.getToc();
  }

  /**
   * Get current trak's playback time lively
   * @returns 
   */
  public getCurrentSeek() {
    return this.audioManager.getCurrentSeek();
  }

  public goToHref(href: string) {
    this.epubManager.goToHref(href);
  }

  public rewind(seconds: number = 10) {
    this.audioManager.rewind(seconds);
  }

  public forward(seconds: number = 10) {
    this.audioManager.forward(seconds);
  }
  
  public setPlaybackRate(rate: number) {
    const maxRate = 2;
    const minRate = 0.5;
    const clamped = Math.max(minRate, Math.min(maxRate, rate));
    this.audioManager.setRate(clamped);
    this.updateSettings({ audioPlay: { playbackRate: clamped } })
  }

  public setVolume(volume: number) {
    const maxVolume = 1;
    const minVolume = 0;
    const clamped = Math.max(minVolume, Math.min(maxVolume, volume));
    this.audioManager.setVolume(clamped);
    this.updateSettings({ audioPlay: { volume: clamped } })
  }

  public playTrack(index: number, offset?: number) {
    this.audioManager.playTrack(index, offset);
  }
  
  public seekToTrack(trackIndex: number, offset: number) {
    this.audioManager.seekToTrack(trackIndex, offset);
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
    if (!this.state.isOpen) return;
    console.log(`<reader> handle shortcut action: ${action}`);
    switch (action) {
      case 'nextPage':
        this.epubManager.nextPage();
        break;
      case 'prevPage':
        this.epubManager.prevPage();
        break;
      case 'volumeUp':
        this.setVolume(this.state.settings.audioPlay.volume + 0.1);
        break;
      case 'volumeDown':
        this.setVolume(this.state.settings.audioPlay.volume - 0.1);
        break;
      case 'togglePlay':
        this.audioManager.togglePlay();
        break;
      case "closeModal":
        this.close();
        break;
    }
  }

  public updateSettings(updates: { epubView?: Partial<EpubViewSettings>, audioPlay?: Partial<AudioPlaySettings> }) {
    console.log("<reader> update reader settings:", updates);
    const currentSettings = this.state.settings;
    const newSettings: ReaderSettings = {
      epubView: { ...currentSettings.epubView, ...(updates.epubView || {}) },
      audioPlay: { ...currentSettings.audioPlay, ...(updates.audioPlay || {}) },
    };

    saveReaderSettings(newSettings);
    
    if (updates.epubView) {
      this.epubManager.applySettings(newSettings.epubView);
    }
    if (updates.audioPlay) {
      this.audioManager.applySettings(newSettings.audioPlay);
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

  private emit<Key extends keyof ReaderEvents>(
    type: Key,
    event: ReaderEvents[Key]
  ) {
    this.emitter.emit(type, event);
  }
}

export const reader = AudioBookReader.getInstance();



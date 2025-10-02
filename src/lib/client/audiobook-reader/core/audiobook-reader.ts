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
  TrackPosition,
} from '../types';
import { EpubManager } from './epub-manager';
import { AudioManager } from './audio-manager';
import { SmilManager } from './smil-manager';

const SETTINGS_KEY = 'myreadcast-reader-settings';
const DEFAULT_READER_SETTINGS: ReaderSettings = {
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
  if (typeof window === 'undefined') {
    return DEFAULT_READER_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        epubView: { ...DEFAULT_READER_SETTINGS.epubView, ...(parsed.epubView || {}) },
        audioPlay: { ...DEFAULT_READER_SETTINGS.audioPlay, ...(parsed.audioPlay || {}) },
      }
    }
  } catch (error) {
    console.error('Failed to load reader settings:', error);
  }
  return DEFAULT_READER_SETTINGS;
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
  private smilManager: SmilManager;

  private constructor() {
    this.state = this.getInitialState();
    this.epubManager = new EpubManager(this.updateState.bind(this));
    this.audioManager = new AudioManager(this.updateState.bind(this));
    this.smilManager = new SmilManager(this.updateState.bind(this));
  }

  private getInitialState(): ReaderState {
    return {
      isOpen: false,
      isPlaying: false,
      settings: loadReaderSettings(),
      
      currentBook: null,
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
   * @returns Return the ReaderState
   */
  public getState(): ReaderState {
    return this.state;
  }

  /**
   * Set a new {@link ReaderState} if it is actually different with the current.   
   * If the state changes, update it and emit a `"state-changed"` event.
   *
   * @param newState - new ReaderState object
   * @emits `state-changed` - Emitted only when the state has actually changed
   */
  private setState(newState: ReaderState) {
    // TODO - 使用 JSON.stringfy 并不是一个高效的对象比较方案
    if (JSON.stringify(this.state) !== JSON.stringify(newState)) {
      this.state = newState;
      this.emit('state-changed', this.state);
      console.log("<reader> setState, state-changed (emit)", newState);
    } else {
      console.log("<reader> setState, no-changed");
    }
  }

  /**
   * Merge the given partial state into the current {@link ReaderState}.  
   * If the state changes, update it and emit a `"state-changed"` event.
   *
   * @param updates - Partial state update
   * @emits `state-changed` - Emitted only when the state has actually changed
   */
  private updateState(updates: Partial<ReaderState>) {
    const updatedState = { ...this.state, ...updates };
    
    // TODO - 使用 JSON.stringfy 并不是一个高效的对象比较方案
    if (JSON.stringify(this.state) !== JSON.stringify(updatedState)) {
      this.state = updatedState;
      this.emit('state-changed', this.state);
      console.log("<reader> updateState, state-changed (emit)", updates);
    } else {
      console.log("<reader> updateState, no-changed");
    }
  }
  

  public async open(bookConfig: BookConfig) {
    console.log('<reader> Opening book:', bookConfig.title);
    
    // 1. Reset state before opening a new book
    this.close();
    
    // 2. Load new book
    if (bookConfig.type === 'epub') {
      await this.epubManager.load(bookConfig.opfPath!);
    } else if (bookConfig.type === 'audible_epub') {
      await this.epubManager.load(bookConfig.opfPath!);
      
      // TODO!
      // audiomanager & smilManager

    } else if (bookConfig.type === 'audios') {
      if (bookConfig.playlist) {
        const playlist = bookConfig.playlist;
        const trackPositions: TrackPosition[] = [];
        let totalDuration = 0;
        
        playlist.forEach((track, index) => {
          const startTime = totalDuration;
          const endTime = startTime + (track.duration || 0);
          trackPositions.push({ startTime, endTime, trackIndex: index });
          totalDuration = endTime;
        });

        this.updateState({ trackPositions: trackPositions, totalDuration: totalDuration });

        this.audioManager.loadPlaylist(bookConfig.playlist);
        this.audioManager.applySettings(this.state.settings.audioPlay);
      } else {
        console.warn(`<AudiobookReader.open> book [${bookConfig.path}] playlist undefined!`);
      }
    } else {
      console.error(`<AudiobookReader.open> book [${bookConfig.path}] typte (${bookConfig.type}) unrecognized!`);
      return;
    }
    this.emit('book-loaded', bookConfig);
    
    // 3. Update ReaderState
    this.updateState({
      isOpen: true,
      currentBook: bookConfig,
    });
  }

  public close() {
    if (!this.state.isOpen) return;

    console.log('<AudioBookReader> Closing reader.');
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
    this.audioManager.next(this.state.isPlaying);
  }

  public prevTrack() {
    this.audioManager.prev(this.state.isPlaying);
  }

  public togglePlay() {
    this.audioManager.togglePlay();
  }

  /**
   * Get current trak's playback time lively
   * @returns 
   */
  public getCurrentTrackSeek() {
    return this.audioManager.getCurrentTrackSeek();
  }

  public goToHref(href: string) {
    console.log(`<AudioBookReader.goToHref> href: ${href}`);
    this.epubManager.goToHref(href);
  }

  /**
   * 根据全局时间偏移量跳转到对应的轨道和位置
   * @param globalOffset 全局时间轴上的位置（秒）
   */
  public seekTo(globalOffset: number) {
    const trackPositions = this.state.trackPositions;
    if (trackPositions === undefined) {
      console.warn('<AudioBookReader.seekTo> trackPositions undefined');
      return;
    }

    // 确保偏移量的范围
    const totalDuration = trackPositions.length ? trackPositions[trackPositions.length - 1].endTime : 0;
    const targetTime = Math.min(Math.max(0, globalOffset), totalDuration);
    console.log(`<AudioBookReader.seekTo> globalOffset: ${globalOffset} (${targetTime})`);
    
    const targetTrack = trackPositions?.find(p => targetTime >= p.startTime && targetTime <= p.endTime);
    if (targetTrack) {
      const trackTime = targetTime - targetTrack.startTime;
      this.setTrack({
        trackIndex: targetTrack.trackIndex,
        offset: trackTime,
        play: this.state.isPlaying,
      });
    } else {
      console.warn('<AudioBookReader.seekTo> Cannot find the target track');
      return;
    }
  }

  /**
   * @returns 当前在全局时间轴上的位置（秒）
   */
  private getCurrentGlobalOffset(): number {
    const currentTrack = this.state.trackPositions?.find(
      track => track.trackIndex === this.state.currentTrackIndex
    );
    
    if (!currentTrack) {
      return 0;
    }
    
    const currentTrackTime = this.state.currentTrackTime ?? 0;
    return currentTrack.startTime + currentTrackTime;
  }
  
  /**
   * 
   * @param seconds 向后跳转的秒数，默认 10 秒
   */
  public rewind(seconds: number = 10) {
    // this.audioManager.rewind(seconds);
    const currentGlobalOffset = this.getCurrentGlobalOffset();
    const targetOffset = currentGlobalOffset - seconds;
    
    console.log(`<Rewind> ${currentGlobalOffset}s -> ${targetOffset}s (${seconds}s back)`);
    this.seekTo(targetOffset);
  }

  /**
   * @param seconds 向前跳转的秒数，默认 10 秒
   */
  public forward(seconds: number = 10) {
    const currentGlobalOffset = this.getCurrentGlobalOffset();
    const targetOffset = currentGlobalOffset + seconds;
    
    console.log(`<Forward> ${currentGlobalOffset}s -> ${targetOffset}s (${seconds}s forward)`);
    this.seekTo(targetOffset);
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

  /**
   * 跳转到指定音频 trackIndex 以及偏移位置, 可选是否播放
   * @param param0.trackIndex 目标音频 track index
   * @param param0.offset 目标音频内的偏移位置 (秒)
   * @param param0.play 是否跳转后立即播放 (默认 false)
   */
  public setTrack({ trackIndex, offset, play = false}: {
    trackIndex: number,
    offset?: number,
    play?: boolean,
  }) {
    this.audioManager.setTrack({ trackIndex, offset, play });
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

    this.updateState({ settings: newSettings });
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



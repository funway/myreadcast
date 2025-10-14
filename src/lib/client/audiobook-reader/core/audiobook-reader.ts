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
  ReadingProgress,
} from '../types';
import { EpubManager } from './epub-manager';
import { AudioManager } from './audio-manager';
import { SmilManager } from './smil-manager';
import { debounce, throttle } from '../../utils';

const SETTINGS_KEY = 'myreadcast-reader-settings';
const DEFAULT_READER_SETTINGS: ReaderSettings = {
  epubView: {
    fontFamily: 'sans-serif',
    fontSize: 100,
    lineHeight: 1.5,
  } as EpubViewSettings,

  audioPlay: {
    volume: 1,
    playbackRate: 1,
    autoPlay: false,
    continuousPlay: true,
    syncHighlight: true,
    syncPage: true,
  } as AudioPlaySettings,
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

  private epubManager: EpubManager;     // 负责 Epub 的加载和渲染
  private audioManager: AudioManager;   // 负责 Audio 的加载和播放
  private smilManager: SmilManager;     // 负责 SMIL 的加载和解析

  private constructor() {
    this.state = this.getInitialState();
    this.epubManager = new EpubManager(this.updateState.bind(this), this.emit.bind(this));
    this.audioManager = new AudioManager(this.updateState.bind(this), this.emit.bind(this));
    this.smilManager = new SmilManager(this.updateState.bind(this));

    this.on('epub-dblclick', this.onEpubDblclick.bind(this));
    this.on('epub-progress-updated', this.onEpubProgressUpdated.bind(this));
    this.on('audio-progress-updated', this.onAudioProgressUpdated.bind(this));
    this.on('audio-playing-updated', this.onAudioPlayingUpdated.bind(this));
  }

  private getInitialState(): ReaderState {
    return {
      isOpen: false,
      isPlaying: false,
      settings: loadReaderSettings(),
      book: null,
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

      if (updates.currentCfi !== undefined) {
        this.emit('epub-progress-updated', undefined);
      }

      if (updates.currentTrackIndex !== undefined || updates.currentTrackTime !== undefined) {
        this.emit('audio-progress-updated', undefined);
      }

      if (updates.isPlaying !== undefined) {
        this.emit('audio-playing-updated', updates.isPlaying);
      }
      
      if (updates.debug_msg !== undefined) {
        console.log("<reader> updateState, state-changed (emit)", updates);
      }
    } else {
      console.log("<reader> updateState, no-changed", updates);
    }
  }

  public async open(bookConfig: BookConfig) {
    console.log('<reader> Opening book:', bookConfig.title);
    
    // 1. Reset state before opening a new book
    this.close();

    // 2. Fetch reading progress
    const progress: ReadingProgress = {};
    try {
      const res = await fetch(`/api/progress/${bookConfig.id}`);
      if (res.ok) {
        const data = (await res.json()).data;
        console.log('<AudioBookReader.open> Got progress data from db:', data);
        if (data.epubCfi !== undefined && data.epubProgress !== undefined) {
          progress.epub = { cfi: data.epubCfi, progress: data.epubProgress };
        }
        if (data.trackIndex !== undefined && data.trackSeek !== undefined && data.trackProgress !== undefined) {
          progress.audio = { trackIndex: data.trackIndex, trackSeek: data.trackSeek, progress: data.trackProgress };
        }

        console.log('<AudioBookReader.open> Parsed progress', progress);
      } else {
      }
    } catch (err) {
      console.error('<AudioBookReader.open> Failed to load progress:', err);
    }

    // 2. Load new book
    if (bookConfig.type === 'epub') {
      await this.epubManager.load(bookConfig.opfPath!);
    } else if (bookConfig.type === 'audible_epub') {
      // 2.1 加载 EPUB
      await this.epubManager.load(bookConfig.opfPath!);
      // 2.2 加载 音频播放列表
      this.audioManager.loadPlaylist(bookConfig.playlist);
      this.audioManager.applySettings(this.state.settings.audioPlay);
      
      // 2.3 加载 smil
      this.smilManager.load(bookConfig.smilPath!);

    } else if (bookConfig.type === 'audios') {
      this.audioManager.loadPlaylist(bookConfig.playlist);
      this.audioManager.applySettings(this.state.settings.audioPlay);
    } else {
      console.error(`<AudiobookReader.open> book [${bookConfig.path}] typte (${bookConfig.type}) unrecognized!`);
      return;
    }
    
    // 3. Update ReaderState
    this.updateState({
      isOpen: true,
      book: bookConfig,
      currentCfi: progress.epub?.cfi,
      currentTrackIndex: progress.audio?.trackIndex,
      currentTrackTime: progress.audio?.trackSeek,
    });

    // 4. 初始化音频
    if (progress.audio) {
      this.setTrack({
        trackIndex: progress.audio.trackIndex,
        offset: progress.audio.trackSeek,
        play: this.state.settings.audioPlay.autoPlay,
      });
    }
    
    this.emit('book-loaded', bookConfig);
  }

  public close() {
    if (!this.state.isOpen) return;
    console.log('<AudioBookReader> Closing reader');
    this.epubManager.destroy();
    this.audioManager.destroy();
    this.smilManager.destroy();
    
    this._debouncedSaveEpubProgress.cancel();

    this.state = this.getInitialState();
    this.emit('state-changed', this.state);
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
   * 跳转到指定章节或锚点所在位置。
   *
   * 根据传入的 href，渲染对应章节文件，并且支持锚点 (#id) 跳转到目标元素所在的页面。
   *
   * @param href - 章节文件的相对路径（相对于 EPUB 的 OPF 文件）。
   *               如果包含锚点（#id），会定位到对应元素。
   *               例如：'Text/Chapter%201.xhtml#ae00293'
   *
   * @example
   * reader.goToHref('Text/Chapter%201.xhtml');           // 跳转到章节开头
   * reader.goToHref('Text/Chapter%201.xhtml#ae00293');  // 跳转到指定元素所在位置
   */
  public async goToHref(href: string) {
    console.log(`<AudioBookReader.goToHref> href: ${href}`);
    await this.epubManager.goToHref(href);
  }

  public async goToCfi(cfi: string) {
    console.log(`<AudioBookReader.goToCfi> cfi: ${cfi}`);
    await this.epubManager.goToCfi(cfi);
  }

  /**
   * 根据全局时间偏移量跳转到对应的轨道和位置
   * @param globalOffset 全局时间轴上的位置（秒）
   */
  public seekTo(globalOffset: number) {
    const trackPositions = this.state.book?.trackPositions;
    if (trackPositions === undefined || trackPositions.length === 0) {
      console.warn('<AudioBookReader.seekTo> trackPositions is undefined or empty');
      return;
    }

    // 确保偏移量的范围
    const totalDuration = this.state.book?.totalDuration ?? 0;
    const targetTime = Math.min(Math.max(0, globalOffset), totalDuration);
    console.log(`<AudioBookReader.seekTo> globalOffset: ${globalOffset} (${targetTime})`);
    
    const targetTrack = trackPositions?.find(p => targetTime >= p.startTime && targetTime <= p.endTime);
    if (targetTrack) {
      const trackTime = targetTime - targetTrack.startTime;
      this.setTrack({
        trackIndex: targetTrack.trackIndex,
        offset: trackTime,
        play: targetTime >= totalDuration ? false : this.state.isPlaying,
      });
    } else {
      console.warn('<AudioBookReader.seekTo> Cannot find the target track');
      return;
    }
  }

  /**
   * Get current trak's playback time lively
   * @returns 
   */
  public getCurrentTrackSeek() {
    return this.audioManager.getCurrentTrackSeek();
  }

  /**
   * @returns 当前在全局时间轴上的位置（秒）
   */
  public getGlobalSeek(): number {
    const currentTrack = this.state.book?.trackPositions.find(
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
    const currentGlobalSeek = this.getGlobalSeek();
    const targetOffset = currentGlobalSeek - seconds;
    
    console.log(`<Rewind> ${currentGlobalSeek}s -> ${targetOffset}s (${seconds}s back)`);
    this.seekTo(targetOffset);
  }

  /**
   * @param seconds 向前跳转的秒数，默认 10 秒
   */
  public forward(seconds: number = 10) {
    const currentGlobalSeek = this.getGlobalSeek();
    const targetOffset = currentGlobalSeek + seconds;
    
    console.log(`<Forward> ${currentGlobalSeek}s -> ${targetOffset}s (${seconds}s forward)`);
    this.seekTo(targetOffset);
  }
  
  public setSyncPage(syncFlag: boolean) {
    this.updateSettings({ audioPlay: { syncPage: syncFlag } });
  }

  public setPlaybackRate(rate: number) {
    const maxRate = 2;
    const minRate = 0.5;
    const clamped = Math.max(minRate, Math.min(maxRate, rate));
    this.audioManager.setRate(clamped);
    this.updateSettings({ audioPlay: { playbackRate: clamped } });
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
    if (this.state.book?.type === 'epub' || this.state.book?.type === 'audible_epub') {
      this.epubManager.attachTo(element, this.state.settings.epubView, this.state.currentCfi);
    }
  }

  public detachView() {
    this.epubManager.detach();
  }

  public onEpubDblclick({textSrc, textId}: {textSrc: string, textId: string}) {
    console.log(`<reader.onEpubDblclick> receive dbclick event from iframe. ${textSrc}#${textId}`);
    if (!textId) return;

    const smilpar = this.smilManager.findByText(textSrc, textId);
    console.log('<reader.handleEpubDblclick> got smilPar:', smilpar);
  
    // 从 playlist 中找到 p.path.endsWith(smilpar.audioSrc) 项目的 index
    const trackIndex = smilpar && this.state.book?.playlist
      ? this.state.book.playlist.findIndex(p => p.path.endsWith(smilpar.audioSrc))
      : 0;

    if (smilpar && trackIndex === -1) {
      console.warn('<reader.handleEpubDblclick> Cannot find track for audioSrc:', smilpar.audioSrc);
    }

    if (smilpar) {
      const trackIndex = this.state.book?.playlist.findIndex(item => item.path.endsWith(smilpar.audioSrc));
      if (trackIndex === undefined || trackIndex === -1) {
        return;
      }
      this.setTrack({
        trackIndex,
        offset: smilpar.clipBegin,
        play: true
      });
    }
  }

  private _saveEpubProgress() {
    // console.log('<reader._EpubProgressUpdater>')
    if (!this.state.book) {
      console.error('<reader.onEpubProgressUpdated> state.book is undefined');
      return;
    }

    const cfi = this.state.currentCfi;
    if (cfi === undefined) {
      console.error('<reader.onEpubProgressUpdated> currentCfi is undefined');
      return;
    }
    const progress = this.epubManager.percentageFromCfi(cfi);
    if (progress === null) {
      console.warn('<reader.onEpubProgressUpdated> progress is null (epubjs.locations unready)');
      return;
    }
    
    fetch(`/api/progress/${this.state.book.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        epubCfi: cfi,
        epubProgress: progress,
      }),
    }).catch(err => {
      console.error('<reader.onEpubProgressUpdated> Failed to update progress:', err);
    });
  }

  private _debouncedSaveEpubProgress = debounce(() => this._saveEpubProgress(), 500);

  /**
   * - 向数据库更新阅读进度
   */
  public onEpubProgressUpdated() {
    // console.log('<reader.onEpubProgressUpdated>');

    // Sync progress to DB
    this._debouncedSaveEpubProgress();
  }

  private _saveAudioProgress() {
    // console.log('<reader._saveAudioProgress>', new Date().toUTCString());

    if (!this.state.book) {
      console.error('<reader._saveAudioProgress> state.book is undefined');
      return;
    }

    const trackIndex = this.state.currentTrackIndex;
    const trackTime = this.state.currentTrackTime;
    if (trackIndex === undefined || trackTime === undefined) {
      console.error('<reader._saveAudioProgress> trackIndex or trackTime is undefined');
      return;
    }
    const progres = this.getGlobalSeek() / this.state.book.totalDuration;

    fetch(`/api/progress/${this.state.book.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackIndex: trackIndex,
        trackSeek: trackTime,
        trackProgress: progres,
      }),
    }).catch(err => {
      console.error('<reader._saveAudioProgress> Failed to update audio progress:', err);
    });
  }

  private _throttledSaveAudioProgress = throttle(() => this._saveAudioProgress(), 500);

  /**
   * - 向数据库更新阅读进度
   * - 高亮 EPUB
   * - 强制跳转 EPUB
   */
  public async onAudioProgressUpdated() {
    const trackIndex = this.state.currentTrackIndex;
    const trackSeek = this.state.currentTrackTime;
    // console.log('<reader.onAudioProgressUpdated>', trackIndex, trackSeek);
    if (trackIndex === undefined || trackSeek === undefined) {
      console.warn('<reader.onAudioProgressUpdated> track index or seek undefined');
      return;
    }

    if (this.state.book!.type === 'audible_epub') {
      const trackSrc = this.state.book!.playlist[trackIndex].relPath;
      const smilPar = this.smilManager.findByAudioTime(trackSrc, trackSeek);
      // console.log('<reader.onAudioProgressUpdated> got smilpar:', smilPar);

      // sync highlighting
      if (this.state.settings.audioPlay.syncHighlight && smilPar) {
        this.epubManager.clearHighlight();
        this.epubManager.highlightText(smilPar.textSrc, smilPar.textId);
      }

      // sync jumping
      if (this.state.settings.audioPlay.syncPage && smilPar) {
        const clipDuration = smilPar.clipEnd - smilPar.clipBegin;
        const clipOffset = Math.max(this.getCurrentTrackSeek() - smilPar.clipBegin, 0);
        const cfi = this.epubManager.getCfi(smilPar.textSrc, smilPar.textId, clipOffset / clipDuration);
        
        if (cfi && this.epubManager.cfiDisplaying(cfi)) {
          // console.log('<reader.onAudioProgressUpdated> cfi is displaying, do nothing');
        } else if (cfi) {
          await this.goToCfi(cfi);
        } else {
          const href = `${smilPar.textSrc}#${smilPar.textId}`;
          await this.goToHref(href);
        }
      }
    }

    // Sync progress to DB
    this._throttledSaveAudioProgress();
  }

  public onAudioPlayingUpdated() {
    if (this.state.isPlaying) {
      this.audioManager.startProgressTracking();
    } else {
      this.audioManager.stopProgressTracking();
    }
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
        this.togglePlay();
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

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as Window & { reader?: AudioBookReader | null }).reader = reader;
}

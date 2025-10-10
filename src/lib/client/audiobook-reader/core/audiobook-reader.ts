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
  EpubProgress,
  AudioProgress,
  ReadingProgress,
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
  private progressSaved: ReadingProgress = {};    // 阅读进度 (与数据库保持同步, 不保证实时同步) 

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
  }

  private getInitialState(): ReaderState {
    return {
      isOpen: false,
      isPlaying: false,
      settings: loadReaderSettings(),
      currentBook: null,
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

      if (updates.currentCfi) {
        this.emit('epub-progress-updated', undefined);
      }

      if (updates.currentTrackIndex || updates.currentTrackTime) {
        this.emit('audio-progress-updated', undefined);
      }
      
      if (updates.debug_msg) {
        console.log("<reader> updateState, state-changed (emit)", updates);
      }
    } else {
      console.log("<reader> updateState, no-changed", updates);
    }
  }

  public async open(bookConfig: BookConfig, progress: ReadingProgress = {}) {
    console.log('<reader> Opening book:', bookConfig.title, progress);
    
    // 1. Reset state before opening a new book
    this.close();

    this.progressSaved = progress;

    // 2. Load new book
    if (bookConfig.type === 'epub') {
      await this.epubManager.load(bookConfig.opfPath!);
      if (progress.epub) {
        this.goToCfi(progress.epub.cfi);
      }
    } else if (bookConfig.type === 'audible_epub') {
      // 2.1 加载 EPUB
      await this.epubManager.load(bookConfig.opfPath!);
      // 2.2 加载 音频播放列表
      this.audioManager.loadPlaylist(bookConfig.playlist);
      this.audioManager.applySettings(this.state.settings.audioPlay);
      this.smilManager.load(bookConfig.smilPath!);

      if (progress.epub) {
        this.goToCfi(progress.epub.cfi);
      }
      // if (progress.audio) {
      //   // this.
      // }

      // 2.3 加载 SMIL
      /**
       * TODO: 现在的 SMILManager 只是一个空壳，还没有实现任何功能
       * 我们需要实现:
       * 
       * 1. 加载已经处理好的 smil.json 文件 this.smilManager.load(bookConfig.smilPath!);
       * 里面的每个元素是如下的形式：
       * {
          "id": "p00001",
          "textSrc": "_21463_25106__split_000.html",
          "textId": "ae00001",
          "audioSrc": "audio/aud_0.mp3",
          "clipBegin": 0.05,
          "clipEnd": 2.562
          },
       * 
       * 2. 提供一个方法, 输入 textSrc, textId, 返回对应的 smilpar, 然后计算 trackIndex (从 playlist 中找) 跟 clipBegin
       *  然后我们就可以调用 setTrack() 来播放对应的音频
       * 
       * 3. 提供一个方法，输入 trackIndex 跟 currentTime, 返回对应的 smilpar
       *  然后我就可以调用一个新方法，通过 epubManager 中的 epub.js 给 textId 的标签增加一个 highlight css 类(清除之前的 highligh 标签)
       *  但这里需要判断当前 iframe view 中显示的是否是 textsrc 文件(如果不是，就不用高亮)
       * 
       * 4. 我们还需要实现一个 实时同步的 开关，当启用实时同步的时候，需要自动加载对应的 textsrc。并且高亮 textId 标签 (如果该 textId 标签不在当前视口，自动翻页到该 textId 显示在窗口中)
       */
      

    } else if (bookConfig.type === 'audios') {
      this.audioManager.loadPlaylist(bookConfig.playlist);
      this.audioManager.applySettings(this.state.settings.audioPlay);
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
    console.log('<AudioBookReader> Closing reader');
    this.epubManager.destroy();
    this.audioManager.destroy();
    this.smilManager.destroy();
    this.progressSaved = {};
    
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
  public goToHref(href: string) {
    console.log(`<AudioBookReader.goToHref> href: ${href}`);
    this.epubManager.goToHref(href);
  }

  public goToCfi(cfi: string) {
    console.log(`<AudioBookReader.goToCfi> cfi: ${cfi}`);
    this.epubManager.goToCfi(cfi);
  }

  /**
   * 根据全局时间偏移量跳转到对应的轨道和位置
   * @param globalOffset 全局时间轴上的位置（秒）
   */
  public seekTo(globalOffset: number) {
    const trackPositions = this.state.currentBook?.trackPositions;
    if (trackPositions === undefined || trackPositions.length === 0) {
      console.warn('<AudioBookReader.seekTo> trackPositions is undefined or empty');
      return;
    }

    // 确保偏移量的范围
    const totalDuration = this.state.currentBook?.totalDuration ?? 0;
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
    const currentTrack = this.state.currentBook?.trackPositions.find(
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
    if (this.state.currentBook?.type === 'epub' || this.state.currentBook?.type === 'audible_epub') {
      this.epubManager.attachTo(element, this.state.settings.epubView);
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
    const trackIndex = smilpar && this.state.currentBook?.playlist
      ? this.state.currentBook.playlist.findIndex(p => p.path.endsWith(smilpar.audioSrc))
      : 0;

    if (smilpar && trackIndex === -1) {
      console.warn('<reader.handleEpubDblclick> Cannot find track for audioSrc:', smilpar.audioSrc);
    }

    if (smilpar) {
      const trackIndex = this.state.currentBook?.playlist.findIndex(item => item.path.endsWith(smilpar.audioSrc));
      if (trackIndex === undefined || trackIndex === -1) {
        return;
      }
      this.audioManager.setTrack({
        trackIndex,
        offset: smilpar.clipBegin,
        play: true
      });
    }
  }

  /**
   * - 向数据库更新阅读进度
   */
  public onEpubProgressUpdated() {
    // console.log('<reader.onEpubProgressUpdated>');
  }

  /**
   * - 向数据库更新阅读进度
   * - 高亮 EPUB
   * - 强制跳转 EPUB
   */
  public onAudioProgressUpdated() {
    const trackIndex = this.state.currentTrackIndex;
    const trackSeek = this.state.currentTrackTime;
    console.log('<reader.onAudioProgressUpdated>', trackIndex, trackSeek);
    if (trackIndex === undefined || trackSeek === undefined) {
      console.warn('<reader.onAudioProgressUpdated> track index or seek undefined');
      return;
    }

    if (this.state.currentBook!.type === 'audible_epub') {
      const trackSrc = this.state.currentBook!.playlist[trackIndex].relPath;
      const smilPar = this.smilManager.findByAudioTime(trackSrc, trackSeek);
      console.log('<reader.onAudioProgressUpdated> got smilpar:', smilPar);

      // sync highlighting
      if (this.state.settings.audioPlay.syncHighlight && smilPar) {
        this.epubManager.highlightText(smilPar.textSrc, smilPar.textId);
      }

      // sync jumping
      if (this.state.settings.audioPlay.syncPage && smilPar) {
        const href = `${smilPar.textSrc}#${smilPar.textId}`;
        this.goToHref(href);
        /**
         * TODO! 
         * 这里有一个问题, 如果这个 text 是一个长句，并且正好被渲染在翻页的地方. 
         * 比如 "big brother " > "is watching you!"
         * 那么此时, 在读完该句子之前, epubjs 是不会翻页的.
         * 要解决这个问题，需要改用 cfi 跳转, cfi 可以指定到该标签元素内的第几个字符。
         */
      }
    }

    // Sync to DB
    
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

if (process.env.NODE_ENV === 'development') {
  (window as Window & { reader?: AudioBookReader | null }).reader = reader;
}

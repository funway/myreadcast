import { NavItem } from "epubjs";

export type BookType = 'epub' | 'audible_epub' | 'audios'

export interface BookConfig {
  type: BookType;
  path: string;
  title?: string;
  author?: string;
  coverPath?: string;
  audioFiles?: AudioTrack[];
  playlist?: AudioTrack[];
}

export interface AudioTrack {
  src: string;
  title?: string;
  duration: number; // 秒数，用于计算总时长和进度条显示
}

export interface TrackPosition { 
  trackIndex: number,
  startTime: number,
  endTime: number,
}

/**
 * https://www.w3.org/submissions/2017/SUBM-epub-mediaoverlays-20170125/#sec-smil-par-elem
 */
export interface SmilPar { 
  id?: string;        // Par id (optional)
  textSrc: string;    // text 所在的文件路径
  textId: string;     // text 所在的标签 id
  audioSrc: string;   // 对应的音频文件路径
  clipBegin: number;  // 对应的音频片段起始时间, 以秒为单位的浮点数 (小数为毫秒)
  clipEnd: number;    // 对应的音频片段结束时间, 以秒为单位的浮点数
}

// export interface ReadingProgress {
//   bookPath: string;
//   epubCfi?: string;   // EPUB的位置标识
//   audioTime?: number; // 基于总播放时长的时间位置
//   chapterIndex?: number;
//   lastReadAt: Date;
// }

// 播放列表信息（用于音频进度条计算）
// export interface PlaylistInfo {
//   tracks: AudioInfo[];
//   totalDuration: number;
//   trackPositions: Array<{
//     startTime: number;
//     endTime: number; 
//     trackIndex: number;
//   }>;
// }

// SMIL 同步数据结构
// export interface SmilSegment {
//   id: string;
//   textSrc: string; // 对应的 HTML 元素 ID
//   audioSrc: string;
//   clipBegin: number; // 秒数
//   clipEnd: number;   // 秒数
// }

// export interface SmilData {
//   segments: SmilSegment[];
//   audioFiles: string[]; // 所有音频文件列表
// }

export const KEYBOARD_SHORTCUTS = {
  'ArrowLeft': 'prevPage',
  'ArrowRight': 'nextPage', 
  'ArrowUp': 'volumeUp',
  'ArrowDown': 'volumeDown',
  'Space': 'togglePlay',
  'Escape': 'closeModal',
} as const;

export type ShortcutAction = typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS];

export interface EpubViewSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface AudioPlaySettings {
  volume: number;
  playbackRate: number;
  autoPlay: boolean;
  continuousPlay: boolean;
}

export interface ReaderSettings {
  epubView: EpubViewSettings;
  audioPlay: AudioPlaySettings;
}

export interface ReaderState {
  isOpen: boolean;                  // AudioBookReader UI 组件是否显示
  isPlaying: boolean;               // AudioPlayer 是否播放音频
  settings: ReaderSettings;         // AudioBookReader UI 组件的设置
  
  currentBook: BookConfig | null;     // 书籍信息
  toc?: NavItem[];                    // EPUB 目录
  currentCfi?: string;                // 当前的 EPUB CFI (阅读进度)
  currentTrackIndex?: number;         // 当前选中的 track idx
  currentTrackTime?: number;          // 当前 track 播放的时间点 (播放进度)
  trackPositions?: TrackPosition[];   // playlist 中每个 track 的全局开始结束时间
  totalDuration?: number;             // playlist 音频总时长
  
  currentHighlightId?: string;        

  // Error state
  error?: { message: string; code?: string };
}

/**
 * A callback to update the ReaderState
 */
export type StateUpdater = (updates: Partial<ReaderState>) => void;

export type ReaderEvents = {
  'state-changed': ReaderState;
  'book-loaded': BookConfig;
  // 'progress-updated': { cfi?: string; audioTime?: number };
  // 'page-changed': { page: number; totalPages: number };
  // 'audio-time-updated': { currentTime: number; totalDuration: number };
  // 'highlight-changed': { elementId: string };
  // 'error': { message: string; code?: string };
}
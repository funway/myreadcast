import { NavItem } from "epubjs";

export type BookType = 'epub' | 'audible_epub' | 'audios'

export interface AudioTrack {
  src: string;
  title?: string;
  duration: number; // 秒数，用于计算总时长和进度条显示
}

export interface BookConfig {
  type: BookType;
  path: string;
  playlist?: AudioTrack[];
  title?: string;
  author?: string;
  coverPath?: string;
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
export interface SmilSegment {
  id: string;
  textSrc: string; // 对应的 HTML 元素 ID
  audioSrc: string;
  clipBegin: number; // 秒数
  clipEnd: number;   // 秒数
}

export interface SmilData {
  segments: SmilSegment[];
  audioFiles: string[]; // 所有音频文件列表
}

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
  
  currentBook: BookConfig | null;   // 书籍信息
  toc: NavItem[];                   // EPUB 目录
  currentCfi?: string;              // 当前的 EPUB CFI (阅读进度)
  currentTrackIndex?: number;       // 当前选中的 track idx
  currentTrackTime?: number;        // 当前 track 播放的时间点 (播放进度)
  
  // duration?: number;                // book.playlist 中应该有的
  // totalDuration?: number;           // book.playlist 中自己计算
  
  // 同步相关
  // currentHighlightId?: string;

  // Error state
  error?: { message: string; code?: string };
}

export type ReaderEvents = {
  'state-changed': ReaderState;
  'book-loaded': BookConfig;
  // 'progress-updated': { cfi?: string; audioTime?: number };
  // 'page-changed': { page: number; totalPages: number };
  // 'audio-time-updated': { currentTime: number; totalDuration: number };
  // 'highlight-changed': { elementId: string };
  // 'error': { message: string; code?: string };
}
export type BookType = 'epub' | 'audible_epub' | 'audios'

export interface AudioTrack {
  src: string;
  title?: string;
  duration: number; // 秒数，用于计算总时长和进度条显示
}

export interface BookConfig {
  type: BookType;
  path: string;
  title?: string;
  author?: string;
  playlist?: AudioTrack[];
}

export interface ReadingProgress {
  bookPath: string;
  epubCfi?: string;   // EPUB的位置标识
  audioTime?: number; // 基于总播放时长的时间位置
  chapterIndex?: number;
  lastReadAt: Date;
}

// 播放列表信息（用于音频进度条计算）
export interface PlaylistInfo {
  tracks: AudioTrack[];
  totalDuration: number;
  trackPositions: Array<{
    startTime: number;
    endTime: number; 
    trackIndex: number;
  }>;
}

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
  'KeyF': 'toggleFullscreen',
} as const;

export type ShortcutAction = typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS];

// 阅读器状态
export interface ReaderState {
  isOpen: boolean;
  currentBook: BookConfig | null;
  
  // EPUB 相关
  currentPage?: number;
  totalPages?: number;
  
  // 音频相关
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  currentTrackIndex: number;
  currentTime: number; 
  
  // 同步相关
  currentHighlightId?: string;

  // Error state
  error?: { message: string; code?: string } | null;
}

// 事件类型
export type ReaderEvents = {
  'state-changed': ReaderState;
  'book-loaded': BookConfig;
  'progress-updated': { cfi?: string; audioTime?: number };
  'page-changed': { page: number; totalPages: number };
  'audio-time-updated': { currentTime: number; totalDuration: number };
  'highlight-changed': { elementId: string };
  'error': { message: string; code?: string };
}
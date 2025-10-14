import { NavItem } from 'hawu-epubjs';

export type BookType = 'epub' | 'audible_epub' | 'audios'

export type BookConfig = {
  id: string;           // Book ID (数据库中的 ID)
  type: BookType;
  title: string;
  path: string;         // 书籍的 URL 路径 (/api/book/[bookId])
  opfPath?: string;     // EPUB 的 OPF 文件路径 (/api/book/[bookId]/[...relPath])
  smilPath?: string;    // SMIL 文件路径 (/api/book/[bookId]/[...relPath])
  coverPath?: string;   // 书籍封面的 URL 路径 (/api/book/[bookId]/cover)
  playlist: AudioTrack[];
  trackPositions: TrackPosition[];  // playlist 中每个 track 的全局开始结束时间
  totalDuration: number;            // playlist 音频总时长 (秒)
  author?: string;
}

export type AudioTrack = {
  title: string;
  path: string;         // 音频文件的 URL 路径 (/api/book/[bookId]/[...relPath])
  relPath: string;      // 音频文件相对于有声书文件夹的路径 (URL encoded, 方便与 SMIL 中的 audioSrc 对齐)
  duration: number;     // 音频文件时长(float 秒)
}

export type TrackPosition ={ 
  trackIndex: number;
  startTime: number;
  endTime: number;
}

/**
 * https://www.w3.org/submissions/2017/SUBM-epub-mediaoverlays-20170125/#sec-smil-par-elem
 */
export type SmilPar ={ 
  id?: string;        // Par id (optional)
  textSrc: string;    // text 所在的文件路径 (相对于 opf)
  textId: string;     // text 所在的标签 id
  audioSrc: string;   // 对应的音频文件路径 (相对于整个有声书的目录)
  clipBegin: number;  // 对应的音频片段起始时间, 以秒为单位的浮点数 (小数为毫秒)
  clipEnd: number;    // 对应的音频片段结束时间, 以秒为单位的浮点数
}

export type EpubProgress = {
  cfi: string;          // epub.js 当前渲染页面的 start location
  progress?: number;    // float 进度
}

export type AudioProgress = {
  trackIndex: number;   // 当前播放的 track index
  trackSeek: number;    // 当前播放的 track 的时间点
  progress?: number;    // float 进度
}

export type ReadingProgress = {
  epub?: EpubProgress;
  audio?: AudioProgress;
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

export type EpubViewSettings = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export type AudioPlaySettings = {
  volume: number;           // 音量
  playbackRate: number;     // 倍速播放
  autoPlay: boolean;        // 是否自动播放
  continuousPlay: boolean;  // 是否连续播放
  syncHighlight: boolean;   // 是否同步高亮 EPUB 文字
  syncPage: boolean;        // 是否同步跳转 EPUB 页面
}

export type ReaderSettings = {
  epubView: EpubViewSettings;
  audioPlay: AudioPlaySettings;
}

export type ReaderState = {
  isOpen: boolean;                  // AudioBookReader UI 组件是否显示
  isPlaying: boolean;               // AudioPlayer 是否播放音频
  settings: ReaderSettings;         // AudioBookReader UI 组件的设置
  
  book: BookConfig | null;     // 书籍信息
  toc?: NavItem[];                    // EPUB 目录
  currentCfi?: string;                // 当前的 EPUB CFI (阅读进度)
  currentTrackIndex?: number;         // 当前 track 在 playlist 中的 idx
  currentTrackTime?: number;          // 当前 track 播放的时间点 (播放进度)

  error?: { message: string; code?: string };
  debug_msg?: string;                 // 仅用于调试显示的消息
}

/**
 * A callback to update the ReaderState
 */
export type StateUpdater = (updates: Partial<ReaderState>) => void;

/**
 * event key
 */
export type ReaderEvents = {
  'state-changed': ReaderState;
  'book-loaded': BookConfig;
  'epub-dblclick': { textSrc: string, textId: string };
  'epub-progress-updated': void;
  'audio-progress-updated': void;
  // 'page-changed': { page: number; totalPages: number };
  // 'audio-time-updated': { currentTime: number; totalDuration: number };
  // 'highlight-changed': { elementId: string };
  // 'error': { message: string; code?: string };
}

export type ReaderEventEmitter = <Key extends keyof ReaderEvents>(
    type: Key,
    event: ReaderEvents[Key]
  ) => void;

// export type EpubEventListener = {
//   eventType: string;
//   eventHandler: (event: Event, section: Section, view: IframeView) => void;
// }
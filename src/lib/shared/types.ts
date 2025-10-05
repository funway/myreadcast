export type ActionResult<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type AudioFileInfo = {
  filePath: string;       // 文件绝对路径 (非 URL encoding)
  duration: number;       // 秒数，解析失败的文件会被跳过
  mimeType?: string;      // 媒体类型，如 "audio/mpeg"
  bitrate?: number;       // 比特率 (bps)
  sampleRate?: number;    // 采样率 (Hz)
  codec?: string;         // 编码格式 (如 MP3, AAC)
  meta?: {
    title?: string;
    artist?: string;
    album?: string;
    albumArtist?: string;
    year?: number;
    genre?: string[];
    coverImageBase64?: string;  // 封面图（Base64 编码）
  };
}

export type PlaylistItem = {
  filePath: string;       // 文件绝对路径
  title: string;          // 音频文件标题
  duration: number;       // 音频文件时长
}

export type WithRelPath<T> = T & { relPath: string };  // relPath 是相对于有声书根目录的相对路径 (非 URL encoding)
export type AudioFileInfoWithRel = WithRelPath<AudioFileInfo>;
export type PlaylistItemWithRel = WithRelPath<PlaylistItem>;
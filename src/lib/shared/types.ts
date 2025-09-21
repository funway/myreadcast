export type ActionResult<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
};

export interface AudioFileInfo {
  filePath: string;       // 文件路径
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
    trackNo?: number;
    genre?: string;
    coverImageBase64?: string;  // 封面图（Base64 编码）
  };
}

export interface PlaylistItem {
  filePath: string;
  title: string;
  duration: number;
}
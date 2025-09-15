'use client';

import React, {
  useState,
  useRef,
  memo,
  useMemo,
  useEffect
} from 'react';
import { reader } from '@/lib/client/audiobook-reader';
import { useReaderState } from '../hooks/useReaderState';
import { formatTime } from '@/lib/client/utils';

export const AudioProgressBar = memo(() => {
  console.log("[AudioProgressBar] rendering");

  const { isPlaying, currentBook, currentTrackIndex } = useReaderState((s) => ({
    isPlaying: s.isPlaying,
    currentBook: s.currentBook,
    currentTrackIndex: s.currentTrackIndex,
    currentTrackTime: s.currentTrackTime,
  }), "AudioProgressBar");

  const { playlist, trackPositions, totalDuration } = useMemo(() => {
    if (!currentBook?.playlist) {
      return { playlist: [], trackPositions: [], totalDuration: 0 };
    }

    const playlist = currentBook.playlist.map((track, index) => ({
      ...track,
      title: track.title || track.src.split('/').pop() || `Track ${index + 1
        }`
    }));
    const trackPositions: Array<{ startTime: number; endTime: number, trackIndex: number }> = [];
    let totalDuration = 0;

    // 计算每个 track 的时间位置
    playlist.forEach((track, index) => {
      const startTime = totalDuration;
      const endTime = startTime + (track.duration || 0);
      trackPositions.push({ startTime, endTime, trackIndex: index });

      totalDuration = endTime;
    });

    return { playlist, trackPositions, totalDuration };
  }, [currentBook]);

  console.log("[AudioProgressBar] got:", {
    currentBook,
    currentTrackIndex,
    playlist,
    trackPositions
  });

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    left: number;
    text: string
  }>({ visible: false, left: 0, text: '' });
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [totalCurrentTime, setTotalCurrentTime] = useState(0);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !totalDuration)
      return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * totalDuration;

    // 找到目标时间对应的 track 和位置
    const targetTrack = trackPositions.find(p => targetTime >= p.startTime && targetTime < p.endTime);
    if (targetTrack) {
      const trackTime = targetTime - targetTrack.startTime;
      console.log("[AudioProgressBar] handleSeek:", percentage, "targetTrack", targetTrack, "targetTime:", targetTime);
      reader.seekToTrack(targetTrack.trackIndex, trackTime);
    } else {
      console.error("[AudioProgressBar] handleSeek. find targetTrack failed!");
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !totalDuration)
      return;


    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const hoverTime = percentage * totalDuration;

    // 设置 hover 位置（用于显示竖线）
    setHoverPosition(percentage);

    const targetTrack = trackPositions.find(p => hoverTime >= p.startTime && hoverTime < p.endTime);
    const trackTitle = targetTrack ? playlist[targetTrack.trackIndex]?.title : '??';

    setTooltip({
      visible: true, left: hoverX, text: `${trackTitle} - ${formatTime(hoverTime)
        }`
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setTooltip({
      ...tooltip,
      visible: false
    });
    setHoverPosition(null);
    setIsHovering(false);
  };

  useEffect(() => {
    let animationFrameId: number;

    if (isPlaying) {
      const trackingProgress = () => {
        const currentTrackPosition = trackPositions[currentTrackIndex ?? 0];
        if (currentTrackPosition) {
          const baseTime = currentTrackPosition.startTime;
          setTotalCurrentTime(baseTime + reader.getCurrentSeek());
        }
        animationFrameId = requestAnimationFrame(trackingProgress);
      };

      animationFrameId = requestAnimationFrame(trackingProgress);
    } else { // nothing
    }

    return () => {
      console.log("[AudioProgressBar] useEffect cleanup");
      cancelAnimationFrame(animationFrameId);
    }
  }, [isPlaying, currentTrackIndex]);

  const currentTrackData = playlist?.[currentTrackIndex ?? 0];
  const trackTitle = currentTrackData?.title ?? '...';
  const progressPercent = totalDuration ? (totalCurrentTime / totalDuration) * 100 : 0;

  return (
    <div className="w-full">
      <div className="h-2.5 flex items-center">
        <div
          ref={progressBarRef}
          className={`w-full cursor-pointer relative rounded-full bg-base-300 
            transition-all duration-300 ${isHovering ? 'h-2.5' : 'h-2'}`}
          onClick={handleSeek}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}>
          {/* 主进度条 */}
          <div
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />

          {/* Track 分隔线 */}
          {trackPositions.map((pos, index) => {
            if (index === 0) return null;
            const left = (pos.startTime / (totalDuration || 1)) * 100;
            return (
              <div
                key={index}
                className="absolute top-0 h-full w-0.5 bg-base-100 opacity-60"
                style={{ left: `${left}%` }}
              />
            );
          })}

          {/* Hover 竖线指示器 */}
          {hoverPosition !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-accent pointer-events-none"
              style={{ left: `${hoverPosition * 100}%` }}
            />
          )}

          {/* 播放位置指示器 */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200 ${isHovering ? 'w-4 h-4' : 'w-3 h-3'
              } bg-primary border-2 border-primary-content rounded-full shadow-sm`}
            style={{ left: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />

          {/* Tooltip */}
          {tooltip.visible && (
            <div
              className="absolute -top-10 bg-neutral text-neutral-content text-xs px-2 py-1 rounded pointer-events-none transform -translate-x-1/2 whitespace-nowrap shadow-lg"
              style={{ left: `${tooltip.left}px` }}
            >
              <div className="text-center">{tooltip.text}</div>
              {/* 小三角形 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-neutral" />
            </div>
          )}
        </div>
      </div>

      {/* 时间信息 */}
      <div className="flex justify-between text-xs font-mono mt-1 px-1 opacity-70">
        <span>{formatTime(totalCurrentTime)}</span>
        <span className="text-center flex-1">
          {Math.round(progressPercent)}% • Track {(currentTrackIndex ?? 0) + 1}/{playlist.length}
        </span>
        <span>{formatTime(totalDuration)}</span>
      </div>
    </div>
  );
});

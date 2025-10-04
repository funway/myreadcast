'use client';

import React, {
  useState,
  useRef,
  memo,
  useEffect
} from 'react';
import { reader } from '@/lib/client/audiobook-reader';
import { useReaderState } from '../hooks/useReaderState';
import { formatTime } from '@/lib/client/utils';

export const AudioProgressBar = memo(() => {
  const { isPlaying, currentBook, currentTrackIndex, currentTrackTime} = useReaderState((s) => ({
    isPlaying: s.isPlaying,
    currentBook: s.currentBook,
    currentTrackIndex: s.currentTrackIndex,
    currentTrackTime: s.currentTrackTime,
  }), "AudioProgressBar");
  const playlist = currentBook?.playlist ?? [];
  const trackPositions = currentBook?.trackPositions ?? [];
  const totalDuration = currentBook?.totalDuration ?? 0;
  const totalCurrentTime = reader.getGlobalSeek();

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    left: number;
    text: string
  }>({ visible: false, left: 0, text: '' });
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  // const [totalCurrentTime, setTotalCurrentTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressPercent = totalDuration ? (totalCurrentTime / totalDuration) * 100 : 0;
  
  // console.log("[AudioProgressBar] rendering", {
  //   isPlaying,
  //   playlist,
  //   trackPositions,
  //   currentTrackIndex,
  //   currentTrackTime,
  //   totalCurrentTime,
  //   totalDuration,
  //   progressPercent,
  // });

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !totalDuration)
      return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * totalDuration;
    
    reader.seekTo(targetTime);
    // setTotalCurrentTime(targetTime);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !totalDuration || !trackPositions)
      return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const hoverTime = percentage * totalDuration;

    setHoverPosition(percentage);

    const targetTrack = trackPositions.find(p => hoverTime >= p.startTime && hoverTime < p.endTime);
    const trackTitle = targetTrack ? playlist[targetTrack.trackIndex].title : '??';

    setTooltip({
      visible: true,
      left: hoverX,
      text: `${trackTitle} - ${formatTime(hoverTime)}`
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoverPosition(null);
  };

  // useEffect(() => {
  //   if (trackPositions === undefined || trackPositions.length === 0) {
  //     return;
  //   }

  //   let animationFrameId: number;
  //   const currentTrackPosition = trackPositions[currentTrackIndex ?? 0];
  //   const baseTime = currentTrackPosition.startTime;
    
  //   const trackingProgress = () => {
  //     const seek = reader.getCurrentTrackSeek();
  //     if (currentTrackPosition && seek) {
  //       setTotalCurrentTime(baseTime + seek);
  //     }
  //     animationFrameId = requestAnimationFrame(trackingProgress);
  //   };
    
  //   if (isPlaying) {
  //     animationFrameId = requestAnimationFrame(trackingProgress);
  //   } else {
  //     setTotalCurrentTime(baseTime + (currentTrackTime ?? 0));
  //   }

  //   return () => {
  //     console.log("[AudioProgressBar] useEffect cleanup");
  //     cancelAnimationFrame(animationFrameId);
  //   }
  // }, [isPlaying, currentTrackIndex, currentTrackTime, trackPositions]);

  return (
    <div className="w-full">
      <div className="h-3 flex items-center">
        {/* 进度条 */}
        <div
          ref={progressBarRef}
          className="w-full cursor-pointer relative rounded-full bg-base-300 
          transition-[height] duration-200 h-2 hover:h-3"
          onClick={handleSeek}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}>
          {/* 进度条前景 */}
          <div className="h-full bg-primary rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />

          {/* Track 分隔线 */}
          {trackPositions?.map((pos, index) => {
            if (index === 0) return null;
            const left = (pos.startTime / (totalDuration || 1)) * 100;
            return (
              <div
                key={index}
                className="absolute top-0 h-full w-0.5 bg-base-100 opacity-80"
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
      <div className="grid grid-cols-3 text-xs font-mono mt-1 px-1 opacity-70">
        {/* 左边 */}
        <span className="text-left">
          {formatTime(totalCurrentTime)} / {Math.round(progressPercent)}%
        </span>

        {/* 中间 */}
        <span className="text-center">
          {playlist[currentTrackIndex ?? 0]?.title}
        </span>

        {/* 右边 */}
        <span className="text-right">
          {formatTime(totalDuration)}
        </span>
      </div>

    </div>
  );
});

AudioProgressBar.displayName = 'AudioProgressBar';
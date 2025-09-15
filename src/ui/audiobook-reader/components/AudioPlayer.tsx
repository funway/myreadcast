'use client';

import React, { memo, useMemo } from 'react';
import { reader } from '@/lib/client/audiobook-reader';
import { useReaderState } from '../hooks/useReaderState';
import { formatTime } from '@/lib/client/utils';
import MyIcon from '@/ui/MyIcon';
import { AudioProgressBar } from './AudioProgressBar';

type AudioPlayerProps = {
    className?: string;
    showCloseButton?: boolean;
};

export const AudioPlayer = memo(({ className, showCloseButton = false }: AudioPlayerProps) => {
    console.log("[AudioPlayer] rendering");

    const { isPlaying, currentBook, currentTrackIndex, settings } = useReaderState(
        (s) => ({
            isPlaying: s.isPlaying,
            currentBook: s.currentBook,
            currentTrackIndex: s.currentTrackIndex,
            currentTrackTime: s.currentTrackTime,
            settings: s.settings.audioPlay,
        }),
        "AudioPalyer"
    );
    
    const { playlist, totalDuration } = useMemo(() => {
        if (!currentBook?.playlist) {
            return {
                playlist: [],
                trackPositions: [],
                totalDuration: 0
            };
        }

        const playlist = currentBook.playlist.map((track, index) => ({
            ...track,
            title: track.title || track.src.split('/').pop() || `Track ${index + 1}`
        }));
        const trackPositions: Array<{ startTime: number; endTime: number, trackIndex: number }> = [];
        let totalDuration = 0;

        // 计算每个 track 的时间位置
        playlist.forEach((track, index) => {
            const startTime = totalDuration;
            const endTime = startTime + (track.duration || 0);
            trackPositions.push({
                startTime,
                endTime,
                trackIndex: index,
            });

            totalDuration = endTime;
        });

        return {
            playlist,
            trackPositions,
            totalDuration
        };
    }, [currentBook]);

    console.log("[AudioPlayer] got:", {currentBook, currentTrackIndex, settings, playlist});
    
    const currentTrackData = playlist?.[currentTrackIndex ?? 0];
    const trackTitle = currentTrackData?.title ?? '...';

    return (
        <div className={`flex flex-col bg-base-200 p-4 gap-2 ${className}`}>
            {/* Row 1: Controls */}
            <div className="flex-1 flex items-center justify-between">
                {/* Left: Info */}
                <div className="w-1/3 text-left">
                    <p className="font-bold truncate text-sm">{currentBook?.title} ({formatTime(totalDuration)})</p>
                    <p className="text-xs truncate opacity-70">{trackTitle} ({formatTime(currentTrackData?.duration)})</p>
                </div>

                {/* Center: Playback Controls */}
                <div className="flex items-center justify-center gap-2">
                    <button className='btn btn-ghost btn-circle pr-1 tooltip' data-tip='Previous Track' onClick={() => reader.prevTrack()}>
                        <MyIcon iconName="prev" />
                    </button>
                    <button className='btn btn-ghost btn-circle tooltip' data-tip='Jump backward - 10 seconds' onClick={() => reader.rewind(10)}>
                        <MyIcon iconName="rewind" />
                    </button>
                    <button className='btn btn-primary btn-lg btn-circle' onClick={() => reader.togglePlay()}>
                        <MyIcon iconName={isPlaying ? 'pause' : 'play'} />
                    </button>
                    <button className='btn btn-ghost btn-circle tooltip' data-tip='Jump forward - 10 seconds' onClick={() => reader.forward(10)}>
                        <MyIcon iconName="forward" />
                    </button>
                    <button className='btn btn-ghost btn-circle pl-1 tooltip' data-tip='Next Track'
                        onClick={() => reader.nextTrack()}
                        disabled={currentTrackIndex === playlist.length - 1}
                    >
                        <MyIcon iconName="next" />
                    </button>
                </div>

                {/* Right: Extra Controls */}
                <div className="w-1/3 flex items-center justify-end gap-2">
                    {/* 播放速度控制 - 竖直滑动条 */}
                    <div className="dropdown dropdown-top dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost w-14">{settings.playbackRate}x</div>
                        <div tabIndex={0} className="dropdown-content bg-base-200 rounded-box z-[1] w-16 p-3 shadow flex flex-col items-center">
                            <div className="text-xs text-center">{settings.playbackRate}x</div>
                            <div className="h-32 flex items-center">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={settings.playbackRate}
                                    className="range range-xs w-24 transform -rotate-90"
                                    onChange={(e) => reader.setPlaybackRate(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 音量控制 - 竖直滑动条 + 动态图标 */}
                    <div className="dropdown dropdown-top dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                            <MyIcon iconName={
                                settings.volume === 0 ? 'volume0' :
                                    settings.volume <= 0.6 ? 'volume1' :
                                        'volume2'
                            } />
                        </div>
                        <div tabIndex={0} className="dropdown-content bg-base-200 rounded-box z-[1] w-16 p-3 shadow flex flex-col items-center">
                            <div className="text-xs text-center">{Math.round(settings.volume * 100)}%</div>
                            <div className="h-32 flex items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.volume}
                                    className="range range-xs w-24 transform -rotate-90"
                                    onChange={(e) => reader.setVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 播放列表 - 保持原样 */}
                    <div className="dropdown dropdown-top dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                            <MyIcon iconName="playlist" />
                        </div>
                        <ul tabIndex={0}
                            className="dropdown-content menu bg-base-200 rounded-box z-[1] 
                            p-2 shadow max-h-64 overflow-y-auto w-max max-w-96">
                            {playlist?.map((track, index) => (
                                <li key={index}>
                                    <a onClick={() => reader.playTrack(index)}
                                        className={index === currentTrackIndex ? 'active bg-primary text-primary-content' : ''}>
                                        {track.title} ({formatTime(track.duration)})
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Row 2: Enhanced Progress Bar */}
            <AudioProgressBar />
        </div>
    );
});
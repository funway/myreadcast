import { Howl, Howler } from 'howler';
import { AudioTrack, AudioPlaySettings, StateUpdater } from '../types';
import { set } from 'zod';

const PROGRESS_TRACKING_INTERVAL = 200;

export class AudioManager {
  private updateState: StateUpdater;
  private playlist: AudioTrack[] = [];
  private sound: Howl | null = null;
  private soundId: number | null = null;
  private pendingSeek: number | null = null;
  private currentTrackIndex: number = 0;
  private continuousPlay: boolean = true;
  private progressTracking: number | null = null;
  private playbackRate: number = 1;
  
  constructor(updateState: StateUpdater) {
    this.updateState = updateState;
  }

  public loadPlaylist(playlist: AudioTrack[]) {
    this.playlist = playlist;
    console.log('<AudioManager> load playlist:', this.playlist);
  }

  // public setTrack(trackIndex: number, offset?: number, play: boolean = false) {
  public setTrack({ trackIndex, offset, play = false}: {
    trackIndex: number,
    offset?: number,
    play?: boolean,
  }) {
    console.log('<AudioManager> setTrack:', {trackIndex, offset, play});
    
    const track = this.playlist[trackIndex];
    if (!track) {
      console.warn(`<AudioManager.setTrack> Track index [${trackIndex}] not exist`);
      return;
    }

    if (this.sound && this.currentTrackIndex === trackIndex) {
      console.log('<AudioManager.setTrack> Same track, just seek and play/pause');
    } else {
      if (this.sound) {
        this.sound.unload();
        this.sound = null;
        this.soundId = null;
        console.log('<AudioManager.setTrack> Unload previous track');
      }

      console.log('<AudioManager.setTrack> Loading new track:', track);
      this.currentTrackIndex = trackIndex;
      this.sound = new Howl({
        src: [track.path],
        html5: true,  // Force HTML5 Audio to enable streaming
        loop: false,
        onload: () => {
          console.log(`<AudioManager> Howl event - Track loaded. index=${trackIndex}`);
          this.updateState({
            currentTrackIndex: this.currentTrackIndex,
            debug_msg: 'Howl onload fired'
          });
        },
        onplay: (id) => {  // But sound.playing() does not immediately return true.
          console.log(`<AudioManager> Howl event - Track start playing. index=${trackIndex}, soundId=${id}`);
          this.sound?.rate(this.playbackRate);
          this.updateState({
            isPlaying: true,
            debug_msg: 'Howl onplay fired'
          });
          if (this.pendingSeek !== null) {
            console.log(`<AudioManager> Applying pending seek to ${this.pendingSeek}`);
            this.safeSeek(this.pendingSeek);
            this.pendingSeek = null;
          }
          this.startProgressTracking();
        },
        onpause: () => {
          const seek = this.sound?.seek();
          console.log(`<AudioManager> Howl event - Track pause playing. index=${trackIndex}, time=${seek}`);
          this.updateState({
            isPlaying: false,
            // currentTrackTime: this.sound?.seek(),
            debug_msg: 'Howl onpause fired'
          });
        },
        onseek: () => { 
          const seek = this.sound?.seek();
          console.log(`<AudioManager> Howl event - Track seek. index=${trackIndex}, time=${seek}`);
          // this.updateState({ currentTrackTime: seek, debug_msg: 'Howl onseek fired' });
        },
        onend: () => {
          console.log(`<AudioManager> Howl event - Track ended. index=${trackIndex}`);
          if (this.continuousPlay && (this.currentTrackIndex < this.playlist.length - 1)) {
            this.updateState({ debug_msg: 'Howl onend fired - Play next track' });
            this.next();
          } else {
            this.updateState({ isPlaying: false, debug_msg: 'Howl onend fired' });
            this.pause();
          }
        },
      });
    }

    if (offset !== undefined) {
      this.safeSeek(offset);
    }

    if (play) {
      this.play();
    } else {
      this.pause();
    }

    this.updateState({
      currentTrackIndex: trackIndex,
      ...(offset !== undefined ? { currentTrackTime: offset } : {}),
      isPlaying: play,
      debug_msg: 'setTrack'
    });
  }

  /**
   * Set and play track
   * @param trackIndex 
   * @param offset 
   */
  public playTrack(trackIndex: number, offset?: number) {
    this.setTrack({ trackIndex, offset, play: true});
  }

  /**
   * Set and pause track
   * @param trackIndex 
   * @param offset 
   */
  public cueTrack(trackIndex: number, offset?: number) {
    this.setTrack({ trackIndex, offset, play: false});
  }

  private startProgressTracking(delay: number = 100) {
    this.stopProgressTracking();
    console.log(`<AudioManager> startProgressTracking. delay ${delay}ms`);
    
    const step = () => { 
      console.log('<AudioManager.startProgressTracking.step> Tracking progress in backend');
      if (this.sound?.playing()) {
        this.updateState({
          currentTrackIndex: this.currentTrackIndex,
          currentTrackTime: this.sound?.seek(),
          isPlaying: true,
          // debug_msg: '<AudioManager> Progress tracking update',
        });

        // 设置下一次 tracking
        this.progressTracking = window.setTimeout(step, PROGRESS_TRACKING_INTERVAL);
      } else {
        // 停止 tracking
        this.progressTracking = null;
      }
    };
    
    // 启动第一次 tracking
    this.progressTracking = window.setTimeout(step, delay); 
  }

  private stopProgressTracking() {
    if (this.progressTracking) {
      clearTimeout(this.progressTracking);
    }
    this.progressTracking = null;
  }

  /**
   * Start/Continue playing
   */
  public play() {
    if (!this.sound) {
      console.error('<AudioManager.play> No track loaded');
      return;
    }

    if (this.soundId === null) {
      this.soundId = this.sound.play();
    } else if (this.sound.playing(this.soundId)) {
      return;
    } else {
      this.sound.play(this.soundId);
    }
  }

  public pause() {
    this.sound?.pause(this.soundId!);
  }

  public togglePlay() {
    if (this.sound) {
      if (this.sound.playing()) {
        this.pause();
      } else {
        this.play();
      }
    } else if (this.playlist.length > 0) {
      this.playTrack(this.currentTrackIndex);
    } else {
      console.warn('<AudioManager.togglePlay> playlist is empty');
    }
  }

  public next(autoPlay: boolean = true) {
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.setTrack({
        trackIndex: this.currentTrackIndex + 1,
        offset: 0,
        play: autoPlay,
      });
    }
  }

  public prev(autoPlay: boolean = true) {
    this.setTrack({
      trackIndex: this.currentTrackIndex - 1 >= 0 ? this.currentTrackIndex - 1 : 0,
      offset: 0,
      play: autoPlay,
    });
  }
  
  public forward(seconds: number) {
      if (!this.sound) return;
      const current = this.sound.seek() || 0;
      this.safeSeek(current + seconds);
  }

  public rewind(seconds: number) {
      if (!this.sound) return;
      const current = this.sound.seek() || 0;
      this.safeSeek(Math.max(0, current - seconds));
  }

  /**
   * Safely seek to a specific playback position.
   * 
   * 1. 在 sound 处于 unplaying 状态下 seek 的话，是不会生效的
   * 
   * 2. seek 到 duration 边界(大概是 -100ms)的时候有一个 race condition. 非常坑人   
   * 如果正在播放状态 seek 到这个边界. Howl 可能认为已经到结尾了, 会自动调用 stop 并触发 onend 事件, 还可能直接跳过 stop 重头开始播放...
   * @param time Playback position in seconds (float).
   */
  private safeSeek(time: number) {
    if (!this.sound) {
      console.error('<AudioManager.safeSeek> No track loaded');
      return;
    }
    if (this.sound.playing()) {
      // 如果 sound 未加载完，duration 可能为 0, 所以要在 playing() 之后调用
      const dur = this.sound.duration();
      console.log(`<AudioManager.safeSeek> Seek to ${time} / ${dur}`);
      
      // 设置 safeTime 防止结尾边界的异常情况
      const safeTime = Math.max(0, Math.min(time, dur - 0.11));
      this.sound.seek(safeTime, this.soundId!);
    } else {
      console.log('<AudioManager.safeSeek> Track not playing, set pending seek to', time);
      this.pendingSeek = time;
    }
  }

  public getCurrentTrackSeek() {
    return this.sound?.seek() ?? 0;
  }

  /**
   * Set the playback rate of the audio.
   * @param rate The playback speed multiplier. Must be a positive number.   
   * Typical values are between 0.5 (half speed) and 2.0 (double speed).
   */
  public setRate(rate: number) {
    this.playbackRate = rate;
    this.sound?.rate(rate, this.soundId!);
  }

  /**
   * Set the global volume for all sounds.
   * @param volume A float number in the range [0, 1], where 0 is muted and 1 is full volume.
   */
  public setVolume(volume: number) {
    Howler.volume(volume);
  }

  public applySettings(settings: AudioPlaySettings) {
    console.log('<AudioManager.applySettings>:', settings);
    this.setRate(settings.playbackRate);
    this.setVolume(settings.volume);
    this.continuousPlay = settings.continuousPlay;
  }

  public destroy() {
    if (this.sound) {
      this.sound.unload();
      this.sound = null;
      this.soundId = null;
      this.pendingSeek = null;
    }
    this.playlist = [];
    this.currentTrackIndex = 0;
  }
}

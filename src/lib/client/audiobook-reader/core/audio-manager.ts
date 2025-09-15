import { Howl, Howler } from 'howler';
import { ReaderState, AudioTrack, AudioPlaySettings } from '../types';

const PROGRESS_TRACKING_INTERVAL = 200;

type StateUpdater = (newState: Partial<ReaderState>) => void;

export class AudioManager {
  private updateState: StateUpdater;
  private playlist: AudioTrack[] = [];
  private sound: Howl | null = null;
  private currentTrackIndex: number = 0;
  private continuousPlay: boolean = true;
  private progressTracking: number | null = null;
  private playbackRate: number = 1;
  
  constructor(updateState: StateUpdater) {
    this.updateState = updateState;
  }

  public load(
    playlist: AudioTrack[],
    initTrack?: number,
    initOffset?: number,
  ) {
    this.playlist = playlist.map((track, index) => ({
      ...track,
      title: track.title || track.src.split('/').pop() || `Track ${index + 1}`
    }));
    console.log('<AudioManager> load playlist:', this.playlist);

    if (initTrack) {
      this.loadTrack(initTrack, initOffset);
    }
  }

  private loadTrack(trackIndex: number, offset?: number) {
    if (this.sound) {
      this.sound.unload();
      this.sound = null;
    }

    const track = this.playlist[trackIndex];
    if (!track) {
      console.warn(`Track index [${trackIndex}] not exist`);
      return;
    }

    this.currentTrackIndex = trackIndex;

    this.sound = new Howl({
      src: [track.src],
      html5: true,  // Force HTML5 Audio to enable streaming
      onload: () => {
        console.log('<AudioManager> Track loaded');
        // this.updateState({ duration: this.sound?.duration() });
      },
      onplay: () => {
        console.log('<AudioManager> Track start playing');
        this.sound?.rate(this.playbackRate);
        this.updateState({ isPlaying: true });
        this.startProgressTracking();
      },
      onpause: () => {
        console.log('<AudioManager> Track pause playing');
        this.updateState({ isPlaying: false });
      },
      onend: () => {
        console.log('<AudioManager> Track end');

        if (this.continuousPlay && (this.currentTrackIndex < this.playlist.length - 1)) {
          this.next();
        } else {
          this.updateState({isPlaying: false});
        }
      },
    });

    if (offset) {
      this.sound.once('play', () => {
        this.seek(offset);
      });
    }
  }

  public playTrack(trackIndex: number, offset?: number) {
    this.loadTrack(trackIndex, offset);
    
    if (!this.sound) return;
    
    this.play();
    this.updateState({ currentTrackIndex: trackIndex, currentTrackTime: offset ?? 0 });
  }

  public seekToTrack(trackIndex: number, offset?: number) {
    this.loadTrack(trackIndex, offset);
  }

  private startProgressTracking(immediate: boolean = true) {
    this.stopProgressTracking();
    
    const step = () => { 
      if (this.sound?.playing()) {
        const seek = this.sound.seek() || 0;
        this.updateState({
          currentTrackIndex: this.currentTrackIndex,
          currentTrackTime: seek
        });

        this.progressTracking = window.setTimeout(step, PROGRESS_TRACKING_INTERVAL);
      } else {
        this.progressTracking = null;
      }
    };

    if (immediate) {
      step();   // 立即执行第一次
    } else {    // 延迟执行
      this.progressTracking = window.setTimeout(step, PROGRESS_TRACKING_INTERVAL); 
    }
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
    this.sound?.play();
  }

  public pause() {
    this.sound?.pause();
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

  public next() {
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.playTrack(this.currentTrackIndex + 1);
    }
  }

  public prev() {
    if (this.currentTrackIndex > 0) {
      this.playTrack(this.currentTrackIndex - 1);
    } else {
      this.seek(0);
    }
  }
  
  public forward(seconds: number) {
      if (!this.sound) return;
      const current = this.sound.seek() || 0;
      const duration = this.sound.duration() || 0;
      this.seek(Math.min(current + seconds, duration));
  }

  public rewind(seconds: number) {
      if (!this.sound) return;
      const current = this.sound.seek() || 0;
      this.seek(Math.max(0, current - seconds));
  }

  /**
   * Seek to a specific playback position.
   *
   * @param time Playback position in seconds (float).
   */
  public seek(time: number) {
    this.sound?.seek(time);
  }

  public getCurrentSeek() {
    return this.sound?.seek() ?? 0;
  }

  /**
   * Set the playback rate of the audio.
   * @param rate The playback speed multiplier. Must be a positive number.   
   * Typical values are between 0.5 (half speed) and 2.0 (double speed).
   */
  public setRate(rate: number) {
    this.playbackRate = rate;
    this.sound?.rate(rate);
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
    }
    this.playlist = [];
    this.currentTrackIndex = 0;
  }
}

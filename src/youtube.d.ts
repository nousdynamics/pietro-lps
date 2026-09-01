declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    rel?: 0 | 1;
    controls?: 0 | 1;
    modestbranding?: 0 | 1;
    disablekb?: 0 | 1;
    fs?: 0 | 1;
    iv_load_policy?: 1 | 3;
    playsinline?: 0 | 1;
    cc_load_policy?: 0 | 1;
    enablejsapi?: 0 | 1;
    mute?: 0 | 1;
    origin?: string;
  }

  interface PlayerOptions {
    videoId: string;
    playerVars?: PlayerVars;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
    };
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }

  class Player {
    constructor(elementId: string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    mute(): void;
    unMute(): void;
    setVolume(volume: number): void;
    getCurrentTime(): number;
    getPlayerState(): PlayerState;
    destroy(): void;
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}

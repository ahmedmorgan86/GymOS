export type PlaybackSegment = 'intro' | 'primary' | 'outro';

export type ScheduledPlaybackJob = {
  id: string;
  announcementId: string;
  segment: PlaybackSegment;
  uri: string;
  volume: number;
  repeat: number;
  gapSeconds: number;
  fadeIn: number;
  fadeOut: number;
};

export function clampVolume(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function createAudioElement(uri: string, volume: number): HTMLAudioElement {
  const audio = new Audio(uri);
  audio.volume = Math.max(0, Math.min(1, volume / 100));
  return audio;
}

export async function playAudioAsset(
  uri: string,
  volume: number,
  options?: { fadeIn?: number; fadeOut?: number; waitForEnd?: boolean }
): Promise<void> {
  if (!uri) return;
  const audio = createAudioElement(uri, volume);
  const fadeIn = Math.max(0, options?.fadeIn ?? 0);
  const fadeOut = Math.max(0, options?.fadeOut ?? 0);

  if (fadeIn > 0) {
    audio.volume = 0;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const progress = Math.min(1, elapsed / fadeIn);
      audio.volume = (volume / 100) * progress;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (fadeOut > 0) {
    audio.addEventListener('timeupdate', () => {
      const remaining = audio.duration - audio.currentTime;
      if (remaining <= fadeOut) {
        const ratio = Math.max(0, remaining / fadeOut);
        audio.volume = (volume / 100) * ratio;
      }
    }, { passive: true });
  }

  if (options?.waitForEnd ?? true) {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('audio-playback-failed'));
      audio.play().catch(reject);
    });
  } else {
    await audio.play().catch(() => {});
  }
}

export async function playAnnouncementSequence(
  introUri: string | null,
  primaryUri: string,
  outroUri: string | null,
  settings: {
    introVolume?: number;
    primaryVolume?: number;
    outroVolume?: number;
    introRepeat?: number;
    primaryRepeat?: number;
    primaryGapSeconds?: number;
    outroRepeat?: number;
    outroGapSeconds?: number;
  } = {}
): Promise<void> {
  const introVolume = clampVolume(settings.introVolume ?? 100);
  const primaryVolume = clampVolume(settings.primaryVolume ?? 100);
  const outroVolume = clampVolume(settings.outroVolume ?? 100);
  const introRepeat = Math.max(1, settings.introRepeat ?? 1);
  const primaryRepeat = Math.max(1, settings.primaryRepeat ?? 1);
  const outroRepeat = Math.max(1, settings.outroRepeat ?? 1);
  const primaryGap = Math.max(0, settings.primaryGapSeconds ?? 0);
  const outroGap = Math.max(0, settings.outroGapSeconds ?? 0);

  if (introUri) {
    for (let i = 0; i < introRepeat; i++) {
      await playAudioAsset(introUri, introVolume);
      if (i < introRepeat - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  for (let i = 0; i < primaryRepeat; i++) {
    await playAudioAsset(primaryUri, primaryVolume);
    if (i < primaryRepeat - 1) {
      await new Promise((resolve) => setTimeout(resolve, primaryGap * 1000));
    }
  }

  if (outroUri) {
    for (let i = 0; i < outroRepeat; i++) {
      await playAudioAsset(outroUri, outroVolume);
      if (i < outroRepeat - 1) {
        await new Promise((resolve) => setTimeout(resolve, outroGap * 1000));
      }
    }
  }
}

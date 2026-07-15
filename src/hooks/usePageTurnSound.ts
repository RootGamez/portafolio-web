import { useCallback, useEffect, useRef } from "react";

const SRC = "/media/audio/page-turn.wav";
const PLAYBACK_RATE = 1.6;
// El clip dura ~2s; ningun giro de pagina pasa de ~520ms (ver HALF_TURN_MS
// en ComicBook), asi que se acelera y se corta antes de que se arrastre.
const CUTOFF_MS = 440;
const FADE_MS = 70;

/**
 * Sonido de pagina al pasar, reproducido desde un asset real (CC0) en vez de
 * sintetizado: el ruido filtrado no sonaba a papel de verdad. El elemento se
 * precarga en el montaje para que hasta el primer giro suene sin retraso.
 */
export function usePageTurnSound(): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cutoffTimer = useRef<number | null>(null);
  const fadeFrame = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(SRC);
    audio.preload = "auto";
    audio.playbackRate = PLAYBACK_RATE;
    audioRef.current = audio;
  }, []);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (cutoffTimer.current !== null) window.clearTimeout(cutoffTimer.current);
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);

    audio.currentTime = 0;
    audio.volume = 1;
    void audio.play().catch(() => {});

    cutoffTimer.current = window.setTimeout(() => {
      const start = performance.now();
      const fade = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        audio.volume = 1 - t;
        if (t < 1) {
          fadeFrame.current = requestAnimationFrame(fade);
        } else {
          audio.pause();
          audio.volume = 1;
        }
      };
      fadeFrame.current = requestAnimationFrame(fade);
    }, CUTOFF_MS - FADE_MS);
  }, []);
}

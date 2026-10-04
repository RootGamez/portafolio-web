import {
  INK_FRAME_BUDGET_MS,
  INK_LOW_END_CORES,
  INK_LOW_END_MEMORY_GB,
  INK_MIN_GL_CORES,
  INK_MIN_GL_MEMORY_GB,
  INK_MONITOR_WINDOW,
  INK_SLOW_SHARE,
  INK_T2_DPR_CAP,
  INK_T2_OCTAVES,
  INK_T3_DPR_CAP,
  INK_T3_OCTAVES,
} from "@/lib/stage/config";
import type { InkQuality } from "./webgl";

/**
 * Tiers de calidad de la tinta (docs/PLAN_ESCENARIOS.md §6):
 *   T3 · WebGL, DPR ≤ 1,5 y 5 octavas de ruido
 *   T2 · WebGL, DPR 1 y 3 octavas
 *   T1 · la tinta SVG/DOM de la fase 2 (siempre disponible)
 * (T0 es el modo lineal: lo decide useDeckMode, no esto.)
 *
 * Todo puro: la eleccion inicial sale de pistas del dispositivo y la degradacion,
 * de un monitor de frame-time que es un valor inmutable.
 */
export type InkTier = "T3" | "T2" | "T1";
export type GlTier = Exclude<InkTier, "T1">;

export const TIER_QUALITY: Readonly<Record<GlTier, InkQuality>> = {
  T3: { dprCap: INK_T3_DPR_CAP, octaves: INK_T3_OCTAVES },
  T2: { dprCap: INK_T2_DPR_CAP, octaves: INK_T2_OCTAVES },
};

export type DeviceHints = {
  readonly webgl: boolean;
  /** GB aproximados (solo Chromium); undefined en Safari y Firefox. */
  readonly deviceMemory?: number;
  readonly hardwareConcurrency?: number;
  readonly saveData?: boolean;
};

/**
 * Gama baja (heuristica de la skill motion-ui): poca memoria, o pocos nucleos
 * cuando el navegador no dice la memoria. Muy justo: ni siquiera T2 compensa.
 */
export function pickInkTier(hints: DeviceHints): InkTier {
  const { webgl, deviceMemory, hardwareConcurrency, saveData } = hints;
  if (!webgl || saveData) return "T1";

  const cores = hardwareConcurrency ?? 0;
  const memory = deviceMemory;
  if ((memory !== undefined && memory <= INK_MIN_GL_MEMORY_GB) || (cores > 0 && cores <= INK_MIN_GL_CORES)) return "T1";

  const lowEnd =
    (memory !== undefined && memory <= INK_LOW_END_MEMORY_GB) ||
    (memory === undefined && cores > 0 && cores <= INK_LOW_END_CORES);
  return lowEnd ? "T2" : "T3";
}

/** Un escalon por debajo de un tier WebGL: de T3 a T2 y de T2 a la tinta SVG. */
export function lowerTier(tier: GlTier): Exclude<InkTier, "T3"> {
  return tier === "T3" ? "T2" : "T1";
}

export type FrameMonitor = {
  /** Ultimos intervalos entre dibujos seguidos, en ms (el mas reciente al final). */
  readonly intervals: readonly number[];
};

export const EMPTY_MONITOR: FrameMonitor = { intervals: [] };

/**
 * Apunta un intervalo. `slow` = la ventana esta llena y demasiados fotogramas se
 * pasaron del presupuesto: hay que bajar de tier. Entonces el monitor vuelve a
 * empezar vacio, para juzgar la calidad nueva con sus propios fotogramas.
 */
export function recordFrame(monitor: FrameMonitor, intervalMs: number): { monitor: FrameMonitor; slow: boolean } {
  if (!Number.isFinite(intervalMs) || intervalMs < 0) return { monitor, slow: false };

  const intervals = [...monitor.intervals, intervalMs].slice(-INK_MONITOR_WINDOW);
  if (intervals.length < INK_MONITOR_WINDOW) return { monitor: { intervals }, slow: false };

  const slowFrames = intervals.filter((ms) => ms > INK_FRAME_BUDGET_MS).length;
  if (slowFrames >= Math.ceil(INK_MONITOR_WINDOW * INK_SLOW_SHARE)) {
    return { monitor: EMPTY_MONITOR, slow: true };
  }
  return { monitor: { intervals }, slow: false };
}

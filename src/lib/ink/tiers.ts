import { INK_FRAME_BUDGET_MS, INK_MONITOR_WINDOW, INK_SLOW_SHARE } from "@/lib/stage/config";
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
  T3: { dprCap: 1.5, octaves: 5 },
  T2: { dprCap: 1, octaves: 3 },
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
  if ((memory !== undefined && memory <= 1) || (cores > 0 && cores <= 2)) return "T1";

  const lowEnd = (memory !== undefined && memory <= 2) || (memory === undefined && cores > 0 && cores <= 4);
  return lowEnd ? "T2" : "T3";
}

export function lowerTier(tier: InkTier): InkTier {
  if (tier === "T3") return "T2";
  return "T1";
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

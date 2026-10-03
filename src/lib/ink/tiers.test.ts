import { describe, expect, it } from "vitest";
import { INK_FRAME_BUDGET_MS, INK_MONITOR_WINDOW, INK_SLOW_SHARE } from "@/lib/stage/config";
import {
  EMPTY_MONITOR,
  lowerTier,
  pickInkTier,
  recordFrame,
  TIER_QUALITY,
  type DeviceHints,
  type FrameMonitor,
} from "./tiers";

const CAPABLE: DeviceHints = { webgl: true, deviceMemory: 8, hardwareConcurrency: 8, saveData: false };

describe("pickInkTier", () => {
  it("un equipo capaz arranca en T3 (DPR 1,5 y 5 octavas)", () => {
    expect(pickInkTier(CAPABLE)).toBe("T3");
    expect(TIER_QUALITY.T3).toEqual({ dprCap: 1.5, octaves: 5 });
  });

  it("sin WebGL se queda en la tinta SVG (T1)", () => {
    expect(pickInkTier({ ...CAPABLE, webgl: false })).toBe("T1");
  });

  it("con ahorro de datos activo no descarga el chunk WebGL (T1)", () => {
    expect(pickInkTier({ ...CAPABLE, saveData: true })).toBe("T1");
  });

  it("gama baja (≤ 2 GB, o sin deviceMemory y ≤ 4 nucleos) arranca en T2 (DPR 1 y 3 octavas)", () => {
    expect(pickInkTier({ ...CAPABLE, deviceMemory: 2 })).toBe("T2");
    expect(pickInkTier({ ...CAPABLE, deviceMemory: undefined, hardwareConcurrency: 4 })).toBe("T2");
    expect(TIER_QUALITY.T2).toEqual({ dprCap: 1, octaves: 3 });
  });

  it("sin deviceMemory (Safari, Firefox) y con muchos nucleos va a T3", () => {
    expect(pickInkTier({ ...CAPABLE, deviceMemory: undefined, hardwareConcurrency: 8 })).toBe("T3");
  });

  it("muy justo (≤ 1 GB o ≤ 2 nucleos) se queda en SVG", () => {
    expect(pickInkTier({ ...CAPABLE, deviceMemory: 1 })).toBe("T1");
    expect(pickInkTier({ ...CAPABLE, hardwareConcurrency: 2 })).toBe("T1");
  });
});

describe("lowerTier", () => {
  it("baja un escalon y en T1 se queda", () => {
    expect(lowerTier("T3")).toBe("T2");
    expect(lowerTier("T2")).toBe("T1");
    expect(lowerTier("T1")).toBe("T1");
  });
});

/** Registra `count` fotogramas de `ms` y devuelve el monitor y si alguno pidio degradar. */
function feed(monitor: FrameMonitor, ms: number, count: number) {
  let current = monitor;
  let slow = false;
  for (let i = 0; i < count; i += 1) {
    const result = recordFrame(current, ms);
    current = result.monitor;
    slow = slow || result.slow;
  }
  return { monitor: current, slow };
}

describe("recordFrame (monitor de frame-time)", () => {
  const SLOW = INK_FRAME_BUDGET_MS + 10;
  const FAST = 8;
  const slowNeeded = Math.ceil(INK_MONITOR_WINDOW * INK_SLOW_SHARE);

  it("no opina hasta tener una ventana entera de fotogramas", () => {
    expect(feed(EMPTY_MONITOR, SLOW, INK_MONITOR_WINDOW - 1).slow).toBe(false);
  });

  it("una ventana con lentitud SOSTENIDA pide degradar y se vacia (la calidad nueva empieza de cero)", () => {
    const result = feed(EMPTY_MONITOR, SLOW, INK_MONITOR_WINDOW);

    expect(result.slow).toBe(true);
    expect(result.monitor).toEqual(EMPTY_MONITOR);
  });

  it("unos pocos tirones (el cambio de escenario) no degradan", () => {
    const withSpikes = feed(feed(EMPTY_MONITOR, FAST, INK_MONITOR_WINDOW - 3).monitor, 55, 3);

    expect(withSpikes.slow).toBe(false);
  });

  it("degrada justo al llegar a la proporcion de fotogramas lentos", () => {
    const below = feed(feed(EMPTY_MONITOR, FAST, INK_MONITOR_WINDOW - slowNeeded + 1).monitor, SLOW, slowNeeded - 1);
    const atShare = feed(feed(EMPTY_MONITOR, FAST, INK_MONITOR_WINDOW - slowNeeded).monitor, SLOW, slowNeeded);

    expect(below.slow).toBe(false);
    expect(atShare.slow).toBe(true);
  });

  it("es una ventana deslizante: lo lento antiguo sale de la cuenta", () => {
    const old = feed(EMPTY_MONITOR, SLOW, slowNeeded - 1).monitor;
    const refreshed = feed(old, FAST, INK_MONITOR_WINDOW);

    expect(feed(refreshed.monitor, SLOW, slowNeeded - 1).slow).toBe(false);
  });

  it("no muta el monitor que recibe", () => {
    const before = feed(EMPTY_MONITOR, FAST, 3).monitor;
    const snapshot = [...before.intervals];

    recordFrame(before, SLOW);

    expect(before.intervals).toEqual(snapshot);
  });

  it("ignora intervalos no validos", () => {
    expect(recordFrame(EMPTY_MONITOR, Number.NaN).monitor).toEqual(EMPTY_MONITOR);
    expect(recordFrame(EMPTY_MONITOR, -5).monitor).toEqual(EMPTY_MONITOR);
  });
});

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { inkFieldFrame } from "@/lib/ink/frame";
import { mountInkEngine, type InkGlModule } from "@/lib/ink/mount";
import { pickInkTier, type DeviceHints, type InkTier } from "@/lib/ink/tiers";
import type { Layout } from "@/lib/stage/timeline";
import type { TransitionSpec } from "@/lib/stage/transitions";

type Props = {
  readonly transitions: readonly TransitionSpec[];
  readonly layout: MotionValue<Layout>;
  readonly scrollOffset: MotionValue<number>;
  /** true mientras se ve la tinta WebGL (InkOverlay oculta entonces la SVG). */
  readonly onActiveChange: (active: boolean) => void;
  /** Para los tests; por defecto, el que toca a este dispositivo. */
  readonly initialTier?: InkTier;
  /** Para los tests; por defecto, el chunk WebGL de verdad. */
  readonly loadEngine?: () => Promise<InkGlModule>;
};

type NavigatorHints = Navigator & {
  readonly deviceMemory?: number;
  readonly connection?: { readonly saveData?: boolean };
};

function readDeviceHints(): DeviceHints {
  const nav = navigator as NavigatorHints;
  return {
    webgl: typeof WebGLRenderingContext !== "undefined",
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
  };
}

const loadGlChunk = () => import("@/lib/ink/glChunk");

/**
 * El canvas de la tinta WebGL (tiers T3/T2). Crea el `<canvas>` y lo entrega a
 * mountInkEngine (lib/ink/mount.ts), que hace el resto fuera de React: ningun
 * render por fotograma. Si WebGL se descarta (sin soporte, chunk que no llega,
 * lentitud sostenida) el canvas se quita y queda la tinta SVG (T1).
 */
export function InkCanvas({
  transitions,
  layout,
  scrollOffset,
  onActiveChange,
  initialTier,
  loadEngine = loadGlChunk,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Se decide una vez: las pistas del dispositivo no cambian en la sesion.
  const [tier] = useState<InkTier>(() => initialTier ?? pickInkTier(readDeviceHints()));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (tier === "T1" || failed || !host) return;

    // Un canvas NUEVO en cada montaje y no uno del JSX: al desmontar, el motor
    // suelta el contexto (WEBGL_lose_context) y ese canvas ya no sirve; si el
    // efecto se rehiciera sobre el mismo, la tinta WebGL moriria para siempre.
    const canvas = document.createElement("canvas");
    canvas.dataset.inkCanvas = "";
    canvas.className = "absolute inset-0 block h-full w-full";
    host.append(canvas);

    const dispose = mountInkEngine({
      canvas,
      tier,
      load: loadEngine,
      getFrame: () => inkFieldFrame(layout.get(), scrollOffset.get(), transitions),
      sources: [layout, scrollOffset],
      onActive: onActiveChange,
      onFail: () => setFailed(true),
    });
    return () => {
      dispose();
      canvas.remove();
    };
  }, [tier, failed, loadEngine, layout, scrollOffset, transitions, onActiveChange]);

  if (tier === "T1" || failed) return null;
  return <div ref={hostRef} data-ink-canvas-host="" className="absolute inset-0" />;
}

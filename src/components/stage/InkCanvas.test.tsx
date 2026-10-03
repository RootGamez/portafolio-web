import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { motionValue } from "motion/react";
import type { InkEngineOptions } from "@/lib/ink/engine";
import type { InkGlModule } from "@/lib/ink/mount";
import { INK_GL_LOAD_DELAY_MS } from "@/lib/stage/config";
import { buildLayout } from "@/lib/stage/timeline";
import { TRANSITIONS } from "@/lib/stage/transitions";
import { InkCanvas } from "./InkCanvas";

const LAYOUT = motionValue(buildLayout([{ contentHeight: 600 }, { contentHeight: 600 }], 800));
const TRANSITIONS_USED = TRANSITIONS.slice(0, 1);

function fakeModule(engine: "ok" | "null" = "ok") {
  const engines: { options: InkEngineOptions; requestRender: ReturnType<typeof vi.fn> }[] = [];
  const module: InkGlModule = {
    readInkPalette: vi.fn(() => ({}) as never),
    createInkEngine: vi.fn((options: InkEngineOptions) => {
      if (engine === "null") return null;
      const created = { options, requestRender: vi.fn(), setQuality: vi.fn(), destroy: vi.fn() };
      engines.push(created);
      return created;
    }),
  };
  return { module, engines };
}

function setup(props: { tier: "T3" | "T1"; module?: ReturnType<typeof fakeModule> }) {
  const loaded = props.module ?? fakeModule();
  const loadEngine = vi.fn(() => Promise.resolve(loaded.module));
  const onActiveChange = vi.fn();
  const scrollOffset = motionValue(0);
  const utils = render(
    <InkCanvas
      transitions={TRANSITIONS_USED}
      layout={LAYOUT}
      scrollOffset={scrollOffset}
      onActiveChange={onActiveChange}
      initialTier={props.tier}
      loadEngine={loadEngine}
    />,
  );
  const canvas = () => utils.container.querySelector("canvas[data-ink-canvas]");
  return { ...utils, canvas, loadEngine, onActiveChange, scrollOffset, loaded };
}

async function idle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(INK_GL_LOAD_DELAY_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("InkCanvas", () => {
  it("en T1 (sin WebGL, ahorro de datos, gama muy baja) no pone canvas ni descarga el chunk", async () => {
    const { canvas, loadEngine } = setup({ tier: "T1" });
    await idle();

    expect(canvas()).toBeNull();
    expect(loadEngine).not.toHaveBeenCalled();
  });

  it("en T3 pone el canvas, carga el chunk en reposo y avisa de que la tinta WebGL esta activa", async () => {
    const { canvas, loadEngine, onActiveChange } = setup({ tier: "T3" });
    expect(canvas()).not.toBeNull();

    await idle();

    expect(loadEngine).toHaveBeenCalledTimes(1);
    expect(onActiveChange).toHaveBeenLastCalledWith(true);
  });

  it("el motor dibuja el fotograma del scroll de AHORA (se lee en el rAF, no al montar)", async () => {
    const { scrollOffset, loaded } = setup({ tier: "T3" });
    await idle();
    const getFrame = loaded.engines[0]?.options.getFrame;

    expect(getFrame?.()).toBeNull();
    scrollOffset.set(480 + 200);
    expect(getFrame?.()).toMatchObject({ index: 0, ink: TRANSITIONS_USED[0].ink });
  });

  it("si WebGL no arranca quita el canvas y deja la tinta SVG", async () => {
    const { canvas, onActiveChange } = setup({ tier: "T3", module: fakeModule("null") });

    await idle();

    expect(canvas()).toBeNull();
    expect(onActiveChange).not.toHaveBeenCalledWith(true);
  });
});

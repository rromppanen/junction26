// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SampleActions } from "./SampleActions";
import { SampleDrawer } from "./SampleDrawer";
import { NursePatients } from "./NursePatients";
import { RobotsView } from "../robots/RobotsView";
import { addEvent, type Sample } from "@/lib/sample/model";
import { patientRows } from "./patientRows";

const state = vi.hoisted(() => ({
  samples: [] as Sample[],
  now: 1_800_000_000_000,
  add: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("@/lib/sample/store", () => ({ useSamples: () => state }));
vi.mock("next/dynamic", () => ({
  default: () => () => createElement("div", { "aria-label": "Map stub" }),
}));
vi.mock("@/lib/robots/routes", () => ({ useRoutes: () => new Map() }));
let root: Root;
let host: HTMLDivElement;
const fixture = (events: Sample["events"]): Sample => ({
  id: "qa",
  person: {
    id: "qa",
    name: "QA Patient",
    age: 60,
    area: "Kallio",
    municipality: "Helsinki",
    lang: "en",
  },
  events,
});
const rowOf = (sample: Sample) => patientRows([sample], state.now)[0];
async function render(node: React.ReactNode) {
  await act(async () => root.render(node));
}
function button(label: string): HTMLButtonElement {
  const result = [...host.querySelectorAll("button")].find(
    (el) =>
      el.textContent?.replace(/\s+/g, " ").trim() === label ||
      el.getAttribute("aria-label") === label,
  );
  if (!result) throw new Error(`No button: ${label}`);
  return result;
}
async function frames() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}
async function click(label: string) {
  await act(async () => button(label).click());
  await frames();
}
async function openPatient() {
  await act(async () =>
    (host.querySelector("#patient-list button") as HTMLButtonElement).click(),
  );
  await frames();
}
async function note(text: string) {
  const textarea = host.querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(textarea, text);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    return window.setTimeout(() => callback(0), 0);
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: true }),
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  state.samples = [];
  state.add.mockReset();
  state.reset.mockReset();
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("nurse contact workflow", () => {
  it("rejects whitespace notes, saves trimmed multiline text, and returns focus to the call action", async () => {
    const actFn = vi.fn();
    await render(
      createElement(SampleActions, {
        row: rowOf(fixture([{ type: "invited", at: state.now - 1000 }])),
        now: state.now,
        busy: false,
        act: actFn,
      }),
    );
    await click("Record a call");
    await note("   ");
    expect(button("Save note").disabled).toBe(true);
    await note("  First line\nSecond line  ");
    await click("Save note");
    expect(actFn).toHaveBeenCalledWith(expect.anything(), "nurseCalled", {
      note: "First line\nSecond line",
    });
    expect(document.activeElement).toBe(button("Record a call"));
  });
  it("discards a cancelled call note instead of reopening it as an unsaved draft", async () => {
    await render(
      createElement(SampleActions, {
        row: rowOf(fixture([{ type: "invited", at: state.now }])),
        now: state.now,
        busy: false,
        act: vi.fn(),
      }),
    );
    await click("Record a call");
    await note("Cancelled note");
    await click("Cancel");
    await click("Record a call");
    expect(host.querySelector("textarea")!.value).toBe("");
  });
  it("keeps a dirty patient record open when discard is cancelled", async () => {
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await render(
      createElement(SampleDrawer, {
        row: rowOf(fixture([{ type: "invited", at: state.now }])),
        now: state.now,
        busy: false,
        act: vi.fn(),
        status: "",
        onClose,
      }),
    );
    await click("Record a call");
    await note("Unsaved discussion");
    await click("Close");
    expect(confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(host.querySelector("textarea")!.value).toBe("Unsaved discussion");
    confirm.mockReturnValue(true);
    await click("Close");
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("screening confirmations", () => {
  for (const label of ["Result: no blood", "Result: blood found"])
    it(`cancels and confirms ${label}`, async () => {
      state.samples = [fixture([{ type: "atLab", at: state.now - 1000 }])];
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      await render(createElement(RobotsView));
      await openPatient();
      await click(label);
      expect(state.add).not.toHaveBeenCalled();
      confirm.mockReturnValue(true);
      await click(label);
      expect(state.add).toHaveBeenCalledWith(
        "qa",
        expect.objectContaining({
          type:
            label === "Result: no blood" ? "resultNegative" : "resultPositive",
        }),
      );
    });
  it("cancels and confirms colonoscopy completion", async () => {
    state.samples = [
      fixture([
        { type: "colonoscopyBooked", at: state.now - 1000, slot: "Mon 09:00" },
      ]),
    ];
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await render(createElement(RobotsView));
    await openPatient();
    await click("Mark colonoscopy done");
    expect(state.add).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await click("Mark colonoscopy done");
    expect(state.add).toHaveBeenCalledWith("qa", { type: "colonoscopyDone" });
  });
  it("keeps the screening stage after a reminder and advances positive results through booking to completion", () => {
    let samples = [fixture([{ type: "atLab", at: state.now - 1000 }])];
    samples = addEvent(samples, "qa", {
      type: "resultPositive",
      at: state.now,
    });
    samples = addEvent(samples, "qa", {
      type: "reminderSent",
      at: state.now + 1,
    });
    expect(rowOf(samples[0]).stage).toBe("positive");
    samples = addEvent(samples, "qa", {
      type: "colonoscopyBooked",
      at: state.now + 2,
      slot: "Mon 09:00",
    });
    expect(rowOf(samples[0]).stage).toBe("colonoscopyBooked");
    samples = addEvent(samples, "qa", {
      type: "colonoscopyDone",
      at: state.now + 3,
    });
    expect(rowOf(samples[0]).stage).toBe("done");
  });
});

describe("patient queue and empty map", () => {
  it("expands and collapses the whole queue, including after all patients are shown", async () => {
    const rows = Array.from({ length: 25 }, (_, i) =>
      rowOf({
        ...fixture([{ type: "invited", at: state.now }]),
        id: `p${i}`,
        person: { ...fixture([]).person, id: `p${i}`, name: `Patient ${i}` },
      }),
    );
    await render(
      createElement(NursePatients, {
        rows,
        onSelect: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(host.querySelectorAll("#patient-list li")).toHaveLength(12);
    await click("Show more patients");
    await click("Show more patients");
    expect(host.querySelectorAll("#patient-list li")).toHaveLength(25);
    await click("Show fewer patients");
    expect(host.querySelectorAll("#patient-list li")).toHaveLength(12);
    expect(document.activeElement).toBe(button("Show more patients"));
  });
  it("shows one live action announcement while a patient drawer is open", async () => {
    state.samples = [fixture([{ type: "invited", at: state.now }])];
    await render(createElement(RobotsView));
    await openPatient();
    expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);
  });
});

describe("keyboard and action availability", () => {
  it("traps Tab, closes clean records with Escape, and preserves multiline history", async () => {
    const close = vi.fn();
    await render(
      createElement(SampleDrawer, {
        row: rowOf(
          fixture([
            { type: "invited", at: state.now },
            {
              type: "nurseCalled",
              at: state.now + 1,
              note: "First line\nSecond line",
            },
          ]),
        ),
        now: state.now,
        busy: false,
        act: vi.fn(),
        status: "",
        onClose: close,
      }),
    );
    expect(document.activeElement).toBe(button("Close"));
    const last = button("Record a call");
    last.focus();
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).toBe(button("Close"));
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).toBe(last);
    expect(
      [...host.querySelectorAll("ol span")]
        .find((el) => el.textContent?.includes("First line\nSecond line"))
        ?.classList.contains("whitespace-pre-wrap"),
    ).toBe(true);
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(close).toHaveBeenCalledOnce();
  });
  it("restores focus inside the record when a result removes the focused action", async () => {
    const sample = fixture([{ type: "atLab", at: state.now - 1000 }]);
    const props = {
      now: state.now,
      busy: false,
      act: vi.fn(),
      status: "",
      onClose: vi.fn(),
    };
    await render(createElement(SampleDrawer, { ...props, row: rowOf(sample) }));
    button("Result: blood found").focus();
    const positive = addEvent([sample], "qa", {
      type: "resultPositive",
      at: state.now,
    })[0];
    await render(
      createElement(SampleDrawer, {
        ...props,
        row: rowOf(positive),
        status: "Result recorded",
      }),
    );
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Patient record",
    );
  });
  for (const event of ["resultNegative", "colonoscopyDone"] as const)
    it(`offers no screening or contact writes after ${event}`, async () => {
      await render(
        createElement(SampleActions, {
          row: rowOf(fixture([{ type: event, at: state.now }])),
          now: state.now,
          busy: false,
          act: vi.fn(),
        }),
      );
      expect(host.querySelectorAll("button")).toHaveLength(0);
      expect(host.textContent).toContain("Screening status");
    });
  it("disables repeated reminder and result submissions while busy", async () => {
    const write = vi.fn();
    await render(
      createElement(SampleActions, {
        row: rowOf(fixture([{ type: "atLab", at: state.now }])),
        now: state.now,
        busy: true,
        act: write,
      }),
    );
    await click("Send reminder");
    await click("Result: blood found");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("empty-state recovery", () => {
  it("recovers a patient search with no matches", async () => {
    await render(
      createElement(NursePatients, {
        rows: [rowOf(fixture([{ type: "invited", at: state.now }]))],
        onSelect: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    const search = host.querySelector('input[type="search"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(search, "not-a-patient");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(host.querySelectorAll("#patient-list li")).toHaveLength(0);
    expect(host.textContent).toContain("No patients match this search");
    await click("Show all patients");
    expect(host.querySelectorAll("#patient-list li")).toHaveLength(1);
  });
  it("restores hidden map layers without resetting location choices", async () => {
    state.samples = [fixture([{ type: "invited", at: state.now }])];
    await render(createElement(RobotsView));
    await click("Filters");
    async function toggle(label: string) {
      const input = [...host.querySelectorAll("label")]
        .find((el) => el.textContent?.trim() === label)
        ?.querySelector("input");
      if (!input) throw new Error(`Missing checkbox: ${label}`);
      await act(async () => input.click());
    }
    await toggle("Itäkeskus hub");
    for (const label of [
      "Screening participants",
      "Robots & pickup homes",
      "Robot routes",
      "Hubs & lab collections",
      "Waiting for a robot",
    ])
      await toggle(label);
    expect(host.textContent).toContain("All map layers are hidden");
    await click("Show map layers");
    expect(host.textContent).not.toContain("All map layers are hidden");
    const location = [...host.querySelectorAll("label")]
      .find((el) => el.textContent?.trim() === "Itäkeskus hub")!
      .querySelector("input")!;
    expect(location.checked).toBe(false);
  });
});

it("does not complete a screening while an unsaved call note would be hidden", async () => {
  const write = vi.fn();
  await render(
    createElement(SampleActions, {
      row: rowOf(
        fixture([
          { type: "colonoscopyBooked", at: state.now, slot: "Mon 09:00" },
        ]),
      ),
      now: state.now,
      busy: false,
      act: write,
    }),
  );
  await click("Record a call");
  await note("Discussion still being recorded");
  await click("Mark colonoscopy done");
  expect(write).not.toHaveBeenCalled();
  expect(host.querySelector("textarea")!.value).toBe(
    "Discussion still being recorded",
  );
  await click("Cancel");
  await click("Mark colonoscopy done");
  expect(write).toHaveBeenCalledWith(expect.anything(), "colonoscopyDone");
});

import { expect, test, type Page, type Route } from "@playwright/test";
import { report, resultStream } from "./fixtures";

async function config(route: Route) {
  await route.fulfill({ contentType: "application/json", body: JSON.stringify({ geminiConfigured: false, contextConfigured: false }) });
}
async function mockPipeline(page: Page, respond: (route: Route) => Promise<void>) {
  await page.route("**/api/pipeline", route => route.request().method() === "GET" ? config(route) : respond(route));
}
const csv = "year,group,invited,attended\n2024,A,100,50\n2024,B,100,90";
async function upload(page: Page) {
  await page.getByLabel("Upload a public screening dataset").setInputFiles({ name: "synthetic-test.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
}

test("one upload starts the pipeline and brings attention directly to insights and actions", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await mockPipeline(page, async route => { await gate; await route.fulfill({ contentType: "application/x-ndjson", body: resultStream() }); });
  await page.goto("/");
  await upload(page);
  await expect(page.getByRole("heading", { name: "Working through your dataset." })).toBeVisible();
  await expect(page.getByRole("list", { name: "Analysis progress" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Run analysis|Continue to analysis|Continue to recommendations/ })).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: "Here’s what needs attention." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Varsinais-Suomi", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reconcile referrals with recorded examinations" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Key insights" }).getByText("2.1%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Investigate variation in the screening chain" }).first()).toHaveAttribute("href", /#page=33$/);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Download results" }).click();
  expect((await download).suggestedFilename()).toBe("care-equity-results.json");
  await page.getByRole("button", { name: "Analyse another dataset" }).click();
  await expect(page.getByRole("heading", { name: /Upload your data/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("the demo starts automatically and cannot present templates as live model output", async ({ page }) => {
  await mockPipeline(page, route => route.fulfill({ contentType: "application/x-ndjson", body: resultStream() }));
  await page.goto("/"); await page.getByRole("button", { name: "Try the public Registry dataset" }).click();
  await expect(page.getByText("Gemini is not configured. Showing source-based proposals.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key insights" })).toBeVisible();
  await page.getByText("How your data were standardised and cleaned", { exact: true }).click();
  await expect(page.getByText("Verified schema.", { exact: true })).toBeVisible();
});

test("only ambiguity interrupts the automatic path, then the pipeline resumes", async ({ page }) => {
  let calls = 0;
  await mockPipeline(page, async route => {
    calls++;
    const input = route.request().postDataJSON();
    if (!input.mapping) await route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ type: "attention", attention: { message: "Which column holds the attended count?", fields: ["attended"], headers: ["year", "group", "invited", "observed_total"], mapping: { year: "year", group: "group", invited: "invited", attended: "", referred: "", completed: "", dimension: "", cohort: "" } } }) + "\n" });
    else { expect(input.mapping.attended).toBe("observed_total"); await route.fulfill({ contentType: "application/x-ndjson", body: resultStream() }); }
  });
  await page.goto("/"); await upload(page);
  await expect(page.getByRole("heading", { name: "Help us resolve the column meaning." })).toBeVisible();
  await page.getByRole("combobox", { name: "Attended count", exact: true }).selectOption("observed_total");
  await page.getByRole("button", { name: "Continue automatically" }).click();
  await expect(page.getByRole("heading", { name: "Key insights" })).toBeVisible(); expect(calls).toBe(2);
});

test("invalid counts and interrupted streams lead to an actionable error, not invented findings", async ({ page }) => {
  await mockPipeline(page, route => route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ type: "error", message: "Row 2: attended exceeds invited." }) + "\n" }));
  await page.goto("/"); await upload(page);
  await expect(page.getByRole("alert").filter({ hasText: "Row 2: attended exceeds invited." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key insights" })).toHaveCount(0);
  await page.getByRole("button", { name: "Choose another file" }).click();
  await page.unroute("**/api/pipeline");
  await mockPipeline(page, route => route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ type: "progress", stage: "prepare", status: "running", message: "Reading input." }) + "\n" }));
  await upload(page);
  await expect(page.getByRole("alert").filter({ hasText: "stopped before producing a result" })).toBeVisible();
});

test("cancelled work cannot overwrite a newly uploaded dataset", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let count = 0;
  await mockPipeline(page, async route => {
    count++;
    if (count === 1) { await gate; await route.fulfill({ contentType: "application/x-ndjson", body: resultStream() }).catch(() => {}); }
    else await route.fulfill({ contentType: "application/x-ndjson", body: resultStream({ ...report, dataset: { ...report.dataset, name: "New dataset" } }) });
  });
  await page.goto("/"); await upload(page);
  await page.getByRole("button", { name: "Cancel analysis" }).click();
  await upload(page); release();
  await expect(page.getByText("New dataset", { exact: false })).toBeVisible();
});

test("upload and results remain readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPipeline(page, route => route.fulfill({ contentType: "application/x-ndjson", body: resultStream() }));
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await upload(page); await expect(page.getByRole("heading", { name: "Key insights" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

import { expect, test, type Page } from "@playwright/test";

async function prepareDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Use the public demo dataset" }).click();
  await page.getByRole("checkbox", { name: "I confirm the definitions" }).check();
  await page.getByRole("button", { name: "Continue to analysis", exact: true }).click();
}

const csv = "period,population,eligible,screened\n2024,Test Group A,100,50\n2024,Test Group B,100,90";
async function upload(page: Page, contents = csv) {
  await page.goto("/");
  await page.getByLabel("Choose a CSV file").setInputFiles({ name: "synthetic-test.csv", mimeType: "text/csv", buffer: Buffer.from(contents) });
}

test("the four steps take real data through findings to sourced recommendations", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/brief", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mode: "template", reason: "Test: model is not configured.", draft: { headline: "Review the measured difference", interpretation: "The counts locate a difference between invitation and screening; causes remain unresolved.", nextQuestion: "Are invitations accessible?", evidenceIds: ["report", "quality"] } }) }));
  await prepareDemo(page);
  await expect(page.getByRole("heading", { name: "Analyse the dataset" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to recommendations" })).toBeDisabled();
  await page.getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Other / missing language" })).toContainText("-19.8 pp");
  await page.getByLabel("Compare by").selectOption("Education");
  await expect(page.getByRole("button", { name: "Continue to recommendations" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Findings", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Basic / unknown education" })).toContainText("50.8%");
  await page.getByLabel("Compare by").selectOption("Language");
  await page.getByRole("button", { name: "Run analysis" }).click();
  await page.getByRole("button", { name: "Continue to recommendations" }).click();
  await expect(page.getByRole("heading", { name: "Recommendations", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Review language accessibility of invitations" })).toBeVisible();
  await expect(page.getByText("The counts locate a difference between invitation and screening; causes remain unresolved.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Consider translated screening invitations" })).toHaveAttribute("href", /#page=18$/);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download results" }).click();
  expect((await download).suggestedFilename()).toBe("care-equity-results.json");
  await page.getByRole("button", { name: "Back to analysis" }).click();
  await expect(page.getByRole("heading", { name: "Findings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue to recommendations" }).click();
  await page.getByRole("button", { name: "Start a new analysis" }).click();
  await expect(page.getByRole("heading", { name: "Upload a dataset" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("upload mapping is confirmed, missing follow-up abstains, and uploaded records stay local", async ({ page }) => {
  let modelCalls = 0;
  page.on("request", request => { if (request.url().includes("/api/brief")) modelCalls++; });
  await upload(page, csv.replace("screened", "observed_total"));
  await expect(page.getByRole("heading", { name: "Prepare the data" })).toBeVisible();
  await expect(page.getByLabel("Map year", { exact: true })).toHaveValue("period");
  await page.getByLabel("Map attended", { exact: true }).selectOption("observed_total");
  await expect(page.getByRole("button", { name: "Continue to analysis", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "I confirm the definitions" }).check();
  await page.getByRole("button", { name: "Continue to analysis", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Map attended", { exact: true })).toHaveValue("observed_total");
  await page.getByRole("checkbox", { name: "I confirm the definitions" }).check();
  await page.getByRole("button", { name: "Continue to analysis", exact: true }).click();
  await page.getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Test Group A" })).toContainText("-40.0 pp");
  await page.getByRole("combobox", { name: "Measure", exact: true }).selectOption("followup");
  await page.getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Test Group A" })).toContainText("Insufficient data");
  await page.getByRole("button", { name: "Continue to recommendations" }).click();
  await expect(page.getByText("No pathway gap or cause can be established", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Maintain monitoring before changing services" })).toBeVisible();
  expect(modelCalls).toBe(0);
});

test("invalid uploads cannot proceed past preparation", async ({ page }) => {
  await upload(page, "year,group,invited,attended\n2024,A,100,101");
  await page.getByRole("checkbox", { name: "I confirm the definitions" }).check();
  await page.getByRole("button", { name: "Continue to analysis", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "counts must satisfy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare the data" })).toBeVisible();
});

test("a failed optional AI request keeps the findings and recommendations usable", async ({ page }) => {
  await page.route("**/api/brief", route => route.abort());
  await prepareDemo(page);
  await page.getByRole("button", { name: "Run analysis" }).click();
  await page.getByRole("button", { name: "Continue to recommendations" }).click();
  await expect(page.getByText("Source-based template", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Review language accessibility of invitations" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download results" })).toBeEnabled();
  await page.getByText("Sources and analysis details", { exact: true }).click();
  await expect(page.getByText("AI drafting unavailable or timed out. Showing the source-based interpretation template.", { exact: true })).toBeVisible();
});

test("the complete sequence is usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await upload(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("checkbox", { name: "I confirm the definitions" }).check();
  await page.getByRole("button", { name: "Continue to analysis", exact: true }).click();
  await page.getByRole("button", { name: "Run analysis" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Continue to recommendations" }).click();
  await expect(page.getByRole("heading", { name: "Recommendations", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("brief endpoint rejects unknown selections and uses deterministic mode without AI", async ({ request }) => {
  const invalid = await request.post("/api/brief", { data: { year: 2024, dimension: "Missing", cohort: "Unknown", group: "A", metric: "participation", useAI: false } });
  expect(invalid.status()).toBe(400);
  const result = await request.post("/api/brief", { data: { year: 2024, dimension: "Language", cohort: "Routine + risk-group screening", group: "Other / missing language", metric: "participation", useAI: false } });
  expect(result.ok()).toBe(true);
  expect((await result.json()).mode).toBe("template");
});

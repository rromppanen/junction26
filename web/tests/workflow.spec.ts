import { expect, test } from "@playwright/test";

test("official data flows through a sourced plan, persistence, monitoring and export", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A clearer picture of care equity." })).toBeVisible();
  await expect(page.getByText("-19.8 pp", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Explore the workflow" }).click();
  await expect(page.getByRole("heading", { name: "Capabilities, before conclusions" })).toBeVisible();
  await page.getByRole("button", { name: "Analyse public dataset" }).click();
  await expect(page.getByRole("heading", { name: "Compare the groups your data contains" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Other / missing language" })).toContainText("56.3%");
  await page.getByLabel("Group by", { exact: true }).selectOption("Education");
  await expect(page.getByRole("row").filter({ hasText: "Basic / unknown education" })).toContainText("50.8%");
  await page.getByLabel("Group by", { exact: true }).selectOption("Language");
  await page.getByRole("button", { name: "Locate the measured transition" }).click();
  await expect(page.getByRole("heading", { name: "Invitation → participation", exact: true })).toBeVisible();
  await expect(page.getByText("The counts locate an observed difference", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Review the supporting evidence" }).click();
  await expect(page.getByRole("link", { name: "Read original source" })).toHaveCount(5);
  await page.getByRole("button", { name: "Build an improvement plan" }).click();
  await page.getByRole("button", { name: "Generate brief" }).click();
  await expect(page.getByRole("status").filter({ hasText: "calculated facts" })).toBeVisible();
  await page.getByRole("button", { name: "Save to action register" }).first().click();
  await page.getByRole("button", { name: "Track actions & subsequent data" }).click();
  await page.getByLabel("Status for Review language accessibility of invitations").selectOption("In progress");
  await page.getByLabel("Implementation / evaluation notes").fill("Discuss aggregate evidence with programme lead.");
  await page.reload();
  await page.getByRole("navigation", { name: "Analysis workflow" }).getByRole("button", { name: "Monitor change" }).click();
  await expect(page.getByLabel("Implementation / evaluation notes")).toHaveValue("Discuss aggregate evidence with programme lead.");
  await expect(page.getByLabel("Status for Review language accessibility of invitations")).toHaveValue("In progress");
  await page.getByLabel("Period", { exact: true }).selectOption("2023");
  await expect(page.getByRole("heading", { name: "2022 → 2023" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  expect((await download).suggestedFilename()).toBe("care-equity-report.json");
  expect(errors).toEqual([]);
});

test("CSV mapping adapts to new headers, abstains without follow-up, and rejects invalid counts", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the workflow" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "synthetic-test.csv", mimeType: "text/csv", buffer: Buffer.from("period,population,eligible,screened\n2024,Test Group A,100,50\n2024,Test Group B,100,90\n2023,Test Group A,100,45\n2023,Test Group B,100,85") });
  await expect(page.getByLabel("Map year", { exact: true })).toHaveValue("period");
  await page.getByRole("checkbox", { name: "I confirm these are public aggregate" }).check();
  await page.getByRole("button", { name: "Confirm mapping & analyse" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Test Group A" })).toContainText("-40.0 pp");
  await page.getByRole("button", { name: "Follow-up", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Test Group A" })).toContainText("Limited data");
  await page.getByRole("navigation", { name: "Analysis workflow" }).getByRole("button", { name: "Your data" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "bad-counts.csv", mimeType: "text/csv", buffer: Buffer.from("year,group,invited,attended\n2024,A,100,101") });
  await page.getByRole("checkbox", { name: "I confirm these are public aggregate" }).check();
  await page.getByRole("button", { name: "Confirm mapping & analyse" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "completed ≤ referred ≤ attended ≤ invited" })).toBeVisible();
});

test("mobile layout has no page overflow and navigation remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Explore the workflow" }).click();
  await expect(page.getByRole("heading", { name: "Good analysis starts with good data." })).toBeVisible();
  await page.getByRole("button", { name: "Analyse public dataset" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("brief endpoint rejects unknown selections and uses deterministic mode without AI", async ({ request }) => {
  const invalid = await request.post("/api/brief", { data: { year: 2024, dimension: "Missing", cohort: "Unknown", group: "A", metric: "participation", useAI: false } });
  expect(invalid.status()).toBe(400);
  const result = await request.post("/api/brief", { data: { year: 2024, dimension: "Language", cohort: "Routine + risk-group screening", group: "Other / missing language", metric: "participation", useAI: false } });
  expect(result.ok()).toBe(true);
  expect((await result.json()).mode).toBe("template");
});

test("appending a new period preserves history and its action register", async ({ page }) => {
  await page.goto("/");
  const upload = async (name: string, csv: string) => {
    await page.getByRole("navigation", { name: "Analysis workflow" }).getByRole("button", { name: "Your data" }).click();
    await page.locator('input[type="file"]').setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from(csv) });
  };
  await upload("synthetic-baseline.csv", "year,group,invited,attended\n2023,A,100,50\n2023,B,100,90");
  await page.getByRole("checkbox", { name: "I confirm these are public aggregate" }).check();
  await page.getByRole("button", { name: "Confirm mapping & analyse" }).click();
  await page.getByRole("navigation", { name: "Analysis workflow" }).getByRole("button", { name: "Plan an action" }).click();
  await page.getByRole("button", { name: "Save to action register" }).click();
  await upload("synthetic-next-period.csv", "year,group,invited,attended\n2024,A,100,60\n2024,B,100,90");
  await page.getByRole("checkbox", { name: "Add new reporting periods" }).check();
  await page.getByRole("checkbox", { name: "I confirm these are public aggregate" }).check();
  await page.getByRole("button", { name: "Confirm mapping & analyse" }).click();
  await page.getByRole("navigation", { name: "Analysis workflow" }).getByRole("button", { name: "Monitor change" }).click();
  await expect(page.getByRole("heading", { name: "2023 → 2024" })).toBeVisible();
  await expect(page.getByText("+10.0 pp", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit invitation and reminder delivery" })).toBeVisible();
});

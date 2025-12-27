import { test, expect } from "@playwright/test";

test.describe("Category Annotations", () => {
  test("complete category annotation workflow", async ({ page }) => {
    // Step 1: Navigate to homepage
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    // Step 2: Find a not-annotated video
    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });
    await annotatedFilter.selectOption("not-annotated");
    await page.waitForTimeout(500);

    // Click the first Label button
    const labelButton = page.getByRole("link", { name: "Label →" }).first();
    await expect(labelButton).toBeVisible({ timeout: 10000 });

    // Get video ID
    const videoCard = labelButton.locator(
      'xpath=ancestor::div[contains(@class, "p-6")]',
    );
    const videoIdElement = videoCard.locator("h2").first();
    const videoId = await videoIdElement.textContent();
    expect(videoId).toBeTruthy();

    // Navigate to labeling page
    await labelButton.click();
    await expect(page).toHaveURL(`/videos/${videoId}`);

    // Step 3: Play video briefly
    const playButton = page.getByRole("button", { name: "Play" });
    await expect(playButton).toBeVisible();
    await playButton.click();
    await page.waitForTimeout(2000);
    const pauseButton = page.getByRole("button", { name: "Pause" });
    await pauseButton.click();

    // Step 4: Select morphs for both speakers
    const morphAButtons = page.getByRole("button", { name: "Morph A" });
    const morphBButtons = page.getByRole("button", { name: "Morph B" });
    await morphAButtons.nth(0).click();
    await morphBButtons.nth(1).click();

    // Step 5: Verify Category Annotations section exists
    await expect(page.getByText("Category Annotations")).toBeVisible();

    // Step 6: Open Prosody dropdown for Speaker 1 and select a signal
    const speaker1Facets = page
      .locator('div[class*="grid"] div[class*="space-y-4"]')
      .first();

    // Find Prosody label
    const prosodyLabel = speaker1Facets.getByText("Prosody").first();
    await expect(prosodyLabel).toBeVisible();

    // Find the multi-select button for Prosody (should be near the label)
    const prosodyDropdown = speaker1Facets
      .locator('button[aria-label="Select signals..."]')
      .first();
    await expect(prosodyDropdown).toBeVisible();
    await prosodyDropdown.click();

    // Wait for dropdown to open and select a signal
    await page.waitForTimeout(300);
    const lowPitchOption = page.getByText("Low pitch variance").first();
    await expect(lowPitchOption).toBeVisible();
    await lowPitchOption.click();

    // Close dropdown by clicking outside
    await page.getByText("Category Annotations").click();
    await page.waitForTimeout(300);

    // Verify selection is shown
    await expect(prosodyDropdown).toHaveText(/1 selected|Low pitch variance/);

    // Step 7: Select signals for Speaker 2 - Lexical Choice facet
    const speaker2Facets = page
      .locator('div[class*="grid"] div[class*="space-y-4"]')
      .nth(1);

    const lexicalChoiceLabel = speaker2Facets
      .getByText("Lexical Choice")
      .first();
    await expect(lexicalChoiceLabel).toBeVisible();

    const lexicalChoiceDropdown = speaker2Facets
      .locator('button[aria-label="Select signals..."]')
      .nth(1); // Second facet
    await lexicalChoiceDropdown.click();
    await page.waitForTimeout(300);

    // Select two signals for Speaker 2
    await page.getByText("Hedging terms").first().click();
    await page.getByText("Certainty terms").first().click();

    // Close dropdown
    await page.getByText("Category Annotations").click();
    await page.waitForTimeout(300);

    // Step 8: Add comments
    const commentTextareas = page.getByPlaceholder(
      "Record observations, patterns, unexpected behaviors, or anything noteworthy that doesn't fit predefined categories...",
    );
    await commentTextareas.nth(0).fill("E2E test - Speaker 1 with prosody");
    await commentTextareas
      .nth(1)
      .fill("E2E test - Speaker 2 with lexical choice");

    // Step 9: Save annotation
    await page.getByRole("button", { name: "Save Annotation" }).click();
    await expect(page).toHaveURL("/", { timeout: 10000 });
    await page.waitForTimeout(500);

    // Step 10: Navigate back to verify categories were persisted
    await page.goto(`/videos/${videoId}`);
    await expect(page.getByText("Category Annotations")).toBeVisible();

    // Verify Speaker 1 Prosody selection persisted
    const speaker1FacetsReload = page
      .locator('div[class*="grid"] div[class*="space-y-4"]')
      .first();
    const prosodyDropdownReload = speaker1FacetsReload
      .locator('button[aria-label="Select signals..."]')
      .first();
    await expect(prosodyDropdownReload).toHaveText(
      /1 selected|Low pitch variance/,
    );

    // Verify Speaker 2 Lexical Choice selection persisted
    const speaker2FacetsReload = page
      .locator('div[class*="grid"] div[class*="space-y-4"]')
      .nth(1);
    const lexicalChoiceDropdownReload = speaker2FacetsReload
      .locator('button[aria-label="Select signals..."]')
      .nth(1);
    await expect(lexicalChoiceDropdownReload).toHaveText(
      "Hedging terms, Certainty terms",
    );

    // Step 11: Test updating categories
    // Open dropdown and deselect one item
    await prosodyDropdownReload.click();
    await page.waitForTimeout(300);
    // Find the label within the dropdown (not in the trigger button)
    const lowPitchOptionReload = page
      .locator('label:has-text("Low pitch variance")')
      .first();
    await lowPitchOptionReload.click(); // Deselect
    await page.getByText("Category Annotations").click();
    await page.waitForTimeout(300);

    // Verify it shows no selection
    await expect(prosodyDropdownReload).toHaveText("Select signals...");

    // Save updated annotation
    await page.getByRole("button", { name: "Save Annotation" }).click();
    await expect(page).toHaveURL("/", { timeout: 10000 });
    await page.waitForTimeout(500);

    // Step 12: Verify update persisted
    await page.goto(`/videos/${videoId}`);
    const prosodyDropdownFinal = page
      .locator('div[class*="grid"] div[class*="space-y-4"]')
      .first()
      .locator('button[aria-label="Select signals..."]')
      .first();
    await expect(prosodyDropdownFinal).toHaveText("Select signals...");

    // Step 13: Cleanup - delete the annotation
    const clearButton = page.getByRole("button", { name: /Clear Annotation/ });
    await expect(clearButton).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await clearButton.click();
    await expect(page).toHaveURL("/", { timeout: 5000 });
  });

  test("test clear all functionality in multi-select", async ({ page }) => {
    // Navigate to a video labeling page
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });
    await annotatedFilter.selectOption("not-annotated");
    await page.waitForTimeout(500);

    const labelButton = page.getByRole("link", { name: "Label →" }).first();
    await labelButton.click();
    await page.waitForTimeout(1000);

    // Select morphs
    const morphAButtons = page.getByRole("button", { name: "Morph A" });
    await morphAButtons.nth(0).click();
    await morphAButtons.nth(1).click();

    // Open a dropdown and select multiple signals
    const speaker1Facets = page
      .locator('div[class*="grid"] div[class*="space-y-4"]')
      .first();
    const prosodyDropdown = speaker1Facets
      .locator('button[aria-label="Select signals..."]')
      .first();
    await prosodyDropdown.click();
    await page.waitForTimeout(300);

    // Select 3 signals
    await page.getByText("Low pitch variance").first().click();
    await page.getByText("High pitch variance").first().click();
    await page.getByText("Rising terminal").first().click();

    // Verify "Clear all" button appears
    const clearAllButton = page.getByRole("button", { name: "Clear all" });
    await expect(clearAllButton).toBeVisible();

    // Click clear all
    await clearAllButton.click();
    await page.waitForTimeout(300);

    // Close dropdown
    await page.getByText("Category Annotations").click();
    await page.waitForTimeout(300);

    // Verify all selections were cleared
    await expect(prosodyDropdown).toHaveText("Select signals...");

    // Navigate back without saving (no cleanup needed)
    await page.goto("/");
  });
});

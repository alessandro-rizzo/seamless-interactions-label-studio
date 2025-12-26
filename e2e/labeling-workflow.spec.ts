import { test, expect } from "@playwright/test";

test.describe("Labeling Workflow", () => {
  test("complete labeling flow and cleanup", async ({ page }) => {
    // Step 1: Land on homepage and capture initial stats
    await page.goto("/");
    const startLabelingLink = page.getByRole("link", {
      name: /Start Labeling/,
    });
    await expect(startLabelingLink).toBeVisible();

    // Get initial annotated videos count
    const getAnnotatedCount = async () => {
      const text = await page
        .getByText("Annotated Videos")
        .locator("..")
        .locator("p.text-3xl")
        .textContent();
      return parseInt(text || "0", 10);
    };
    const initialAnnotatedCount = await getAnnotatedCount();

    // Step 2: Go to videos list
    await startLabelingLink.click();
    await expect(page).toHaveURL("/videos");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    // Step 3: Find a video that's not annotated
    // First, filter to show only not-annotated videos
    const annotatedFilter = page.locator("select").first();
    await annotatedFilter.selectOption("not-annotated");

    // Wait for the list to update
    await page.waitForTimeout(500);

    // Find the first "Label →" button and click it
    const labelButton = page.getByRole("link", { name: "Label →" }).first();
    await expect(labelButton).toBeVisible({ timeout: 10000 });

    // Get the video ID from the same card
    const videoCard = labelButton.locator(
      'xpath=ancestor::div[contains(@class, "p-6")]',
    );
    const videoIdElement = videoCard.locator("h2").first();
    const videoId = await videoIdElement.textContent();
    expect(videoId).toBeTruthy();

    // Click the Label button to go to the label page
    await labelButton.click();
    await expect(page).toHaveURL(`/videos/${videoId}`);

    // Step 5: Play video for a few seconds then stop
    const playButton = page.getByRole("button", { name: "Play" });
    await expect(playButton).toBeVisible();
    await playButton.click();

    // Wait for video to play for 3 seconds
    await page.waitForTimeout(3000);

    // Click pause button
    const pauseButton = page.getByRole("button", { name: "Pause" });
    await pauseButton.click();

    // Step 6: Select morphs for both speakers
    const morphAButtons = page.getByRole("button", { name: "Morph A" });
    const morphBButtons = page.getByRole("button", { name: "Morph B" });

    // Select Morph A for speaker 1
    await morphAButtons.nth(0).click();

    // Select Morph B for speaker 2
    await morphBButtons.nth(1).click();

    // Step 7: Set confidence levels (adjust sliders)
    const confidenceSliders = page.locator(
      'input[type="range"][min="1"][max="5"]',
    );
    await confidenceSliders.nth(0).fill("4");
    await confidenceSliders.nth(1).fill("5");

    // Step 8: Add comments
    const commentTextareas = page.getByPlaceholder("Add observations...");
    await commentTextareas.nth(0).fill("E2E test comment for speaker 1");
    await commentTextareas.nth(1).fill("E2E test comment for speaker 2");

    // Step 9: Submit annotation
    await page.getByRole("button", { name: "Save Annotation" }).click();

    // Should navigate back to videos list
    await expect(page).toHaveURL("/videos", { timeout: 10000 });

    // Step 10: Go back to homepage
    await page.goto("/");

    // Step 11: Verify the annotated count increased
    const updatedAnnotatedCount = await getAnnotatedCount();
    expect(updatedAnnotatedCount).toBe(initialAnnotatedCount + 1);

    // Verify the annotation appears in recent annotations
    await expect(
      page.locator(`a[href="/videos/${videoId}"]`).first(),
    ).toBeVisible();

    // Step 12: Cleanup - delete the annotation
    await page.goto(`/videos/${videoId}`);

    const clearButton = page.getByRole("button", { name: /Clear Annotation/ });
    await expect(clearButton).toBeVisible();

    // Handle the confirmation dialog
    page.once("dialog", (dialog) => dialog.accept());
    await clearButton.click();

    // Wait for the page to refresh
    await page.waitForTimeout(1000);

    // Final verification: go to homepage and check annotation count is back to initial
    await page.goto("/");
    const finalAnnotatedCount = await getAnnotatedCount();
    expect(finalAnnotatedCount).toBe(initialAnnotatedCount);
  });
});

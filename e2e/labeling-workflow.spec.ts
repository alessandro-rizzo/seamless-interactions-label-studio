import { test, expect } from "@playwright/test";

test.describe("Labeling Workflow", () => {
  test("complete labeling flow and cleanup", async ({ page }) => {
    // Step 1: Land on homepage (now has stats and video list together)
    await page.goto("/");

    // Wait for page to load
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    // Get initial annotated videos count
    const getAnnotatedCount = async () => {
      // Find the card containing "Annotated Videos" text
      const card = page.locator('div.p-6:has(h3:text-is("Annotated Videos"))');
      const text = await card.locator("p.text-3xl").textContent();
      return parseInt(text || "0", 10);
    };
    const initialAnnotatedCount = await getAnnotatedCount();

    // Step 2: Video list is already visible on home page

    // Step 3: Find a video that's not annotated
    // Filter to show only not-annotated videos
    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });
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
    const commentTextareas = page.getByPlaceholder(
      "Record observations, patterns, unexpected behaviors, or anything noteworthy that doesn't fit predefined categories...",
    );
    await commentTextareas.nth(0).fill("E2E test comment for speaker 1");
    await commentTextareas.nth(1).fill("E2E test comment for speaker 2");

    // Step 9: Submit annotation
    await page.getByRole("button", { name: "Save Annotation" }).click();

    // Should navigate back to home page
    await expect(page).toHaveURL("/", { timeout: 10000 });

    // Step 10: Verify the annotated count increased (already on home page)
    // Wait a moment for stats to update
    await page.waitForTimeout(500);
    const updatedAnnotatedCount = await getAnnotatedCount();
    expect(updatedAnnotatedCount).toBe(initialAnnotatedCount + 1);

    // Verify the video shows as annotated in the list
    const annotatedVideoCard = page
      .locator(`text=${videoId}`)
      .first()
      .locator("..");
    await expect(annotatedVideoCard.getByText("Annotated")).toBeVisible();

    // Step 11: Cleanup - delete the annotation
    await page.goto(`/videos/${videoId}`);

    const clearButton = page.getByRole("button", { name: /Clear Annotation/ });
    await expect(clearButton).toBeVisible();

    // Handle the confirmation dialog
    page.once("dialog", (dialog) => dialog.accept());
    await clearButton.click();

    // Wait for the page to refresh and navigate back to home
    await expect(page).toHaveURL("/", { timeout: 5000 });

    // Final verification: check annotation count is back to initial
    await page.waitForTimeout(500);
    const finalAnnotatedCount = await getAnnotatedCount();
    expect(finalAnnotatedCount).toBe(initialAnnotatedCount);
  });
});

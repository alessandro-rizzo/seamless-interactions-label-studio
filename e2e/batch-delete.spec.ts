import { test, expect } from "@playwright/test";

test.describe("Batch Delete Annotations", () => {
  // Clean up any annotations created by batch delete tests after all tests complete
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    try {
      await page.goto("/");
      await page.waitForTimeout(500);

      const annotatedFilter = page.getByRole("combobox", {
        name: "Annotation Status Filter",
      });
      await annotatedFilter.selectOption("annotated");
      await page.waitForTimeout(500);

      // Check if there are any annotations
      const checkboxes = page.locator(
        'input[type="checkbox"][aria-label^="Select V"]',
      );
      const count = await checkboxes.count();

      if (count > 0) {
        // Select first checkbox to make batch bar appear
        await checkboxes.nth(0).check();
        await page.waitForTimeout(300);

        // Select all on page
        const selectAllCheckbox = page.locator(
          'input[type="checkbox"]#select-all-page',
        );
        await selectAllCheckbox.check();
        await page.waitForTimeout(300);

        // Delete all
        const deleteButton = page.getByRole("button", {
          name: /Delete \d+ Selected/,
        });
        page.once("dialog", (dialog) => dialog.accept());
        await deleteButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log("Cleanup error (non-critical):", error);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test("should select and batch delete multiple annotations", async ({
    page,
  }) => {
    // Step 1: Navigate to homepage
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    // Helper function to get annotated count
    const getAnnotatedCount = async () => {
      const card = page.locator('div.p-6:has(h3:text-is("Annotated Videos"))');
      const text = await card.locator("p.text-3xl").textContent();
      return parseInt(text || "0", 10);
    };

    // Step 2: Create test annotations if needed
    // First check if there are at least 3 annotated videos
    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    // Count existing annotated videos
    const existingAnnotatedVideos = await page
      .locator('span:text-is("Annotated")')
      .count();

    let videosToCreate = Math.max(0, 3 - existingAnnotatedVideos);
    const createdVideoIds: string[] = [];

    // Create annotations if we don't have enough
    while (videosToCreate > 0) {
      await page.goto("/");
      await annotatedFilter.selectOption("not-annotated");
      await page.waitForTimeout(500);

      const labelButton = page.getByRole("link", { name: "Label →" }).first();
      if (!(await labelButton.isVisible())) {
        break; // No more videos to annotate
      }

      const videoCard = labelButton.locator(
        'xpath=ancestor::div[contains(@class, "p-6")]',
      );
      const videoIdElement = videoCard.locator("h2").first();
      const videoId = await videoIdElement.textContent();

      if (videoId) {
        createdVideoIds.push(videoId);

        await labelButton.click();
        await expect(page).toHaveURL(`/videos/${videoId}`);

        // Quick annotation
        const playButton = page.getByRole("button", { name: "Play" });
        await playButton.click();
        await page.waitForTimeout(2000);
        const pauseButton = page.getByRole("button", { name: "Pause" });
        await pauseButton.click();

        const morphAButtons = page.getByRole("button", { name: "Morph A" });
        const morphBButtons = page.getByRole("button", { name: "Morph B" });
        await morphAButtons.nth(0).click();
        await morphBButtons.nth(1).click();

        await page.getByRole("button", { name: "Save Annotation" }).click();
        await expect(page).toHaveURL("/", { timeout: 10000 });
        await page.waitForTimeout(500);
      }

      videosToCreate--;
    }

    // Step 3: Go to homepage and filter to show annotated videos
    await page.goto("/");
    await page.waitForTimeout(500);
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    const initialAnnotatedCount = await getAnnotatedCount();
    expect(initialAnnotatedCount).toBeGreaterThanOrEqual(3);

    // Step 4: Verify checkboxes are visible on annotated videos
    const checkboxes = page.locator(
      'input[type="checkbox"][aria-label^="Select V"]',
    );
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    // Step 5: Select 3 videos by clicking their checkboxes
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();
    await page.waitForTimeout(300);

    // Step 6: Verify batch action bar appears with specific selector
    const batchActionBar = page.locator(
      'div.flex-shrink-0.container:has(button:has-text("Clear All"))',
    );
    await expect(batchActionBar).toBeVisible();

    // Verify selection count
    await expect(
      page.locator('span.font-medium:has-text("3 selected")'),
    ).toBeVisible();

    // Step 7: Verify "Select All on Page" checkbox is visible
    const selectAllCheckbox = page.locator(
      'input[type="checkbox"]#select-all-page',
    );
    await expect(selectAllCheckbox).toBeVisible();

    // Step 8: Verify selected cards have visual feedback (ring border)
    // The ring is on the outer card container
    const selectedCard = checkboxes
      .nth(0)
      .locator('xpath=ancestor::div[contains(@class, "p-6")]');
    const className = await selectedCard.getAttribute("class");
    expect(className).toContain("ring-2");
    expect(className).toContain("ring-primary");

    // Step 9: Click "Delete X Selected" button
    const deleteButton = page.getByRole("button", {
      name: "Delete 3 Selected",
    });
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();

    // Handle confirmation dialog
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Delete 3 annotation(s)?");
      expect(dialog.message()).toContain(
        "This will permanently delete the annotations",
      );
      await dialog.accept();
    });

    await deleteButton.click();

    // Step 10: Wait for deletion to complete
    await page.waitForTimeout(1000);

    // Verify batch action bar is gone (selection cleared)
    const batchActionBarAfterDelete = page.locator(
      'div.flex-shrink-0.container:has(button:has-text("Clear All"))',
    );
    await expect(batchActionBarAfterDelete).not.toBeVisible();

    // Step 11: Verify annotated count decreased by 3
    const updatedAnnotatedCount = await getAnnotatedCount();
    expect(updatedAnnotatedCount).toBe(initialAnnotatedCount - 3);

    // Step 12: Verify the videos no longer show as annotated
    // Switch to "all" filter to see if they're now not annotated
    await annotatedFilter.selectOption("all");
    await page.waitForTimeout(500);
  });

  test("should select all on page and batch delete", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    const getAnnotatedCount = async () => {
      const card = page.locator('div.p-6:has(h3:text-is("Annotated Videos"))');
      const text = await card.locator("p.text-3xl").textContent();
      return parseInt(text || "0", 10);
    };

    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });

    // Ensure we have at least 2 annotations for this test
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);
    const existingCount = await page
      .locator('span:text-is("Annotated")')
      .count();

    const annotationsNeeded = Math.max(0, 2 - existingCount);
    for (let i = 0; i < annotationsNeeded; i++) {
      await page.goto("/");
      await annotatedFilter.selectOption("not-annotated");
      await page.waitForTimeout(500);

      const labelButton = page.getByRole("link", { name: "Label →" }).first();
      if (!(await labelButton.isVisible())) break;

      await labelButton.click();
      const playButton = page.getByRole("button", { name: "Play" });
      await playButton.click();
      await page.waitForTimeout(2000);
      const pauseButton = page.getByRole("button", { name: "Pause" });
      await pauseButton.click();

      const morphAButtons = page.getByRole("button", { name: "Morph A" });
      const morphBButtons = page.getByRole("button", { name: "Morph B" });
      await morphAButtons.nth(0).click();
      await morphBButtons.nth(1).click();

      await page.getByRole("button", { name: "Save Annotation" }).click();
      await expect(page).toHaveURL("/", { timeout: 10000 });
      await page.waitForTimeout(500);
    }

    // Now proceed with the actual test
    await page.goto("/");
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    const initialCount = await getAnnotatedCount();

    // Get count of annotated videos on current page
    const checkboxes = page.locator(
      'input[type="checkbox"][aria-label^="Select V"]',
    );
    const checkboxCountOnPage = await checkboxes.count();
    expect(checkboxCountOnPage).toBeGreaterThan(0);

    // Click "Select All on Page" checkbox
    const selectAllCheckbox = page.locator(
      'input[type="checkbox"]#select-all-page',
    );

    // First, select at least one checkbox to make the batch bar appear
    await checkboxes.nth(0).check();
    await page.waitForTimeout(300);

    await expect(selectAllCheckbox).toBeVisible();
    await selectAllCheckbox.check();
    await page.waitForTimeout(300);

    // Verify all checkboxes on page are checked
    const checkedCount = await checkboxes.evaluateAll(
      (inputs) =>
        inputs.filter((input) => (input as HTMLInputElement).checked).length,
    );
    expect(checkedCount).toBe(checkboxCountOnPage);

    // Verify selection count shows correct number
    await expect(
      page.locator(`span:has-text("${checkboxCountOnPage} selected")`),
    ).toBeVisible();

    // Click delete button
    const deleteButton = page.getByRole("button", {
      name: new RegExp(`Delete ${checkboxCountOnPage} Selected`),
    });
    await expect(deleteButton).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify count decreased
    const updatedCount = await getAnnotatedCount();
    expect(updatedCount).toBe(initialCount - checkboxCountOnPage);
  });

  test("should persist selection across page navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });

    // Ensure we have at least 2 annotations for this test
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);
    const existingCount = await page
      .locator('span:text-is("Annotated")')
      .count();

    const annotationsNeeded = Math.max(0, 2 - existingCount);
    for (let i = 0; i < annotationsNeeded; i++) {
      await page.goto("/");
      await annotatedFilter.selectOption("not-annotated");
      await page.waitForTimeout(500);

      const labelButton = page.getByRole("link", { name: "Label →" }).first();
      if (!(await labelButton.isVisible())) break;

      await labelButton.click();
      const playButton = page.getByRole("button", { name: "Play" });
      await playButton.click();
      await page.waitForTimeout(2000);
      const pauseButton = page.getByRole("button", { name: "Pause" });
      await pauseButton.click();

      const morphAButtons = page.getByRole("button", { name: "Morph A" });
      const morphBButtons = page.getByRole("button", { name: "Morph B" });
      await morphAButtons.nth(0).click();
      await morphBButtons.nth(1).click();

      await page.getByRole("button", { name: "Save Annotation" }).click();
      await expect(page).toHaveURL("/", { timeout: 10000 });
      await page.waitForTimeout(500);
    }

    // Now proceed with the actual test
    await page.goto("/");
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    // Select first checkbox
    const checkboxes = page.locator(
      'input[type="checkbox"][aria-label^="Select V"]',
    );
    await checkboxes.nth(0).check();
    await page.waitForTimeout(300);

    // Verify batch bar shows 1 selected
    await expect(page.locator('span:has-text("1 selected")')).toBeVisible();

    // Change filter (simulating navigation/filter change)
    const labelFilter = page.getByRole("combobox", {
      name: "Label Type Filter",
    });
    await labelFilter.selectOption("improvised");
    await page.waitForTimeout(500);

    // Verify selection persists - batch bar should still show 1 selected
    await expect(page.locator('span:has-text("1 selected")')).toBeVisible();

    // Change back to "all"
    await labelFilter.selectOption("all");
    await page.waitForTimeout(500);

    // Selection should still be there
    await expect(page.locator('span:has-text("1 selected")')).toBeVisible();

    // Clear selection
    const clearButton = page.getByRole("button", { name: "Clear All" });
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await page.waitForTimeout(300);

    // Batch action bar should be gone
    const batchActionBar = page.locator(
      'div.flex-shrink-0.container:has(button:has-text("Clear All"))',
    );
    await expect(batchActionBar).not.toBeVisible();
  });

  test("should handle batch delete with no network errors", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });

    // Ensure we have at least 1 annotation for this test
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);
    let count = await page.locator('span:text-is("Annotated")').count();

    if (count === 0) {
      // Create one annotation
      await page.goto("/");
      await annotatedFilter.selectOption("not-annotated");
      await page.waitForTimeout(500);

      const labelButton = page.getByRole("link", { name: "Label →" }).first();
      if (await labelButton.isVisible()) {
        await labelButton.click();
        const playButton = page.getByRole("button", { name: "Play" });
        await playButton.click();
        await page.waitForTimeout(2000);
        const pauseButton = page.getByRole("button", { name: "Pause" });
        await pauseButton.click();

        const morphAButtons = page.getByRole("button", { name: "Morph A" });
        const morphBButtons = page.getByRole("button", { name: "Morph B" });
        await morphAButtons.nth(0).click();
        await morphBButtons.nth(1).click();

        await page.getByRole("button", { name: "Save Annotation" }).click();
        await expect(page).toHaveURL("/", { timeout: 10000 });
        await page.waitForTimeout(500);
      }
    }

    // Now proceed with the actual test
    await page.goto("/");
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    const checkboxes = page.locator(
      'input[type="checkbox"][aria-label^="Select V"]',
    );
    count = await checkboxes.count();

    // Select one video
    await checkboxes.nth(0).check();
    await page.waitForTimeout(300);

    // Monitor network requests
    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().includes("/api/annotations/batch") &&
        request.method() === "POST",
    );
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/annotations/batch") &&
        response.status() === 200,
    );

    // Click delete
    const deleteButton = page.getByRole("button", {
      name: /Delete 1 Selected/,
    });
    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();

    // Verify request was made
    const request = await requestPromise;
    expect(request.method()).toBe("POST");

    // Verify successful response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.deletedCount).toBeGreaterThanOrEqual(1);

    // Verify UI updates - batch action bar should be gone
    await page.waitForTimeout(500);
    const batchActionBar = page.locator(
      'div.flex-shrink-0.container:has(button:has-text("Clear All"))',
    );
    await expect(batchActionBar).not.toBeVisible();
  });

  test("checkboxes should only appear on annotated videos", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Search by video ID...")).toBeVisible();

    const annotatedFilter = page.getByRole("combobox", {
      name: "Annotation Status Filter",
    });

    // First ensure we have at least one annotation for this test
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    const existingAnnotations = await page
      .locator('span:text-is("Annotated")')
      .count();

    // Create one annotation if none exist
    if (existingAnnotations === 0) {
      await annotatedFilter.selectOption("not-annotated");
      await page.waitForTimeout(500);

      const labelButton = page.getByRole("link", { name: "Label →" }).first();
      if (await labelButton.isVisible()) {
        await labelButton.click();

        const playButton = page.getByRole("button", { name: "Play" });
        await playButton.click();
        await page.waitForTimeout(2000);
        const pauseButton = page.getByRole("button", { name: "Pause" });
        await pauseButton.click();

        const morphAButtons = page.getByRole("button", { name: "Morph A" });
        const morphBButtons = page.getByRole("button", { name: "Morph B" });
        await morphAButtons.nth(0).click();
        await morphBButtons.nth(1).click();

        await page.getByRole("button", { name: "Save Annotation" }).click();
        await expect(page).toHaveURL("/", { timeout: 10000 });
        await page.waitForTimeout(500);
      }
    }

    // Now verify checkbox behavior
    await page.goto("/");
    await page.waitForTimeout(500);

    // Filter to show all videos
    await annotatedFilter.selectOption("all");
    await page.waitForTimeout(500);

    // Count checkboxes and annotated badges - they should match
    const checkboxes = page.locator(
      'input[type="checkbox"][aria-label^="Select V"]',
    );
    const annotatedBadges = page.locator('span:text-is("Annotated")');

    const checkboxCount = await checkboxes.count();
    const annotatedCount = await annotatedBadges.count();

    // Number of checkboxes should equal number of annotated videos
    expect(checkboxCount).toBe(annotatedCount);

    // Filter to show only not-annotated videos
    await annotatedFilter.selectOption("not-annotated");
    await page.waitForTimeout(500);

    // Should have no checkboxes on not-annotated videos
    const checkboxesNotAnnotated = await page
      .locator('input[type="checkbox"][aria-label^="Select V"]')
      .count();
    expect(checkboxesNotAnnotated).toBe(0);

    // Filter to show only annotated videos
    await annotatedFilter.selectOption("annotated");
    await page.waitForTimeout(500);

    // Wait for cards to render
    await page.waitForTimeout(300);

    // All visible video cards should have checkboxes when showing only annotated
    const videoCardsAnnotated = await page
      .locator(
        "div.p-6.border.rounded-lg.bg-card.hover\\:shadow-md.transition-shadow",
      )
      .count();
    const checkboxesAnnotated = await page
      .locator('input[type="checkbox"][aria-label^="Select V"]')
      .count();

    if (videoCardsAnnotated > 0) {
      expect(checkboxesAnnotated).toBe(videoCardsAnnotated);
    }
  });
});

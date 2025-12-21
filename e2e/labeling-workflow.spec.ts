import { test, expect } from '@playwright/test';

test.describe('Labeling Workflow', () => {
  test('complete labeling flow and cleanup', async ({ page }) => {
    // Step 1: Land on homepage and capture initial stats
    await page.goto('/');
    const startLabelingLink = page.getByRole('link', { name: /Start Labeling/ });
    await expect(startLabelingLink).toBeVisible();

    // Get initial annotated videos count
    const getAnnotatedCount = async () => {
      const text = await page.getByText('Annotated Videos').locator('..').locator('p.text-3xl').textContent();
      return parseInt(text || '0', 10);
    };
    const initialAnnotatedCount = await getAnnotatedCount();

    // Step 2: Go to videos list
    await startLabelingLink.click();
    await expect(page).toHaveURL('/videos');
    await expect(page.getByPlaceholder('Search by video ID...')).toBeVisible();

    // Step 3: Find a video that's not downloaded and download it
    // First, filter to show only not-downloaded videos
    const downloadFilter = page.locator('select').first();
    await downloadFilter.selectOption('not-downloaded');

    // Wait for the list to update
    await page.waitForTimeout(500);

    // Find the first Download button and click it
    const downloadButton = page.getByRole('button', { name: 'Download' }).first();
    await expect(downloadButton).toBeVisible({ timeout: 10000 });

    // Get the video ID from the same card
    const videoCard = downloadButton.locator('xpath=ancestor::div[contains(@class, "p-6")]');
    const videoIdElement = videoCard.locator('h2').first();
    const videoId = await videoIdElement.textContent();
    expect(videoId).toBeTruthy();

    // Click download and wait for it to complete
    await downloadButton.click();

    // Wait for "Downloading..." to appear then disappear, and "Label →" to appear
    await expect(page.getByText('Downloading...')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Downloading...')).toBeHidden({ timeout: 120000 });

    // Step 4: Go to the label page directly
    await page.goto(`/videos/${videoId}`);

    // Step 5: Play video for a few seconds then stop
    const playButton = page.getByRole('button', { name: 'Play' });
    await expect(playButton).toBeVisible();
    await playButton.click();

    // Wait for video to play for 3 seconds
    await page.waitForTimeout(3000);

    // Click pause button
    const pauseButton = page.getByRole('button', { name: 'Pause' });
    await pauseButton.click();

    // Step 6: Select morphs for both speakers
    const morphAButtons = page.getByRole('button', { name: 'Morph A' });
    const morphBButtons = page.getByRole('button', { name: 'Morph B' });

    // Select Morph A for speaker 1
    await morphAButtons.nth(0).click();

    // Select Morph B for speaker 2
    await morphBButtons.nth(1).click();

    // Step 7: Set confidence levels (adjust sliders)
    const confidenceSliders = page.locator('input[type="range"][min="1"][max="5"]');
    await confidenceSliders.nth(0).fill('4');
    await confidenceSliders.nth(1).fill('5');

    // Step 8: Add comments
    const commentTextareas = page.getByPlaceholder('Add observations...');
    await commentTextareas.nth(0).fill('E2E test comment for speaker 1');
    await commentTextareas.nth(1).fill('E2E test comment for speaker 2');

    // Step 9: Submit annotation
    await page.getByRole('button', { name: 'Save Annotation' }).click();

    // Should navigate back to videos list
    await expect(page).toHaveURL('/videos', { timeout: 10000 });

    // Step 10: Go back to homepage
    await page.goto('/');

    // Step 11: Verify the annotated count increased
    const updatedAnnotatedCount = await getAnnotatedCount();
    expect(updatedAnnotatedCount).toBe(initialAnnotatedCount + 1);

    // Verify the annotation appears in recent annotations
    await expect(page.locator(`a[href="/videos/${videoId}"]`).first()).toBeVisible();

    // Step 11b: Download JSON export and verify
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Export JSON' }).click(),
    ]);
    const jsonFileName = jsonDownload.suggestedFilename();
    expect(jsonFileName).toMatch(/annotations-.*\.json$/);

    // Read and verify JSON content
    const jsonPath = await jsonDownload.path();
    const jsonContent = require('fs').readFileSync(jsonPath!, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData.length).toBeGreaterThan(0);
    // Verify our annotation is in the export
    const ourAnnotation = jsonData.find((a: any) => a.videoId === videoId);
    expect(ourAnnotation).toBeTruthy();
    expect(ourAnnotation.speaker1Label).toBe('Morph A');
    expect(ourAnnotation.speaker2Label).toBe('Morph B');

    // Step 11c: Download CSV export and verify
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Export CSV' }).click(),
    ]);
    const csvFileName = csvDownload.suggestedFilename();
    expect(csvFileName).toMatch(/annotations-.*\.csv$/);

    // Read and verify CSV content
    const csvPath = await csvDownload.path();
    const csvContent = require('fs').readFileSync(csvPath!, 'utf-8');
    expect(csvContent).toContain('videoId'); // Header
    expect(csvContent).toContain(videoId!); // Our annotation

    // Step 12: Cleanup - delete the annotation
    await page.goto(`/videos/${videoId}`);

    const clearButton = page.getByRole('button', { name: /Clear Annotation/ });
    await expect(clearButton).toBeVisible();

    // Handle the confirmation dialog
    page.once('dialog', dialog => dialog.accept());
    await clearButton.click();

    // Wait for the page to refresh
    await page.waitForTimeout(1000);

    // Step 13: Cleanup - delete the downloaded video
    await page.goto('/videos');

    // Find the video card by the h2 containing the video ID
    const videoCardForDelete = page.locator(`div.p-6:has(h2:text("${videoId}"))`);
    const deleteButton = videoCardForDelete.getByRole('button', { name: 'Delete from disk' });

    // Handle the confirmation dialog
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(2000);

    // Verify the video is no longer downloaded (should show Download button again)
    const downloadButtonAgain = videoCardForDelete.getByRole('button', { name: 'Download' });
    await expect(downloadButtonAgain).toBeVisible({ timeout: 10000 });

    // Final verification: go to homepage and check annotation count is back to initial
    await page.goto('/');
    const finalAnnotatedCount = await getAnnotatedCount();
    expect(finalAnnotatedCount).toBe(initialAnnotatedCount);
  });
});

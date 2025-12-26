import { execSync } from "child_process";

async function globalTeardown() {
  console.log("🧹 Cleaning up...");

  try {
    // Stop docker-compose
    console.log("🐳 Stopping Docker Compose...");
    execSync("docker-compose down", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Kill any process on port 3000 (dev server)
    console.log("🛑 Stopping dev server...");
    try {
      execSync("lsof -ti:3000 | xargs kill -9", {
        stdio: "ignore",
      });
    } catch {
      // Ignore if no process found
    }

    console.log("✅ Cleanup complete");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    // Don't throw - we want tests to complete even if cleanup fails
  }
}

export default globalTeardown;

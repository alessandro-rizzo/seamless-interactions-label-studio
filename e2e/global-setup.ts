import { execSync } from "child_process";

async function globalSetup() {
  console.log("🚀 Starting PostgreSQL via Docker Compose...");

  try {
    // Start docker-compose (use 'docker compose' for V2 compatibility)
    execSync("docker compose up -d postgres", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Wait for PostgreSQL to be ready
    console.log("⏳ Waiting for PostgreSQL to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Create database schema
    console.log("📋 Creating database schema...");
    execSync("pnpm prisma db push --accept-data-loss", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://seamless:seamless@localhost:5432/seamless_interactions?schema=public",
      },
    });

    // Clear any existing annotations
    console.log("🧹 Clearing database...");
    execSync("node e2e/clear-db.js", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://seamless:seamless@localhost:5432/seamless_interactions?schema=public",
      },
    });

    console.log("✅ Setup complete");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

export default globalSetup;

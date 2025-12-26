import { test as setup } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://seamless:seamless@localhost:5432/seamless_interactions?schema=public",
      },
    },
  });

  try {
    // Create a test user and session directly in the database
    const testUser = await prisma.user.upsert({
      where: { email: "e2e-test@example.com" },
      update: {},
      create: {
        email: "e2e-test@example.com",
        name: "E2E Test User",
        emailVerified: new Date(),
      },
    });

    // Create a session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 days from now

    await prisma.session.create({
      data: {
        sessionToken,
        userId: testUser.id,
        expires,
      },
    });

    console.log("✅ Created test user and session");

    // Set the session cookie
    await page.context().addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        expires: Math.floor(expires.getTime() / 1000),
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Navigate to the app to verify auth works
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Save signed-in state
    await page.context().storageState({ path: authFile });
    console.log("✅ Saved authentication state");
  } finally {
    await prisma.$disconnect();
  }
});

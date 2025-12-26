const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Clear annotations first (due to foreign key constraints)
    await prisma.annotation.deleteMany();
    console.log("✓ Annotations cleared");

    // Clear sessions
    await prisma.session.deleteMany();
    console.log("✓ Sessions cleared");

    // Clear accounts
    await prisma.account.deleteMany();
    console.log("✓ Accounts cleared");

    // Clear users (will be recreated by auth setup)
    await prisma.user.deleteMany();
    console.log("✓ Users cleared");

    console.log("Database cleared");
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();

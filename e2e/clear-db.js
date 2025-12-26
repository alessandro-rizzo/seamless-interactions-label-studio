const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

prisma.annotation
  .deleteMany()
  .then(() => {
    console.log("Database cleared");
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error("Error clearing database:", error);
    process.exit(1);
  });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Create a few sample videos for e2e testing
const sampleVideos = [
  {
    videoId: "V00_S0001_I00000001",
    vendorId: 0,
    sessionId: 1,
    interactionId: 1,
    participant1Id: "0001",
    participant2Id: "0002",
    label: "improvised",
    split: "train",
    fileId1: "V00_S0001_I00000001_P0001",
    fileId2: "V00_S0001_I00000001_P0002",
  },
  {
    videoId: "V00_S0001_I00000002",
    vendorId: 0,
    sessionId: 1,
    interactionId: 2,
    participant1Id: "0003",
    participant2Id: "0004",
    label: "naturalistic",
    split: "dev",
    fileId1: "V00_S0001_I00000002_P0003",
    fileId2: "V00_S0001_I00000002_P0004",
  },
  {
    videoId: "V00_S0001_I00000003",
    vendorId: 0,
    sessionId: 1,
    interactionId: 3,
    participant1Id: "0005",
    participant2Id: "0006",
    label: "improvised",
    split: "test",
    fileId1: "V00_S0001_I00000003_P0005",
    fileId2: "V00_S0001_I00000003_P0006",
  },
];

prisma.video
  .createMany({
    data: sampleVideos,
    skipDuplicates: true,
  })
  .then(() => {
    console.log("Database seeded with test videos");
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });

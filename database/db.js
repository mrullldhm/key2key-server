import { prisma } from "../config/prisma.client.js";

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected via Prisma");
  } catch (err) {
    console.error(`Database connection error: ${err}`);
    process.exit(1);
  }
};

// export const disconnectDB = async () => {
//   await prisma.$disconnect();
//   console.log("Database Disconnected");
// };

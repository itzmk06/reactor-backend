import dotenv from "dotenv";
dotenv.config();
import { prisma } from "./lib/prisma";

async function test() {
  const users = await prisma.user.findMany();

  console.log("Users:", users);
}

test()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
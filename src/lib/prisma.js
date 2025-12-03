import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

dotenv.config(); // Load environment variables

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };

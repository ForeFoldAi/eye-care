import { defineConfig } from "drizzle-kit";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required. Please ensure the MongoDB connection string is set in your environment variables.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mongodb",
  dbCredentials: {
    uri: process.env.MONGODB_URI,
  },
});

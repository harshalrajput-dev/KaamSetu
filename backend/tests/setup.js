import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Ensure test env before importing app/config.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_do_not_use_in_prod";
process.env.BCRYPT_SALT_ROUNDS = "4";

let mongod;

export async function startTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
}

export async function stopTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Loads a fresh app instance bound to the in-memory DB.
 */
export async function getApp() {
  const { createApp } = await import("../src/app.js");
  return createApp();
}

export { request, mongoose };

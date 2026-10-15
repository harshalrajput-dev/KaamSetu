import bcrypt from "bcryptjs";
import env from "../config/env.js";

export async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
}

export async function comparePassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export default { hashPassword, comparePassword };

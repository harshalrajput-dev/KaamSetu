import mongoose from "mongoose";
import { SERVICE_CATEGORIES } from "../config/constants.js";

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Worker name is required"],
      trim: true,
      maxlength: 120,
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [/^[0-9]{10,15}$/, "Contact number must be 10-15 digits"],
    },
    skills: {
      type: [String],
      enum: SERVICE_CATEGORIES,
      default: [],
      index: true,
    },
    // Optional profile photo shown to customers when the worker is assigned.
    photoUrl: { type: String, trim: true, default: "" },
    naka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Naka",
      required: true,
      index: true,
    },
    isAvailable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    // Optional linked login account (role: worker). Null means no app login.
    loginUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Sanction / reliability tracking, reviewed by admins.
    noShowCount: { type: Number, default: 0, min: 0 },
    warningCount: { type: Number, default: 0, min: 0 },
    suspendedUntil: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false, index: true },
    sanctionNote: { type: String, trim: true, default: "" },
    // Optional per-day attendance notes set by the naka admin.
    attendance: [{ date: Date, present: Boolean, note: String }],
  },
  { timestamps: true }
);

workerSchema.index({ naka: 1, isActive: 1, isAvailable: 1 });

/**
 * A worker can be assigned when active, not blocked and not suspended.
 */
workerSchema.methods.isAssignable = function isAssignable() {
  if (!this.isActive || this.isBlocked) return false;
  if (this.suspendedUntil && this.suspendedUntil > new Date()) return false;
  return true;
};

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;

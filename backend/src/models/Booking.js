import mongoose from "mongoose";
import { BOOKING_STATUS, BOOKING_STATUS_VALUES, SERVICE_CATEGORIES } from "../config/constants.js";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    service: {
      type: String,
      enum: SERVICE_CATEGORIES,
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    address: { type: String, required: true, trim: true },
    area: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true, default: "Surat", index: true },
    naka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Naka",
      default: null,
      index: true,
    },
    requiredWorkerCount: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 1,
    },
    assignedWorkers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    ],
    preferredDate: { type: Date, default: null },
    preferredTime: { type: String, trim: true, default: "" },
    photoUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: BOOKING_STATUS_VALUES,
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, enum: BOOKING_STATUS_VALUES },
        note: { type: String, trim: true, default: "" },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    // Lifecycle timestamps, set as the booking progresses.
    assignedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    // Per-worker arrival confirmation recorded by the naka/super admin.
    // `arrived: false` marks a no-show and feeds worker no-show counters.
    workerArrivals: [
      {
        worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
        arrived: { type: Boolean, default: true },
        note: { type: String, trim: true, default: "" },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        recordedAt: { type: Date, default: Date.now },
      },
    ],
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ naka: 1, status: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

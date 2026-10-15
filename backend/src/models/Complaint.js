import mongoose from "mongoose";
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUS, COMPLAINT_STATUS_VALUES } from "../config/constants.js";

// A dispute/issue raised by a customer, optionally about a booking.
// Naka admins handle their own naka's complaints; the super admin sees all
// and receives escalations.
const complaintSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    naka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Naka",
      default: null,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      default: "Other",
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUS_VALUES,
      default: COMPLAINT_STATUS.OPEN,
      index: true,
    },
    // Admin currently handling the complaint.
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Super admin the complaint was escalated to.
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNote: { type: String, trim: true, default: "" },
    history: [
      {
        status: { type: String, enum: COMPLAINT_STATUS_VALUES },
        note: { type: String, trim: true, default: "" },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

complaintSchema.index({ naka: 1, status: 1, createdAt: -1 });
complaintSchema.index({ customer: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;

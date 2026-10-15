import mongoose from "mongoose";
import { SERVICE_CATEGORIES } from "../config/constants.js";

// Service categories can be managed by the super admin.
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: SERVICE_CATEGORIES,
    },
    // i18n labels so the category is shown in all three languages.
    labelGu: { type: String, trim: true, default: "" },
    labelHi: { type: String, trim: true, default: "" },
    labelEn: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "wrench" },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;

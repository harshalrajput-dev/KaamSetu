import mongoose from "mongoose";

const nakaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Naka name is required"],
      trim: true,
      maxlength: 120,
    },
    address: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      default: "Surat",
      index: true,
    },
    // The naka_admin user responsible for this naka.
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    contactNumber: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

nakaSchema.index({ name: 1, city: 1 }, { unique: true });

const Naka = mongoose.model("Naka", nakaSchema);
export default Naka;

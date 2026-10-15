import mongoose from "mongoose";

export const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  NAKA_ADMIN: "naka_admin",
  WORKER: "worker",
  CUSTOMER: "customer",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [/^[0-9]{10,15}$/, "Contact number must be 10-15 digits"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      default: ROLES.CUSTOMER,
      index: true,
    },
    // Only relevant for naka_admin users.
    naka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Naka",
      default: null,
      index: true,
    },
    // Only relevant for worker users: links the login to its Worker profile.
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
      index: true,
    },
    // Optional customer address fields.
    address: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "Surat" },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },
    // Password reset (token based, no external email/SMS service required).
    passwordResetTokenHash: { type: String, select: false, default: null },
    passwordResetExpiresAt: { type: Date, select: false, default: null },
  },
  { timestamps: true }
);

// Prevent leaking sensitive fields in JSON output.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    naka: this.naka,
    worker: this.worker,
    address: this.address,
    area: this.area,
    city: this.city,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;

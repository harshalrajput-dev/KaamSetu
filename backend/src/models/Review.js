import mongoose from "mongoose";

// A customer review (1-5 stars + optional comment) for a completed booking.
// One review per booking is enforced by the unique index on `booking`.
const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
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
    naka: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Naka",
      default: null,
      index: true,
    },
    workers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }],
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },
    // Admins can hide abusive reviews from public listings.
    isVisible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

reviewSchema.index({ naka: 1, createdAt: -1 });
reviewSchema.index({ workers: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;

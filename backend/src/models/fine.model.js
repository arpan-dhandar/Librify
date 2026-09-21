import mongoose from "mongoose";

const { Schema, model } = mongoose;

const fineSchema = new Schema(
  {
    issue: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: [true, "Fine must reference an Issue"],
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Fine must reference a Member"],
    },
    amount: {
      type: Number,
      required: [true, "Fine amount is required"],
      min: 0,
    },
    daysLate: {
      type: Number,
      default: 0,
      min: 0,
    },
    reason: {
      type: String,
      enum: ["Late return", "Lost book", "Damaged book", "Other"],
      default: "Late return",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "pending",
    },
    paidDate: {
      type: Date,
      default: null,
    },
    waivedBy: {
      // admin who waived the fine, if applicable
      type: Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fineSchema.index({ member: 1, status: 1 });
fineSchema.index({ issue: 1 });

// ---- Middleware ----
// "Trigger": when a fine's status flips to "paid", stamp paidDate automatically.
fineSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "paid" && !this.paidDate) {
    this.paidDate = new Date();
  }
  next();
});

// ---- Instance methods ----
// Simulates a stored procedure: mark a fine as paid.
fineSchema.methods.markAsPaid = function () {
  this.status = "paid";
  this.paidDate = new Date();
  return this.save();
};

const Fine = model("Fine", fineSchema);

export default Fine;
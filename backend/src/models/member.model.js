import mongoose from "mongoose";

const { Schema, model } = mongoose;

const memberSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default in queries
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    role: {
      type: String,
      enum: ["member", "admin", "librarian"],
      default: "member",
    },
    membershipDate: {
      type: Date,
      default: Date.now,
    },
    maxBooksAllowed: {
      type: Number,
      default: 3,
      min: 0,
    },
    currentBooksIssued: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// ---- Virtuals ----
// Simulates a "computed column": true if member has hit their borrow limit
memberSchema.virtual("hasReachedLimit").get(function () {
  return this.currentBooksIssued >= this.maxBooksAllowed;
});

memberSchema.set("toJSON", { virtuals: true });
memberSchema.set("toObject", { virtuals: true });

// ---- Indexes ----
memberSchema.index({ email: 1 }, { unique: true });
memberSchema.index({ status: 1 });

// ---- Instance methods ----
// Simulates a stored procedure: "can this member issue another book?"
memberSchema.methods.canIssueBook = function () {
  return this.status === "active" && this.currentBooksIssued < this.maxBooksAllowed;
};

const Member = model("Member", memberSchema);

export default Member;
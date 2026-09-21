import mongoose from "mongoose";

const { Schema, model } = mongoose;

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
      // Accepts ISBN-10 or ISBN-13, with or without hyphens
      match: [/^(?:\d{9}[\dXx]|\d{13})$|^(?:\d{1,5}-\d{1,7}-\d{1,7}-[\dXx])$/, "Invalid ISBN format"],
    },
    genre: {
      type: String,
      trim: true,
      enum: [
        "Fiction",
        "Non-Fiction",
        "Science",
        "Technology",
        "History",
        "Biography",
        "Fantasy",
        "Mystery",
        "Romance",
        "Academic",
        "Other",
      ],
      default: "Other",
    },
    publisher: {
      type: String,
      trim: true,
    },
    publishedYear: {
      type: Number,
      min: 1450, // Gutenberg press era, sane lower bound
      max: new Date().getFullYear(),
    },
    language: {
      type: String,
      default: "English",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // Denormalized counters kept in sync via BookCopy middleware/services.
    // These act like "materialized view" columns so we don't have to run
    // an aggregation every time we just need a quick count.
    totalCopies: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableCopies: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ---- Indexes ----
bookSchema.index({ isbn: 1 }, { unique: true });
bookSchema.index({ title: "text", author: "text" }); // simulates full-text search
bookSchema.index({ genre: 1 });

// ---- Virtuals ----
bookSchema.virtual("isAvailable").get(function () {
  return this.availableCopies > 0;
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

const Book = model("Book", bookSchema);

export default Book;
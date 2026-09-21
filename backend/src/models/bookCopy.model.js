import mongoose from "mongoose";

const { Schema, model } = mongoose;

const bookCopySchema = new Schema(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "BookCopy must reference a Book"],
    },
    copyNumber: {
      type: Number,
      required: [true, "Copy number is required"],
      min: 1,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true, // allows nulls without violating uniqueness
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "issued", "reserved", "lost", "damaged", "withdrawn"],
      default: "available",
    },
    shelfLocation: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ["new", "good", "worn", "damaged"],
      default: "good",
    },
    acquiredDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One copyNumber per book must be unique (compound index)
bookCopySchema.index({ book: 1, copyNumber: 1 }, { unique: true });
bookCopySchema.index({ status: 1 });

// ---- Middleware ----
// "Trigger": whenever a new copy is added or a copy's status changes,
// keep the parent Book's totalCopies/availableCopies counters in sync.
bookCopySchema.post("save", async function (doc) {
  const Book = mongoose.model("Book");
  await syncBookCounters(Book, doc.book);
});

bookCopySchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  const Book = mongoose.model("Book");
  await syncBookCounters(Book, doc.book);
});

bookCopySchema.post("deleteOne", { document: true, query: false }, async function (doc) {
  const Book = mongoose.model("Book");
  await syncBookCounters(Book, doc.book);
});

// Helper: recompute totalCopies/availableCopies for a given book
// via aggregation (this is the "view" — a live recalculation).
async function syncBookCounters(Book, bookId) {
  const BookCopy = mongoose.model("BookCopy");

  const [stats] = await BookCopy.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: "$book",
        totalCopies: { $sum: 1 },
        availableCopies: {
          $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
        },
      },
    },
  ]);

  await Book.findByIdAndUpdate(bookId, {
    totalCopies: stats ? stats.totalCopies : 0,
    availableCopies: stats ? stats.availableCopies : 0,
  });
}

const BookCopy = model("BookCopy", bookCopySchema);

export default BookCopy;
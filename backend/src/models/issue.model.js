import mongoose from "mongoose";

const { Schema, model } = mongoose;

// How many days a book may be borrowed for, and the daily late fee.
// In a real app pull these from a config/settings collection or .env.
const LOAN_PERIOD_DAYS = 14;
const FINE_PER_DAY = 5; // currency units per day late

const issueSchema = new Schema(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Issue must reference a Member"],
    },
    bookCopy: {
      type: Schema.Types.ObjectId,
      ref: "BookCopy",
      required: [true, "Issue must reference a BookCopy"],
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["issued", "returned", "overdue", "lost"],
      default: "issued",
    },
    fine: {
      type: Schema.Types.ObjectId,
      ref: "Fine",
      default: null,
    },
    issuedBy: {
      // admin/librarian who processed the issue, optional
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.index({ member: 1, status: 1 });
issueSchema.index({ bookCopy: 1 });
issueSchema.index({ dueDate: 1 });

// ---- Virtuals ----
issueSchema.virtual("isOverdue").get(function () {
  if (this.status === "returned") return false;
  return new Date() > this.dueDate;
});

issueSchema.set("toJSON", { virtuals: true });
issueSchema.set("toObject", { virtuals: true });

// =====================================================================
// PRE-SAVE MIDDLEWARE ("trigger": BEFORE INSERT/UPDATE)
// =====================================================================
issueSchema.pre("save", function () {
  // Stash flags now, because `isNew`/`isModified` flip right after save()
  // resolves — the post hook needs to know what just happened.
  this.$locals.wasNew = this.isNew;
  this.$locals.returnJustSet =
    !this.isNew && this.isModified("returnDate") && this.returnDate;

  // On creation: auto-compute the due date if the caller didn't supply one.
  if (this.isNew && !this.dueDate) {
    const due = new Date(this.issueDate);
    due.setDate(due.getDate() + LOAN_PERIOD_DAYS);
    this.dueDate = due;
  }

  // If a returnDate is being set, flip status to "returned" automatically.
  if (this.$locals.returnJustSet && this.status !== "returned") {
    this.status = "returned";
  }
});

// =====================================================================
// POST-SAVE MIDDLEWARE ("trigger": AFTER INSERT/UPDATE)
// =====================================================================
issueSchema.post("save", async function (doc) {
  const BookCopy = mongoose.model("BookCopy");
  const Member = mongoose.model("Member");
  const Fine = mongoose.model("Fine");
  const Issue = mongoose.model("Issue");

  try {
    // --- Case 1: brand-new issue -> mark the copy issued, bump member's count
    if (doc.$locals.wasNew) {
      await BookCopy.findByIdAndUpdate(doc.bookCopy, { status: "issued" });
      await Member.findByIdAndUpdate(doc.member, {
        $inc: { currentBooksIssued: 1 },
      });
    }

    // --- Case 2: book just got returned -> free the copy, auto-fine if late
    if (doc.$locals.returnJustSet) {
      await BookCopy.findByIdAndUpdate(doc.bookCopy, { status: "available" });
      await Member.findByIdAndUpdate(doc.member, {
        $inc: { currentBooksIssued: -1 },
      });

      const lateMs = doc.returnDate - doc.dueDate;
      const lateDays = Math.ceil(lateMs / (1000 * 60 * 60 * 24));

      if (lateDays > 0 && !doc.fine) {
        const fine = await Fine.create({
          issue: doc._id,
          member: doc.member,
          amount: lateDays * FINE_PER_DAY,
          daysLate: lateDays,
          reason: "Late return",
          status: "pending",
        });

        // Use updateOne (not doc.save()) so we don't re-trigger this
        // same pre/post save pipeline again.
        await Issue.updateOne({ _id: doc._id }, { fine: fine._id });
      }
    }
  } catch (err) {
    // Post hooks can't call next(err) in modern Mongoose; log loudly so
    // a broken trigger doesn't fail silently during a DBMS demo.
    console.error("Issue post-save middleware failed:", err);
  }
});

const Issue = model("Issue", issueSchema);

export default Issue;
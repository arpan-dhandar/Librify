import express from "express";
import Issue from "../models/issue.model.js";
import Member from "../models/member.model.js";
import BookCopy from "../models/bookCopy.model.js";

const router = express.Router();

// POST /api/issue - issue a book to a member
// body: { memberId, bookId }
router.post("/issue", async (req, res) => {
  try {
    const { memberId, bookId } = req.body;

    if (!memberId || !bookId) {
      return res
        .status(400)
        .json({ success: false, message: "memberId and bookId are required" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    if (!member.canIssueBook()) {
      return res.status(400).json({
        success: false,
        message: "Member cannot issue another book (limit reached or account not active)",
      });
    }

    const availableCopy = await BookCopy.findOne({ book: bookId, status: "available" });
    if (!availableCopy) {
      return res
        .status(400)
        .json({ success: false, message: "No available copies for this book" });
    }

    // Creating this triggers Issue's post('save') hook, which marks the
    // copy as 'issued' and increments the member's currentBooksIssued.
    const issue = await Issue.create({
      member: memberId,
      bookCopy: availableCopy._id,
    });

    res.status(201).json({ success: true, data: issue });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/return/:issueId - return a book
router.put("/return/:issueId", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue record not found" });
    }

    if (issue.returnDate) {
      return res
        .status(400)
        .json({ success: false, message: "This book has already been returned" });
    }

    issue.returnDate = new Date();

    // Saving here (not create) triggers the "just returned" branch of the
    // pre/post save hooks: BookCopy -> available, member count decremented,
    // and a Fine is auto-created if the return is late.
    await issue.save();

    res.status(200).json({ success: true, data: issue });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/issues/active - all books currently checked out
router.get("/issues/active", async (req, res) => {
  try {
    const issues = await Issue.find({ returnDate: null })
      .populate("member")
      .populate({ path: "bookCopy", populate: { path: "book" } })
      .sort({ dueDate: 1 });

    res.json({ success: true, count: issues.length, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
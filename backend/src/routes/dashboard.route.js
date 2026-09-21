import express from "express";
import Member from "../models/member.model.js";
import Book from "../models/book.model.js";
import BookCopy from "../models/bookCopy.model.js";
import Issue from "../models/issue.model.js";
import Fine from "../models/fine.model.js";

const router = express.Router();

// GET /api/dashboard - quick summary counts for an admin dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalMembers,
      totalBooks,
      totalCopies,
      availableCopies,
      currentlyIssued,
      overdueCount,
      pendingFines,
    ] = await Promise.all([
      Member.countDocuments(),
      Book.countDocuments(),
      BookCopy.countDocuments(),
      BookCopy.countDocuments({ status: "available" }),
      Issue.countDocuments({ returnDate: null }),
      Issue.countDocuments({ returnDate: null, dueDate: { $lt: new Date() } }),
      Fine.aggregate([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        totalBooks,
        totalCopies,
        availableCopies,
        currentlyIssued,
        overdueCount,
        pendingFinesCount: pendingFines[0]?.count || 0,
        pendingFinesAmount: pendingFines[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
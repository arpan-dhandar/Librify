import express from "express";
import Issue from "../models/issue.model.js";

const router = express.Router();

// GET /api/overdue - list all currently overdue issues
router.get("/overdue", async (req, res) => {
  try {
    const overdueIssues = await Issue.aggregate([
      // Only issues that are still out and past their due date
      {
        $match: {
          returnDate: null,
          dueDate: { $lt: new Date() },
        },
      },
      // Join member details
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },
      // Join the book copy, then the book itself
      {
        $lookup: {
          from: "bookcopies",
          localField: "bookCopy",
          foreignField: "_id",
          as: "bookCopy",
        },
      },
      { $unwind: "$bookCopy" },
      {
        $lookup: {
          from: "books",
          localField: "bookCopy.book",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      // Compute how many days overdue
      {
        $addFields: {
          daysOverdue: {
            $ceil: {
              $divide: [{ $subtract: [new Date(), "$dueDate"] }, 1000 * 60 * 60 * 24],
            },
          },
        },
      },
      // Only return the fields the frontend actually needs
      {
        $project: {
          issueDate: 1,
          dueDate: 1,
          daysOverdue: 1,
          "member.name": 1,
          "member.email": 1,
          "book.title": 1,
          "book.author": 1,
        },
      },
      { $sort: { daysOverdue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: overdueIssues.length,
      data: overdueIssues,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
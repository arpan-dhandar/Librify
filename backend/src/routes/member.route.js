import express from "express";
import Member from "../models/member.model.js";

const router = express.Router();

// GET /api/members - list all members
router.get("/members", async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/members - add a new member
router.post("/members", async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
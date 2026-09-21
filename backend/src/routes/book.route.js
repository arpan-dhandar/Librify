import express from "express";
import Book from "../models/book.model.js";

const router = express.Router();

// GET /api/books - list all books
router.get("/books", async (req, res) => {
  try {
    const books = await Book.find().sort({ title: 1 });
    res.status(200).json({ success: true, count: books.length, data: books });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/books - add a new book
router.post("/books", async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
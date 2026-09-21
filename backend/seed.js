// backend/seed.js
//
// Populates the database with sample data for demo/testing.
// Run with:  node seed.js
//
// IMPORTANT: This intentionally creates Issue documents step by step
// (create -> then set returnDate -> save) rather than writing every
// field in one .create() call. That's because the Issue model's
// pre/post 'save' middleware only treats a document as "just returned"
// when returnDate is set on an UPDATE, not on initial creation. Doing
// it this way means your BookCopy-status and auto-Fine triggers fire
// for real, exactly as they would when a librarian uses the app.

import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./src/db/connect.js";
// ^ If your connect.js uses a named export instead of a default export,
//   change the line above to:  import { connectDB } from "./src/db/connect.js";

import Member from "./src/models/member.model.js";
import Book from "./src/models/book.model.js";
import BookCopy from "./src/models/bookCopy.model.js";
import Issue from "./src/models/issue.model.js";
import Fine from "./src/models/fine.model.js"; // imported so mongoose.model('Fine') resolves inside Issue's hooks

dotenv.config();

// ---------- small helpers ----------
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const pick = (arr, i) => arr[i % arr.length];

// ---------- sample data ----------
const GENRES = [
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
];

const memberSeed = [
  { name: "Aarav Sharma", email: "aarav.sharma@example.com" },
  { name: "Priya Patel", email: "priya.patel@example.com" },
  { name: "Rohan Mehta", email: "rohan.mehta@example.com" },
  { name: "Ishita Verma", email: "ishita.verma@example.com" },
  { name: "Kabir Singh", email: "kabir.singh@example.com" },
  { name: "Ananya Joshi", email: "ananya.joshi@example.com" },
  { name: "Vivaan Nair", email: "vivaan.nair@example.com" },
  { name: "Diya Reddy", email: "diya.reddy@example.com" },
  { name: "Arjun Kapoor", email: "arjun.kapoor@example.com" },
  { name: "Sneha Gupta", email: "sneha.gupta@example.com" },
];

const bookSeed = [
  { title: "Clean Code", author: "Robert C. Martin", genre: "Technology", publisher: "Prentice Hall", publishedYear: 2008 },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", genre: "Technology", publisher: "Addison-Wesley", publishedYear: 1999 },
  { title: "Sapiens", author: "Yuval Noah Harari", genre: "Non-Fiction", publisher: "Harper", publishedYear: 2011 },
  { title: "A Brief History of Time", author: "Stephen Hawking", genre: "Science", publisher: "Bantam Books", publishedYear: 1988 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", publisher: "George Allen & Unwin", publishedYear: 1937 },
  { title: "1984", author: "George Orwell", genre: "Fiction", publisher: "Secker & Warburg", publishedYear: 1949 },
  { title: "Steve Jobs", author: "Walter Isaacson", genre: "Biography", publisher: "Simon & Schuster", publishedYear: 2011 },
  { title: "The Silent Patient", author: "Alex Michaelides", genre: "Mystery", publisher: "Celadon Books", publishedYear: 2019 },
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", publisher: "T. Egerton", publishedYear: 1813 },
  { title: "Database System Concepts", author: "Abraham Silberschatz", genre: "Academic", publisher: "McGraw-Hill", publishedYear: 2019 },
];

// how many copies each of the 10 books gets (sums to 18, within the 15-20 range)
const copiesPerBook = [2, 2, 1, 2, 2, 1, 2, 2, 1, 3];

async function seed() {
  await connectDB();
  console.log("Connected. Clearing existing collections...");

  await Promise.all([
    Member.deleteMany({}),
    Book.deleteMany({}),
    BookCopy.deleteMany({}),
    Issue.deleteMany({}),
    Fine.deleteMany({}),
  ]);

  // ---------- 1. Members ----------
  const members = await Member.insertMany(
    memberSeed.map((m) => ({
      ...m,
      password: "password123", // demo only — plaintext is fine for seed data
     phone: `98${String(Math.floor(10000000 + Math.random() * 90000000))}`,
      role: "member",
      maxBooksAllowed: 3,
    }))
  );
  console.log(`Inserted ${members.length} members`);

  // ---------- 2. Books ----------
  const books = await Book.insertMany(
    bookSeed.map((b, i) => ({
      ...b,
      isbn: `978${String(1000000000 + i).slice(0, 10)}`, // fake but valid 13-digit ISBN
      language: "English",
      description: `${b.title} by ${b.author}.`,
      // totalCopies / availableCopies are recalculated automatically
      // by BookCopy's post-save trigger, so we don't set them here.
    }))
  );
  console.log(`Inserted ${books.length} books`);

  // ---------- 3. Book copies ----------
  // Created one at a time with .create() (not insertMany) so each copy's
  // post('save') trigger fires and keeps each Book's copy counters in sync.
  const copies = [];
  for (let b = 0; b < books.length; b++) {
    const count = copiesPerBook[b];
    for (let c = 1; c <= count; c++) {
      const copy = await BookCopy.create({
        book: books[b]._id,
        copyNumber: c,
        barcode: `LIB-${b + 1}-${c}`,
        shelfLocation: `Shelf ${String.fromCharCode(65 + (b % 5))}-${b + 1}`,
        condition: "good",
        status: "available",
      });
      copies.push(copy);
    }
  }
  console.log(`Inserted ${copies.length} book copies`);

  // ---------- 4. Issues ----------
  // We deliberately use a distinct copy per issue so no two issues ever
  // fight over the same physical copy at the same time — keeps the demo
  // data consistent without needing to simulate a full timeline.
  let copyIndex = 0;
  const nextCopy = () => copies[copyIndex++];

  const issuesCreated = [];

  // -- Group A: 5 issues returned ON TIME --
  for (let i = 0; i < 5; i++) {
    const issue = await Issue.create({
      member: pick(members, i)._id,
      bookCopy: nextCopy()._id,
      issueDate: daysAgo(20 + i), // issued 20-24 days ago
      // dueDate auto-computed as issueDate + 14 days by pre('save')
    });
    // Return it a few days before the due date -> on time
    issue.returnDate = daysAgo(20 + i - 18); // returned ~2 days before due
    await issue.save(); // triggers: BookCopy -> available, no fine (on time)
    issuesCreated.push(issue);
  }

  // -- Group B: 5 issues returned LATE (auto-generates a Fine each) --
  for (let i = 0; i < 5; i++) {
    const issue = await Issue.create({
      member: pick(members, i + 5)._id,
      bookCopy: nextCopy()._id,
      issueDate: daysAgo(30 + i), // issued 30-34 days ago
      // dueDate = issueDate + 14
    });
    // Return it several days AFTER the due date -> late, triggers a Fine
    issue.returnDate = daysAgo(30 + i - 20); // returned ~6-10 days after due
    await issue.save(); // triggers: BookCopy -> available, Fine auto-created
    issuesCreated.push(issue);
  }

  // -- Group C: 3 issues still OUT and OVERDUE (never returned) --
  for (let i = 0; i < 3; i++) {
    const issue = await Issue.create({
      member: pick(members, i)._id,
      bookCopy: nextCopy()._id,
      issueDate: daysAgo(20 + i), // due date has already passed
    });
    issuesCreated.push(issue); // no returnDate -> BookCopy stays 'issued'
  }

  // -- Group D: 2 issues still OUT but WITHIN the loan period (active) --
  for (let i = 0; i < 2; i++) {
    const issue = await Issue.create({
      member: pick(members, i + 3)._id,
      bookCopy: nextCopy()._id,
      issueDate: daysAgo(3 + i), // recently issued, due date is in the future
    });
    issuesCreated.push(issue);
  }

  console.log(`Inserted ${issuesCreated.length} issue records`);

  const fineCount = await Fine.countDocuments();
  console.log(`Fine records auto-generated by triggers: ${fineCount}`);

  console.log("\nSeed summary:");
  console.log(`  Members:     ${members.length}`);
  console.log(`  Books:       ${books.length}`);
  console.log(`  Book copies: ${copies.length}`);
  console.log(`  Issues:      ${issuesCreated.length} (5 on-time returns, 5 late returns, 3 overdue, 2 active)`);
  console.log(`  Fines:       ${fineCount}`);
}

seed()
  .then(() => {
    console.log("\nSeeding complete.");
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    mongoose.disconnect().finally(() => process.exit(1));
  });
const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, isAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// ADMIN creates employee
router.post(
  "/create-employee",
  verifyToken,
  isAdmin,
  upload.single("profile_image"),
  async (req, res) => {
    const { name, email, password } = req.body;
    const bcrypt = require("bcryptjs");

    const hashedPassword = await bcrypt.hash(password, 10);
    const imagePath = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    const sql = `
      INSERT INTO users (name, email, password, role, profile_image)
      VALUES (?, ?, ?, 'employee', ?)
    `;

    db.query(
      sql,
      [name, email, hashedPassword, imagePath],
      (err) => {
        if (err)
          return res.status(500).json({ message: "User exists" });
        res.json({ message: "Employee created with image" });
      }
    );
  }
);
module.exports = router;

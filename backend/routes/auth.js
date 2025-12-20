const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
const SECRET = "ticket_secret_key"; // move to env later

// =======================
// LOGIN
// =======================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(401).json({ message: "User not found" });

      const user = results[0];

      // ✅ bcrypt password check
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid password" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile_image: user.profile_image,
        },
      });
    }
  );
});
// GET CURRENT USER PROFILE
router.get("/me",
   verifyToken,
   upload.single("profile_image"),
    async(req, res) => {
  db.query(
    "SELECT id, name, email, role, profile_image FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0]);
    }
  );
});


// =======================
// UPDATE OWN PROFILE
// =======================
router.put(
  "/me",
  verifyToken,
  upload.single("profile_image"),
  async (req, res) => {
    const userId = req.user.id;
    const { name, password } = req.body;

    const imagePath = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    let sql;
    let params;

    if (password && imagePath) {
      const hashed = await bcrypt.hash(password, 10);
      sql =
        "UPDATE users SET name=?, password=?, profile_image=? WHERE id=?";
      params = [name, hashed, imagePath, userId];
    } else if (password) {
      const hashed = await bcrypt.hash(password, 10);
      sql = "UPDATE users SET name=?, password=? WHERE id=?";
      params = [name, hashed, userId];
    } else if (imagePath) {
      sql = "UPDATE users SET name=?, profile_image=? WHERE id=?";
      params = [name, imagePath, userId];
    } else {
      sql = "UPDATE users SET name=? WHERE id=?";
      params = [name, userId];
    }

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Profile updated",
        profile_image: imagePath,
        name,
      });
    });
  }
);

module.exports = router;

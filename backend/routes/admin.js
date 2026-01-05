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
// Get all employees (admin only)
router.get('/employees', verifyToken, isAdmin, (req, res) => {
  const sql = "SELECT id, name, email, profile_image FROM users WHERE role = 'employee'";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.get("/employees", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, status FROM users WHERE role = 'employee'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

router.put("/employees/:id", async (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, id]
    );
    res.json({ message: "Employee updated" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});


router.put("/employees/:id/status", async (req, res) => {
  const { status } = req.body; // active | hold
  const { id } = req.params;

  try {
    await db.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, id]
    );
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
});


router.delete("/employees/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

if (user.status === "hold") {
  return res.status(403).json({
    message: "Your account is on hold. Contact admin."
  });
}



module.exports = router;

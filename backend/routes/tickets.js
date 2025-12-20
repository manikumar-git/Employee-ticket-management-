const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, isAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");



// CREATE ticket
router.post("/", (req, res) => {
  const { title, description, priority } = req.body;

  const sql =
    "INSERT INTO tickets (title, description, priority) VALUES (?, ?, ?)";

  db.query(sql, [title, description, priority], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ticket created" });
  });
});

// GET all tickets
router.get("/", (req, res) => {
  db.query("SELECT * FROM tickets", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});
router.get("/", verifyToken, (req, res) => {
  const sql = `
    SELECT
      tickets.id,
      tickets.title,
      tickets.description,
      tickets.priority,
      tickets.status,
      tickets.user_id,
      users.name AS employee_name,
      users.email AS employee_email,
      users.profile_image
    FROM tickets
    JOIN users ON tickets.user_id = users.id
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});



// UPDATE ticket status
// router.put("/:id/status", (req, res) => {
//   const { status } = req.body;
//   const { id } = req.params;

//   const sql = "UPDATE tickets SET status = ? WHERE id = ?";

//   db.query(sql, [status, id], (err, result) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json(err);
//     }

//     res.json({ message: "Status updated" });
//   });
// });
// UPDATE ticket status (ADMIN ONLY)
router.put("/:id/status", verifyToken, isAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const sql = "UPDATE tickets SET status = ? WHERE id = ?";

  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json({ message: "Status updated by admin" });
  });
});


router.post("/", verifyToken, (req, res) => {
  const { title, description, priority } = req.body;
  const userId = req.user.id; // from JWT

  const sql = `
    INSERT INTO tickets (title, description, priority, user_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [title, description, priority, userId], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ticket created" });
  });
});

// DELETE ticket (owner or admin)
router.delete("/:id", verifyToken, (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;
  const role = req.user.role;

  let sql, params;

  if (role === "admin") {
    sql = "DELETE FROM tickets WHERE id = ?";
    params = [ticketId];
  } else {
    sql = "DELETE FROM tickets WHERE id = ? AND user_id = ?";
    params = [ticketId, userId];
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json({ message: "Ticket deleted" });
  });
});

// DASHBOARD STATS
router.get("/stats/dashboard", verifyToken, (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Open') AS open,
      SUM(status = 'In Progress') AS in_progress,
      SUM(status = 'Resolved') AS resolved
    FROM tickets
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

router.post("/", verifyToken, (req, res) => {
  const { title, description, priority } = req.body;
  const userId = req.user.id; // 🔥 logged-in employee

  const sql = `
    INSERT INTO tickets (title, description, priority, user_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [title, description, priority, userId], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ticket created" });
  });
});

// UPDATE PROFILE (name + image)
router.put(
  "/me",
  verifyToken,
  upload.single("profile_image"),
  (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;

    const imagePath = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    let sql;
    let params;

    if (imagePath) {
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

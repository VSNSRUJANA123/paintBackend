const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddileware("admin"),
  (req, res) => {
    try {
      return res.status(200).json({ message: "Admin dashboard", data: {} });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.get(
  "/",
  authMiddleware,
  roleMiddileware("admin", "user"),
  (req, res) => {
    try {
      return res.status(200).json({ message: "Home page", data: {} });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
module.exports = router;

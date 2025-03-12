const express = require("express");
const db = require("../config/db");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
router.get("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM purchaseOrderDetail");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/:id", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM purchaseOrderDetail WHERE purchaseOrderDetailId = ?",
      [id]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Purchase order detail not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.delete(
  "/:id",
  verifyToken,
  roleMiddileware("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await db.execute(
        "DELETE FROM purchaseOrderDetail WHERE purchaseOrderDetailId = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Purchase order detail not found" });
      }

      res.json({ message: "Purchase order detail deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;

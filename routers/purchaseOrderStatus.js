const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET all statuses
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM purchaseorderstatus");
    res.send(rows);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// POST new status
router.post("/", async (req, res) => {
  const { statusName } = req.body;

  if (!statusName) {
    return res.status(400).send({ message: "All fields are required" });
  }

  const formattedName = statusName
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!formattedName) {
    return res
      .status(400)
      .send({ message: "Status name cannot be empty after formatting." });
  }

  try {
    const [result] = await db.execute(
      "SELECT IFNULL(MAX(statusId),0) AS statusId FROM purchaseorderstatus"
    );
    const { statusId } = result[0];

    await db.execute(
      "INSERT INTO purchaseorderstatus (statusId, statusName) VALUES (?, ?)",
      [statusId + 1, formattedName]
    );

    res.send({ message: "Inserted purchaseOrderStatus successfully" });
  } catch (err) {
    res.status(500).send({ message: "Error inserting data" });
  }
});

// PUT update status
router.put("/:statusId", async (req, res) => {
  const { statusId } = req.params;
  const { statusName } = req.body;

  if (!statusName) {
    return res.status(400).send({ message: "All fields are required" });
  }

  try {
    const [result] = await db.execute(
      "UPDATE purchaseorderstatus SET statusName = ? WHERE statusId = ?",
      [statusName, statusId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Data not found" });
    }

    res.send({ message: "Updated status successfully" });
  } catch (err) {
    res.status(500).send({ message: "Error updating data" });
  }
});

// DELETE status
router.delete("/:statusId", async (req, res) => {
  const { statusId } = req.params;

  try {
    const [result] = await db.execute(
      "DELETE FROM purchaseorderstatus WHERE statusId = ?",
      [statusId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Data not found" });
    }

    res.send({ message: "Deleted data successfully" });
  } catch (err) {
    res.status(500).send({ message: "Error deleting data" });
  }
});

module.exports = router;

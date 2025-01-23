const express = require("express");
const router = express.Router();
const db = require("../config/db");
router.get("/", (req, res) => {
  const getQuery = "select * from purchaseorderstatus";
  db.query(getQuery, (err, result) => {
    return res.send(result);
  });
});
router.post("/", (req, res) => {
  const { statusName } = req.body;
  if (!statusName) {
    return res.send("required all fields");
  }
  const formattedName = statusName
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim(); // Trim leading and trailing spaces
  if (!formattedName) {
    return res
      .status(400)
      .send("Product name cannot be empty after formatting.");
  }
  const index =
    "select IFNULL(max(statusId),0) as statusId from purchaseorderstatus";
  db.query(index, (err, result) => {
    if (err) {
      return res.send("err to generate index");
    }
    const { statusId } = result[0];
    const postQuery =
      "insert into purchaseorderstatus(statusId,statusName) values(?,?)";
    db.query(postQuery, [statusId + 1, statusName], (err, result) => {
      if (err) {
        return res.status(403).send(err);
      }
      return res.send("insert purchaseOrderStatus successfully");
    });
  });
});
router.put("/:statusId", (req, res) => {
  const { statusId } = req.params;
  const { statusName } = req.body;
  if (!statusName) {
    return res.send("required fields");
  }
  const updateQuery =
    "update purchaseorderstatus set statusName=? where statusId=?";
  db.query(updateQuery, [statusName, statusId], (err, result) => {
    if (err) {
      return res.send("err");
    }
    if (result.affectedRows === 0) {
      return res.send("data not found");
    }
    return res.send("update status successfully");
  });
});
router.delete("/:statusId", (req, res) => {
  const { statusId } = req.params;
  const deleteQuery = "delete from purchaseorderstatus where statusId=?";
  db.query(deleteQuery, [statusId], (err, result) => {
    if (err) {
      return res.send(err);
    }
    if (result.affectedRows === 0) {
      return res.send("data not found");
    }
    return res.send("delete data successfully");
  });
});
module.exports = router;

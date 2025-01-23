const express = require("express");
const db = require("../config/db");
const router = express.Router();
router.get("/", (req, res) => {
  const query = "select * from purchaseOrderDetail";
  db.query(query, (err, result) => {
    if (err) {
      return res.status(403).send("error to get purchaseOrderDetail");
    }
    return res.status(200).send(result);
  });
});
router.post("/", (req, res) => {
  const {} = req.body;
});
module.exports = router;

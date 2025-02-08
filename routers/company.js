const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
router.get("/", (req, res) => {
  const companyDetails = "select * from companyType";
  db.query(companyDetails, (err, result) => {});
});
module.exports = router;

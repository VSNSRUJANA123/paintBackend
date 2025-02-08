const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
router.get("/", (req, res) => {
  const companyDetails = "select * from company";
  db.query(companyDetails, (err, result) => {
    if (err) {
      return res.status(403).send({ message: "error to get company values" });
    }
    return res.status(200).send({ message: result });
  });
});
router.post("/", verifyToken, roleMiddileware("admin"), (req, res) => {
  const { name, addeddBy, modifiedBy } = req.body;
  console.log(name, addeddBy, modifiedBy);
  if (!name || !addeddBy || !modifiedBy) {
    return res.status(403).json({ message: "required field" });
  }
  const insertCompany = "insert into company values (?,?,?)";
  db.query(insertCompany, [name, addeddBy, modifiedBy], (err, result) => {
    if (err) {
      return res.status(403).send({ message: "error to insert values" });
    }
    return res.status(200).send({ message: "company add successfully" });
  });
});
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, modifiedBy } = req.body;
  const updateCompany = "update company set name=?,modifiedBy=?";
  db.query(updateCompany, [id, name, modifiedBy], (err, result) => {
    if (err) {
    }
  });
});
module.exports = router;

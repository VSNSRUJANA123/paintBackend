const express = require("express");
const router = express.Router();
const db = require("../config/db");
router.get("/", async (req, res) => {
  const query = "select * from studytitles";
  try {
    const [result] = await db.execute(query);
    return res.json(result);
  } catch (err) {
    return res.send({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { studytitlecode, studyitemname, isActive } = req.body;
  if (!studytitlecode || !studyitemname || !isActive) {
    return res.status(403).send({ message: "required all fields" });
  }
  try {
    const query =
      "insert into studytitles(studytitlecode ,studyitemname,isActive) values (?,?,?)";
    await db.execute(query, [studytitlecode, studyitemname, isActive]);
    return res.json({ message: "insert data successfully", data: req.body });
  } catch (err) {
    return res.send({ message: err.message });
  }
});

router.put("/:studytitlecode", async (req, res) => {
  const { studytitlecode } = req.params;
  const { studyitemname, isActive } = req.body;
  try {
    const query =
      "update studytitles set studyitemname=?,isActive=? where studytitlecode=?";
    const [result] = await db.execute(query, [
      studyitemname,
      isActive,
      studytitlecode,
    ]);
    if (result.affectedRows === 0) {
      return res.json({ message: "studytitlecode not found" });
    }
    return res.status(200).send({ message: "update successfully" });
  } catch (err) {
    return res.status(403).send({ message: err.message });
  }
});
// studytitlecode;
// studyitemname;
// isActive;
router.delete("/:studytitlecode", async (req, res) => {
  const { studytitlecode } = req.params;
  try {
    const query = "delete from studytitles where studytitlecode=?";
    const [result] = await db.execute(query, [studytitlecode]);
    if (result.affectedRows === 0) {
      return res.json({ message: "studytitlecode not found" });
    }
    return res.status(200).send({ message: "delete item code successfully" });
  } catch (err) {
    return res.status(403).send({ message: err.message });
  }
});
module.exports = router;

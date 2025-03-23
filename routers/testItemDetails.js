const express = require("express");
const router = express.Router();
const db = require("../config/db");
router.get("/", async (req, res) => {
  const query = "select * from testitemdeatils";
  try {
    const [result] = await db.execute(query);
    return res.json(result);
  } catch (err) {
    return res.send({ message: err.message });
  }
});
router.post("/", async (req, res) => {
  const { testitemcode, testitemname, isActive } = req.body;
  if (!testitemcode || !testitemname || !isActive) {
    return res.status(403).send({ message: "required all fields" });
  }
  try {
    const query =
      "insert into testitemdeatils(testitemcode,testitemname,isActive) values (?,?,?)";
    await db.execute(query, [testitemcode, testitemname, isActive]);
    return res.json({ message: "insert data successfully", data: req.body });
  } catch (err) {
    return res.send({ message: err.message });
  }
});

router.put("/:testitemcode", async (req, res) => {
  const { testitemcode } = req.params;
  const { testitemname, isActive } = req.body;
  //   console.log(testitemcode, testitemname, isActive);
  //   if (!testitemname || !isActive) {
  //     return res.status(403).send({ message: "required all fields" });
  //   }
  try {
    const query =
      "update testitemdeatils set testitemname=?,isActive=? where testitemcode=?";
    const [result] = await db.execute(query, [
      testitemname,
      isActive,
      testitemcode,
    ]);
    if (result.affectedRows === 0) {
      return res.json({ message: "testitemcode not found" });
    }
    return res.status(200).send({ message: "update successfully" });
  } catch (err) {
    return res.status(403).send({ message: err.message });
  }
});

router.delete("/:testitemcode", async (req, res) => {
  const { testitemcode } = req.params;
  try {
    const query = "delete from testitemdeatils where testitemcode=?";
    const [result] = await db.execute(query, [testitemcode]);
    if (result.affectedRows === 0) {
      return res.json({ message: "testitemcode not found" });
    }
    return res.status(200).send({ message: "delete item code successfully" });
  } catch (err) {
    return res.status(403).send({ message: err.message });
  }
});
module.exports = router;

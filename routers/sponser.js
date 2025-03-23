const express = require("express");
const router = express.Router();
const db = require("../config/db");
router.get("/", async (req, res) => {
  const query = "select * from sponsor";
  const [result] = await db.execute(query);
  return res.json(result);
});
router.post("/", async (req, res) => {
  const { sponsercode, sponsername, isActive } = req.body;
  if (!sponsercode || !sponsername || !isActive) {
    return res.json({ message: "required all fields" });
  }
  try {
    const query =
      "insert into sponsor( sponsercode, sponsername, isActive) values (?,?,?)";
    await db.execute(query, [sponsercode, sponsername, isActive]);
    return res.json({ message: "insert Successfully", data: req.body });
  } catch (err) {
    return res.json({ message: err.message });
  }
});
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  //   console.log(id);
  const { sponsername, isActive } = req.body;
  if (!sponsername || !isActive) {
    return res.json({ message: "required all fields" });
  }
  try {
    const query =
      "update sponsor set sponsername=?, isActive=? where sponsercode=?";
    const [result] = await db.execute(query, [sponsername, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Data not found" });
    }
    return res.json({ message: "update Successfully", data: req.body });
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(403).json({ message: "missed giving id" });
  }
  try {
    const query = "delete from sponsor where sponsercode=?";
    const [result] = await db.execute(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Data not found" });
    }
    return res.status(200).json({ message: "delete data successfully" });
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
});
module.exports = router;

const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
const router = express.Router();
router.get("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const [result] = await db.execute("select * from masterscheudling");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
router.get("/:id", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const studyNo = req.params.id;
    const query = `SELECT * FROM masterscheudling WHERE studyNo=?`;
    const [result] = await db.execute(query, [studyNo]);

    if (result.length === 0) {
      return res.status(404).json({ message: "masterscheudling not found" });
    }
    res.status(200).json(result[0]);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve masterscheudling", error: err });
  }
});
router.post("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const {
      studyNo,
      compliance,
      studyShortTitle,
      testItemNameCode,
      testItemCategory,
      studyDirectorName,
      principalInvestigatorName,
      sponser,
      remarks,
    } = req.body;
    const query = `
      INSERT INTO masterscheudling(
      studyNo,compliance,studyShortTitle,
      testItemNameCode,testItemCategory,studyDirectorName,
      principalInvestigatorName,studyInitiationDate,sponser,
      remarks
      ) VALUES (?,?,?,?,?,?,?,NOW(),?,?)
    `;
    if (!studyNo) {
      return res.status(403).json({ message: "required filed" });
    }
    const [result] = await db.execute(query, [
      studyNo,
      compliance,
      studyShortTitle,
      testItemNameCode,
      testItemCategory,
      studyDirectorName,
      principalInvestigatorName,
      sponser,
      remarks,
    ]);
    return res.status(201).json({
      message: "created successfully",
      masterscheudleId: { ...req.body },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.put("/:id", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const studyNo = req.params.id;
    const {
      compliance,
      studyShortTitle,
      testItemNameCode,
      testItemCategory,
      studyDirectorName,
      principalInvestigatorName,
      sponser,
      remarks,
    } = req.body;
    if (!studyNo) {
      return res.status(403).json({ message: "required filed" });
    }

    const query = `UPDATE masterscheudling SET compliance=?,
       studyShortTitle=?,testItemNameCode=?,testItemCategory=?,
       studyDirectorName=?,principalInvestigatorName=?,
       studyInitiationDate=NOW(),sponser=?,remarks=?
       WHERE studyNo=?
    `;
    const [result] = await db.execute(query, [
      compliance,
      studyShortTitle,
      testItemNameCode,
      testItemCategory,
      studyDirectorName,
      principalInvestigatorName,
      sponser,
      remarks,
      studyNo,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "studyNo not found" });
    }
    return res.status(201).json({
      message: "Update Successfully",
      masterscheudleData: { ...req.body },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.delete(
  "/:id",
  verifyToken,
  roleMiddileware("admin"),
  async (req, res) => {
    try {
      const studyNo = req.params.id;
      const [result] = await db.execute(
        "DELETE FROM masterscheudling WHERE studyNo=?",
        [studyNo]
      );
      if (result.affectedRows === 0) {
        return res.status(403).json({ message: "studyNo is not found" });
      }
      return res.status(201).json({ message: "delete successfully" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);
module.exports = router;

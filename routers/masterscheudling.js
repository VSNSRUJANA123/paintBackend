const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
const router = express.Router();
const validateFormData = require("../middleware/validationForm");

router.get("/", async (req, res) => {
  try {
    const [result] = await db.execute(
      "select * from masterscheudling order by isCreated desc"
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
router.get("/:id", async (req, res) => {
  const studyNo = req.params.id;
  try {
    const query = `SELECT * FROM masterscheudling WHERE studyNo=?`;
    const [result] = await db.execute(query, [studyNo]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "masterscheudling not found" });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", validateFormData, async (req, res) => {
  const {
    studyNo,
    studyphaseno,
    compliance,
    studyDirectorName,
    studyShortTitleId,
    testItemCategoryId,
    testItemNameCode,
    sponserIdCode,
    studyAllocateDate,
    testguidelines,
    testitemothercategory,
    remarks,
    mointoringScientist,
    principalInvestigatorName,
    userid,
    isActive,
  } = req.body;
  console.log(req.body);
  // let finalTestItemCategoryId = testItemCategoryId;
  try {
    const query = `
    INSERT INTO masterscheudling(
    studyNo,
    studyphaseno,
    compliance,
    studyDirectorName,
    studyShortTitleId,
    testItemCategoryId,
    testItemNameCode,
    sponserIdCode,
    studyAllocateDate,
    studyInitiationDate,
    testguidelines,
    testitemothercategory,
    remarks,
    mointoringScientist,
    principalInvestigatorName,
    userid, isCreated,    
    isActive) VALUES (?,?,?,?,?,?,?,?,?,now(),?,?,?,?,?,?,NOW(),?)
    `;
    const [resultTestItem] = await db.execute(
      "select * from testitemdeatils where testitemcode=?",
      [testItemCategoryId]
    );
    // if (testItemCategoryId === "other" && testitemothercategory) {
    //   // Check if this custom category already exists
    //   const [existing] = await db.execute(
    //     "SELECT * FROM testitemdeatils WHERE testitemname = ?",
    //     [testitemothercategory]
    //   );
    //   if (existing.length === 0) {
    //     // Insert the new custom category
    //     const [insertResult] = await db.execute(
    //       "INSERT INTO testitemdeatils (testitemname) VALUES (?)",
    //       [testitemothercategory]
    //     );
    //     finalTestItemCategoryId = insertResult.insertId; // newly generated id
    //   } else {
    //     finalTestItemCategoryId = existing[0].testitemcode;
    //   }
    // }
    // console.log("finalTestItemCategoryId", finalTestItemCategoryId);
    const [resultStudyTitles] = await db.execute(
      "select * from studytitles where studytitlecode=?",
      [studyShortTitleId]
    );
    if (resultStudyTitles.length === 0) {
      return res.status(403).send({ message: "studyTitleCode not found" });
    }
    const [resultsponsor] = await db.execute(
      "select * from sponsor where sponsercode=?",
      [sponserIdCode]
    );
    if (resultsponsor.length === 0) {
      return res.status(403).send({ message: "sponsorCode not found" });
    }
    // const newTestguidelines = JSON.stringify(testguidelines);
    await db.execute(query, [
      studyNo,
      studyphaseno,
      compliance,
      studyDirectorName,
      studyShortTitleId,
      testItemCategoryId,
      testItemNameCode,
      sponserIdCode,
      studyAllocateDate,
      testguidelines,
      testitemothercategory,
      remarks,
      mointoringScientist,
      principalInvestigatorName,
      userid,
      isActive,
    ]);
    return res.status(201).json({
      message: "created successfully",
      data: { ...req.body },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.put("/:id", async (req, res) => {
  const studyNo = req.params.id;
  const {
    studyphaseno,
    compliance,
    studyDirectorName,
    studyShortTitleId,
    testItemCategoryId,
    testItemNameCode,
    sponserIdCode,
    studyAllocateDate,
    testguidelines,
    testitemothercategory,
    remarks,
    mointoringScientist,
    principalInvestigatorName,
    userid,
    isActive,
  } = req.body;
  if (!studyNo || !studyShortTitleId || !testItemCategoryId || !sponserIdCode) {
    return res.status(400).json({ message: "Required field(s) missing" });
  }

  if (!studyNo) {
    return res.status(403).json({ message: "required filed" });
  }
  // const newTestguidelines = JSON.stringify(testguidelines);
  try {
    const query = `update masterscheudling set  studyphaseno=?,
    compliance=?,
    studyDirectorName=?,
    studyShortTitleId=?,
    testItemCategoryId=?,
    testItemNameCode=?,
    sponserIdCode=?,
    studyAllocateDate=?,    
    testguidelines=?,
    testitemothercategory=?,
    remarks=?,
    mointoringScientist=?,
    principalInvestigatorName=?,
    userid=?,isUpdated=now(),isActive=? where studyNo=?
    `;
    const [resultTestItem] = await db.execute(
      "select * from testitemdeatils where testitemcode=?",
      [testItemCategoryId]
    );
    if (resultTestItem.length === 0) {
      return res.status(403).send({ message: "testItemCode not found" });
    }
    const [resultStudyTitles] = await db.execute(
      "select * from studytitles where studytitlecode=?",
      [studyShortTitleId]
    );
    // console.log("studyItem", resultStudyTitles);
    if (resultStudyTitles.length === 0) {
      return res.status(403).send({ message: "studyTitleCode not found" });
    }
    const [resultsponsor] = await db.execute(
      "select * from sponsor where sponsercode=?",
      [sponserIdCode]
    );
    if (resultsponsor.length === 0) {
      return res.status(403).send({ message: "sponsorCode not found" });
    }
    const [result] = await db.execute(query, [
      studyphaseno ?? null,
      compliance ?? null,
      studyDirectorName ?? null,
      studyShortTitleId,
      testItemCategoryId,
      testItemNameCode ?? null,
      sponserIdCode,
      studyAllocateDate ?? null,
      testguidelines ?? null,
      testitemothercategory ?? null,
      remarks ?? null,
      mointoringScientist ?? null,
      principalInvestigatorName ?? null,
      userid ?? null,
      isActive ?? null,
      studyNo,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "studyNo not found" });
    }
    return res.status(201).json({
      message: "Update Successfully",
      data: {
        ...req.body,
        studyNo,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  const studyNo = req.params.id;
  try {
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
});
module.exports = router;

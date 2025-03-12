const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET ALL COMPANIES
router.get("/", async (req, res) => {
  try {
    const [result] = await db.execute("SELECT * FROM company");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving company values", error });
  }
});

// CREATE COMPANY
router.post("/", verifyToken, roleMiddleware("admin"), async (req, res) => {
  const { name, addedby, modifiedBy } = req.body;

  if (!name || !addedby || !modifiedBy) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    const insertCompany =
      "INSERT INTO company (name, addedby, modifiedBy) VALUES (?, ?, ?)";
    const [insertResult] = await db.execute(insertCompany, [
      name,
      addedby,
      modifiedBy,
    ]);

    const [company] = await db.execute("SELECT * FROM company WHERE id = ?", [
      insertResult.insertId,
    ]);

    res.status(201).json({ message: "Company added successfully", company });
  } catch (error) {
    res.status(500).json({ message: "Error inserting values", error });
  }
});

// UPDATE COMPANY
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, modifiedBy } = req.body;

  try {
    const [company] = await db.execute("SELECT * FROM company WHERE id = ?", [
      id,
    ]);

    if (company.length === 0) {
      return res.status(404).json({ message: "Company ID not found" });
    }

    const updateCompany =
      "UPDATE company SET name = ?, modifiedBy = ? WHERE id = ?";
    await db.execute(updateCompany, [name, modifiedBy, id]);

    const [updatedCompany] = await db.execute(
      "SELECT * FROM company WHERE id = ?",
      [id]
    );

    res
      .status(200)
      .json({ message: "Company updated successfully", updatedCompany });
  } catch (error) {
    res.status(500).json({ message: "Error updating data", error });
  }
});

// DELETE COMPANY
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [company] = await db.execute("SELECT * FROM company WHERE id = ?", [
      id,
    ]);

    if (company.length === 0) {
      return res.status(404).json({ message: "Company ID not found" });
    }

    await db.execute("DELETE FROM company WHERE id = ?", [id]);

    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting data", error });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const verifyToken = require("../middleware/authMiddleware");
// const roleMiddileware = require("../middleware/roleMiddleware");
// router.get("/", (req, res) => {
//   const companyDetails = "select * from company";
//   db.query(companyDetails, (err, result) => {
//     if (err) {
//       return res.status(403).send({ message: "error to get company values" });
//     }
//     return res.status(200).send(result);
//   });
// });
// router.post("/", verifyToken, roleMiddileware("admin"), (req, res) => {
//   const { name, addedby, modifiedBy } = req.body;
//   console.log(name, addedby, modifiedBy);
//   if (!name || !addedby || !modifiedBy) {
//     return res.status(403).json({ message: "required field" });
//   }
//   const insertCompany =
//     "insert into company (name,addedby,modifiedBy) values (?,?,?)";
//   db.query(insertCompany, [name, addedby, modifiedBy], (err, result) => {
//     if (err) {
//       return res.status(403).send({ message: "error to insert values", err });
//     }
//     const getId = `select * from company where id=${result.insertId}`;
//     db.query(getId, (err, result) => {
//       if (err) {
//         return res.status(403).send({ message: "error to create id" });
//       }
//       return res
//         .status(200)
//         .send({ message: "company add successfully", result });
//     });
//     // return res.status(200).send({
//     //   message: "company add successfully",
//     //   companyTypeId: result.insertId,
//     //   companyTypeBody: req.body,
//     // });
//   });
// });
// router.put("/:id", (req, res) => {
//   const { id } = req.params;
//   const { name, modifiedBy } = req.body;
//   const index = "select * from company where id=?";
//   db.query(index, [id], (err, result) => {
//     if (err) {
//       return res.status(403).send({ message: "error to get id" });
//     }
//     if (result.length === 0) {
//       return res.status(200).send({ message: "company id not found" });
//     }
//     const updateCompany = "update company set name=?,modifiedBy=? where id=?";
//     db.query(updateCompany, [name, modifiedBy, id], (err, result) => {
//       if (err) {
//         return res.status(403).send({ message: "error to update data", err });
//       }
//       const getId = `select * from company where id=${id}`;
//       db.query(getId, (err, result) => {
//         if (err) {
//           return res.status(403).send({ message: "error to create id" });
//         }
//         return res.status(200).send({ message: "update successfully", result });
//       });
//       // return res.status(200).send({ message: "update successfully" });
//     });
//   });
// });
// router.delete("/:id", (req, res) => {
//   const { id } = req.params;
//   const index = "select * from company where id=?";
//   db.query(index, [id], (err, result) => {
//     if (err) {
//       return res.status(403).send({ message: "error to get id" });
//     }
//     if (result.length === 0) {
//       return res.status(200).send({ message: "companyType id not found" });
//     }
//     const deleteCompany = "delete from company where id=?";
//     db.query(deleteCompany, [id], (err, result) => {
//       if (err) {
//         return res.status(403).send({ message: "error to delete data", err });
//       }
//       return res.status(200).send({ message: "delete data successfully" });
//     });
//   });
// });
// module.exports = router;

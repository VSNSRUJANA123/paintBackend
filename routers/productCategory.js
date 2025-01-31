const express = require("express");
const db = require("../config/db");
const router = express.Router();
const upload = require("./imageUpload");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
router.get("/", verifyToken, roleMiddileware("admin"), (req, res) => {
  const query = "select * from productCategory";
  db.query(query, (err, result) => {
    return res.send(result);
  });
});
router.post(
  "/",
  verifyToken,
  roleMiddileware("admin"),
  upload.single("CategoryImage"),
  async (req, res) => {
    const { CategoryName, CategoryDesc, CategoryCode, IsActive } = req.body;
    if (!CategoryName || !CategoryDesc || !CategoryCode || !IsActive) {
      return res.send("require all fields");
    }
    if (!req.file) {
      return res.status(400).send({ message: "Please upload an image" });
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
    const result = await db.execute(
      `SELECT IFNULL(MAX(CategoryId),0) AS max_id FROM productCategory`
    );
    db.query(result, (err, result) => {
      if (err) {
        return req.send("error to get id");
      }
      const index = result[0];
      if (!result[0]) {
        return res.send("invalid index");
      }
      const { max_id } = index;
      const insertQuery = `insert into productCategory(CategoryId,
        CategoryName,
        CategoryDesc,
        CategoryCode,
        IsActive,
        CategoryImage) values(?,?,?,?,?,?)`;
      db.query(
        insertQuery,
        [
          max_id + 1,
          CategoryName,
          CategoryDesc,
          CategoryCode,
          IsActive,
          imageUrl,
        ],
        (err, result) => {
          if (err) {
            return res.status(403).send("something error");
          }
          return res.send("Inserted added successfully");
        }
      );
    });
  }
);
router.put(
  "/:CategoryId",
  verifyToken,
  roleMiddileware("admin"),
  upload.single("CategoryImage"),
  (req, res) => {
    const { CategoryId } = req.params;
    const { CategoryName, CategoryDesc, CategoryCode, IsActive } = req.body;
    if (!req.file) {
      return res.status(400).send({ message: "Please upload an image" });
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
    if (!CategoryName || !CategoryDesc || !CategoryCode || !IsActive) {
      return res.send(403).status("required all fields");
    }
    const updateQuery = `update productCategory set CategoryName=?,
        CategoryDesc=?,
        CategoryCode=?,
        IsActive=?,
        CategoryImage=? where CategoryId=?`;
    db.query(
      updateQuery,
      [
        CategoryName,
        CategoryDesc,
        CategoryCode,
        IsActive,
        imageUrl,
        CategoryId,
      ],
      (err, result) => {
        if (err) {
          return res.send("error to update values");
        }
        if (result.affectedRows === 0) {
          return res.send("failed to update");
        }
        return res.send("update data successfully");
      }
    );
  }
);
router.delete(
  "/:CategoryId",
  verifyToken,
  roleMiddileware("admin"),
  (req, res) => {
    const { CategoryId } = req.params;
    if (!CategoryId) {
      return res.send("invalid id");
    }
    const checkId = "select * from productCategory where CategoryId =?";
    db.query(checkId, CategoryId, (err, result) => {
      if (err) {
        return res.send("error to delete");
      }
      if (result.length === 0) {
        return res.send("data not found");
      }
      const deleteQuery = "delete from productCategory where CategoryId=?";
      db.query(deleteQuery, CategoryId, (err, result) => {
        if (err) {
          return res.send("error to delete");
        }
        return res.send("delete productCategory Successfully");
      });
    });
  }
);
module.exports = router;

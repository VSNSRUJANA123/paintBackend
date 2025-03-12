const express = require("express");
const db = require("../config/db");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ✅ GET all product categories
router.get("/", verifyToken, roleMiddleware("admin"), async (req, res) => {
  try {
    const [result] = await db.execute("SELECT * FROM productCategory");
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Error fetching categories", error: err });
  }
});

// ✅ POST (Insert a new category)
router.post("/", verifyToken, roleMiddleware("admin"), async (req, res) => {
  const { CategoryName, CategoryDesc, CategoryCode, IsActive, CategoryImage } =
    req.body;

  if (!CategoryName || !CategoryCode) {
    return res.status(400).send({ message: "All fields are required" });
  }

  try {
    // Get the max ID and increment it
    const [[{ max_id }]] = await db.execute(
      "SELECT IFNULL(MAX(CategoryId), 0) AS max_id FROM productCategory"
    );

    // Insert the new category
    const insertQuery = `INSERT INTO productCategory (CategoryId, CategoryName, CategoryDesc, CategoryCode, IsActive, CategoryImage)
                         VALUES (?, ?, ?, ?, ?, ?)`;

    await db.execute(insertQuery, [
      max_id + 1,
      CategoryName,
      CategoryDesc,
      CategoryCode,
      IsActive,
      CategoryImage,
    ]);

    res.send({
      message: "Category added successfully",
      productCategoryId: max_id + 1,
      productCategoryData: req.body,
    });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to add product category", error: err });
  }
});

// ✅ PUT (Update a category)
router.put(
  "/:CategoryId",
  verifyToken,
  roleMiddleware("admin"),
  async (req, res) => {
    const { CategoryId } = req.params;
    const {
      CategoryName,
      CategoryDesc,
      CategoryCode,
      IsActive,
      CategoryImage,
    } = req.body;

    if (!CategoryName || !CategoryCode) {
      return res.status(400).send({ message: "All fields are required" });
    }

    try {
      const updateQuery = `UPDATE productCategory 
                         SET CategoryName=?, CategoryDesc=?, CategoryCode=?, IsActive=?, CategoryImage=? 
                         WHERE CategoryId=?`;

      const [result] = await db.execute(updateQuery, [
        CategoryName,
        CategoryDesc,
        CategoryCode,
        IsActive,
        CategoryImage,
        CategoryId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Product category not found" });
      }

      res.send({
        message: "Category updated successfully",
        productCategoryId: CategoryId,
        productCategoryData: req.body,
      });
    } catch (err) {
      res.status(500).send({ message: "Error updating category", error: err });
    }
  }
);

// ✅ DELETE (Remove a category)
router.delete(
  "/:CategoryId",
  verifyToken,
  roleMiddleware("admin"),
  async (req, res) => {
    const { CategoryId } = req.params;

    if (!CategoryId) {
      return res.status(400).send({ message: "Invalid category ID" });
    }

    try {
      const [checkResult] = await db.execute(
        "SELECT * FROM productCategory WHERE CategoryId = ?",
        [CategoryId]
      );

      if (checkResult.length === 0) {
        return res.status(404).send({ message: "Product category not found" });
      }

      await db.execute("DELETE FROM productCategory WHERE CategoryId = ?", [
        CategoryId,
      ]);

      res.send({ message: "Category deleted successfully" });
    } catch (err) {
      res.status(500).send({ message: "Error deleting category", error: err });
    }
  }
);

module.exports = router;

// router.get("/", verifyToken, roleMiddileware("admin"), (req, res) => {
//   const query = "select * from productCategory";
//   db.query(query, (err, result) => {
//     return res.send(result);
//   });
// });
// router.post("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
//   const { CategoryName, CategoryDesc, CategoryCode, IsActive, CategoryImage } =
//     req.body;
//   if (!CategoryName || !CategoryCode) {
//     return res.send({ message: "require all fields" });
//   }
//   const result = await db.execute(
//     `SELECT IFNULL(MAX(CategoryId),0) AS max_id FROM productCategory`
//   );
//   db.query(result, (err, result) => {
//     if (err) {
//       return req.send({ message: "error to get id" });
//     }
//     const index = result[0];
//     if (!result[0]) {
//       return res.send({ message: "invalid index" });
//     }
//     const { max_id } = index;
//     const insertQuery = `insert into productCategory(CategoryId,
//         CategoryName,
//         CategoryDesc,
//         CategoryCode,
//         IsActive,
//         CategoryImage) values(?,?,?,?,?,?)`;
//     db.query(
//       insertQuery,
//       [
//         max_id + 1,
//         CategoryName,
//         CategoryDesc,
//         CategoryCode,
//         IsActive,
//         CategoryImage,
//       ],
//       (err, result) => {
//         if (err) {
//           return res.status(403).send({
//             message: "failed to add productCategory and enter unique code",
//             err,
//           });
//         }
//         return res.send({
//           message: "Inserted added successfully",
//           productCategoryId: max_id + 1,
//           productCategoryData: req.body,
//         });
//       }
//     );
//   });
// });
// router.put(
//   "/:CategoryId",
//   verifyToken,
//   roleMiddileware("admin"),
//   (req, res) => {
//     const { CategoryId } = req.params;
//     const {
//       CategoryName,
//       CategoryDesc,
//       CategoryCode,
//       IsActive,
//       CategoryImage,
//     } = req.body;
//     if (!CategoryName || !CategoryCode) {
//       return res.status(403).send({ message: "required all fields" });
//     }
//     const updateQuery = `update productCategory set CategoryName=?,
//         CategoryDesc=?,
//         CategoryCode=?,
//         IsActive=?,
//         CategoryImage=? where CategoryId=?`;
//     db.query(
//       updateQuery,
//       [
//         CategoryName,
//         CategoryDesc,
//         CategoryCode,
//         IsActive,
//         CategoryImage,
//         CategoryId,
//       ],
//       (err, result) => {
//         if (err) {
//           return res.send({ message: "error to update values", err });
//         }
//         if (result.affectedRows === 0) {
//           return res.send({ message: "productCategory not found" });
//         }
//         return res.send({
//           message: "update data successfully",
//           productCategoryId: CategoryId,
//           productCategoryData: req.body,
//         });
//       }
//     );
//   }
// );
// router.delete(
//   "/:CategoryId",
//   verifyToken,
//   roleMiddileware("admin"),
//   (req, res) => {
//     const { CategoryId } = req.params;
//     if (!CategoryId) {
//       return res.send({ message: "invalid id" });
//     }
//     const checkId = "select * from productCategory where CategoryId =?";
//     db.query(checkId, CategoryId, (err, result) => {
//       if (err) {
//         return res.send({ message: "error to delete" });
//       }
//       if (result.length === 0) {
//         return res.send({ message: "productCategory not found" });
//       }
//       const deleteQuery = "delete from productCategory where CategoryId=?";
//       db.query(deleteQuery, CategoryId, (err, result) => {
//         if (err) {
//           return res.send({ message: "error to delete" });
//         }
//         return res.send({ message: "delete productCategory Successfully" });
//       });
//     });
//   }
// );

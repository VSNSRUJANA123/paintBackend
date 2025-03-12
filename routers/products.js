const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const uploads = require("../routers/imageUpload");
router.get("/", verifyToken, async (req, res) => {
  try {
    const query = `SELECT * FROM Products`;
    const [result] = await db.execute(query);
    res.status(200).json(result);
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to retrieve products", error: err });
  }
});

// ✅ GET a product by ID
router.get("/:id", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const productId = req.params.id;
    const query = `SELECT * FROM Products WHERE ProductID=?`;
    const [result] = await db.execute(query, [productId]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(result[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve product", error: err });
  }
});

// ✅ ADD a new product
router.post("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const {
      ProductCode,
      ProductName,
      ProductDescription = "",
      StandardUnitCost,
      UnitPrice,
      ReorderLevel,
      TargetLevel,
      QuantityPerUnit,
      Discontinued,
      MinimumReorderQuantity,
      ProductCategoryID,
      addedBy,
      ModifiedBy,
      supplier_id,
    } = req.body;

    if (
      !ProductCode ||
      !ProductName ||
      StandardUnitCost == null ||
      UnitPrice == null ||
      ReorderLevel == null ||
      TargetLevel == null ||
      !QuantityPerUnit ||
      Discontinued == null ||
      MinimumReorderQuantity == null ||
      ProductCategoryID == null ||
      !addedBy ||
      !ModifiedBy ||
      !supplier_id
    ) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // ✅ Check if supplier exists
    const [supplier] = await db.execute("SELECT * FROM suppliers WHERE id=?", [
      supplier_id,
    ]);
    if (supplier.length === 0) {
      return res.status(404).send({ message: "Supplier not found" });
    }

    // ✅ Insert product
    const insertQuery = `
      INSERT INTO Products (
        ProductCode, ProductName, ProductDescription, StandardUnitCost,
        UnitPrice, ReorderLevel, TargetLevel, QuantityPerUnit,
        Discontinued, MinimumReorderQuantity, ProductCategoryID,
        addedBy, ModifiedBy, AddedOn, supplier_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    const [result] = await db.execute(insertQuery, [
      ProductCode,
      ProductName,
      ProductDescription,
      StandardUnitCost,
      UnitPrice,
      ReorderLevel,
      TargetLevel,
      QuantityPerUnit,
      Discontinued,
      MinimumReorderQuantity,
      ProductCategoryID,
      addedBy,
      ModifiedBy,
      supplier_id,
    ]);

    res.status(201).json({
      message: "Product added successfully",
      productId: result.insertId,
      productData: { ...req.body, AddedOn: new Date().toISOString() },
    });
  } catch (err) {
    res.status(500).send({ message: "Error adding product", error: err });
  }
});

// ✅ UPDATE a product
router.put("/:id", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      ProductCode,
      ProductName,
      ProductDescription = "",
      StandardUnitCost,
      UnitPrice,
      ReorderLevel,
      TargetLevel,
      QuantityPerUnit,
      Discontinued,
      MinimumReorderQuantity,
      ProductCategoryID,
      ModifiedBy,
      supplier_id,
    } = req.body;

    // ✅ Check if supplier exists
    const [supplier] = await db.execute("SELECT * FROM suppliers WHERE id=?", [
      supplier_id,
    ]);
    if (supplier.length === 0) {
      return res.status(404).send({ message: "Supplier not found" });
    }

    // ✅ Update product
    const updateQuery = `
      UPDATE Products SET ProductCode=?, ProductName=?, ProductDescription=?, 
        StandardUnitCost=?, UnitPrice=?, ReorderLevel=?, TargetLevel=?, 
        QuantityPerUnit=?, Discontinued=?, MinimumReorderQuantity=?, 
        ProductCategoryID=?, ModifiedBy=?, supplier_id=?, ModifiedOn=NOW() 
      WHERE ProductID=?
    `;

    const [result] = await db.execute(updateQuery, [
      ProductCode,
      ProductName,
      ProductDescription,
      StandardUnitCost,
      UnitPrice,
      ReorderLevel,
      TargetLevel,
      QuantityPerUnit,
      Discontinued,
      MinimumReorderQuantity,
      ProductCategoryID,
      ModifiedBy,
      supplier_id,
      productId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      productId,
      productData: { ...req.body, ModifiedOn: new Date().toISOString() },
    });
  } catch (err) {
    res.status(500).send({ message: "Error updating product", error: err });
  }
});

// ✅ DELETE a product
router.delete(
  "/:id",
  verifyToken,
  roleMiddileware("admin"),
  async (req, res) => {
    try {
      const productId = req.params.id;

      const deleteQuery = `DELETE FROM Products WHERE ProductID=?`;
      const [result] = await db.execute(deleteQuery, [productId]);

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Product not found" });
      }

      res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
      res.status(500).send({ message: "Error deleting product", error: err });
    }
  }
);

// router.get("/", verifyToken, (req, res) => {
//   const query = `select * from Products`;
//   db.query(query, (err, result) => {
//     if (err) {
//       return res.status(500).send({ message: "Failed to retrieve employees" });
//     }
//     res.status(200).json(result);
//   });
// });
// router.get("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
//   const productsId = req.params.id;
//   const query = `select * from Products where ProductID=?`;
//   db.query(query, [productsId], (err, result) => {
//     if (err) {
//       console.error("Error fetching data:", err);
//       return res.status(500).json({ error: "Failed to retrieve products" });
//     }
//     if (result.length === 0) {
//       return res.status(404).json({ message: "products not found" });
//     }
//     res.status(200).json(result[0]);
//   });
// });

// router.post("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
//   const {
//     ProductCode,
//     ProductName,
//     ProductDescription = "",
//     StandardUnitCost,
//     UnitPrice,
//     ReorderLevel,
//     TargetLevel,
//     QuantityPerUnit,
//     Discontinued,
//     MinimumReorderQuantity,
//     ProductCategoryID,
//     addedBy,
//     ModifiedBy,
//     supplier_id,
//   } = req.body;
//   if (
//     !ProductCode ||
//     !ProductName ||
//     StandardUnitCost == null ||
//     UnitPrice == null ||
//     ReorderLevel == null ||
//     TargetLevel == null ||
//     !QuantityPerUnit ||
//     Discontinued == null ||
//     MinimumReorderQuantity == null ||
//     ProductCategoryID == null ||
//     !addedBy ||
//     !ModifiedBy ||
//     !supplier_id
//   ) {
//     // console.log(
//     //   ProductCode,
//     //   ProductName,
//     //   StandardUnitCost,
//     //   UnitPrice,
//     //   ReorderLevel,
//     //   TargetLevel,
//     //   QuantityPerUnit,
//     //   Discontinued,
//     //   MinimumReorderQuantity,
//     //   ProductCategoryID,
//     //   ModifiedBy,
//     //   supplier_id
//     // );
//     return res.status(403).send({ message: "required all fields" });
//   }
//   const checkSupplierId = "select * from suppliers where id=?";
//   db.query(checkSupplierId, [supplier_id], (err, result) => {
//     if (err) {
//       return res.status(403).send({ message: "error to get supplierId" });
//     }
//     if (result.length === 0) {
//       return res.status(403).send({ message: "supplierId not found" });
//     }
//     const productQuery = `insert into Products (ProductCode,
//     ProductName,
//     ProductDescription,
//     StandardUnitCost,
//     UnitPrice,
//     ReorderLevel,
//     TargetLevel,
//     QuantityPerUnit,
//     Discontinued,
//     MinimumReorderQuantity,
//     ProductCategoryID,
//     addedBy,
//     ModifiedBy,AddedOn,supplier_id) values (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`;
//     db.query(
//       productQuery,
//       [
//         ProductCode,
//         ProductName,
//         ProductDescription,
//         StandardUnitCost,
//         UnitPrice,
//         ReorderLevel,
//         TargetLevel,
//         QuantityPerUnit,
//         Discontinued,
//         MinimumReorderQuantity,
//         ProductCategoryID,
//         addedBy,
//         ModifiedBy,
//         supplier_id,
//       ],
//       (err, results) => {
//         if (err) {
//           return res.status(403).send({
//             message: "something wrong check it again or enter unique id",
//             err,
//           });
//         }
//         if (results.affectedRows === 0) {
//           return res.status(403).send({ message: "must add unique id" });
//         }
//         res.status(200).json({
//           message: "Products added successfully",
//           productId: results.insertId,
//           productData: {
//             ...req.body,
//             AddedOn: new Date().toISOString(),
//           },
//         });
//       }
//     );
//   });
// });

// router.put("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
//   const productIndex = req.params.id;
//   const {
//     ProductCode,
//     ProductName,
//     ProductDescription = "",
//     StandardUnitCost,
//     UnitPrice,
//     ReorderLevel,
//     TargetLevel,
//     QuantityPerUnit,
//     Discontinued,
//     MinimumReorderQuantity,
//     ProductCategoryID,
//     ModifiedBy,
//     supplier_id,
//   } = req.body;
//   const checkSupplierId = "select * from suppliers where id=?";
//   db.query(checkSupplierId, [supplier_id], (err, result) => {
//     if (err) {
//       return res.status(403).send({ message: "error to get supplierId" });
//     }
//     if (result.length === 0) {
//       return res.status(403).send({ message: "supplierId not found" });
//     }
//     const productUpdate = `update Products set ProductCode=?,
//     ProductName=?,
//     ProductDescription = ?,
//     StandardUnitCost=?,
//     UnitPrice=?,
//     ReorderLevel=?,
//     TargetLevel=?,
//     QuantityPerUnit=?,
//     Discontinued=?,
//     MinimumReorderQuantity=?,
//     ProductCategoryID=?,
//     ModifiedBy=?,supplier_id=?,ModifiedOn=now() where ProductID=?`;
//     db.query(
//       productUpdate,
//       [
//         ProductCode,
//         ProductName,
//         ProductDescription,
//         StandardUnitCost,
//         UnitPrice,
//         ReorderLevel,
//         TargetLevel,
//         QuantityPerUnit,
//         Discontinued,
//         MinimumReorderQuantity,
//         ProductCategoryID,
//         ModifiedBy,
//         supplier_id,
//         productIndex,
//       ],
//       (err, result) => {
//         if (err) {
//           return res
//             .status(500)
//             .send({ message: "failed to update product", err });
//         }
//         if (result.affectedRows === 0) {
//           return res.status(404).send({ message: "product doesn't exist" });
//         }
//         res.status(200).json({
//           message: "Products updated successfully",
//           productId: productIndex,
//           productData: {
//             ...req.body,
//             ModifiedBy: new Date(),
//           },
//         });
//       }
//     );
//   });
// });
// router.delete("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
//   const deleteIndex = req.params.id;
//   const deleteQueryId = `delete from Products where ProductID=?`;
//   db.query(deleteQueryId, [deleteIndex], (err, result) => {
//     if (err) {
//       return res.status(500).send({ message: "failed to delete id", err });
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).send({ message: "product not found" });
//     }
//     res.status(200).json({ message: "deleted successfully" });
//   });
// });
module.exports = router;

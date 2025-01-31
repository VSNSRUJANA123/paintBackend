const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
const router = express.Router();
router.get("/", verifyToken, roleMiddileware("admin"), (req, res) => {
  const query = `select * from Products`;
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).send("Failed to retrieve employees");
    }
    res.status(200).json(result);
  });
});
router.get("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
  const productsId = req.params.id;
  const query = `select * from Products where id=?`;
  db.query(query, [productsId], (err, result) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Failed to retrieve products" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "products not found" });
    }
    res.status(200).json(result[0]);
  });
});

router.post("/", verifyToken, roleMiddileware("admin"), (req, res) => {
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
    !ModifiedBy ||
    !supplier_id
  ) {
    console.log(
      ProductCode,
      ProductName,
      StandardUnitCost,
      UnitPrice,
      ReorderLevel,
      TargetLevel,
      QuantityPerUnit,
      Discontinued,
      MinimumReorderQuantity,
      ProductCategoryID,
      ModifiedBy,
      supplier_id
    );
    return res.status(403).send("required all fields");
  }
  const supplierQuery = "select * from suppliers where id=?";
  db.query(supplierQuery, [supplier_id], (err, result) => {
    if (err) {
      return res.status(403).send("something error to get supplierId");
    }
    if (result.length === 0) {
      return res.send("supplier not found");
    }
    const productQuery = `insert into Products (ProductCode,
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
    ModifiedBy,AddedOn,supplier_id) values (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`;
    db.query(
      productQuery,
      [
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
      ],
      (err, result) => {
        if (err) {
          return res
            .status(403)
            .send("something wrong check it again or enter unique id");
        }
        if (result.affectedRows === 0) {
          return res.status(403).send("must add unique id");
        }
        res.status(201).json({ message: "Products added successfully" });
      }
    );
  });
});

router.put("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
  const productIndex = req.params.id;
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
    !ModifiedBy
  ) {
    console.log(
      ProductCode,
      ProductName,
      StandardUnitCost,
      UnitPrice,
      ReorderLevel,
      TargetLevel,
      QuantityPerUnit,
      Discontinued,
      MinimumReorderQuantity,
      ProductCategoryID,
      ModifiedBy
    );
    return res.status(403).send("required all fields");
  }
  const productUpdate = `update Products set ProductCode=?,
    ProductName=?,
    ProductDescription = ?,
    StandardUnitCost=?,
    UnitPrice=?,
    ReorderLevel=?,
    TargetLevel=?,
    QuantityPerUnit=?,
    Discontinued=?,
    MinimumReorderQuantity=?,
    ProductCategoryID=?,        
    ModifiedBy=?,ModifiedOn=now() where ProductID=?`;
  db.query(
    productUpdate,
    [
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
      productIndex,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).send({ message: "failed to update product" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "product doesn't exist" });
      }
      res.status(200).json({ message: "successfully updated product" });
    }
  );
});
router.delete("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
  const deleteIndex = req.params.id;
  const deleteQueryId = `delete from Products where ProductID=?`;
  db.query(deleteQueryId, [deleteIndex], (err, result) => {
    if (err) {
      return res.status(500).send({ message: "failed to fetch id" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "product not found" });
    }
    res.status(200).json({ message: "deleted successfully" });
  });
});
module.exports = router;

const express = require("express");
const db = require("../config/db");
const router = express.Router();
const upload = require("./imageUpload");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
// supplierProductTable;
router.get("/", verifyToken, roleMiddileware("admin"), (req, res) => {
  const getData = "select * from supplierProductTable";
  db.query(getData, (err, result) => {
    if (err) {
      return res.status(403).send({ message: "query error" });
    }
    return res.status(200).send(result);
  });
});
router.post("/", verifyToken, roleMiddileware("admin"), (req, res) => {
  const { productsId, supplierId } = req.body;
  if (!productsId || !supplierId) {
    return res.status(403).send({ message: "required all fields" });
  }
  const checkProductsId = "select * from Products where ProductID=?";
  db.query(checkProductsId, [productsId], (err, result) => {
    if (err) {
      return res.status(403).send({ message: "error to get productId" });
    }
    // console.log("productError", checkProductsId);
    if (result.length === 0) {
      return res.status(403).send({ message: "productId not found" });
    }
    const checkSupplierId = "select * from suppliers where id=?";
    db.query(checkSupplierId, [supplierId], (err, result) => {
      if (err) {
        return res.status(403).send({ message: "error to get supplierId" });
      }
      if (result.length === 0) {
        return res.status(403).send({ message: "supplierId not found" });
      }
      const inserts =
        "insert into supplierProductTable (productsId, supplierId) values(?,?)";
      db.query(inserts, [productsId, supplierId], (err, result) => {
        if (err) {
          return res.status(403).send({ message: "query error", err });
        }
        return res.status(200).json({
          message: "inserted successfully",
          supplierProductData: { id: result.insertId, ...req.body },
        });
      });
    });
  });
});

router.put("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
  const { id } = req.params;
  const { productsId, supplierId } = req.body;
  if (!productsId || !supplierId) {
    return res.status(403).send({ message: "required all fields" });
  }
  const findProductSupplierId = "select * from supplierProductTable where id=?";
  db.query(findProductSupplierId, [id], (err, result) => {
    if (err) {
      return res.status(403).send({ message: "error to find id" });
    }
    if (result.length === 0) {
      return res.status(403).send({ message: "supplierProduct id not found" });
    }
    const checkProductsId = "select * from Products where ProductID=?";
    db.query(checkProductsId, [productsId], (err, result) => {
      if (err) {
        return res.status(403).send({ message: "error to get productId" });
      }
      if (result.length === 0) {
        return res.status(403).send({ message: "productId not found" });
      }
      const checkSupplierId = "select * from suppliers where id=?";
      db.query(checkSupplierId, [supplierId], (err, result) => {
        if (err) {
          return res.status(403).send({ message: "error to get supplierId" });
        }
        if (result.length === 0) {
          return res.status(403).send({ message: "supplierId not found" });
        }
        const inserts =
          "update supplierProductTable  set productsId=?, supplierId=? where id=?";
        db.query(inserts, [productsId, supplierId, id], (err, result) => {
          if (err) {
            return res.status(403).send({ message: "query error", err });
          }
          return res.status(200).json({
            message: "updated successfully",
            supplierProductData: { id: result.insertId, ...req.body },
          });
        });
      });
    });
  });
});
router.delete("/:id", verifyToken, roleMiddileware("admin"), (req, res) => {
  const { id } = req.params;
  const deleteSupplierId = "delete from supplierProductTable where id=?";
  db.query(deleteSupplierId, [id], (err, result) => {
    if (err) {
      return res.status(403).send({ message: "error to find id" });
    }
    if (result.affectedRows === 0) {
      return res.status(403).send({ message: "supplierProduct id not found" });
    }
    return res.status(200).json({ message: "delete id successfully" });
  });
});
module.exports = router;

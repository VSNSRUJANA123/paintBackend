const express = require("express");
const router = express.Router();
const db = require("../config/db");
// router.get("/", async (req, res) => {
//   try {
//     const rows = `
//             SELECT p.*, pr.ProductName FROM Purchase p
//             JOIN Product pr ON p.ProductID = pr.ProductID
//         `;
//     res.status(200).json({ rows });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
router.get("/", (req, res) => {
  try {
    const rows = "select * from purchase";
  } catch (err) {
    db.query(rows, (err, result) => {
      if (err) {
        return res.status(403).send("to get error");
      }
      return res.status(200).send(result);
    });
    console.log(err);
    return res.status(403).send("server error");
  }
});

router.post("/add-purchase", (req, res) => {
  const { vendorId, submittedById, notes, products } = req.body;
  if (!vendorId || !submittedById || !products || products.length === 0) {
    return res.status(403).send("filled the details");
  }
  const purchaseQuery =
    "select IFNULL(max(purchaseOrderId),0) as purchaseId from purchase";
  db.query(purchaseQuery, (err, result) => {
    if (err) {
      return res.status(403).send("error to create id");
    }
    const { purchaseId } = result[0];
    const insert =
      "insert into purchase(purchaseOrderId,vendorId, submittedById, notes,submittedDate) values (?,?,?,?,now())";
    db.query(
      insert,
      [purchaseId + 1, vendorId, submittedById, notes],
      (err, result) => {
        if (err) {
          return res.status(403).send(err);
        }
        if (result.affectedRows === 0) {
          return res.send("failed to insert");
        }
        const purchaseOrderDetailQuery =
          "select IFNULL(max(purchaseOrderDetailId),0) as purchaseOrderDetailId from purchaseOrderDetail";
        // const purchaseId = result.insertId;

        db.query(purchaseOrderDetailQuery, (err, result) => {
          if (err) {
            return res.status(403).send("error to create");
          }
          const { purchaseOrderDetailId } = result[0];
          for (const product of products) {
            const { ProductID, QuantityPerUnit, UnitPrice } = product;
            const unitCost = QuantityPerUnit * UnitPrice;
            db.query(
              `INSERT INTO purchaseOrderDetail (purchaseOrderDetailId,purchaseOrderId, productId, quantity, unitCost)
                 VALUES (?, ?,?, ?, ?)`,
              [
                purchaseOrderDetailId + 1,
                purchaseId,
                ProductID,
                QuantityPerUnit,
                UnitPrice,
                unitCost,
              ],
              (err, result) => {
                if (err) {
                  return res.send(err);
                }
                return res.send({ message: "PO submitted successfully" });
              }
            );
          }
        });
      }
    );
  });
});
// router.post = async (req, res) => {
//   const { vendor_id, notes, submitted_by, products } = req.body;
//   const connection = await db.getConnection();
//   try {
//     await connection.beginTransaction();
//     const [result] = await connection.query(
//       `INSERT INTO PurchaseOrders (vendor_id, notes, submitted_by) VALUES (?, ?, ?)`,
//       [vendor_id, notes, submitted_by]
//     );
//     const poId = result.insertId;
//     for (const product of products) {
//       const { product_id, quantity, unit_cost } = product;
//       const cost = quantity * unit_cost;
//       await connection.query(
//         `INSERT INTO PurchaseOrderDetails (purchase_order_id, product_id, quantity, unit_cost, cost)
//                  VALUES (?, ?, ?, ?, ?)`,
//         [poId, product_id, quantity, unit_cost, cost]
//       );
//     }
//     await connection.commit();
//     res.status(201).json({ message: "PO submitted successfully", poId });
//   } catch (error) {
//     await connection.rollback();
//     res.status(500).json({ error: error.message });
//   } finally {
//     connection.release();
//   }
// };

module.exports = router;

// router.post = async (req, res) => {
//   const { id } = req.params;
//   const { approved_by } = req.body;

//   try {
//     await db.query(
//       `UPDATE PurchaseOrders SET status = 'Approved', approved_by = ?, approved_date = NOW() WHERE id = ?`,
//       [approved_by, id]
//     );
//     res.status(200).json({ message: "PO approved successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// router.post = async (req, res) => {
//   const { id } = req.params;

//   try {
//     await db.query(
//       `UPDATE PurchaseOrders SET status = 'Received', received_date = NOW() WHERE id = ?`,
//       [id]
//     );
//     res.status(200).json({ message: "PO received successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// router.post = async (req, res) => {
//   const { id } = req.params;
//   const { payment_method, shipping_fee, tax_amount, total, payment_date } =
//     req.body;

//   try {
//     await db.query(
//       `UPDATE PurchaseOrders
//              SET status = 'Closed', payment_method = ?, shipping_fee = ?, tax_amount = ?, total = ?, payment_date = ?
//              WHERE id = ?`,
//       [payment_method, shipping_fee, tax_amount, total, payment_date, id]
//     );
//     res.status(200).json({ message: "PO closed successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get PO Details
// router.post = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const [po] = await db.query(`SELECT * FROM PurchaseOrders WHERE id = ?`, [
//       id,
//     ]);
//     const [details] = await db.query(
//       `SELECT * FROM PurchaseOrderDetails WHERE purchase_order_id = ?`,
//       [id]
//     );

//     if (po.length === 0) {
//       return res.status(404).json({ message: "PO not found" });
//     }

//     res.status(200).json({ po: po[0], details });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

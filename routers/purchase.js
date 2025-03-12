const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
router.get("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  try {
    const [result] = await db.execute("SELECT * FROM purchase");
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  let {
    vendorId,
    submittedById,
    approvedById,
    statusId = "new",
    recievedDate,
    shippingFee,
    taxamount,
    paymentDate,
    paymentAmount,
    paymentMethod,
    notes,
    products,
  } = req.body;

  if (
    !vendorId ||
    !submittedById ||
    !approvedById ||
    !statusId ||
    products.length === 0
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  recievedDate = statusId > 4 ? recievedDate : null;
  shippingFee = shippingFee ?? 0.0; // Default to 0.00
  taxamount = taxamount ?? 0.0; // Default to 0.00
  paymentDate = paymentDate > 4 ? paymentDate : null;
  paymentAmount = paymentAmount ?? 0; // Default to 0
  paymentMethod = paymentMethod ?? null;
  notes = notes ?? "";
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [maxPurchase] = await connection.execute(
      `SELECT IFNULL(MAX(purchaseOrderId), 0) + 1 AS new_id FROM purchase`
    );
    const newPurchaseOrderId = maxPurchase[0].new_id;
    const insertPurchaseQuery = `
      INSERT INTO purchase (purchaseOrderId, vendorId, submittedById, submittedDate, 
        approvedById, approvedDate, statusId, recievedDate, shippingFee, taxamount, 
        paymentDate, paymentAmount, paymentMethod, notes, totalAmount) 
      VALUES (?, ?, ?, NOW(), ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    await connection.execute(insertPurchaseQuery, [
      newPurchaseOrderId,
      vendorId,
      submittedById,
      approvedById,
      statusId,
      recievedDate,
      shippingFee,
      taxamount,
      paymentDate,
      paymentAmount,
      paymentMethod,
      notes,
    ]);

    let totalAmount = 0;

    // Insert into purchaseOrderDetails for each product
    for (const product of products) {
      const { ProductID, QuantityPerUnit, StandardUnitCost } = product;
      // Ensure the product exists
      const [productData] = await connection.execute(
        "SELECT StandardUnitCost FROM Products WHERE ProductID = ?",
        [ProductID]
      );
      if (productData.length === 0) {
        throw new Error(`Product with ID ${ProductID} not found`);
      }
      const lineTotal = QuantityPerUnit * StandardUnitCost;
      totalAmount += lineTotal;
      const [maxPurchaseOrderDetail] = await connection.execute(
        `SELECT IFNULL(MAX(purchaseOrderId), 0) + 1 AS new_id FROM purchaseOrderDetail`
      );
      const newPurchaseOrderDetailId = maxPurchaseOrderDetail[0].new_id;
      await connection.execute(
        `INSERT INTO purchaseOrderDetail (purchaseOrderDetailId,purchaseOrderId, productId, quantity, unitCost) 
         VALUES (?,?, ?, ?, ?)`,
        [
          newPurchaseOrderDetailId,
          newPurchaseOrderId,
          ProductID,
          QuantityPerUnit,
          StandardUnitCost,
        ]
      );
    }
    // Update total amount in purchaseOrder
    await connection.execute(
      `UPDATE purchase SET totalAmount = ? WHERE purchaseOrderId = ?`,
      [totalAmount + shippingFee + taxamount, newPurchaseOrderId]
    );
    await connection.commit(); // Commit transaction
    return res.status(201).json({
      message: "Purchase order created successfully",
      purchaseData: { ...req.body },
    });
  } catch (error) {
    if (connection) await connection.rollback(); // Rollback on error
    return res.status(500).json({ message: error.message });
  } finally {
    if (connection) connection.release(); // Release the connection
  }
});
router.put(
  "/:purchaseOrderId/update-status",
  verifyToken,
  roleMiddileware("admin"),
  async (req, res) => {
    const { purchaseOrderId } = req.params;
    const { statusId } = req.body;
    const Timestamp = new Date(); // Current Date & Time
    const currentTimestamp = Timestamp.toLocaleDateString();
    try {
      // Get the current status of the order
      const [existingOrder] = await db.execute(
        "SELECT statusId FROM purchase WHERE purchaseOrderId = ?",
        [purchaseOrderId]
      );

      if (existingOrder.length === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      const currentStatus = existingOrder[0].statusId;

      // Define status transition logic
      let updateQuery = "UPDATE purchase SET statusId = ?, ";
      let params = [statusId, purchaseOrderId];

      if (currentStatus === 3 && statusId === 4) {
        updateQuery += "submittedDate = ?, ";
        params.unshift(currentTimestamp);
      } else if (currentStatus === 4 && statusId === 1) {
        updateQuery += "approvedDate = ?, ";
        params.unshift(currentTimestamp);
      } else if (currentStatus === 1 && statusId === 5) {
        updateQuery += "receivedDate = ?, ";
        params.unshift(currentTimestamp);
      } else if (currentStatus === 5 && statusId === 2) {
        updateQuery += "paymentDate = ?, ";
        params.unshift(currentTimestamp);
      } else {
        return res.status(400).json({ message: "Invalid status transition" });
      }

      // Remove last comma and add WHERE clause
      updateQuery = updateQuery.slice(0, -2) + " WHERE purchaseOrderId = ?";

      const [result] = await db.execute(updateQuery, params);

      if (result.affectedRows === 0) {
        return res.status(400).json({ message: "Status update failed" });
      }

      res.status(200).json({
        message: "Status updated successfully",
        newStatusId: statusId,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
router.put("/:purchaseOrderId/update-product", async (req, res) => {
  const { purchaseOrderId } = req.params;
  const { oldProductId, newProductId, quantity, unitCost } = req.body;

  try {
    // Check if the wrong product exists in this order
    const [existingProduct] = await db.execute(
      "SELECT * FROM purchaseOrderDetail WHERE purchaseOrderId = ? AND productId = ?",
      [purchaseOrderId, oldProductId]
    );

    if (existingProduct.length === 0) {
      return res
        .status(404)
        .json({ message: "Old product not found in this order" });
    }

    // Update the product
    const updateQuery = `
      UPDATE purchaseOrderDetails
      SET productId = ?, quantity = ?, unitCost = ?
      WHERE purchaseOrderId = ? AND productId = ?`;

    const [result] = await db.execute(updateQuery, [
      newProductId,
      quantity,
      unitCost,
      purchaseOrderId,
      oldProductId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Update failed" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully in the order" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete(
  "/:id",
  verifyToken,
  roleMiddileware("admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      // First, delete purchaseOrderDetails related to the purchaseOrder
      await db.execute(
        "DELETE FROM purchaseOrderDetail WHERE purchaseOrderId = ?",
        [id]
      );

      // Then, delete the purchaseOrder
      const [deleteResult] = await db.execute(
        "DELETE FROM purchase WHERE purchaseOrderId = ?",
        [id]
      );

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      res.status(200).json({ message: "Purchase order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// router.get("/", (req, res) => {
//   try {
//     const rows = `
//             SELECT * FROM purchase`;
//     db.query(rows, (err, result) => {
//       if (err) {
//         return res.status(403).send({ message: "error to get productTable" });
//       }
//       return res.status(200).json(result);
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.post("/", async (req, res) => {
//   const {
//     vendorId,
//     submittedById,
//     submittedDate,
//     approvedById,
//     approvedDate,
//     statusId,
//     recievedDate,
//     shippingFee,
//     taxamount,
//     paymentDate,
//     paymentAmount,
//     paymentMethod,
//     notes,
//     totalAmount,
//     products,
//   } = req.body;
//   if (
//     !vendorId ||
//     !submittedById ||
//     !approvedById ||
//     !statusId ||
//     products.length === 0
//   ) {
//     console.log(
//       vendorId,
//       submittedById,
//       approvedById,
//       statusId,
//       totalAmount,
//       products.length
//     );
//     return res.status(400).json({ message: "Missing required fields" });
//   }
//   try {
//     await db.beginTransaction();
//     const purchaseOrderId = await db.execute(
//       `SELECT IFNULL(MAX(CategoryId),0) AS max_id FROM purchase`
//     );
//     db.query(purchaseOrderId, (err, result) => {
//       if (err) {
//         return req.send({ message: "error to get id" });
//       }
//       const index = result[0];
//       if (!result[0]) {
//         return res.send({ message: "invalid index" });
//       }
//       const { max_ids } = index;
//       const insertProduct = `insert into purchase(purchaseOrderId, vendorId,
//     submittedById,
//     submittedDate,
//     approvedById,
//     approvedDate,
//     statusId,
//     recievedDate,
//     shippingFee,
//     taxamount,
//     paymentDate,
//     paymentAmount,
//     paymentMethod,
//     notes,
//     totalAmount) values (?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?,0)`;
//       db.query(
//         insertProduct,
//         [
//           max_ids + 1,
//           vendorId,
//           submittedById,
//           submittedDate,
//           approvedById,
//           approvedDate,
//           statusId,
//           recievedDate,
//           shippingFee,
//           taxamount,
//           paymentDate,
//           paymentAmount,
//           paymentMethod,
//           notes,
//           totalAmount,
//         ],
//         async (err, result) => {
//           if (err) {
//             return res.status(403).send({ message: "error to insert" });
//           }
//           const purchaseOrderDetailId = await db.execute(
//             `SELECT IFNULL(MAX(CategoryId),0) AS max_id FROM purchaseOrderDetail`
//           );
//           db.query(purchaseOrderDetailId, async (err, result) => {
//             if (err) {
//               return req.send({
//                 message: "error to create purchaseOrderDetailId id",
//               });
//             }
//             const index = result[0];
//             if (!result[0]) {
//               return res.send({ message: "invalid index" });
//             }
//             const { max_id } = index;
//             let totalAmount = 0;
//             for (const product of products) {
//               const { ProductId, QuantityPerUnit, StandardUnitCost } = product;
//               const [productData] = await db.execute(
//                 "SELECT StandardUnitCost FROM Product WHERE ProductID = ?",
//                 [ProductId]
//               );
//               if (productData.length === 0) {
//                 throw new Error(`Product with ID ${ProductId} not found`);
//               }
//               // const unitCost = productData[0].StandardUnitCost;
//               const lineTotal = QuantityPerUnit * StandardUnitCost;
//               totalAmount += lineTotal;
//               const insertPurchaseOrderDetail = await db.execute(
//                 `INSERT INTO purchaseOrderDetails (purchaseOrderDetailId,purchaseOrderId, productId, quantity, unitCost)
//          VALUES (?, ?, ?, ?)`,
//                 [
//                   max_id + 1,
//                   max_ids + 1,
//                   ProductId,
//                   QuantityPerUnit,
//                   StandardUnitCost,
//                 ]
//               );
//               console.log(
//                 "error in insertPurchaseOrderDetail",
//                 insertPurchaseOrderDetail
//               );
//             }
//             await db.execute(
//               `UPDATE purchaseOrder SET totalAmount = ? WHERE purchaseOrderId = ?`,
//               [totalAmount, max_ids + 1]
//             );
//             await db.commit();
//             res.status(201).json({
//               message: "Purchase order created",
//             });
//           });
//         }
//       );
//     });
//   } catch (error) {
//     await db.rollback();
//     res.status(500).json({ message: error.message });
//   } finally {
//     await db.release();
//     return res.status(500).json({ message: "error.message" });
//   }
// });
// module.exports = router;

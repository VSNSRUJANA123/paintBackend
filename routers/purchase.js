const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");
const nodemailer = require("nodemailer");
const sendEmail = require("../utils/sendEmail");
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
    statusId = 3,
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
  statusId = statusId ?? 3;
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
      await connection.execute(
        `INSERT INTO purchaseOrderDetail (purchaseOrderId, productId, quantity, unitCost) 
         VALUES (?, ?, ?, ?)`,
        [newPurchaseOrderId, ProductID, QuantityPerUnit, StandardUnitCost]
      );
    }
    // Update total amount in purchaseOrder
    await connection.execute(
      `UPDATE purchase SET totalAmount = ? WHERE purchaseOrderId = ?`,
      [totalAmount + shippingFee + taxamount, newPurchaseOrderId]
    );
    await connection.commit(); // Commit transaction
    const [vendorResult] = await connection.execute(
      "SELECT email, firstname FROM suppliers WHERE id = ?",
      [vendorId]
    );
    if (vendorResult.length === 0) {
      throw new Error("Vendor not found.");
    }
    const vendorEmail = vendorResult[0].email;
    const vendorName = vendorResult[0].firstname;
    const approvalLink = `https://paint-backend.vercel.app/purchases/approve?vendorId=${vendorId}&purchaseOrderId=${newPurchaseOrderId}`;

    let orderDetailsHtml = `<h3>Hello ${vendorName},</h3><p>You have a new purchase order:</p><ul>`;
    for (const product of products) {
      orderDetailsHtml += `<li>Product ID: ${product.ProductID}, Quantity: ${product.QuantityPerUnit}, Cost: ₹${product.StandardUnitCost}</li>`;
    }
    orderDetailsHtml += `</ul><p><b>Total:</b> ₹${
      totalAmount + shippingFee + taxamount
    }</p>`;
    orderDetailsHtml += `<p><a href="${approvalLink}" style="padding: 10px 15px; background-color: green; color: white; text-decoration: none; border-radius: 4px;">Accept Purchase Order</a></p>`;
    await sendEmail(vendorEmail, "New Purchase Order", orderDetailsHtml);
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
router.get("/approve", async (req, res) => {
  const { vendorId, purchaseOrderId } = req.query;

  if (!vendorId || !purchaseOrderId) {
    return res.status(400).send("Missing vendor or order info.");
  }
  let connection;
  try {
    connection = await db.getConnection();

    const [purchase] = await connection.execute(
      `SELECT * FROM purchase WHERE purchaseOrderId = ? AND vendorId = ?`,
      [purchaseOrderId, vendorId]
    );

    if (purchase.length === 0) {
      return res.status(404).send("Purchase order not found.");
    }

    // Update status to Approved
    await connection.execute(
      `UPDATE purchase SET statusId = 1 WHERE purchaseOrderId = ?`,
      [purchaseOrderId]
    );
    return res.send(
      `<h2>✅ Purchase Order #${purchaseOrderId} approved successfully!</h2>`
    );
  } catch (error) {
    return res.status(500).send("Error approving order: " + error.message);
  } finally {
    if (connection) connection.release();
  }
});

router.delete(
  "/:id",
  verifyToken,
  roleMiddileware("admin"),
  async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      // First, delete purchaseOrderDetails related to the purchaseOrder
      await connection.execute(
        "DELETE FROM purchaseOrderDetail WHERE purchaseOrderId = ?",
        [id]
      );

      // Then, delete the purchaseOrder
      const [deleteResult] = await connection.execute(
        "DELETE FROM purchase WHERE purchaseOrderId = ?",
        [id]
      );

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      await connection.commit();
      res.status(200).json({ message: "Purchase order deleted successfully" });
    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ message: error.message });
    } finally {
      if (connection) {
        connection.release(); // Ensure connection is released
      }
    }
  }
);

module.exports = router;
// apply transaction concept for update one
// router.put(
//   "/:purchaseOrderId/update-status",
//   verifyToken,
//   roleMiddileware("admin"),
//   async (req, res) => {
//     const { purchaseOrderId } = req.params;
//     const { statusId } = req.body;
//     const Timestamp = new Date(); // Current Date & Time
//     const currentTimestamp = Timestamp.toLocaleDateString();
//     try {
//       // Get the current status of the order
//       const [existingOrder] = await db.execute(
//         "SELECT statusId FROM purchase WHERE purchaseOrderId = ?",
//         [purchaseOrderId]
//       );

//       if (existingOrder.length === 0) {
//         return res.status(404).json({ message: "Purchase order not found" });
//       }

//       const currentStatus = existingOrder[0].statusId;

//       // Define status transition logic
//       let updateQuery = "UPDATE purchase SET statusId = ?, ";
//       let params = [statusId, purchaseOrderId];

//       if (currentStatus === 3 && statusId === 4) {
//         updateQuery += "submittedDate = ?, ";
//         params.unshift(currentTimestamp);
//       } else if (currentStatus === 4 && statusId === 1) {
//         updateQuery += "approvedDate = ?, ";
//         params.unshift(currentTimestamp);
//       } else if (currentStatus === 1 && statusId === 5) {
//         updateQuery += "receivedDate = ?, ";
//         params.unshift(currentTimestamp);
//       } else if (currentStatus === 5 && statusId === 2) {
//         updateQuery += "paymentDate = ?, ";
//         params.unshift(currentTimestamp);
//       } else {
//         return res.status(400).json({ message: "Invalid status transition" });
//       }

//       // Remove last comma and add WHERE clause
//       updateQuery = updateQuery.slice(0, -2) + " WHERE purchaseOrderId = ?";

//       const [result] = await db.execute(updateQuery, params);

//       if (result.affectedRows === 0) {
//         return res.status(400).json({ message: "Status update failed" });
//       }

//       res.status(200).json({
//         message: "Status updated successfully",
//         newStatusId: statusId,
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );
// router.put("/:purchaseOrderId/update-product", async (req, res) => {
//   const { purchaseOrderId } = req.params;
//   const { oldProductId, newProductId, quantity, unitCost } = req.body;

//   try {
//     // Check if the wrong product exists in this order
//     const [existingProduct] = await db.execute(
//       "SELECT * FROM purchaseOrderDetail WHERE purchaseOrderId = ? AND productId = ?",
//       [purchaseOrderId, oldProductId]
//     );

//     if (existingProduct.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Old product not found in this order" });
//     }

//     // Update the product
//     const updateQuery = `
//       UPDATE purchaseOrderDetails
//       SET productId = ?, quantity = ?, unitCost = ?
//       WHERE purchaseOrderId = ? AND productId = ?`;

//     const [result] = await db.execute(updateQuery, [
//       newProductId,
//       quantity,
//       unitCost,
//       purchaseOrderId,
//       oldProductId,
//     ]);

//     if (result.affectedRows === 0) {
//       return res.status(400).json({ message: "Update failed" });
//     }

//     res
//       .status(200)
//       .json({ message: "Product updated successfully in the order" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const cookie = require("cookie-parser");
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cookie());
app.use(cors({}));
app.use("/employees", require("./routers/employee"));
app.use("/suppliers", require("./routers/suppliers"));
app.use("/companyType", require("./routers/company"));
app.use("/products", require("./routers/products"));
app.use("/productCategory", require("./routers/productCategory"));
app.use("/purchases", require("./routers/purchase"));
app.use("/purchaseStatus", require("./routers/purchaseOrderStatus"));
app.use("/productSupplier", require("./routers/productSupplier"));
app.use("/masterScheduling", require("./routers/masterscheudling"));
app.use("/purchaseOrderDetail", require("./routers/purchaseOrderDetail"));
app.use("/sponsor", require("./routers/sponser"));
app.use("/testitemdeatils", require("./routers/testItemDetails"));
app.use("/studytitle", require("./routers/studyTitle"));
// app.use("/uploads", require("./routers/imageUpload"));
app.use("/api/auth", require("./routers/loginRoute"));
app.use("/api/user", require("./routers/userRoute"));

const PORT = process.env.PORT || 5000;
app.get("/working", (req, res) => {
  return res.send({ message: "hi welcome to paint application" });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

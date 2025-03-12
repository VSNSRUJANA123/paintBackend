const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const dbConnection = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const roleMiddileware = require("../middleware/roleMiddleware");

router.post("/register", async (req, res) => {
  const { username, password, role = "user" } = req.body;
  try {
    if (!username || !password) {
      return res.status(403).send("required username and password");
    }
    const sqlQuery = "select * from user where username=?";
    const [result] = await dbConnection.execute(sqlQuery, [username]);
    if (result.length > 0) {
      return res.status(403).send({ message: "user already exist" });
    }
    const insertQueries = "insert into user(username,password) values(?,?)";
    const hashPassword = await bcrypt.hash(password, 10);
    const [insertResult] = await dbConnection.execute(insertQueries, [
      username,
      hashPassword,
    ]);
    if (insertResult.affectedRows === 0) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    return res.status(200).json({ message: "user created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(403).send("required username and password");
  }
  try {
    const sqlQuery = "select * from user where username=?";
    const [result] = await dbConnection.execute(sqlQuery, [username]);
    // console.log(result);
    if (result.length > 0) {
      const isPasswordValid = await bcrypt.compare(
        password,
        result[0].password
      );
      if (!isPasswordValid) {
        return res.status(400).send({ message: "Invalid password" });
      }
      const token = jwt.sign({ role: result[0].role }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      return res
        .status(200)
        .json({ message: "Login successfully", token, result });
    }
    return res
      .status(403)
      .send({ message: "user doesn't exist create account" });
  } catch (err) {
    return res.status(500).json({ message: err });
  }
});
router.get("/", verifyToken, roleMiddileware("admin"), async (req, res) => {
  // console.log("ok");
  try {
    const sqlQuery = "select * from user";
    const [result] = await dbConnection.execute(sqlQuery);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
});

module.exports = router;

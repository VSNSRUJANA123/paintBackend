const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const cookie = require("cookie-parser");
const verifyToken = (req, res, next) => {
  const getToken = req.cookies.token;
  // console.log(getToken);
  if (!getToken) {
    return res.status(403).json({ error: "No token provided" });
  }
  jwt.verify(getToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Failed to authenticate token" });
    }
    // console.log("user_id", decoded);
    req.user = decoded;
    next();
  });
};
module.exports = verifyToken;

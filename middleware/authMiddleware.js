const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const cookie = require("cookie-parser");
const verifyToken = (req, res, next) => {
  if (!req.headers) {
    return res.status(404).json({ message: "token not provided" });
  }
  const { authorization } = req.headers;
  // console.log("hello", );
  if (!authorization.split(" ")[1]) {
    return res.status(403).send("invalid token");
  }
  const getToken = req.cookies.token || authorization.split(" ")[1];
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

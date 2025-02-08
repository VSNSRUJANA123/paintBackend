const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const verifyToken = (req, res, next) => {
  // console.log(req.headers, "token");
  if (!req.headers) {
    return res.status(404).json({ message: "token not provided" });
  }
  const { authorization } = req.headers;
  // console.log(req.headers);
  if (!authorization) {
    return res.status(403).json({ message: "invalid token" });
  }
  const getToken = authorization.split(" ")[1];
  // console.log(getToken, "token");
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

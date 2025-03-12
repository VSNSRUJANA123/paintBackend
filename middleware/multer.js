const multer = require("multer");
const path = require("path");

// Multer Storage (Store file temporarily)
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

module.exports = upload;

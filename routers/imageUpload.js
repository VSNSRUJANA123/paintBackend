const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/multer");

// Upload image to Cloudinary
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "uploads",
    });
    res.status(200).json({
      message: "Image uploaded successfully!",
      imageUrl: result.secure_url,
      result,
    });
  } catch (error) {
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;

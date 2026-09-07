const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { compareDocuments } = require("../controllers/compareController");

router.post("/", protect, compareDocuments);

module.exports = router;

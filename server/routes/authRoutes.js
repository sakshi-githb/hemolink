const express = require("express");
const {
  registerController,
  loginController,
  currentUserController,
  changePasswordController,
} = require("../controllers/authController");
const authMiddelware = require("../middlewares/authMiddelware");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/current-user", authMiddelware, currentUserController);
router.post("/change-password", authMiddelware, changePasswordController);

module.exports = router;

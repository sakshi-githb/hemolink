const express = require("express");
const authMiddelware = require("../middlewares/authMiddelware");
const {
  createInventoryController,
  getInventoryController,
  getDonarsController,
  getHospitalController,
  getOrgnaisationController,
  getOrgnaisationForHospitalController,
  getInventoryHospitalController,
  getRecentInventoryController,
  getAllOrgnaisationsController,
  getBloodAvailabilityController,
  getDonorBloodUsageController,
} = require("../controllers/inventoryController");

const router = express.Router();

router.post("/create-inventory", authMiddelware, createInventoryController);
router.get("/get-inventory", authMiddelware, getInventoryController);
router.get(
  "/get-recent-inventory",
  authMiddelware,
  getRecentInventoryController,
);
router.post(
  "/get-inventory-hospital",
  authMiddelware,
  getInventoryHospitalController,
);
router.get("/get-donars", authMiddelware, getDonarsController);
router.get("/get-hospitals", authMiddelware, getHospitalController);
router.get("/get-orgnaisation", authMiddelware, getOrgnaisationController);
router.get(
  "/get-all-organisations",
  authMiddelware,
  getAllOrgnaisationsController,
);
router.get(
  "/get-orgnaisation-for-hospital",
  authMiddelware,
  getOrgnaisationForHospitalController,
);
router.get(
  "/get-blood-availability",
  authMiddelware,
  getBloodAvailabilityController,
);
router.get(
  "/get-donor-blood-usage",
  authMiddelware,
  getDonorBloodUsageController,
);

module.exports = router;

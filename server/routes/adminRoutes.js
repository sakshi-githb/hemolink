const express = require("express");
const authMiddelware = require("../middlewares/authMiddelware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getDonarsListController,
  getHospitalListController,
  getOrgListController,
  deleteDonarController,
  getAllRequestsController,
  adminAcceptRequestController,
  adminRejectRequestController,
  getAllInventoryController,
  getAllCampsController,
  deleteCampController,
  getSiteStatsController,
} = require("../controllers/adminController");

const router = express.Router();

router.get(
  "/donar-list",
  authMiddelware,
  adminMiddleware,
  getDonarsListController,
);
router.get(
  "/hospital-list",
  authMiddelware,
  adminMiddleware,
  getHospitalListController,
);
router.get("/org-list", authMiddelware, adminMiddleware, getOrgListController);
router.delete(
  "/delete-donar/:id",
  authMiddelware,
  adminMiddleware,
  deleteDonarController,
);
router.get(
  "/all-requests",
  authMiddelware,
  adminMiddleware,
  getAllRequestsController,
);
router.put(
  "/accept-request/:id",
  authMiddelware,
  adminMiddleware,
  adminAcceptRequestController,
);
router.put(
  "/reject-request/:id",
  authMiddelware,
  adminMiddleware,
  adminRejectRequestController,
);
router.get(
  "/all-inventory",
  authMiddelware,
  adminMiddleware,
  getAllInventoryController,
);
router.get(
  "/all-camps",
  authMiddelware,
  adminMiddleware,
  getAllCampsController,
);
router.delete(
  "/delete-camp/:id",
  authMiddelware,
  adminMiddleware,
  deleteCampController,
);
router.get(
  "/site-stats",
  authMiddelware,
  adminMiddleware,
  getSiteStatsController,
);

module.exports = router;

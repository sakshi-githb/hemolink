const express = require("express");
const authMiddelware = require("../middlewares/authMiddelware");
const {
  createRequestController,
  getHospitalRequestsController,
  getOrgRequestsController,
  acceptRequestController,
  rejectRequestController,
} = require("../controllers/requestController");

const router = express.Router();

router.post("/create-request", authMiddelware, createRequestController);
router.get(
  "/get-hospital-requests",
  authMiddelware,
  getHospitalRequestsController,
);
router.get("/get-org-requests", authMiddelware, getOrgRequestsController);
router.put("/accept-request/:id", authMiddelware, acceptRequestController);
router.put("/reject-request/:id", authMiddelware, rejectRequestController);

module.exports = router;

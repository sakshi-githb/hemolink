const express = require("express");
const authMiddelware = require("../middlewares/authMiddelware");
const {
  createCampController,
  getAllCampsController,
  getOrgCampsController,
  deleteCampController,
  updateAttendanceController,
} = require("../controllers/campController");

const router = express.Router();

router.post("/create-camp", authMiddelware, createCampController);
router.get("/get-all-camps", authMiddelware, getAllCampsController);
router.get("/get-org-camps", authMiddelware, getOrgCampsController);
router.delete("/delete-camp/:id", authMiddelware, deleteCampController);
router.put(
  "/update-attendance/:id",
  authMiddelware,
  updateAttendanceController,
);

module.exports = router;

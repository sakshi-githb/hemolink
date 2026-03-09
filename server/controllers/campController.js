const campModel = require("../models/campModel");

const createCampController = async (req, res) => {
  try {
    const camp = new campModel({ ...req.body, organisation: req.body.userId });
    await camp.save();
    return res
      .status(201)
      .send({ success: true, message: "Camp created successfully", camp });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error creating camp", error });
  }
};

// GET ALL CAMPS — only future/today camps by default
const getAllCampsController = async (req, res) => {
  try {
    const showAll = req.query.showAll === "true";
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const filter = showAll
      ? { isActive: true }
      : { isActive: true, date: { $gte: today } };

    const camps = await campModel
      .find(filter)
      .populate("organisation", "organisationName email phone address")
      .sort({ date: 1 });

    return res
      .status(200)
      .send({ success: true, message: "Camps fetched", camps });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching camps", error });
  }
};

// GET ORG'S OWN CAMPS — show all including past
const getOrgCampsController = async (req, res) => {
  try {
    const camps = await campModel
      .find({ organisation: req.body.userId, isActive: true })
      .sort({ date: -1 });
    return res
      .status(200)
      .send({ success: true, message: "Org camps fetched", camps });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching org camps", error });
  }
};

const deleteCampController = async (req, res) => {
  try {
    await campModel.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.status(200).send({ success: true, message: "Camp removed" });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error removing camp", error });
  }
};

// UPDATE ATTENDANCE
const updateAttendanceController = async (req, res) => {
  try {
    const { attendance } = req.body;
    await campModel.findByIdAndUpdate(req.params.id, {
      attendance: Number(attendance),
    });
    return res
      .status(200)
      .send({ success: true, message: "Attendance updated" });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error updating attendance", error });
  }
};

module.exports = {
  createCampController,
  getAllCampsController,
  getOrgCampsController,
  deleteCampController,
  updateAttendanceController,
};

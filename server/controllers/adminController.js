const userModel = require("../models/userModel");
const inventoryModel = require("../models/inventoryModel");
const requestModel = require("../models/requestModel");
const campModel = require("../models/campModel");
const mongoose = require("mongoose");

// GET DONOR LIST
const getDonarsListController = async (req, res) => {
  try {
    const donarData = await userModel
      .find({ role: "donar" })
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "Donor List Fetched", donarData });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching donors", error });
  }
};

// GET HOSPITAL LIST
const getHospitalListController = async (req, res) => {
  try {
    const hospitalData = await userModel
      .find({ role: "hospital" })
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "Hospital List Fetched", hospitalData });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching hospitals", error });
  }
};

// GET ORG LIST
const getOrgListController = async (req, res) => {
  try {
    const orgData = await userModel
      .find({ role: "organisation" })
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "Org List Fetched", orgData });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching orgs", error });
  }
};

// DELETE USER + ALL THEIR DATA (cascade)
const deleteDonarController = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found" });

    const id = new mongoose.Types.ObjectId(req.params.id);

    if (user.role === "donar") {
      // Delete all inventory records where this person donated
      await inventoryModel.deleteMany({ donar: id });
    }

    if (user.role === "organisation") {
      // Delete all inventory, camps, and requests linked to this org
      await inventoryModel.deleteMany({ organisation: id });
      await campModel.deleteMany({ organisation: id });
      await requestModel.deleteMany({ organisation: id });
    }

    if (user.role === "hospital") {
      // Delete all requests and inventory OUT records for this hospital
      await requestModel.deleteMany({ hospital: id });
      await inventoryModel.deleteMany({ hospital: id });
    }

    // Finally delete the user
    await userModel.findByIdAndDelete(req.params.id);

    return res
      .status(200)
      .send({ success: true, message: "User and all related data deleted" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Error deleting user", error });
  }
};

// GET ALL REQUESTS
const getAllRequestsController = async (req, res) => {
  try {
    const requests = await requestModel
      .find({})
      .populate("hospital", "hospitalName email phone address")
      .populate("organisation", "organisationName email phone address")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "All requests fetched", requests });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching requests", error });
  }
};

// ADMIN ACCEPT REQUEST
const adminAcceptRequestController = async (req, res) => {
  try {
    const request = await requestModel
      .findById(req.params.id)
      .populate("hospital");
    if (!request)
      return res
        .status(404)
        .send({ success: false, message: "Request not found" });
    if (request.status !== "pending")
      return res
        .status(400)
        .send({ success: false, message: "Already processed" });

    const orgId = new mongoose.Types.ObjectId(request.organisation);

    const totalInAgg = await inventoryModel.aggregate([
      {
        $match: {
          organisation: orgId,
          inventoryType: "in",
          bloodGroup: request.bloodGroup,
        },
      },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    const totalOutAgg = await inventoryModel.aggregate([
      {
        $match: {
          organisation: orgId,
          inventoryType: "out",
          bloodGroup: request.bloodGroup,
        },
      },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    const available =
      (totalInAgg[0]?.total || 0) - (totalOutAgg[0]?.total || 0);

    if (available < request.quantity) {
      return res.status(400).send({
        success: false,
        message: `Only ${available}ml of ${request.bloodGroup} available`,
      });
    }

    await inventoryModel.create({
      bloodGroup: request.bloodGroup,
      quantity: request.quantity,
      inventoryType: "out",
      organisation: request.organisation,
      hospital: request.hospital._id,
      email: request.hospital.email,
    });

    request.status = "accepted";
    await request.save();
    return res.status(200).send({
      success: true,
      message: "Request accepted and inventory updated",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Error accepting request", error });
  }
};

// ADMIN REJECT REQUEST
const adminRejectRequestController = async (req, res) => {
  try {
    const request = await requestModel.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .send({ success: false, message: "Request not found" });
    if (request.status !== "pending")
      return res
        .status(400)
        .send({ success: false, message: "Already processed" });
    request.status = "rejected";
    await request.save();
    return res.status(200).send({ success: true, message: "Request rejected" });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error rejecting request", error });
  }
};

// GET ALL INVENTORY
const getAllInventoryController = async (req, res) => {
  try {
    const inventory = await inventoryModel
      .find({})
      .populate("organisation", "organisationName")
      .populate("donar", "name email")
      .populate("hospital", "hospitalName email")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "All inventory fetched", inventory });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching inventory", error });
  }
};

// GET ALL CAMPS
const getAllCampsController = async (req, res) => {
  try {
    const camps = await campModel
      .find({})
      .populate("organisation", "organisationName email")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "All camps fetched", camps });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching camps", error });
  }
};

// DELETE CAMP
const deleteCampController = async (req, res) => {
  try {
    await campModel.findByIdAndDelete(req.params.id);
    return res.status(200).send({ success: true, message: "Camp deleted" });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error deleting camp", error });
  }
};

// GET SITE STATS
const getSiteStatsController = async (req, res) => {
  try {
    const totalDonors = await userModel.countDocuments({ role: "donar" });
    const totalHospitals = await userModel.countDocuments({ role: "hospital" });
    const totalOrgs = await userModel.countDocuments({ role: "organisation" });
    const totalInventory = await inventoryModel.countDocuments({});
    const totalRequests = await requestModel.countDocuments({});
    const pendingRequests = await requestModel.countDocuments({
      status: "pending",
    });
    const totalCamps = await campModel.countDocuments({ isActive: true });
    const totalBloodInAgg = await inventoryModel.aggregate([
      { $match: { inventoryType: "in" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    const totalBloodOutAgg = await inventoryModel.aggregate([
      { $match: { inventoryType: "out" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    return res.status(200).send({
      success: true,
      stats: {
        totalDonors,
        totalHospitals,
        totalOrgs,
        totalInventory,
        totalRequests,
        pendingRequests,
        totalCamps,
        totalBloodIn: totalBloodInAgg[0]?.total || 0,
        totalBloodOut: totalBloodOutAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching stats", error });
  }
};

module.exports = {
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
};

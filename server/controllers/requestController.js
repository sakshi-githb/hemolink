const requestModel = require("../models/requestModel");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");

// HOSPITAL CREATES A REQUEST
const createRequestController = async (req, res) => {
  try {
    const { bloodGroup, quantity, organisation } = req.body;
    if (!bloodGroup || !quantity || !organisation) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required" });
    }
    const request = new requestModel({
      bloodGroup,
      quantity: Number(quantity),
      organisation,
      hospital: req.body.userId,
      status: "pending",
    });
    await request.save();
    return res
      .status(201)
      .send({ success: true, message: "Blood request submitted", request });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Error creating request", error });
  }
};

// HOSPITAL GETS THEIR OWN REQUESTS
const getHospitalRequestsController = async (req, res) => {
  try {
    const requests = await requestModel
      .find({ hospital: req.body.userId })
      .populate("organisation", "organisationName email phone address")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "Requests fetched", requests });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Error fetching requests", error });
  }
};

// ORGANISATION GETS REQUESTS SENT TO THEM
const getOrgRequestsController = async (req, res) => {
  try {
    const requests = await requestModel
      .find({ organisation: req.body.userId })
      .populate("hospital", "hospitalName email phone address")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "Org requests fetched", requests });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Error fetching org requests", error });
  }
};

// ORGANISATION ACCEPTS REQUEST
const acceptRequestController = async (req, res) => {
  try {
    const request = await requestModel
      .findById(req.params.id)
      .populate("hospital");

    if (!request)
      return res
        .status(404)
        .send({ success: false, message: "Request not found" });
    if (request.status !== "pending") {
      return res
        .status(400)
        .send({ success: false, message: "Request already processed" });
    }

    const orgId = new mongoose.Types.ObjectId(req.body.userId);

    // Check available stock
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
        message: `Only ${available}ml of ${request.bloodGroup} available, cannot fulfil ${request.quantity}ml`,
      });
    }

    // Deduct from inventory
    const inventory = new inventoryModel({
      bloodGroup: request.bloodGroup,
      quantity: request.quantity,
      inventoryType: "out",
      organisation: req.body.userId,
      hospital: request.hospital._id,
      email: request.hospital.email,
    });
    await inventory.save();

    // Update status
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

// ORGANISATION REJECTS REQUEST
const rejectRequestController = async (req, res) => {
  try {
    const request = await requestModel.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .send({ success: false, message: "Request not found" });
    if (request.status !== "pending") {
      return res
        .status(400)
        .send({ success: false, message: "Request already processed" });
    }
    request.status = "rejected";
    await request.save();
    return res.status(200).send({ success: true, message: "Request rejected" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, message: "Error rejecting request", error });
  }
};

module.exports = {
  createRequestController,
  getHospitalRequestsController,
  getOrgRequestsController,
  acceptRequestController,
  rejectRequestController,
};

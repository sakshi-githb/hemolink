const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

const createInventoryController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) throw new Error("User Not Found");

    if (req.body.inventoryType === "out") {
      const requestedBloodGroup = req.body.bloodGroup;
      const requestedQuantityOfBlood = Number(req.body.quantity);
      const organisation = new mongoose.Types.ObjectId(
        req.body.organisation || req.body.userId,
      );

      const totalInAgg = await inventoryModel.aggregate([
        {
          $match: {
            organisation,
            inventoryType: "in",
            bloodGroup: requestedBloodGroup,
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]);
      const totalOutAgg = await inventoryModel.aggregate([
        {
          $match: {
            organisation,
            inventoryType: "out",
            bloodGroup: requestedBloodGroup,
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]);

      const available =
        (totalInAgg[0]?.total || 0) - (totalOutAgg[0]?.total || 0);
      if (available < requestedQuantityOfBlood) {
        return res.status(500).send({
          success: false,
          message: `Only ${available}ML of ${requestedBloodGroup} is available`,
        });
      }
      req.body.hospital = user._id;
    } else {
      req.body.donar = user._id;
    }

    const inventory = new inventoryModel(req.body);
    await inventory.save();
    return res
      .status(201)
      .send({ success: true, message: "New Blood Record Added" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Create Inventory API",
      error,
    });
  }
};

const getInventoryController = async (req, res) => {
  try {
    const inventory = await inventoryModel
      .find({ organisation: req.body.userId })
      .populate("donar")
      .populate("hospital")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      messaage: "get all records successfully",
      inventory,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error In Get All Inventory", error });
  }
};

const getInventoryHospitalController = async (req, res) => {
  try {
    const inventory = await inventoryModel
      .find(req.body.filters)
      .populate("donar")
      .populate("hospital")
      .populate("organisation")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      messaage: "get hospital consumer records successfully",
      inventory,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error In Get consumer Inventory",
      error,
    });
  }
};

const getRecentInventoryController = async (req, res) => {
  try {
    const inventory = await inventoryModel
      .find({ organisation: req.body.userId })
      .limit(3)
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send({ success: true, message: "recent Inventory Data", inventory });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
      error,
    });
  }
};

const getDonarsController = async (req, res) => {
  try {
    const organisation = req.body.userId;
    const donorId = await inventoryModel.distinct("donar", { organisation });
    const donars = await userModel.find({ _id: { $in: donorId } });
    return res.status(200).send({
      success: true,
      message: "Donar Record Fetched Successfully",
      donars,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error in Donar records", error });
  }
};

const getHospitalController = async (req, res) => {
  try {
    const organisation = req.body.userId;
    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation,
    });
    const hospitals = await userModel.find({ _id: { $in: hospitalId } });
    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error In get Hospital API", error });
  }
};

const getOrgnaisationController = async (req, res) => {
  try {
    const donar = req.body.userId;
    const orgId = await inventoryModel.distinct("organisation", { donar });
    const organisations = await userModel.find({ _id: { $in: orgId } });
    return res.status(200).send({
      success: true,
      message: "Org Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error In ORG API", error });
  }
};

const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const hospital = req.body.userId;
    const orgId = await inventoryModel.distinct("organisation", { hospital });
    const organisations = await userModel.find({ _id: { $in: orgId } });
    return res.status(200).send({
      success: true,
      message: "Hospital Org Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error In Hospital ORG API", error });
  }
};

const getAllOrgnaisationsController = async (req, res) => {
  try {
    const organisations = await userModel.find({ role: "organisation" });
    return res.status(200).send({
      success: true,
      message: "All Organisations Fetched Successfully",
      organisations,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error In Get All Organisations API",
      error,
    });
  }
};

const getBloodAvailabilityController = async (req, res) => {
  try {
    const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    const orgs = await userModel.find({ role: "organisation" });

    const availability = await Promise.all(
      orgs.map(async (org) => {
        const orgId = new mongoose.Types.ObjectId(org._id);
        const bloodData = await Promise.all(
          bloodGroups.map(async (bg) => {
            const inAgg = await inventoryModel.aggregate([
              {
                $match: {
                  organisation: orgId,
                  inventoryType: "in",
                  bloodGroup: bg,
                },
              },
              { $group: { _id: null, total: { $sum: "$quantity" } } },
            ]);
            const outAgg = await inventoryModel.aggregate([
              {
                $match: {
                  organisation: orgId,
                  inventoryType: "out",
                  bloodGroup: bg,
                },
              },
              { $group: { _id: null, total: { $sum: "$quantity" } } },
            ]);
            const available = Math.max(
              0,
              (inAgg[0]?.total || 0) - (outAgg[0]?.total || 0),
            );
            return { bloodGroup: bg, available };
          }),
        );
        return {
          organisation: {
            _id: org._id,
            organisationName: org.organisationName,
            email: org.email,
            phone: org.phone,
            address: org.address,
          },
          bloodData,
          totalAvailable: bloodData.reduce((sum, b) => sum + b.available, 0),
        };
      }),
    );

    return res.status(200).send({
      success: true,
      message: "Blood availability fetched",
      availability,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error fetching blood availability",
      error,
    });
  }
};

// GET DONOR'S BLOOD USAGE — shows donor how much of their blood has been used
const getDonorBloodUsageController = async (req, res) => {
  try {
    const donorId = req.body.userId;

    // Find all donations by this donor
    const donations = await inventoryModel
      .find({ donar: donorId, inventoryType: "in" })
      .populate("organisation", "organisationName");

    // For each donation, find how much of that blood group was sent OUT by the org
    const usageData = await Promise.all(
      donations.map(async (donation) => {
        const orgId = new mongoose.Types.ObjectId(donation.organisation._id);
        const outAgg = await inventoryModel.aggregate([
          {
            $match: {
              organisation: orgId,
              inventoryType: "out",
              bloodGroup: donation.bloodGroup,
            },
          },
          { $group: { _id: null, total: { $sum: "$quantity" } } },
        ]);
        return {
          _id: donation._id,
          bloodGroup: donation.bloodGroup,
          donatedQty: donation.quantity,
          organisation: donation.organisation,
          usedQty: outAgg[0]?.total || 0,
          createdAt: donation.createdAt,
        };
      }),
    );

    return res
      .status(200)
      .send({ success: true, message: "Donor usage fetched", usageData });
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, message: "Error fetching donor usage", error });
  }
};

module.exports = {
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
};

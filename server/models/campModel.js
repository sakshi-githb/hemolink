const mongoose = require("mongoose");

const campSchema = new mongoose.Schema(
  {
    campName: { type: String, required: [true, "Camp name is required"] },
    address: { type: String, required: [true, "Camp address is required"] },
    date: { type: String, required: [true, "Camp date is required"] },
    time: { type: String, required: [true, "Camp time is required"] },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    attendance: { type: Number, default: null }, // how many donors showed up
  },
  { timestamps: true },
);

module.exports = mongoose.model("Camp", campSchema);

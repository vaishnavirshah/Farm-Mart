const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  productName: String,
  productDesc: String,
  productPrice: String,
  imagepath: String,   
  productCategory: {
    type: String,
    lowercase: true,
    enum: ["fruit", "vegetable", "dairy", "pulses", "grains", "spices", "oils"],
  },
  productID: String,
  ownerName: String,
  quantity: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("Cart", cartSchema);

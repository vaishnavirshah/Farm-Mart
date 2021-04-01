const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderNum: Number,
  carts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
  ],
  date: Date,
  discount: Number,
  total: Number,
});

module.exports = mongoose.model("Order", orderSchema);

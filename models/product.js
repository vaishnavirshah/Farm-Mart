const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const ProductSchema = new Schema({
  images: {
    path: String,
    filename: String,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  price: String,
  description: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  category: {
    type: String,
    lowercase: true,
    enum: ["fruit", "vegetable", "dairy", "nuts", "grains", "spices", "oils"],
  },
});

ProductSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});
module.exports = mongoose.model("Product", ProductSchema);

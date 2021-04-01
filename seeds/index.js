const mongoose = require("mongoose");
const Product = require("../models/product");
const User = require("../models/user");
const mod = require("./database.js");
const productDB = mod.productDB;

mongoose.connect("mongodb://localhost:27017/farmers-market", {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});
// const categories = [
//   "fruit",
//   "vegetable",
//   "dairy",
//   "nuts",
//   "grains",
//   "spices",
//   "oils",
// ];
const seedDB = async () => {
  await Product.deleteMany({});

  for (i = 0; i < productDB.length; i++) {
    //var temp = Math.floor(Math.random() * 10);
    const prod = new Product({
      images: {
        path: productDB[i].images["path"],
        filename: productDB[i].images["filename"],
      },
      // owner: "605a322c2acc7107b8a4b747",
      title: productDB[i].title,
      description: productDB[i].description,
      price: productDB[i].price,
      category: productDB[i].category,
    });
    await prod.save();
  }
  // console.log(productDB.length);
  // for (i = 0; i < productDB.length; i++) {
  //   console.log(productDB[i]);
  // }
};
seedDB().then(() => {
  mongoose.connection.close();
});

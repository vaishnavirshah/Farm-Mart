if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const stripe_sk = process.env.STRIPE_SECRET_KEY;
const stripe_pk = process.env.STRIPE_PUBLIC_KEY;
const express = require("express");
const nodemailer = require("nodemailer");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const Product = require("./models/product");
const Review = require("./models/review");
const Cart = require("./models/cart");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const Order = require("./models/order");
const multer = require("multer");
const { storage } = require("./cloudinary");
const upload = multer({ storage });
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI("8032a40e5429490f9696180e800d5e67");
//const MongoDBStore = require("connect-mongo")(session);
const { isLoggedIn } = require("./middleware");
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
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
const secret = process.env.SECRET || "thisshouldbeabettersecret!";
const discountCodes = {
  DISFIRST: 10,
  DIS50: 50,
};
const bestSellersArray = [
  "60647bcb65630910e4bcbc78",
  "60647bcb65630910e4bcbc79",
  "60647bcb65630910e4bcbc74",
  "60647bcb65630910e4bcbc98",
  "60647bcb65630910e4bcbca0",
  "60647bcb65630910e4bcbc93",
];

const categories = [
  "fruit",
  "vegetable",
  "dairy",
  "nuts",
  "grains",
  "spices",
  "oils",
];
const smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "farm.martt@gmail.com",
    pass: "farmMart0*",
  },
});
const stripe = require("stripe")(stripe_sk);
var rand = Math.floor(100000 + Math.random() * 900000);

/*const store = new MongoDBStore({
  url: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
});*/

/*store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});
*/
const sessionConfig = {
  //store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  //console.log(req.session);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("users/register");
});
app.get("/login", async (req, res) => {
  try {
    const userId = req.user._id;
    res.redirect(`/user/${userId}`);
  } catch (e) {
    //console.log("catch");
    res.render("users/login");
  }
});

app.get("/products", async (req, res) => {
  var bestSellers = [];
  for (i = 0; i < bestSellersArray.length; i++) {
    var item = await Product.findById(bestSellersArray[i]);
    bestSellers.push(item);
  }
  // console.log(bestSellers);
  const { category } = req.query;
  if (category) {
    const products = await Product.find({ category })
      .populate({
        path: "reviews",
        populate: {
          path: "owner",
        },
      })
      .populate("owner");
    res.render("products/index", {
      products,
      category,
      categories,
      bestSellers,
    });
  } else {
    const products = await Product.find({})
      .populate({
        path: "reviews",
        populate: {
          path: "owner",
        },
      })
      .populate("owner");

    res.render("products/index", {
      products,
      category: "All",
      categories,
      bestSellers,
    });
  }
});

app.get("/products/new", isLoggedIn, (req, res) => {
  res.render("products/new", { categories });
});

app.get("/user/:Userid", isLoggedIn, async (req, res) => {
  const userId = req.user._id;
  const usern = await User.findById(userId).populate({
    path: "carts",
  });
  var total = 0;
  const prod = usern.carts;

  //console.log(prod[0].quantity, prod[0].productPrice, usern.carts.length);
  for (i = 0; i < usern.carts.length; i++) {
    total = total + prod[i].quantity * prod[i].productPrice;
  }
  var subtotal = 1.1 * total;
  res.render("users/cart1", {
    userId,
    username: usern.username,
    email: usern.email,
    items: usern.carts,
    total,
    subtotal,
    stripePK: stripe_pk,
    applied: 0,
  });
});
app.get("/user/:userId/profile", isLoggedIn, async (req, res) => {
  const usern = await User.findById(req.user._id)
    .populate({
      path: "carts",
    })
    .populate({
      path: "orders",
      populate: { path: "carts" },
    });
  const orders = usern.orders;

  res.render("profile", { orders });
});
app.post("/user/:Userid", isLoggedIn, async (req, res) => {
  const userId = req.user._id;
  const usern = await User.findById(userId).populate({
    path: "carts",
  });
  console.log(usern.orders);
  var total = 0;
  const prod = usern.carts;
  if (prod.length == 0) {
    req.flash("error", "The cart is empty!!");
    res.redirect(`${userId}`);
  } else {
    for (i = 0; i < usern.carts.length; i++) {
      total = total + prod[i].quantity * prod[i].productPrice;
    }
    if (discountCodes[req.body.discount]) {
      discount = discountCodes[req.body.discount];
      var subtotal = 1.1 * total;
      if (req.body.discount == "DISFIRST") {
        if (usern.orders.length != 0) {
          discount = 0;
          res.render("users/cart1", {
            error: "Invalid Discount Code!!",
            userId,
            username: usern.username,
            email: usern.email,
            items: usern.carts,
            total,
            subtotal,
            stripePK: stripe_pk,
            applied: discount,
          });
        } else {
          res.render("users/cart1", {
            success: "Successfully applied the discount!!",
            userId,
            username: usern.username,
            email: usern.email,
            items: usern.carts,
            total,
            subtotal,
            stripePK: stripe_pk,
            applied: discount,
          });
        }
      } else {
        res.render("users/cart1", {
          success: "Successfully applied the discount!!",
          userId,
          username: usern.username,
          email: usern.email,
          items: usern.carts,
          total,
          subtotal,
          stripePK: stripe_pk,
          applied: discount,
        });
      }
    } else {
      discount = 0;
      res.render("users/cart1", {
        error: "Invalid Discount Code!!",
        userId,
        username: usern.username,
        email: usern.email,
        items: usern.carts,
        total,
        subtotal,
        stripePK: stripe_pk,
        applied: 0,
      });
    }
  }
});
app.get("/success", isLoggedIn, async (req, res) => {
  // const usern = await User.findById(req.user._id);
  // console.log(usern);
  // var order = new Order();
  // for (i = 0; i < usern.carts.length; i++) {
  //   order.carts.push(usern.carts[i]);
  // }
  // var items = [];
  // for (i = 0; i < usern.carts.length; i++) {
  //   var item = await Cart.findById(usern.carts[i]);
  //   items.push(item);
  // }
  // console.log(items);
  // order.date = Date.now();
  // usern.orders.push(order);
  // usern.carts = [];
  // await order.save();
  // await usern.save();

  // var mailOptions = {
  //   to: usern.email,
  //   subject: "Farm-Mart: Thank You for ordering!",
  //   html:
  //     "Hello " +
  //     usern.username +
  //     "! <br><br> Your order has been received.<br><br>We will be delivering your order to you soon.<br><br> Thank You for shopping with us! Continue browsing at <a href='http://localhost:3000/'>Farm-Mart</a>.",
  // };
  // // console.log(mailOptions);
  // const sending = await smtpTransport.sendMail(
  //   mailOptions,
  //   function (error, response) {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       console.log("Message sent ");
  //     }
  //   }
  // );
  res.render("partials/success");
});

app.post("/checkoutPage", isLoggedIn, async (req, res) => {
  const userId = req.user._id;
  console.log("checkoutPage ");
  const usern = await User.findById(userId).populate({
    path: "carts",
  });
  var total = 0;
  const prod = usern.carts;
  if (prod.length == 0) {
    req.flash("error", "The cart is empty!!!");
    res.redirect(`user/${userId}`);
  } else {
    //console.log(prod[0].quantity, prod[0].productPrice, usern.carts.length);
    for (i = 0; i < usern.carts.length; i++) {
      total = total + prod[i].quantity * prod[i].productPrice;
    }
    var subtotal = total;
    res.render("users/checkout", {
      userId,
      username: usern.username,
      email: usern.email,
      items: usern.carts,
      total,
      subtotal,
      stripePK: stripe_pk,
      applied: req.body.applied,
      discountedTotal: req.body.discountedTotal,
    });
  }
});
app.post("/checkout", isLoggedIn, async (req, res) => {
  console.log("checkout ");
  var total = parseInt(req.body.total) * 100;
  const usern = await User.findById(req.body.customer);
  stripe.customers
    .create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken,
      name: usern.username,
      address: {
        line1: "TC 9/4 Old MES colony",
        postal_code: "110092",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
      },
    })
    .then((customer) => {
      return stripe.charges.create({
        amount: total,
        description: usern.username + "'s cart",
        currency: "INR",
        customer: customer.id,
      });
    })
    .then(async (charge) => {
      const usern = await User.findById(req.user._id);
      console.log(usern);
      var order = new Order();
      for (i = 0; i < usern.carts.length; i++) {
        order.carts.push(usern.carts[i]);
      }
      var items = [];
      var amt = 0;
      for (i = 0; i < usern.carts.length; i++) {
        var item = await Cart.findById(usern.carts[i]);
        console.log(item);
        amt = amt + item.productPrice * item.quantity;
        items.push(item);
      }
      console.log(amt, "  *  ", items);
      order.discount = req.body.discount;
      order.total = amt;
      var rand3 = Math.floor(Math.random() * (999 - 100 + 1) + 100);
      order.orderNum = rand3;
      order.date = Date.now();
      console.log("Order:     ", order);
      console.log("Discount: ", req.body.discount, order.discount);
      console.log("total:", order.total);
      usern.orders.push(order);
      usern.carts = [];
      await order.save();
      await usern.save();

      var mailOptions = {
        to: usern.email,
        subject: "Farm-Mart: Thank You for ordering!",
        html:
          "Hello " +
          usern.username +
          "! <br><br> Your order has been received.<br><br>We will be delivering your order to you soon.<br><br> Thank You for shopping with us! Continue browsing at <a href='http://localhost:3000/'>Farm-Mart</a>.",
      };
      // console.log(mailOptions);
      const sending = await smtpTransport.sendMail(
        mailOptions,
        function (error, response) {
          if (error) {
            console.log(error);
          } else {
            console.log("Message sent ");
          }
        }
      );
      res.redirect("/success"); // If no error occurs
    })
    .catch((err) => {
      res.send(err); // If some error occurs
    });
});
app.post("/checkout-cod", isLoggedIn, async (req, res) => {
  const usern = await User.findById(req.user._id);
  console.log(usern);
  var order = new Order();
  for (i = 0; i < usern.carts.length; i++) {
    order.carts.push(usern.carts[i]);
  }
  var items = [];
  var rand3 = Math.floor(Math.random() * (999 - 100 + 1) + 100);
  var amt = 0;
  for (i = 0; i < usern.carts.length; i++) {
    var item = await Cart.findById(usern.carts[i]);
    console.log(item);
    amt = amt + item.productPrice * item.quantity;
    items.push(item);
  }
  console.log(amt, "  *  ", items);
  order.discount = req.body.discount;
  order.total = amt;
  order.date = Date.now();
  order.orderNum = rand3;
  console.log("Order:     ", order);
  console.log("Discount: ", req.body.discount, order.discount);
  console.log("total:", order.total);
  usern.orders.push(order);
  usern.carts = [];
  await order.save();
  await usern.save();

  var mailOptions = {
    to: usern.email,
    subject: "Farm-Mart: Thank You for ordering!",
    html:
      "Hello " +
      usern.username +
      "! <br><br> Your order has been received.<br><br>We will be delivering your order to you soon.<br><br> Thank You for shopping with us! Continue browsing at <a href='http://localhost:3000/'>Farm-Mart</a>.",
  };
  // console.log(mailOptions);
  const sending = await smtpTransport.sendMail(
    mailOptions,
    function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Message sent ");
      }
    }
  );
  res.redirect("/success");
});
app.post("/products", upload.single("image"), isLoggedIn, async (req, res) => {
  const prod = new Product(req.body.product);
  prod.owner = req.user._id;
  // console.log(req.body);
  // console.log(111101101101);
  // console.log(req.file);
  prod.images = req.file;
  await prod.save();
  req.flash("success", "Successfully added the product!");
  res.redirect(`/products`);
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
app.post("/searchItem", async (req, res) => {
  var bestSellers = [];
  for (i = 0; i < bestSellersArray.length; i++) {
    var item = await Product.findById(bestSellersArray[i]);
    bestSellers.push(item);
  }
  //console.log(req.body.search);
  const search = req.body.search;
  if (req.body.search) {
    const regex = new RegExp(escapeRegex(req.body.search), "gi");

    const products = await Product.find({ title: regex })
      .populate({
        path: "reviews",
        populate: {
          path: "owner",
        },
      })
      .populate("owner");

    // console.log(products);
    if (products.length == 0) {
      req.flash("error", "No product found!!");
      res.redirect("/products");
    } else {
      res.render("products/index", {
        products,
        category: "All",
        categories,
        bestSellers,
      });
    }
  } else {
    res.redirect("products");
  }
});

app.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "owner",
      },
    })
    .populate("owner");
  //console.log(product);
  res.render("products/show", { product });
});

app.get("/products/:id/edit", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  req.flash("success", "Successfully edited the product!");
  res.render("products/edit", { product, categories });
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  // console.log(111111111111111111);
  // console.log(req.body);
  product.images = req.file;
  product.title = req.body.name;
  product.price = req.body.price;
  product.description = req.body.description;
  product.category = req.body.category;
  await product.save();
  req.flash("success", "Successfully updated the product!");
  res.redirect(`/products`);
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const deletedProduct = await Product.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted the product!");

  res.redirect("/products");
});

app.post("/register", async (req, res) => {
  // console.log(req.body);
  // var host = req.get("host");
  // console.log(host, "register");
  const user1 = await User.find({ username: req.body.username });
  const user2 = await User.find({ email: req.body.email });
  if (user1.length == 0 && user2.length == 0) {
    var mailOptions = {
      to: req.body.email,
      subject: "Please confirm your Email account",
      html: "Hello,<br> Your code is: " + rand,
    };
    // console.log(mailOptions);
    const sending = await smtpTransport.sendMail(
      mailOptions,
      function (error, response) {
        if (error) {
          console.log(error);
        } else {
          console.log("Message sent ");
        }
      }
    );
    // console.log(rand);
    const data = req.body;
    // console.log(data);
    res.render("users/verification", { data });
  } else {
    req.flash("error", "Username or email already in use!");
    res.redirect("register");
  }
});
app.post("/contact", async (req, res) => {
  var mailOptions = {
    to: req.body.email,
    subject: "Farm-Mart: Thank You for writing to us!",
    html:
      "Hello " +
      req.body.name +
      "! <br><br> Your message: <br>" +
      req.body.message +
      "<br> has been received.<br><br> An executive will be connecting to you soon.<br><br> Thank You! Continue shopping in the meanwhile at <a href='http://localhost:3000/'>Farm-Mart</a>.",
  };
  // console.log(mailOptions);
  const sending = await smtpTransport.sendMail(
    mailOptions,
    function (error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log("Message sent ");
      }
    }
  );
  //flash success message
  res.render("contactus");
});
app.post("/verify", async (req, res) => {
  // console.log(req.body);
  const otp = parseInt(req.body.otp);
  if (otp == rand) {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registered = await User.register(user, password);
    req.login(registered, (err) => {
      if (err) return next(err);

      res.redirect("/");
    });
    // console.log(registered);
    console.log("email is verified");
  } else {
    console.log("email is not verified");
  }
  res.redirect("/");
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Successfully logged in");

    res.redirect("/");
  }
);

app.get("/contact", (req, res) => {
  res.render("contactus");
});

app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Successfully logged out");
  res.redirect("/");
});

app.get("/cart", isLoggedIn, (req, res) => {
  const userId = req.user._id;
  res.redirect(`/user/${userId}`);
});

app.post("/products/:id/reviews", isLoggedIn, async (req, res) => {
  const prod = await Product.findById(req.params.id);

  const review = new Review(req.body.reviews);
  review.owner = req.user._id;
  review.rating = req.body["reviews[rating]"];
  review.body = req.body["reviews[body]"];
  prod.reviews.push(review);
  await review.save();
  await prod.save();
  req.flash("success", "Successfully submitted a review");
  res.redirect(`/products`);
});

app.delete("/cancelOrder", async (req, res) => {
  //console.log(req.body.orders);
  // await Cart.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Order.findByIdAndDelete(req.body.orders);
  req.flash("success", "Successfully cancelled the order");

  res.redirect(`user/${req.user._id}/profile`);
});

app.post("/products/:id/cart", isLoggedIn, async (req, res) => {
  //console.log(req.user._id);
  var { quantity } = req.body;
  if (!quantity) {
    quantity = 1;
  }
  const prod = await Product.findById(req.params.id);
  // console.log(prod.images);
  const usern = await User.findById(req.user._id).populate({
    path: "carts",
    match: { productID: prod._id },
  });
  // console.log(usern);
  if (usern.carts.length != 0) {
    //console.log(111);
    await Cart.findByIdAndUpdate(usern.carts[0]._id, {
      quantity: usern.carts[0].quantity + parseInt(quantity),
    });
  } else {
    const cart = new Cart({
      productDesc: prod.description,
      productCategory: prod.category,
      productPrice: prod.price,
      imagepath: prod.images.path,
      productName: prod.title,
      productID: prod._id,
      ownerName: req.user._id,
      quantity: quantity,
    });
    usern.carts.push(cart);
    await cart.save();
    await usern.save();
  }
  req.flash("success", `Successfully added ${prod.title} to cart`);

  res.redirect(`/products`);
});
app.get("/terms", (req, res) => {
  res.render("tac");
});

app.get("/privacy", (req, res) => {
  res.render("privacy");
});

app.get("/blog", (req, res) => {
  var data;
  newsapi.v2
    .everything({
      q: "food",
      sources: "buzzfeed",
      domains: "https://www.buzzfeed.com/in/food",
      from: "2021-03-01",
      to: "2021-03-25",
      language: "en",
      sortBy: "relevancy",
      page: 1,
    })
    .then((response) => {
      data = response;
      res.render("partials/blog", { data });
    });
});

app.get("/cookies", (req, res) => {
  res.render("cookies");
});

app.delete("/user/:userId/cart/:cartId", async (req, res) => {
  const { cartId } = req.params;
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId, { $pull: { carts: cartId } });
  await Cart.findByIdAndDelete(cartId);
  req.flash("success", "Successfully deleted from the cart");
  res.redirect(`/user/${userId}`);
});
app.delete("/products/:id/reviews/:reviewId", async (req, res) => {
  const { id, reviewId } = req.params;
  await Product.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Successfully deleted the review");

  res.redirect(`/products`);
});

app.all("*", (req, res) => {
  res.render("partials/error");
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});

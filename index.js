const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
dotenv.config();
const app = express();
const CLIENT_URL = process.env.CLIENT_URL;

app.use(cors({ credentials: true, origin: CLIENT_URL }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

//Databse Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI);
app.get("/", (req, res) => {
  res.send("<h1>This is a RESTful API for MERN Chat</h1>");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});

//User Register
const salt = bcrypt.genSaltSync(10);
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});

//User Login
const secret = process.env.SECRET;
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  //   if (!userDoc) res.status(404).json("user not found")
  if (userDoc) {
    const isMatchedPassword = bcrypt.compareSync(password, userDoc.password);
    if (isMatchedPassword) {
      //logged in
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        //Save data in cookie
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json("wrong credentials");
    }
  } else {
    res.status(404).json("user not found");
  }
});

//User logout
app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, secret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("No Token");
  }
});

const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const logger = require("morgan");
const bcrypt = require("bcrypt");
require("dotenv").config();
const PORT = process.env.PORT || 8080;
const app = express();
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));


// set mongoDB source and connect collection model files
const db = require("./models");
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/sandbox", {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});


// session settings
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);
// check active session
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user)
  } else {
    res.json(false)
  }
})

// user signup route
app.post('/signUp', (req, res) => {
  let uniqueUsername = true
  let uniqueEmail = true

  db.User.find({}, (err, data) => {
    if (err) { console.log(err), res.status(500).send("error") }
    else {
      data.forEach(x => {
        if (x.username === req.body.username) { uniqueUsername = false }
        if (x.email === req.body.email) { uniqueEmail = false }
      });
    }

    if (uniqueUsername && uniqueEmail) {
      console.log('creating entry =====================')
      db.User.create({
        username: req.body.username,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
      }, (err, data) => {
        if (err) { console.log(err), res.status(500).json(err) }
        else { res.json({ username: uniqueUsername, email: uniqueEmail }) }
      })
    } else { res.json({ username: uniqueUsername, email: uniqueEmail }) }

  })
})

//user login route
app.post('/login', (req, res) => {
  db.User.findOne({
    username: req.body.username
  }, (err, data) => {
    console.log(data)
    if (err) { console.log(err), res.status(500).send("error") }
    if (data) {
      if (bcrypt.compareSync(req.body.password, data.password)) {
        req.session.user = {
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
        }
        res.json(data.first_name)
      } else { res.json(false) }
    } else { res.json(false) }
  })
})

//user logout route
app.get('/logout', (req, res) => {
  req.session.destroy()
  res.json('goodbye')
})

// Listen on port 3000
app.listen(PORT, () => {
  console.log(`Cruising on port ${PORT}!`);
});

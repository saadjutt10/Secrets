//jshint esversion:6
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

//Making the connection
mongoose.connect('mongodb://127.0.0.1:27017/SecretDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
// console.log(process.env.SECRETKEY);
userSchema.plugin(encrypt, { secret: process.env.SECRETKEY, encryptedFields: ["password"] });
const User = mongoose.model("User", userSchema);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));



app.get("/", function (req, res) {
    res.render("home");
});
app.get("/login", function (req, res) {
    res.render("login");
});

//Registration route
app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })
    .post(function (req, res) {
     
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save()
            .then(function (nuser) {
                console.log(nuser);
                res.render("secrets")
            })

    })








app.listen(3000, function (req, res) {
    console.log("Server is up and running");
})
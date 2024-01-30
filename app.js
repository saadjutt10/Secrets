//jshint esversion:6
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');




app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "My little secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//Making the connection
mongoose.connect('mongodb://127.0.0.1:27017/SecretDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
    // getUserById(id): return this._id
});
// console.log(process.env.SECRETKEY);
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    return done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    return done(null, User.findById(id))
})

//Strategies 
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        console.log("======Google=======");
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        console.log("======FB=======");
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
});

// Routes for Google auth 
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });

// Routes for Facebook auth 

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated() === true) {
        res.render("secrets")
    } else {
        // console.log("Re directing to login-->" + req.isAuthenticated());
        res.redirect("/login")
    }
});

app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })
    .post(function (req, res) {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        req.login(newUser, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    // Authentication succeeded, redirect to the "/secrets" page
                    res.redirect("/secrets");

                });
            }
        });

    })

//Registration route
app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password)
        .then(function () {
            // Authenticate the user using passport.authenticate as a middleware
            passport.authenticate("local")(req, res, function () {
                // Authentication succeeded, redirect to the "/secrets" page
                res.redirect("/secrets");
            });
        })
        .catch(function (err) {
            console.log(err);
            res.redirect("/register");
        });
});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
});

app.get("/submit", function (req, res) {

    if (req.isAuthenticated() === true) {
        res.render("submit")
    } else {
        // console.log("Re directing to login-->" + req.isAuthenticated());
        res.redirect("/login")
    }
});

app.post("/submit", function (req, res) {
    console.log("Checking the authen" + req.isAuthenticated());
    const Obtainedsecret = req.body.secret;
    // console.log(req.body);
    // console.log(req.user._id.toString());
    User.findById(req.user.id)
        .then(function (foundUser) {
            console.log(foundUser);
            foundUser.secret = Obtainedsecret;
            return foundUser.save();
        })
        .then(function () {
            res.redirect("/secrets");
        })
        .catch(function (err) {
            console.log(err);
            // Handle the error appropriately (e.g., display an error page).
        });


});







app.listen(3000, function (req, res) {
    console.log("Server is up and running");
})
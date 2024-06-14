const express = require("express");
const flash = require('express-flash');
const userRouter = express();
const userController = require('../controllers/userController');
const userAuth = require('../middleware/userAuth');
const passport = require("passport")
userRouter.use(passport.initialize());
userRouter.use(passport.session())

//------Google Authentication Starting------//
userRouter.get('/auth/google', passport.authenticate("google", { scope: ["profile", "email"] }));

userRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/auth/google/googleSuccess",
        failureRedirect: "/register",
    })
);

userRouter.get("/auth/google/googleSuccess", userController.googleSuccess);
//------Google Authentication Ending------//

userRouter.set("view engine", "ejs");
userRouter.set("views", "./views/users");

// Account Related
userRouter.get('/', userController.userHome);
userRouter.get('/login', userAuth.isLogout, userController.loginLoad);
userRouter.post('/login', userController.loginUser);
userRouter.get('/register', userController.registerLoad);
userRouter.post('/register', userController.insertUser);
userRouter.get('/logout', userAuth.isLogin, userController.userLogout);
userRouter.get('/otp', userAuth.isLogout, userController.handleOTP);
userRouter.post('/otp', userController.verifyOtp);

// Products
userRouter.get('/productDetails', userController.productDetails);

module.exports = userRouter;
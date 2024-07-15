const express = require("express");
const userRouter = express();
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const walletController = require('../controllers/user/walletController');
const userAuth = require('../middleware/userAuth');
const passport = require("passport");
const { captureRejectionSymbol } = require("nodemailer/lib/xoauth2");
userRouter.use(passport.initialize());
userRouter.use(passport.session())

userRouter.set("view engine", "ejs");
userRouter.set("views", "./views/users");

// Google auth
userRouter.get('/auth/google', passport.authenticate("google", { scope: ["profile", "email"] }));
userRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/auth/google/googleSuccess",
        failureRedirect: "/login",
    })
);
userRouter.get("/auth/google/googleSuccess", userController.googleSuccess);

// Login
userRouter.get('/', userController.userHome);
userRouter.get('/login', userAuth.isLogout, userController.loginLoad);
userRouter.post('/login', userController.loginUser);
userRouter.get('/logout', userAuth.isLogin, userController.userLogout);

// Register
userRouter.get('/register', userController.registerLoad);
userRouter.post('/register', userController.insertUser);
userRouter.get('/otp', userAuth.isLogout, userController.handleOTP);
userRouter.post('/otp', userController.verifyOtp);

// Products
userRouter.get('/productDetails', userController.productDetails);
userRouter.get('/shop', userController.shop);

// Wishlist
userRouter.get('/wishlist', userAuth.isLogin, wishlistController.wishlist);
userRouter.post('/wishlist/add', userAuth.isLogin, wishlistController.addToWishlist);
userRouter.delete('/wishlist/remove', userAuth.isLogin, wishlistController.removeFromWishlist);

// Cart
userRouter.get('/load-cart', userAuth.isLogin, cartController.loadCart);
userRouter.get('/checkout/stock-check', userAuth.isLogin, cartController.stockCheck);
userRouter.post('/add-to-cart', userAuth.isLogin, cartController.addToCart);
userRouter.post('/cart/decrement', userAuth.isLogin, cartController.decrementCart);
userRouter.post('/cart/increment', userAuth.isLogin, cartController.incrementCart);
userRouter.post('/cart/remove', userAuth.isLogin, cartController.removeFromCart);
userRouter.post('/cart/stock-check', userAuth.isLogin, cartController.stockCheck);

// Checkout
userRouter.get('/checkout', userAuth.isLogin, cartController.loadCheckout);
userRouter.post('/checkout/add-new-address', userAuth.isLogin, cartController.addNewAddress);

// Orders
userRouter.post('/checkout/place-order', userAuth.isLogin, orderController.createOrder);
userRouter.get('/order-success', userAuth.isLogin, orderController.orderSuccess);
userRouter.get('/view-orders', userAuth.isLogin, orderController.viewOrders);
userRouter.get('/order-details', userAuth.isLogin, orderController.orderDetails);
userRouter.post('/cancel-order', userAuth.isLogin, orderController.cancelOrder);

// Profile
userRouter.get('/profile', userAuth.isLogin, profileController.profile);
userRouter.post('/editProfile', userAuth.isLogin, profileController.editProfile);

// Address
userRouter.get('/address', userAuth.isLogin, profileController.loadAddress);
userRouter.post('/addAddress', userAuth.isLogin, profileController.addAddress);
userRouter.get('/loadEditAddress', userAuth.isLogin, profileController.loadEditAddress);
userRouter.post('/editAddress', userAuth.isLogin, profileController.editAddress);
userRouter.post('/deleteAddress', userAuth.isLogin, profileController.deleteAddress);

// Password
userRouter.get('/edit-password', userAuth.isLogin, profileController.loadEditPassword);
userRouter.post('/change-password', userAuth.isLogin, profileController.changePassword);
userRouter.get('/forgot-password', userAuth.isLogout, profileController.loadForgetPassword);
userRouter.post('/send-password-link', userAuth.isLogout, profileController.sendPasswordLink);
userRouter.get('/reset-password', profileController.renderResetPasswordForm);
userRouter.post('/reset-password', profileController.handleResetPassword);

// Wallet
userRouter.get('/wallet', userAuth.isLogin, walletController.loadWallet);

module.exports = userRouter;
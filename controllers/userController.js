require('dotenv').config();
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// Password Hashing
const hashPassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const sendOTP = (recipientEmail, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'NEXUS Registration OTP',
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3>OTP for account verification is</h3>
                    <h1 style="font-weight: bold;">${otp}</h1>
                    <p>Please enter this OTP to complete your registration process.</p>
                    <p>Thanks for choosing NEXUS!</p>
                    <p>Best regards,<br>The NEXUS Team</p>
                </div>
            </div>
        `
    };

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred:', error.message);
        } else {
            console.log('OTP sent:', info.response);
        }
    });
};

// Register Form
const registerLoad = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('register',{user: userData});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

// Register method POST
const insertUser = async (req, res, next) => {
    try {
        const hashedPassword = await hashPassword(req.body.password);
        const existingUser = await userModel.findOne({ email: req.body.email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email already exists' });
        }

        req.session.newUser = {
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            password: hashedPassword
        }
        if (req.session.newUser) {
            return res.json({ success: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

// OTP page
const handleOTP = async (req, res, next) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const activeProducts = await productModel.find({ status: "active" }).populate('category');

        const recipientEmail = req.session.newUser.email;
        const otp = generateOTP();
        console.log('GENERATED OTP......'); // debugging
        console.log(otp); // debugging
        req.session.otp = otp;

        sendOTP(recipientEmail, otp);
        res.render('otp', { user: userData, products: activeProducts });
        
    } catch (error) {
        console.log(error);
    }
};

// Register user to db after otp
const verifyOtp = async (req, res) => {
    try {
        if (req.body.otp == req.session.otp) {

            const user = new userModel({
                name: req.session.newUser.name,
                phone: req.session.newUser.phone,
                email: req.session.newUser.email,
                password: req.session.newUser.password
            });

            const userData = await user.save();

            if (userData) {
                return res.json({ success: true });
            } else {
                return res.json({ success: false });
            }
        } else {
            return res.json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: 'An error occurred' });
    }
};

//------Google Authentication Starting------//
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

const googleSuccess = async (req, res) => {
    try {
        let userData = await userModel.findOne({ email: req.user.emails[0].value });
        
        if (!userData) {
            userData = new userModel({
                name: req.user.displayName,
                email: req.user.emails[0].value
            });
            await userData.save();
        }
        
        if (userData.is_blocked) {
            return res.status(403).send('You are blocked from accessing this website');
        }
        
        req.session.user_id = userData._id;
        
        // Save user session
        req.session.save((err) => {
            if (err) {
                console.log(err);
                return res.status(500).send('An error occurred');
            }
            res.redirect('/');
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
};
//------Google Authentication Ending------//

// Login Form
const loginLoad = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('login',{user: userData});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

// Login
const loginUser = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await userModel.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_blocked == false) {
                    req.session.user_id = userData._id;
                    res.json({ success: true, message: "Login successful" });
                } else {
                    res.json({ success: false, message: "You are blocked from accessing this website" });
                }
            } else {
                res.json({ success: false, message: "Wrong email or Password" });
            }
        } else {
            res.json({ success: false, message: "No user found" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Home Page   
const userHome = async (req, res) => {
    try {   
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const activeProducts = await productModel.find({ status: "active" }).populate('category');

        res.render('index', { user: userData, products: activeProducts });
    } catch (error) {
        res.status(500).send(error);
    }
};

// Logout
const userLogout = async (req, res) => {
    try {
        delete req.session.user_id;
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
};

// Single prouct page
const productDetails = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;
        
        const userData = await userModel.findOne({ _id: userId });
        const product = await productModel.findOne({ _id: productId, status: "active" }).populate('category');
        
        if (product) {
            const relatedProducts = await productModel.find({
                category: product.category._id,
                _id: { $ne: productId },
                status: "active"
            }).limit(4);

            res.render('productDetails', { user: userData, product, relatedProducts });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

// Shop
const shop = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const activeProducts = await productModel.find({ status: "active" }).populate('category');
        const categories = await categoryModel.find({ status: "active" });

        res.render('shop', { user: userData, products: activeProducts, categories: categories });
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    userHome,
    loginLoad,
    loginUser,
    userLogout,
    registerLoad,
    hashPassword,
    handleOTP,
    googleSuccess,
    insertUser,
    verifyOtp,
    productDetails,
    shop
};
require('dotenv').config();
const userModel = require('../../models/userModel');
const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');
const productOfferModel = require('../../models/productOfferModel');
const categoryOfferModel = require('../../models/categoryOfferModel');
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
const insertUser = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        const hashedPassword = await hashPassword(password);
        const existingUser = await userModel.findOne({ email: req.body.email });

        if (existingUser) {
            return res.json({ success: false, message: 'Email already exists' });
        }

        req.session.newUser = { name, phone, email, password: hashedPassword };
        if (req.session.newUser) {
            return res.json({ success: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// OTP page
const handleOTP = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const activeProducts = await productModel.find({ status: "active" }).populate('category');

        const recipientEmail = req.session.newUser.email;
        const otp = generateOTP();
        req.session.otp = otp;
        req.session.otpExpires = Date.now() + 60000;

        sendOTP(recipientEmail, otp);
        res.render('otp', { user: userData, products: activeProducts, email: recipientEmail });
        
    } catch (error) {
        console.log(error);
    }
};

// Register user to db after otp
const verifyOtp = async (req, res) => {
    try {
        const currentTime = Date.now();

        if (currentTime > req.session.otpExpires) {
            return res.json({ success: false, message: 'OTP has expired' });
        }

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
                email: req.user.emails[0].value,
                isGoogleAuth: true
            });
            await userData.save();
        }

        if (userData.is_blocked) {
            // return res.status(403).send('You are blocked from accessing this website');
            return res.redirect('/login');
        }
        
        req.session.user_id = userData._id;
        
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
        const { email, password } = req.body;

        const userData = await userModel.findOne({ email: email });

        if (userData) {
            if (userData.isGoogleAuth) {
                res.json({ success: false, message: "Account already exists with Google authentication" });
                return;
            }

            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (!userData.is_blocked) {
                    req.session.user_id = userData._id;
                    res.json({ success: true, message: "Login successful" });
                } else {
                    res.json({ success: false, message: "You are blocked from accessing this website" });
                }
            } else {
                res.json({ success: false, message: "Wrong email or password" });
            }
        } else {
            res.json({ success: false, message: "No user found" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Offers
const offerPrice = async (products) => {
    try {
        let updatedProducts = [];
        const productOffer = await productOfferModel.find().populate("productId");
        const categoryOffer = await categoryOfferModel.find().populate("categoryId");
  
        for (let product of products) {
            let productOfferMatch = 0;
            let categoryOfferMatch = 0;
            let productOfferPercentage;
            let categoryOfferPercentage;
  
            for (let offer of productOffer) {
                if (offer.productId._id.toString() === product._id.toString()) {
                    productOfferMatch = 1;
                    productOfferPercentage = offer.offerPercentage;
                    break;
                }
            }
  
            for (let offer of categoryOffer) {
                if (offer.categoryId._id.toString() === product.category._id.toString()) {
                    categoryOfferMatch = 1;
                    categoryOfferPercentage = offer.offerPercentage;
                    break;
                }
            }
  
            if (categoryOfferMatch === 1 && productOfferMatch === 1) {
                if (categoryOfferPercentage > productOfferPercentage) {
                    await productModel.updateOne(
                        { _id: product._id },
                        {
                            offerPrice:
                            product.price -
                            Math.ceil((product.price * categoryOfferPercentage) / 100),
                        }
                    );
                } else {
                    await productModel.updateOne(
                        { _id: product._id },
                        {
                            offerPrice:
                            product.price -
                            Math.ceil((product.price * productOfferPercentage) / 100),
                        }
                    );
                }
            } else if (categoryOfferMatch === 1) {
                await productModel.updateOne(
                    { _id: product._id },
                    {
                        offerPrice:
                        product.price -
                        Math.ceil((product.price * categoryOfferPercentage) / 100),
                    }
                );
            } else if (productOfferMatch === 1) {
                await productModel.updateOne(
                    { _id: product._id },
                    {
                        offerPrice:
                        product.price -
                        Math.ceil((product.price * productOfferPercentage) / 100),
                    }
                );
            } else {
                if (product.offerPrice) {
                    await productModel.updateOne(
                        { _id: product._id },
                        { $unset: { offerPrice: "" } }
                    );
                }
            }
            const updatedProduct = await productModel.findOne({ _id: product._id });
            updatedProducts.push(updatedProduct);
        }
  
        return updatedProducts;
    } catch (error) {
        console.error(error);
        return [];
    }
};
  
// Home Page    
const userHome = async (req, res) => {
    try {   
        const userData = await userModel.findOne({ _id: req.session.user_id });
        let activeProducts = await productModel.find({ status: "active" }).populate('category');

        activeProducts = await offerPrice(activeProducts);

        res.render('home', { user: userData, products: activeProducts });
    } catch (error) {
        console.error(error);
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
        let product = await productModel.findOne({ _id: productId, status: "active" }).populate('category');
        
        if (product) {
            const relatedProducts = await productModel.find({
                category: product.category._id,
                _id: { $ne: productId },
                status: "active"
            }).limit(4);

            product = await offerPrice([product]);
            product = product[0];
            
            const updatedRelatedProducts = await offerPrice(relatedProducts);

            res.render('productDetails', { user: userData, product, relatedProducts: updatedRelatedProducts });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        res.render('500')
        console.log(error);
    }
};


// Shop
const shop = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        const { sortOption, searchQuery = "", selectedCategories = "", minPrice = 0, maxPrice = Number.MAX_VALUE } = req.query;

        const query = { status: "active", quantity: { $gt: 0 } };

        if (searchQuery) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }

        const selectedCategoryArray = selectedCategories.length > 0 ? selectedCategories.split(",") : [];
        if (selectedCategoryArray.length > 0) {
            query.category = { $in: selectedCategoryArray };
        }

        const minPriceInt = Number(minPrice);
        const maxPriceInt = Number(maxPrice);

        if (!isNaN(minPriceInt) && minPriceInt > 0) {
            query.price = { $gte: minPriceInt };
        }
        if (!isNaN(maxPriceInt) && maxPriceInt < Number.MAX_VALUE) {
            query.price = { ...query.price, $lte: maxPriceInt };
        }

        let productsQuery = productModel.find(query).populate('category').skip(skip).limit(limit);

        switch (sortOption) {
            case "newArrival":
                productsQuery = productsQuery.sort({ addedDate: -1 });
                break;
            case "priceLowToHigh":
                productsQuery = productsQuery.sort({ price: 1 });
                break;
            case "priceHighToLow":
                productsQuery = productsQuery.sort({ price: -1 });
                break;
            case "nameAZ":
                productsQuery = productsQuery.sort({ productName: 1 });
                break;
            case "nameZA":
                productsQuery = productsQuery.sort({ productName: -1 });
                break;
            default:
                break;
        }

        const totalProducts = await productModel.countDocuments(query);
        const activeProducts = await productsQuery.exec();
        const totalPages = Math.ceil(totalProducts / limit);

        const userData = await userModel.findOne({ _id: req.session.user_id });
        const categories = await categoryModel.find({ status: "active" });

        res.render('shop', {
            user: userData,
            products: activeProducts,
            categories: categories,
            currentPage: page,
            totalPages: totalPages,
            search: searchQuery,
            selectedCategories: selectedCategoryArray,
            sortOption: sortOption || "",
            minPrice: minPriceInt || 0,
            maxPrice: maxPriceInt || Number.MAX_VALUE,
            noProductsFound: activeProducts.length === 0
        });
    } catch (error) {
        console.log(error);
    }
};


// About page
const aboutPage = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('about', { user: userData });
    } catch (error) {
        console.log(error);
    }
}

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
    shop,
    offerPrice,
    aboutPage
};
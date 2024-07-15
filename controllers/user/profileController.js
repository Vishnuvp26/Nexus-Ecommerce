const userModel = require('../../models/userModel');
const addressModel = require('../../models/addressModel');
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
require('dotenv').config();

// Profile
const profile = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('profile', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

// Fetch adress
const loadAddress = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const addressData = await addressModel.findOne({ userId: req.session.user_id });

        res.render('address', { user: userData, addresses: addressData ? addressData.address : [] });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

// Add address
const addAddress = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        let address = await addressModel.findOne({ userId: userData._id });

        if (!address) {
            address = new addressModel({
                userId: userData._id,
                address: [],
            });
        }

        const { name, phone, district, city, house, state, pincode } = req.body;
        address.address.push({
            name,
            phone,
            district,
            city,
            house,
            state,
            pincode
        });

        await address.save();
        res.status(200).json({ msg: 'Address added successfully', address });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Load Edit Address
const loadEditAddress = async (req, res, next) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const addressId = req.query.addressId;
        const address = await addressModel.findOne({ userId: req.session.user_id });

        res.render("editAddress", {
            user: userData,
            address: address.address.find(a => a._id.toString() === addressId)
        });
    } catch (error) {
        next(error);
    }
};

// Edit address
const editAddress = async (req, res, next) => {
    try {
        const addressId = req.body.addressId;

        let address = await addressModel.findOne({ 'address._id': addressId });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const index = address.address.findIndex(a => a._id.toString() === addressId);
        const { name, phone, district, city, house, state, pincode } = req.body;

        address.address[index].name = name;
        address.address[index].phone = phone;
        address.address[index].district = district;
        address.address[index].city = city;
        address.address[index].house = house;
        address.address[index].state = state;
        address.address[index].pincode = pincode;

        await address.save();
        res.status(200).json({ msg: 'Address updated successfully', address: address.address[index] });
    } catch (error) {
        next(error);
    }
};

// Delete Address
const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body;
        
        const result = await addressModel.updateOne(
            { 'address._id': addressId },
            { $pull: { address: { _id: addressId } } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ msg: 'Address deleted successfully' });
    } catch (error) {
        console.log(error);
    }
};

// Edit profile
const editProfile = async (req, res) => {
    const userId = req.session.user_id;
    const { name, phone } = req.body;

    try {
        const updatedUser = await userModel.findByIdAndUpdate(userId, { name, phone }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// hash-password
const hashPassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

// Load edit password
const loadEditPassword = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('editPassword', { user: userData });
    } catch (error) {
        console.log('error');
    }
};

// Edit password
const changePassword = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        if (userData) {
            const passwordMatch = await bcrypt.compare(req.body.currentPassword, userData.password);
            if (passwordMatch) {
                const hashedPassword = await hashPassword(req.body.newPassword);
                userData.password = hashedPassword;
                await userData.save();
                return res.json({ success: true });
            } else {
                return res.status(400).json({ message: "Entered old password is wrong." });
            }
        } else {
            return res.status(404).json({ message: "User not found." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Load forget password
const loadForgetPassword = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('forgetPassword', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

// Send Password Reset Link
const sendPasswordLink = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.body.email });

        if (user) {
            if (user.isGoogleAuth) {
                return res.status(400).json({ message: 'Unable to change password. Your account is linked with Google.' });
            }

            const token = crypto.randomBytes(20).toString('hex');
            req.session.token = token;
            req.session.email = req.body.email;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: req.body.email,
                subject: 'Your Password Reset Link',
                html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <h3>Reset Your Password</h3>
                        <p>Click the link below to reset your password:</p>
                        <a href="http://localhost:3000/reset-password?token=${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        <p>Thanks for using our service!</p>
                        <p>Best regards,<br>The NEXUS Team</p>
                    </div>
                </div>`
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
                    res.status(500).json({ message: 'Error sending email' });
                } else {
                    res.status(200).json({ message: 'Password reset link has been sent to your email' });
                }
            });

        } else {
            res.status(400).json({ message: 'No such email exists. Please create an account.' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset Password Form
const renderResetPasswordForm = async (req, res) => {
    try {
        const token = req.query.token;

        if (!token) {
            return res.redirect('/login');
        }

        const userData = await userModel.findOne({ email: req.session.email });

        res.render('resetPasswordForm', { token, user: userData });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

// Handle Password Resett
const handleResetPassword = async (req, res) => {
    try {
        const token = req.body.token;
        const newPassword = req.body.password;

        if (token === req.session.token) {
            const hashedPassword = await hashPassword(newPassword);

            await userModel.findOneAndUpdate(
                { email: req.session.email },
                { password: hashedPassword }
            );

            delete req.session.token;

            res.status(200).json({ message: 'Password reset successful' });
        } else {
            res.status(400).send('Invalid token');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};





module.exports = {
    profile,
    loadAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    editProfile,
    loadEditPassword,
    changePassword,
    loadForgetPassword,
    sendPasswordLink,
    renderResetPasswordForm,
    handleResetPassword,
};
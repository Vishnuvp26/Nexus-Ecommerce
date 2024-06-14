const adminModel = require('../models/adminModel');
const bcrypt = require("bcrypt"); 
const userModel = require('../models/userModel');

// Admin Login Page GET
const adminLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        res.send(error.message);
    }
};

// Admin Login POST
const adminPostLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.redirect('/admin');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.redirect('/admin');
        }
        
        req.session.admin_id = admin._id;
        res.redirect('/admin/dashboard');
        
    } catch (error) {
        res.redirect('/admin');
    }
};

// Admin Logout
const adminLogout = async (req, res) => {
    try {
        delete req.session.admin_id;
        res.redirect('/admin');
    } catch (error) {
        console.log(error);
    }
};

// Dashboard
const loadDashboard = async (req, res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        res.send(error.message);
    }
};

// View User
const viewuser = async (req, res) => {
    try {
        res.render('users');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Block User
const blockUser = async (req, res) => {
    try {
        const id = req.params.id;
        await userModel.updateOne({ _id: id }, { $set: { is_blocked: true } });
        res.status(200).json({ success: true, message: 'User has been successfully blocked.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Unblock User
const unblockUser = async (req, res) => {
    try {
        const id = req.params.id;
        await userModel.updateOne({ _id: id }, { $set: { is_blocked: false } });
        res.status(200).json({ success: true, message: 'User has been successfully unblocked.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    adminLogin,
    adminLogout,
    adminPostLogin,
    loadDashboard,
    blockUser,
    unblockUser,
    viewuser,
};  
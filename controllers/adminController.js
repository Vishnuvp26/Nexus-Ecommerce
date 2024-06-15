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


module.exports = {
    adminLogin,
    adminLogout,
    adminPostLogin,
    loadDashboard,
}; 
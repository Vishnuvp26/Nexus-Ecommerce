const adminModel = require('../../models/adminModel');
const bcrypt = require("bcrypt"); 
const userModel = require('../../models/userModel');

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
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        
        req.session.admin_id = admin._id;
        return res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
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
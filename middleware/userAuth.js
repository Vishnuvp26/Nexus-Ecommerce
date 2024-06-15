const userModel = require('../models/userModel');

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const userData = await userModel.findOne({ _id: req.session.user_id });
            if (userData.is_blocked == false) {
                next();
            } else {
                delete req.session.user_id;
                req.sesion.message = 'You are blocked by admin';
                return res.redirect('/login');
            }
        } else {
            return res.redirect("/login");
        }
    } catch (error) {
        res.send(error.message);
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect('/');
        } else {
            next();
        }
    } catch (error) {
        res.send(error.message);
    }
};


module.exports = {
    isLogout,
    isLogin,
};
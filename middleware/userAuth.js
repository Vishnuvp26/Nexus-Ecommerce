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

const authMiddleware = async (req, res, next) => {
    try {
        if (req.session && req.session.isLogin) {
            const user = await userModel.findById(req.session.user_id);
            if (user) {
                res.locals.isAuthenticated = true;
                res.locals.user = user;
            } else {
                res.locals.isAuthenticated = false;
                res.locals.user = null;
            }
        } else {
            res.locals.isAuthenticated = false;
            res.locals.user = null;
        }
        next();
    } catch (error) {
        res.send(error.message);
    }
};

module.exports = {
    isLogout,
    isLogin,
    authMiddleware
};
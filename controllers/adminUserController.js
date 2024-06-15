const userModel = require('../models/userModel'); 

// User table
const loadUser = async (req, res, next) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * 5;

        const userData = await userModel.find({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ]
        }).skip(skip).limit(5);

        const totalUsers = await userModel.countDocuments({
            $or: [
                { name: { $regex: "." + search + ".", $options: "i" } },
                { email: { $regex: "." + search + ".", $options: "i" } },
            ],
        });

        const totalPages = Math.ceil(totalUsers / 5);
        res.render('users', { userData: userData, currentPage: page, totalPages: totalPages, searchQuery: search });
    } catch (error) {
        next(error);
    }
};  

// Block user
const blockUser = async (req, res, next) => {
    try {
        const id = req.query.id;
        await userModel.updateOne({ _id: id }, { $set: { is_blocked: true } });

        if (req.session.user_id && id === req.session.user_id) {
            delete req.session.user_id;
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Unblock user
const unblockUser = async (req, res, next) => {
    try {
        const id = req.query.id;
        await userModel.updateOne({ _id: id }, { $set: { is_blocked: false } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};  

module.exports = {
    loadUser,
    blockUser,
    unblockUser
};
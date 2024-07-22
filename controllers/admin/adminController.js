const adminModel = require('../../models/adminModel');
const bcrypt = require("bcrypt");
const orderModel = require('../../models/orderModel');
const walletModel = require('../../models/walletModel');

// Admin Login Page GET
const adminLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error)
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
        console.log(error)
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
        console.log(error)
    }
};

// List Orders
const loadOrdersList = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        let orderData;

        if (search) {
            orderData = await orderModel.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                {
                    $match: {
                        $or: [
                            { "user.name": { $regex: ".*" + search + ".*", $options: "i" } },
                            { status: { $regex: ".*" + search + ".*", $options: "i" } },
                            { paymentStatus: { $regex: ".*" + search + ".*", $options: "i" } },
                            { orderId: { $regex: ".*" + search + ".*", $options: "i" } },
                        ],
                    },
                },
                { $sort: { date: -1 } },
                { $skip: skip },
                { $limit: 5 },
            ]);
        } else {
            orderData = await orderModel.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                { $sort: { date: -1 } },
                { $skip: skip },
                { $limit: 5 },
            ]);
        }

        const totalOrders = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $match: {
                    "user.name": { $regex: ".*" + search + ".*", $options: "i" },
                },
            },
            { $count: "totalOrders" },
        ]);

        const totalPages = totalOrders.length > 0 ? Math.ceil(totalOrders[0].totalOrders / limit) : 0;

        res.render('orders', { orders: orderData, currentPage: page, totalPages: totalPages, searchQuery: search });
    } catch (error) {
        console.log(error);
    }
};

// Admin order Details
const adminOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.id;

        const order = await orderModel.findById(orderId).populate('userId').exec();

        if (!order) {
            return res.render('orderDetails', { order: null, error: 'Order not found!' });
        }

        res.render('orderDetails', { order, error: null });
    } catch (error) {
        console.log(error);
    }
};

// Change Status
const updateOrderStatus = async (req, res) => {
    try {

        const { orderId, itemId, currentStatus } = req.body;

        const order = await orderModel.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        let status = true;
        order.items.forEach((item) => {
            if (item._id.toString() === itemId) {
                item.itemStatus = currentStatus;
            }
            if (item.itemStatus !== "Delivered") {
                status = false;
            }
        });

        if (status) {
            order.status = "Completed";
            order.paymentStatus = "Success";
        } else {
            order.status = "Pending";
            order.paymentStatus = "Pending";
        }

        await order.save();

        res.json({ success: true, status: order.status, paymentStatus: order.paymentStatus });
    } catch (error) {
        console.error('Error updating order status:', error);
    }
};

// Filter intervals
const filterInterval = async (req, res, next) => {
    try {
        const interval = req.query.interval;
        let startDate;
        let today = new Date();

        switch (interval) {
            case "daily":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 1
                );
                break;
            case "weekly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 7
                );
                break;
            case "monthly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    today.getDate()
                );
                break;
            case "yearly":
                startDate = new Date(
                    today.getFullYear() - 1,
                    today.getMonth(),
                    today.getDate()
                );
                break;
            default:
                startDate = new Date();
                break;
        }
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                    date: { $gte: startDate, $lte: new Date() },
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let totalSales = orderData.length;

        res.render("salesReport", {
            orders: orderData,
            totalSales: totalSales,
        });
    } catch (error) {
        console.log(error)
    }
};

// Filter report
const filterReport = async (req, res, next) => {
    try {
        const startDate = new Date(req?.query?.startDate);
        const endDate = new Date(req?.query?.endDate);
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let totalSales = orderData.length;

        res.render("salesReport", {
            orders: orderData,
            totalSales: totalSales,
        });
    } catch (error) {
        console.log(error)
    }
};

// Sales report
const loadSalesReport = async (req, res) => {
    try {
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let totalSales = orderData.length;

        res.render("salesReport", {
            orders: orderData,
            totalSales: totalSales,
        });
    } catch (error) {
        console.log(error)
    }
};

// Approve Return
const returnApproval = async (req, res, next) => {
    try {
        const { orderId, itemId, status } = req.body;
        const order = await orderModel.findById(orderId);
        let wallet = await walletModel.findOne({ userId: req.session.user_id });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let completed = 1;
        for (let item of order.items) {
            if (item._id.toString() === itemId) {
                if (status === "Approve") {
                    item.itemStatus = "Returned";
                    item.isApproved = true;

                    if (!wallet) {
                        wallet = new walletModel({
                            userId: req.session.user_id,
                            balance: 0,
                            history: [],
                        });
                    }

                    wallet.history.push({
                        amount: item.finalPrice,
                        transactionType: "Credit",
                        newBalance: wallet.balance + Number(item.finalPrice * item.quantity),
                    });
                    wallet.balance += Number(item.finalPrice * item.quantity);
                    await wallet.save();
                } else {
                    item.itemStatus = "Delivered";
                    item.isApproved = false;
                }
            }
            if (!["Delivered", "Cancelled", "Returned"].includes(item.itemStatus)) {
                completed = 0;
            }
        }

        if (completed === 1) {
            order.status = "Completed";
            order.paymentStatus = "Done";
        } else {
            order.status = "Ordered";
        }
        await order.save();

        res.json({ success: true, status: order.status, paymentStatus: order.paymentStatus });
    } catch (error) {
        next(error);
    }
};
  


module.exports = {
    adminLogin,
    adminLogout,
    adminPostLogin,
    loadDashboard,
    loadOrdersList,
    adminOrderDetails,
    updateOrderStatus,
    loadSalesReport,
    filterInterval,
    filterReport,
    loadSalesReport,
    returnApproval
};
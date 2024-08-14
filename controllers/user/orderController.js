const mongoose = require("mongoose");
const userModel = require('../../models/userModel');
const addressModel = require('../../models/addressModel');
const cartModel = require('../../models/cartModel');
const orderModel = require('../../models/orderModel');
const productModel = require('../../models/productModel');
const walletModel = require('../../models/walletModel');
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.SECRET_KEY
});

// create order
const createOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized user" });
        }

        const cartData = await cartModel.findOne({ userId }).populate({
            path: "items.productId",
            populate: {
                path: "category",
                model: "Category"
            }
        });

        const addressId = new mongoose.Types.ObjectId(req.body.selectedAddress);
        const addressArray = await addressModel.aggregate([
            { $unwind: "$address" },
            { $match: { "address._id": addressId } },
        ]);

        if (!addressArray || addressArray.length === 0 || !cartData) {
            return res.redirect("/checkout");
        }

        const address = addressArray[0].address;

        const orderData = new orderModel({
            orderId: Math.floor(100000 + Math.random() * 900000).toString(),
            userId,
            paymentMethod: req.body.paymentMethod,
            totalPrice: req.body.totalprice,
            address: {
                name: address.name,
                phone: address.phone,
                district: address.district,
                city: address.city,
                house: address.house,
                state: address.state,
                pincode: address.pincode,
            },
            items: [],
            status: "Ordered",
            date: Date.now(),
        });

        for (const item of cartData.items) {
            let finalPrice = item.productId.price;
            if (item.productId.offerPrice) {
                finalPrice = item.productId.offerPrice;
            }
            orderData.items.push({
                productId: item.productId._id,
                productName: item.productId.productName,
                categoryName: item.productId.category.categoryName,
                image: item.productId.image[0],
                quantity: item.quantity,
                price: item.productId.price,
                finalPrice: finalPrice,
            });

            await productModel.findByIdAndUpdate(
                item.productId._id,
                { $inc: { quantity: -item.quantity } }
            );
        }

        if (orderData.paymentMethod === "cod") {
            if (req.body.totalprice > 1000) {
                return res.json({ success: false, message: "Cannot place order with COD for amount above 1000" });
            }
            orderData.paymentStatus = "Pending";

        } else if (orderData.paymentMethod === "razorpay") {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: req.body.totalprice * 100,
                currency: "INR",
                receipt: orderData.orderId,
            });
            orderData.paymentStatus = "Success";
            orderData.razorpayOrderId = razorpayOrder.id;
        } else {
            orderData.paymentStatus = "Paid";
        }

        const savedOrder = await orderData.save();

        await cartModel.findOneAndUpdate({ userId }, { $set: { items: [] } });
        req.session.orderId = savedOrder._id;

        if (orderData.paymentMethod === "razorpay") {
            return res.json({
                success: true,
                message: "Order created, redirecting to Razorpay...",
                orderId: savedOrder._id,
                razorpayOrderId: orderData.razorpayOrderId,
                key: process.env.KEY_ID,
                amount: req.body.totalprice * 100,
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
            });
        } else {
            return res.json({ success: true, message: "Order placed successfully" });
        }
    } catch (error) {
        console.log(error)
    }
};

// Order success
const orderSuccess = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('orderPlaced', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

// Order failure
const orderFailed = async (req, res) => {
    try {
        const userId = req.session.user_id;
        if (!userId) {
            return res.redirect('/shop');
        }

        const orderId = req.session.orderId;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.paymentStatus = "Pending";
        order.status = "Pending";
        for (let item of order.items) {
            item.itemStatus = "Pending";
        }

        await order.save();

        const userData = await userModel.findOne({ _id: userId });
        res.render('orderFailure', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

// Pay now for razorpay
const payNow = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const order = await orderModel.findById(orderId).populate('userId');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const totalPrice = order.totalPrice;

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: totalPrice * 100,
            currency: "INR",
            receipt: order.orderId,
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
            success: true,
            message: "Redirecting to Razorpay...",
            razorpayOrderId: razorpayOrder.id,
            key: process.env.KEY_ID,
            amount: totalPrice * 100,
            name: order.userId.name,
            email: order.userId.email,
            phone: order.address.phone,
        });
    } catch (error) {
        console.log(error);
    }
};  


// Update status after paynow
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        const order = await orderModel.findById(orderId);

        order.status = 'Pending';
        for (let item of order.items) {
            item.itemStatus = "Ordered";
        }
        order.paymentStatus = 'Success';
        order.razorpayPaymentId = paymentId;
        order.razorpaySignature = signature;
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully.',
        });

    } catch (error) {
        console.log(error)
    }
};

// View orders
const viewOrders = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const userData = await userModel.findOne({ _id: req.session.user_id });
        const totalOrders = await orderModel.countDocuments({ userId: req.session.user_id });
        const orderData = await orderModel.find({ userId: req.session.user_id }).sort({ date: -1 }).skip(skip).limit(limit);

        const totalPages = Math.ceil(totalOrders / limit);

        res.render('viewOrders', { 
            user: userData, 
            order: orderData, 
            currentPage: page, 
            totalPages 
        });
    } catch (error) {
        console.log(error);
    }
};


// Order Details
const orderDetails = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const orderId = req.query.orderId;

        if (!userId || !orderId) {
            return res.redirect('/')
        }

        const userData = await userModel.findOne({ _id: userId });
        const orderData = await orderModel.findOne({ _id: orderId });

        res.render('orderDetails', { user: userData, order: orderData });
    } catch (error) {
        res.render('500');
        console.log(error);
    }
};

// Cancel order
const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.body;
        const orderData = await orderModel.findOne({ _id: orderId });

        let allItemsCancelled = true;
        let refundAmount = 0;

        for (let item of orderData.items) {
            if (item.productId == productId) {
                item.itemStatus = "Cancelled";
                
                const product = await productModel.findById(item.productId);
                const itemPrice = product.offerPrice ? product.offerPrice : product.price;
                
                refundAmount = itemPrice * item.quantity;

                await productModel.findByIdAndUpdate(
                    item.productId,
                    { $inc: { quantity: item.quantity } }
                );
            }
            if (item.itemStatus !== "Cancelled") {
                allItemsCancelled = false;
            }
        }

        orderData.status = allItemsCancelled ? "Completed" : "Pending";
        await orderData.save();

        if (refundAmount > 0 && orderData.paymentMethod === "razorpay") {
            let wallet = await walletModel.findOne({ userId: orderData.userId });

            if (!wallet) {
                wallet = new walletModel({
                    userId: orderData.userId,
                    balance: refundAmount,
                    history: [{
                        amount: refundAmount,
                        transactionType: "Credit",
                        newBalance: refundAmount,
                    }]
                });
            } else {
                wallet.history.push({
                    amount: refundAmount,
                    transactionType: "Credit",
                    newBalance: wallet.balance + refundAmount,
                });
                wallet.balance += refundAmount;
            }

            await wallet.save();
        }

        res.json({ success: true, message: "Order item cancelled successfully." });
    } catch (error) {
        console.log(error)
    }
};


// Return request
const returnProduct = async (req, res) => {
    try {
        const { productId, orderId, reason } = req.body;
        const orderData = await orderModel.findOne({ _id: orderId });

        let itemFound = false;
        for (let item of orderData.items) {
            if (item.productId.toString() === productId && item.itemStatus === "Delivered") {
                item.itemStatus = "Return Pending";
                item.reason = reason;
                itemFound = true;
                await item.save();
            }
        }

        orderData.status = "Return Requested";
        await orderData.save();

        res.json({ success: true, message: "Return request submitted successfully" });
    } catch (error) {
        console.log(error)
    }
};



module.exports = {
    createOrder,
    orderSuccess,
    viewOrders,
    orderDetails,
    cancelOrder,
    returnProduct,
    orderFailed,
    payNow,
    updateOrderStatus
};
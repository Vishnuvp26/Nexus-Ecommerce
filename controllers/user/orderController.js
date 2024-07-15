const mongoose = require("mongoose");
const userModel = require('../../models/userModel');
const addressModel = require('../../models/addressModel');
const cartModel = require('../../models/cartModel');
const orderModel = require('../../models/orderModel');
const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');
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

        // Check if address and cart data exist
        const addressId = new mongoose.Types.ObjectId(req.body.selectedAddress);
        const addressArray = await addressModel.aggregate([
            { $unwind: "$address" },
            { $match: { "address._id": addressId } },
        ]);

        if (!addressArray || addressArray.length === 0 || !cartData) {
            return res.redirect("/checkout");
        }

        // Extract address details
        const address = addressArray[0].address;

        // Create order data
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

        // Populate order items
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

            // Decrease product quantity
            await productModel.findByIdAndUpdate(
                item.productId._id,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Handle payment method specifics
        if (orderData.paymentMethod === "cod") {
            // Check COD limit
            if (req.body.totalprice > 3000) {
                return res.json({ success: false, message: "Cannot place order with COD for amount above 3000" });
            }
            orderData.paymentStatus = "Pending";
        } else if (orderData.paymentMethod === "razorpay") {
            // Create Razorpay order
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: req.body.totalprice * 100, // Amount in smallest currency unit (paise for INR)
                currency: "INR",
                receipt: orderData.orderId, // Unique order ID
            });

            orderData.paymentStatus = "Pending";
            orderData.razorpayOrderId = razorpayOrder.id; // Save Razorpay order ID
        } else {
            orderData.paymentStatus = "Paid"; // Handle other payment methods
        }

        // Save order
        const savedOrder = await orderData.save();

        // Clear cart items after successful order creation
        await cartModel.findOneAndUpdate({ userId }, { $set: { items: [] } });

        // Save order ID to session
        req.session.orderId = savedOrder._id;

        // Redirect or respond based on payment method
        if (orderData.paymentMethod === "razorpay") {
            return res.json({
                success: true,
                message: "Order created, redirecting to Razorpay...",
                orderId: savedOrder._id,
                razorpayOrderId: orderData.razorpayOrderId,
                key: process.env.KEY_ID,
                amount: req.body.totalprice * 100, // Amount in smallest currency unit
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
            });
        } else {
            return res.json({ success: true, message: "Order placed successfully" });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.json({ success: false, message: "Error creating order" });
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

// View orders
const viewOrders = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const orderData = await orderModel.find({ userId: req.session.user_id }).sort({ date: -1 });
    
        res.render('viewOrders', { user: userData, order: orderData });
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
            return redirect('/')
        }

        const userData = await userModel.findOne({ _id: userId });
        const orderData = await orderModel.findOne({ _id: orderId });

        res.render('orderDetails', { user: userData, order: orderData });
    } catch (error) {
        console.log(error);
    }
};

// Cancel order
const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.body;
        const orderData = await orderModel.findOne({ _id: orderId });

        let allItemsCancelled = true;
        let refund = false;

        for (let item of orderData.items) {
            if (item.productId == productId) {
                item.itemStatus = "Cancelled";
                refund = true;

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

        if (refund && orderData.paymentMethod === "razorpay") {
            let wallet = await walletModel.findOne({ userId: orderData.userId });

            if (!wallet) {
                wallet = new walletModel({
                    userId: orderData.userId,
                    balance: orderData.totalPrice,
                    history: [{
                        amount: orderData.totalPrice,
                        transactionType: "Credit",
                        newBalance: orderData.totalPrice,
                    }]
                });
            } else {
                wallet.history.push({
                    amount: orderData.totalPrice,
                    transactionType: "Credit",
                    newBalance: wallet.balance + orderData.totalPrice,
                });
                wallet.balance += orderData.totalPrice;
            }

            await wallet.save();
        }

        res.json({ success: true, message: "Order item cancelled successfully." });
    } catch (error) {
        console.log('Error cancelling order:', error);
        res.json({ success: false, message: "Error cancelling order." });
    }
};


module.exports = {
    createOrder,
    orderSuccess,
    viewOrders,
    orderDetails,
    cancelOrder
};
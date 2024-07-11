const mongoose = require("mongoose");
const userModel = require('../../models/userModel');
const addressModel = require('../../models/addressModel');
const cartModel = require('../../models/cartModel');
const orderModel = require('../../models/orderModel');
const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');

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

        console.log(cartData, 'CARTDATA IN CREATE ORDER');

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
            if (req.body.totalprice > 10000) {
                return res.json({ success: false, message: "Cannot place order with COD for amount above 10000" });
            }
            orderData.paymentStatus = "Pending";
        } else {
            orderData.paymentStatus = "Paid";
        }

        const savedOrder = await orderData.save();

        await cartModel.findOneAndUpdate({ userId }, { $set: { items: [] } });

        req.session.orderId = savedOrder._id;
        res.json({ success: true, message: "Order placed successfully" });

    } catch (error) {
        console.error('Error creating order:', error);
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
        for (let item of orderData.items) {
            if (item.productId == productId) {
                item.itemStatus = "Cancelled";

                await productModel.findByIdAndUpdate(
                    item.productId,
                    { $inc: { quantity: item.quantity } }
                );
            }
            if (item.itemStatus !== "Cancelled") {
                allItemsCancelled = false;
            }
        }

        orderData.status = allItemsCancelled ? "Cancelled" : "Pending";
        await orderData.save();

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
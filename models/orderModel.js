const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
    },
    userId: {
        type: ObjectId,
        required: true,
        ref: "User"
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    items: [
        {
            productId: {
                type: ObjectId,
                required: true,
                ref: "Product"
            },
            productName: {
                type: String,
                required: true
            },
            categoryName: {
                type: String,
                required: true
            },
            image: {
                type: String
            },
            quantity: {
                type: Number,
                required: true
            },
            itemStatus: {
                type: String,
                required: true,
                default: "Ordered"
            },
            price: {
                type: Number,
                required: true
            },
            finalPrice: {
                type: Number,
                required: true
            },
            reason: {
                type: String,
            },
            isApproved: {
                type: Boolean,
                default: false
            },
        },
    ],
    address: {
        name: {
            type: String
        },
        phone: {
            type: String
        },
        district: {
            type: String
        },
        city: {
            type: String
        },
        house: {
            type: String
        },
        state: {
            type: String
        },
        pincode: {
            type: String
        },
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "Ordered"
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
});

module.exports = mongoose.model("Order", orderSchema);
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "Users",
        required: true
    },
    balance: {
        type: Number
    },
    history: [
        {
            date: {
                type: Date,
                default: Date.now
            },
            amount: {
                type: Number
            },
            transactionType: {
                type: String
            },
            newBalance: {
                type: Number
            },
        },
    ],
});

module.exports = mongoose.model("Wallet", walletSchema);
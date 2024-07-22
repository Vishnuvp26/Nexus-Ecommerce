const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');

const categoryOfferSchema = mongoose.Schema({
    categoryId: {
        type: ObjectId,
        ref: "Category"
    },
    offerPercentage: {
        type: Number
    },
    expiryDate: {
        type: Date,
        index: {
            expires: 0
        }
    }
});

module.exports = mongoose.model("categoryOffer", categoryOfferSchema);
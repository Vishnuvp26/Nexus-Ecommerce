const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");

const productSchema = mongoose.Schema({

    productName: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number },
    image: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    productDec: { type: String },
    status: { type: String, required: true, default: "active" },
    quantity: { type: Number, required: true },
    addedDate: { type: Date, required: true },
    highlights: [{ type: String }],
    productDetails: { type: String }
    
});


module.exports = mongoose.model('Product', productSchema);

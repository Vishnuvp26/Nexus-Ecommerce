const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: [
        {
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
    }]
});

module.exports = mongoose.model('Address', addressSchema);
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    
    name: { type: String, required: true },
    phone: { type: Number },
    email: { type: String, required: true },
    password: { type: String },
    is_blocked: { type: Boolean, required: true, default: false },
    referal: { type: String }
});

module.exports = mongoose.model('User', userSchema);

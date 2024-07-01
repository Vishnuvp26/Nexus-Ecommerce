const userModel = require('../models/userModel');
const addressModel = require('../models/addressModel');

// Profile
const profile = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('profile', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

// Fetch adress
const loadAddress = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const addressData = await addressModel.findOne({ userId: req.session.user_id });

        res.render('address', { user: userData, addresses: addressData ? addressData.address : [] });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

// Add address
const addAddress = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        let address = await addressModel.findOne({ userId: userData._id });

        if (!address) {
            address = new addressModel({
                userId: userData._id,
                address: [],
            });
        }

        const { name, phone, district, city, house, state, pincode } = req.body;
        address.address.push({
            name,
            phone,
            district,
            city,
            house,
            state,
            pincode
        });

        await address.save();
        res.status(200).json({ msg: 'Address added successfully', address });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Load Edit Address
const loadEditAddress = async (req, res, next) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const addressId = req.query.addressId;
        const address = await addressModel.findOne({ userId: req.session.user_id });

        res.render("editAddress", {
            user: userData,
            address: address.address.find(a => a._id.toString() === addressId)
        });
    } catch (error) {
        next(error);
    }
};

// Edit address
const editAddress = async (req, res, next) => {
    try {
        const addressId = req.body.addressId;

        let address = await addressModel.findOne({ 'address._id': addressId });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        // Find the index of the address to update
        const index = address.address.findIndex(a => a._id.toString() === addressId);
        const { name, phone, district, city, house, state, pincode } = req.body;

        address.address[index].name = name;
        address.address[index].phone = phone;
        address.address[index].district = district;
        address.address[index].city = city;
        address.address[index].house = house;
        address.address[index].state = state;
        address.address[index].pincode = pincode;

        await address.save();
        res.status(200).json({ msg: 'Address updated successfully', address: address.address[index] });
    } catch (error) {
        next(error);
    }
};

// Delete Address
const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body;
        
        const result = await addressModel.updateOne(
            { 'address._id': addressId },
            { $pull: { address: { _id: addressId } } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ msg: 'Address deleted successfully' });
    } catch (error) {
        console.log(error);
    }
};

    
module.exports = {
    profile,
    loadAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress
};
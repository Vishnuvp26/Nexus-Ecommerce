const couponModel = require('../../models/couponModel');

// View coupons
const loadCoupons = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const coupons = await couponModel.find()
            .sort({ addedDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalCoupons = await couponModel.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('coupon', { coupons, totalPages, currentPage: page });
    } catch (error) {
        console.log(error);
    }
};


// Add coupons
const addCoupon = async (req, res) => {
    try {
        const { couponCode, percentage, minPrice, maxRedeemAmount, expiryDate } = req.body;

        let coupon = await couponModel.findOne({ couponCode: couponCode });
        if (!coupon) {
            coupon = new couponModel({
                couponCode,
                percentage,
                minPrice,
                maxRedeemAmount,
                expiryDate
            });
            await coupon.save();
            return res.status(200).json({ message: 'Coupon added successfully' });
        } else {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
    } catch (error) {
        console.error('Error adding coupon:', error);
        return res.status(500).json({ message: 'Failed to add coupon' });
    }
};

// Edit coupons
const editCoupon = async (req, res) => {
    try {
        const { couponCode, percentage, minPrice, maxRedeemAmount, expiryDate } = req.body;

        await couponModel.updateOne(
            { _id: req.query.id },
            {
                $set: {
                    couponCode,
                    percentage,
                    minPrice,
                    maxRedeemAmount,
                    expiryDate
                }
            }
        )
        return res.status(200).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.log(error);
    }
}

// Delete coupons
const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        await couponModel.deleteOne({ _id: couponId });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
    }
};

// Check eligibility
const checkCoupon = async (req, res) => {
    try {
        const { couponId, totalPrice } = req.query;
        const coupon = await couponModel.findById(couponId);

        if (!coupon) {
            return res.json({ success: true, message: "Not a valid coupon" });
        } else if (coupon.minPrice > totalPrice) {
            return res.json({ success: true, message: "Not eligible for this coupon" });
        } else {
            const discountPercentage = coupon.percentage;
            const maxRedeemAmount = coupon.maxRedeemAmount;
            return res.json({
                success: true,
                discountPercentage,
                maxRedeemAmount,
            });
        }
    } catch (error) {
        console.error('Error checking coupon:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    loadCoupons,
    addCoupon,
    deleteCoupon,
    editCoupon,
    checkCoupon,
};
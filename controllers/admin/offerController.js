const productModel = require('../../models/productModel');
const productOfferModel = require('../../models/productOfferModel');
const categoryModel = require('../../models/categoryModel');
const categoryOfferModel = require('../../models/categoryOfferModel');

// Load product offer
const loadProductOffer = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const activeProducts = await productModel.find({ status: 'active' });
        const productOffers = await productOfferModel.find()
            .populate('productId')
            .skip(skip)
            .limit(limit);

        const totalProductOffers = await productOfferModel.countDocuments();

        const totalPages = Math.ceil(totalProductOffers / limit);

        res.render('productOffer', { activeProducts, productOffers, totalPages, currentPage: page });
    } catch (error) {
        console.log(error);
    }
};


// Add product offer
const addProductOffer = async (req, res) => {
    try {
        const { productId, offerPercentage, expiryDate } = req.body;
        let productOffer = await productOfferModel.findOne({ productId });
        if (!productOffer) {
            productOffer = new productOfferModel({ productId, offerPercentage, expiryDate });
        } else {
            productOffer.offerPercentage = offerPercentage;
            productOffer.expiryDate = expiryDate;
        }
        await productOffer.save();
        
        res.status(200).json({ success: true, message: "Product offer added successfully" });
    } catch (error) {
        console.log(error);
    }
};

// Edit product offer
const editProductOffer = async (req, res) => {
    try {
        const { offerId, offerPercentage, expiryDate } = req.query;
        const productOffer = await productOfferModel.findById(offerId);

        if (productOffer) {
            productOffer.offerPercentage = offerPercentage;
            productOffer.expiryDate = new Date(expiryDate);
            await productOffer.save();
            res.status(200).json({ success: true, message: "Product offer updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Product offer not found" });
        }
    } catch (error) {
        console.log(error);
    }
};

// Delete product offer
const removeProductOffer = async (req, res) => {
    try {
        const offer = await productOfferModel.deleteOne({ _id: req.query.id });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
    }
};

// Load category offer
const loadCategoryOffer = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const activeCategories = await categoryModel.find({ status: 'active' });
        const categoryOffers = await categoryOfferModel.find()
            .populate('categoryId')
            .skip(skip)
            .limit(limit);

        const totalCategoryOffers = await categoryOfferModel.countDocuments();

        const totalPages = Math.ceil(totalCategoryOffers / limit);

        res.render('categoryOffer', { activeCategories, categoryOffers, totalPages, currentPage: page });
    } catch (error) {
        console.log(error);
    }
};


// Add category offer
const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, offerPercentage, expiryDate } = req.body;
        let categoryOffer = await categoryOfferModel.findOne({ categoryId });
        if (!categoryOffer) {
            categoryOffer = new categoryOfferModel({ categoryId, offerPercentage, expiryDate });
        } else {
            categoryOffer.offerPercentage = offerPercentage;
            categoryOffer.expiryDate = expiryDate;
        }
        await categoryOffer.save();
        
        res.status(200).json({ success: true, message: "Category offer added successfully" });
    } catch (error) {
        console.log(error);
    }
};

// Edit category offer
const editCategoryOffer = async (req, res) => {
    try {
        const { offerId, offerPercentage, expiryDate } = req.query;
        const categoryOffer = await categoryOfferModel.findById(offerId);

        if (categoryOffer) {
            categoryOffer.offerPercentage = offerPercentage;
            categoryOffer.expiryDate = new Date(expiryDate);
            await categoryOffer.save();
            res.status(200).json({ success: true, message: "Category offer updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Category offer not found" });
        }
    } catch (error) {
        console.log(error);
    }
};

// Delete category offer
const removeCategoryOffer = async (req, res) => {
    try {
        const offer = await categoryOfferModel.deleteOne({ _id: req.query.id });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    loadProductOffer,
    addProductOffer,
    editProductOffer,
    removeProductOffer,
    loadCategoryOffer,
    addCategoryOffer,
    editCategoryOffer,
    removeCategoryOffer,
};

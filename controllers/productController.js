const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// Load Products
const loadProduct = async (req, res) => {
    try {
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const productData = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
        })
        .populate('category')
        .sort({ addedDate: -1 })
        .skip(skip)
        .limit(limit);

        const totalProducts = await Product.countDocuments({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
        });

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products: productData,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: search,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Load add products
const loadAddProducts = async (req, res, next) => {
    try {
        const category = await Category.find();
        res.render('addProducts', { category: category });
    } catch (error) {
        next(error);
    }
};

// Adding Products
const addProducts = async (req, res) => {
    try {
        const { productName, price, categoryName, productDescription, quantity, highlights, productDetails } = req.body;

        const category = await Category.findOne({ categoryName: categoryName });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const highlightsArray = highlights.split('\n').map(feature => feature.trim());

        const product = new Product({
            productName: productName,
            price: price,
            category: category._id,
            productDec: productDescription,
            quantity: quantity,
            highlights: highlightsArray,
            productDetails: productDetails,
            addedDate: new Date()
        });

        for (const file of req.files) {
            product.image.push(file.filename);
        }
        await product.save();
        res.status(201).json({ success: true, message: 'Product added successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add product', error: error.message });
    }
};

// List Products
const listProducts = async (req, res, next) => {
    try {
        const id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { status: "active" } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Unlist Products
const unlistProducts = async (req, res, next) => {
    try {
        const id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { status: "inactive" } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};


const checkAlready = async (req, res) => {
    try {
        const productName = req.query.productName;
        const product = await Product.findOne({ productName: productName });

        if (product) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking product name:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Load edit products menu
const loadEditProducts = async (req, res) => {
    try {
      const id = req.query.id;
      const category = await Category.find();
      const product = await Product.findOne({ _id: id }).populate('category');
      
      if (product) {
        res.render('editProducts', { product: product, category: category });
      } else {
        res.status(404).send('Product not found');
      }
    } catch (error) {
      console.log(error)
    }
};

// Edit products
const editProducts = async (req, res) => {
    try {
        const { categoryName, productName, price, quantity, productDescription, highlights, productDetails, deletedIndices } = req.body;
        const id = req.query.id;
        const category = await Category.findOne({ categoryName: categoryName });

        const highlightsArray = highlights.split('\n').map(feature => feature.trim());

        const product = await Product.findById(id);
        product.productName = productName;
        product.price = price;
        product.category = category._id;
        product.productDec = productDescription;
        product.quantity = quantity;
        product.highlights = highlightsArray;
        product.productDetails = productDetails;

        if (deletedIndices) {
            const indicesToDelete = JSON.parse(deletedIndices);
            product.image = product.image.filter((img, index) => !indicesToDelete.includes(index.toString()));
        }

        for (const file of req.files) {
            product.image.push(file.filename);
        }

        await product.save();

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false, error: error.message });
    }
};  

  

module.exports = {
    loadProduct,
    addProducts,
    loadAddProducts,
    listProducts,
    unlistProducts,
    loadEditProducts,
    checkAlready,
    editProducts
};

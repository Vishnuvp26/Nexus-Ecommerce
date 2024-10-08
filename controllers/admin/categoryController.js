const categoryModel = require('../../models/categoryModel');
const productModel = require('../../models/productModel');

// Load Category Page
const loadCategory = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * 5;

        const categoryData = await categoryModel.find({
            $or: [
                { categoryName: { $regex: ".*" + search + ".*", $options: "i" } }
            ]
        }).skip(skip).limit(5);

        const totalCategories = await categoryModel.countDocuments({
            $or: [
                { categoryName: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        });

        const totalPages = Math.ceil(totalCategories / 5);
        res.render('category', { categoryData: categoryData, currentPage: page, totalPages: totalPages, searchQuery: search });
    } catch (error) {
        console.log(error);
    }
};


// Add Category Modal
const addCategory = async (req, res) => {
    try {
        res.render('addCategory');
    } catch (error) {
        console.log(error);
    }
};
 
// Adding category
const addNewCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        
        const existingCategory = await categoryModel.findOne({
            categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') }
        });
        
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const newCategory = new categoryModel({ categoryName });
        await newCategory.save();
    
        return res.status(200).json({ message: 'Category added successfully' });
    } catch (err) {
        console.error(err);
    }
};

// Edit Category
const updateCategory = async (req, res) => {
    try {
        const { id, name } = req.body;

        await categoryModel.findByIdAndUpdate(id, { categoryName: name }, { new: true });

        const categoryData = await categoryModel.find();

        res.redirect('/admin/category');
    } catch (error) {
        const categoryData = await categoryModel.find();
        if (error.code === 11000) {
            res.status(400).render('category', { categoryData, error: 'Category name already exists' });
        } else {
            console.error(error);
        }
    }
};

// List Category
const listCategory = async (req, res) => {
    try {
        await categoryModel.findByIdAndUpdate(
            { _id: req.body.id },
            { $set: { status: "active" } }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error(error);
    }
};

// Unlist Category
const unlistCategory = async (req, res) => {
    try {
        await categoryModel.findByIdAndUpdate(
            { _id: req.body.id },
            { $set: { status: "inactive" } }
        );

        res.json({ success: true });
        
    } catch (error) {
        console.error(error);
    }
};

module.exports = {
    loadCategory,
    addCategory,
    addNewCategory,
    updateCategory,
    listCategory,
    unlistCategory,
}
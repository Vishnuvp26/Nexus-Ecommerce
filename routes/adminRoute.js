const express = require("express");
const adminRouter = express();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const adminUserController = require('../controllers/adminUserController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/multer')
const setNoCacheHeaders = require('../middleware/nocache');

// views
adminRouter.set("view engine", "ejs");
adminRouter.set("views", "./views/admin");

// login logout
adminRouter.get('/', adminAuth.isLogout, adminController.adminLogin);
adminRouter.post('/', adminController.adminPostLogin);
adminRouter.get("/dashboard", adminAuth.isLogin, adminController.loadDashboard);  
adminRouter.get("/logout", adminAuth.isLogin, adminController.adminLogout);

// category
adminRouter.get('/category', adminAuth.isLogin, categoryController.loadCategory);
adminRouter.get('/addCategory', adminAuth.isLogin, categoryController.addCategory);
adminRouter.post('/addNewCategory', adminAuth.isLogin, categoryController.addNewCategory);
adminRouter.post('/editCategory', adminAuth.isLogin, categoryController.updateCategory);
adminRouter.post('/listCategory', adminAuth.isLogin, categoryController.listCategory);
adminRouter.post('/unlistCategory', adminAuth.isLogin, categoryController.unlistCategory);

// users
adminRouter.get('/users', adminAuth.isLogin, adminUserController.loadUser);
adminRouter.get('/blockUser', adminAuth.isLogin, adminUserController.blockUser);
adminRouter.get('/unblockUser', adminAuth.isLogin, adminUserController.unblockUser);

// products
adminRouter.get('/products', adminAuth.isLogin, productController.loadProduct);
adminRouter.get('/addProducts', adminAuth.isLogin, productController.loadAddProducts);
adminRouter.post('/addProducts', adminAuth.isLogin, upload.array('images'), productController.addProducts);
adminRouter.post('/listProducts', adminAuth.isLogin, productController.listProducts);
adminRouter.post('/unlistProducts', adminAuth.isLogin, productController.unlistProducts);
adminRouter.get('/editProducts', adminAuth.isLogin, productController.loadEditProducts);
adminRouter.get('/checkAlready', adminAuth.isLogin, productController.checkAlready);
adminRouter.post('/editProducts', adminAuth.isLogin, upload.array('images'), productController.editProducts);

module.exports = adminRouter;
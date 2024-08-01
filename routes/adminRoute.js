const express = require("express");
const adminRouter = express();
const adminController = require('../controllers/admin/adminController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');
const adminUserController = require('../controllers/admin/adminUserController');
const orderController = require('../controllers/user/orderController');
const couponController = require('../controllers/admin/couponController');
const offerController = require('../controllers/admin/offerController');
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
adminRouter.post('/addProducts', adminAuth.isLogin, upload.any(), productController.addProducts);
adminRouter.post('/listProducts', adminAuth.isLogin, productController.listProducts);
adminRouter.post('/unlistProducts', adminAuth.isLogin, productController.unlistProducts);
adminRouter.get('/editProducts', adminAuth.isLogin, productController.loadEditProducts);
adminRouter.get('/checkAlready', adminAuth.isLogin, productController.checkAlready);
adminRouter.post('/editProducts', adminAuth.isLogin, upload.array('images'), productController.editProducts);

// Orders
adminRouter.get('/orderList', adminAuth.isLogin, adminController.loadOrdersList);
adminRouter.get('/orderDetails', adminAuth.isLogin, adminController.adminOrderDetails);
adminRouter.post('/updateOrderStatus', adminAuth.isLogin, adminController.updateOrderStatus);
adminRouter.post('/returnApproval', adminAuth.isLogin, adminController.returnApproval);

// Coupons
adminRouter.get('/coupons', adminAuth.isLogin, couponController.loadCoupons); 
adminRouter.post('/coupons/add', adminAuth.isLogin, couponController.addCoupon);
adminRouter.put('/coupons/edit', adminAuth.isLogin, couponController.editCoupon);
adminRouter.delete('/coupons/delete', adminAuth.isLogin, couponController.deleteCoupon); 

// Product offers
adminRouter.get('/productOffers', adminAuth.isLogin, offerController.loadProductOffer);
adminRouter.post('/addProductOffer', adminAuth.isLogin, offerController.addProductOffer);
adminRouter.post('/editProductOffer', adminAuth.isLogin, offerController.editProductOffer);
adminRouter.delete('/removeProductOffer', adminAuth.isLogin, offerController.removeProductOffer);

// Category offers
adminRouter.get('/categoryOffers', adminAuth.isLogin, offerController.loadCategoryOffer);
adminRouter.post('/addCategoryOffer', adminAuth.isLogin, offerController.addCategoryOffer);
adminRouter.post('/editCategoryOffer', adminAuth.isLogin, offerController.editCategoryOffer);
adminRouter.delete('/removeCategoryOffer', adminAuth.isLogin, offerController.removeCategoryOffer);

// Sales report
adminRouter.get('/salesReport', adminAuth.isLogin, adminController.loadSalesReport);
adminRouter.get('/filterInterval', adminAuth.isLogin, adminController.filterInterval);
adminRouter.get('/filter', adminAuth.isLogin, adminController.filterReport);

module.exports = adminRouter;
const userModel = require('../../models/userModel');
const addressModel = require('../../models/addressModel');
const cartModel = require('../../models/cartModel');
const couponModel = require('../../models/couponModel');
const productModel = require('../../models/productModel');

// Calculate total
function calculateCartTotal(cart) {
    if (!cart || cart.items.length === 0) {
        return 0;
    }
    let total = 0;
    cart.items.forEach(item => {
        total += item.productId.price * item.quantity;
    });
    return total;
};

// Render Cart
const loadCart = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const cartData = await cartModel.findOne({ userId: req.session.user_id })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            });

        let cartCount = 0;
        if (cartData) {
            cartCount = cartData.items.length;
        }
        res.render('cart', { 
            user: userData, 
            cartCount: cartCount, 
            cart: cartData, 
            calculateCartTotal: calculateCartTotal 
        });
    } catch (error) {
        console.log(error);
    }
};

// Add to cart
const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const already = await cartModel.findOne({ userId: req.session.user_id });

        if (!already) {
            const cartItem = new cartModel({
                userId: req.session.user_id,
                items: [{ productId: productId }],
            });
            await cartItem.save();
            return res.status(200).send('Added to cart successfully');
        } else {
            let flag = 0;
            already.items.forEach((item) => {
                if (item.productId == productId) {
                    flag = 1;
                }
            });
            if (flag == 0) {
                await cartModel.updateOne(
                    { userId: req.session.user_id },
                    {
                        $push: {
                            items: { productId: productId },
                        },
                    }
                );
                return res.status(200).send('Added to cart successfully');
            } else {
                return res.status(400).send('Product already exists in cart');
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).send('Internal server error');
    }
};

// Reduce cart quanity
const decrementCart = async (req, res, next) => {
    try {
        const { index } = req.body;
        const item = await cartModel.findOne({ userId: req.session.user_id });
        if (item.items[index].quantity > 1) {
            item.items[index].quantity--;
            await item.save();
            const total = item.items.reduce((acc, curr) => acc + curr.productId.price * curr.quantity, 0);
            res.json({ success: true, cartTotal: total });
        } else {
            res.json({ success: false, message: 'Quantity cannot be less than 1' });
        }
    } catch (error) {
        next(error);
    }
};

// Increase cart quantity
const incrementCart = async (req, res, next) => {
    try {
        const { index } = req.body;
        const item = await cartModel.findOne({ userId: req.session.user_id });
        if (item.items[index].quantity < 5) {
            item.items[index].quantity++;
            await item.save();
            const total = item.items.reduce((acc, curr) => acc + curr.productId.price * curr.quantity, 0);
            res.json({ success: true, cartTotal: total });
        } else {
            res.json({ success: false, message: "You can't buy more than 5 quantityssss" });
        }
    } catch (error) {
        next(error);
    }
};

// Remove cart
const removeFromCart = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const cart = await cartModel.findOne({ userId: req.session.user_id });

        if (cart) {
            const index = cart.items.findIndex(item => item.productId.toString() === productId);

            if (index !== -1) {
                cart.items.splice(index, 1);
                await cart.save();

                const total = cart.items.reduce((acc, curr) => acc + curr.productId.price * curr.quantity, 0);

                res.json({ success: true, cartTotal: total });
            } else {
                res.json({ success: false, message: 'Item not found in cart' });
            }
        } else {
            res.json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        next(error);
    }
};

// Stock Check
const stockCheck = async (req, res) => {
    try {
        const cart = await cartModel.findOne({ userId: req.session.user_id }).populate('items.productId');

        let isAvailable = true;
        let message = "";

        for (let item of cart.items) {
            const product = item.productId;

            if (product.status === 'inactive') {
                isAvailable = false;
                message = "The product is no longer exist";
                break;
            } else if (product.quantity === 0) {
                isAvailable = false;
                message = "Some items in your cart are currently unavailable";
                break;
            } else if (item.quantity > product.quantity) {
                isAvailable = false;
                message = "Some item's quantity in your cart is greater than the stock available";
                break;
            }
        }

        if (isAvailable) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Load checkout
const loadCheckout = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const couponData = await couponModel.find();
        const addressData = await addressModel.findOne({ userId: req.session.user_id });
        const cartData = await cartModel.findOne({ userId: req.session.user_id })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            });

        res.render('checkout', { 
            user: userData,  
            cart: cartData,
            coupons: couponData,
            addresses: addressData ? addressData.address : [] 
        });
    } catch (error) {
        console.log(error);
    }
};

// Checkout
const addNewAddress = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        let address = await addressModel.findOne({ userId: userData._id });

        console.log(address,'CART ADDRESSDATA');

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
        // res.redirect("/checkout");

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    loadCart,
    addToCart,
    calculateCartTotal,
    decrementCart,
    incrementCart,
    removeFromCart,
    stockCheck,
    loadCheckout,
    addNewAddress
};
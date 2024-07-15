const userModel = require('../../models/userModel');
const walletModel = require('../../models/walletModel');

// Wallet
const loadWallet = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const wallet = await walletModel.findOne({ userId: req.session.user_id }).lean();

        if (!wallet) {
            return res.render('wallet', { user: userData, balance: 0, history: [] });
        }

        const sortedHistory = wallet.history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.render('wallet', { user: userData, balance: wallet.balance, history: sortedHistory });
    } catch (error) {
        console.log('Error loading wallet:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    loadWallet
};
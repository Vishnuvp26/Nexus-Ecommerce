const orderModel = require('../../models/orderModel');

// Dashboard
const loadDashboard = async (req, res) => {
    try {
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let bestProducts = await orderModel.aggregate([
            {
                $unwind: "$items",
            },
            {
                $group: {
                    _id: "$items.productName",
                    totalQuantity: { $sum: "$items.quantity" },
                    image: { $first: "items.image" },
                },
            },
            {
                $sort: {
                    totalQuantity: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    productName: "$_id",
                    totalQuantity: 1,
                    image: 1
                },
            },
        ]);

        let bestCategories = await orderModel.aggregate([
            {
                $unwind: "$items",
            },
            {
                $group: {
                    _id: "$items.categoryName",
                    totalQuantity: { $sum: "$items.quantity" },
                },
            },
            {
                $sort: {
                    totalQuantity: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    categoryName: "$_id",
                    totalQuantity: -1,
                },
            },
        ]);

        revenue = 0;
        totalOrders = 0;
        discount = 0;

        for (let order of orderData) {
            totalOrders++;
            revenue += order.items.finalPrice * order.items.quantity;
            discount += order.items.price * order.items.quantity - order.items.finalPrice * order.items.quantity;
        }

        let results = await orderModel.aggregate([
            {
                $unwind: "$items"
            },
            {
                $match: {
                    "items.itemStatus": "Delivered"
                }
            },
            {
                $project: {
                    dayOfWeek: { $dayOfWeek: "$date" },
                    revenue: { $multiply: [{ $toDouble: "$items.quantity" }, { $toDouble: "$items.finalPrice" }] }
                }
            },
            {
                $group: {
                    _id: "$dayOfWeek",
                    total: { $sum: "$revenue" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        function getDayName(dayOfWeek) {
            const daysOfWeek = [
                "Sunday",
                "Monday",
                 "Tuesday",
                 "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            return daysOfWeek[dayOfWeek - 1];
        }

        const labels = results.map((result) => getDayName(result._id));
        const values = results.map((result) => result.total);

        let fromDate;
        let toDate;
        let interval;
        let groupByField;
        let labelFunction;


        if (req.query.interval === 'monthly') {
            interval = 'month';
            groupByField = { $month: "$date" };

            labelFunction = (date) => {
                return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date); 
            };

        } else if (req.query.interval === 'yearly') {
            interval = 'year';
            groupByField = { $year: "$date" };
            
            labelFunction = (date) => {
                return date.getFullYear().toString(); 
            };
        } else {
            interval = 'week';
            groupByField = { $week: "$date" };

            labelFunction = (date) => {
                return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date); 
            };
        }

        const today = new Date();
        if (interval === 'week') {
            toDate = new Date(today);

            fromDate = new Date(toDate);
            fromDate.setDate(fromDate.getDate() - 6); 
        } else if (interval === 'month') {
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1); 
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); 
        } else if (interval === 'year') {
            fromDate = new Date(today.getFullYear(), 0, 1); 
            toDate = new Date(today.getFullYear(), 11, 31); 
        }

        let results2;
        
        if (interval == 'week') {
            results2 = await orderModel.aggregate([
                {
                    $unwind: "$items"
                },
                {
                    $match: {
                        date: { $gte: fromDate, $lte: toDate },
                        "items.itemStatus": "Delivered"
                    }
                },
                {
                    $project: {
                        dayOfWeek: { $dayOfWeek: "$date" },
                        revenue: { $multiply: [{ $toDouble: "$items.quantity" }, { $toDouble: "$items.finalPrice" }] }
                    }
                },
                {
                    $group: {
                        _id: "$dayOfWeek",
                        total: { $sum: "$revenue" }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);
        } else if (interval == 'month') {
            results2 = await orderModel.aggregate([
                {
                    $unwind: "$items"
                },
                {
                    $match: {
                        date: { $gte: fromDate, $lte: toDate },
                        "items.itemStatus": "Delivered"
                    }
                },
                {
                    $project: {
                        month: { $month: "$date" },
                        revenue: { $multiply: ["$items.quantity", "$items.finalPrice"] }
                    }
                },
                {
                    $group: {
                        _id: { month: "$month" },
                        total: { $sum: "$revenue" }
                    }
                },
                {
                    $sort: { "_id.month": 1 }
                }
            ]);
        } else if (interval = 'year') {
            results2 = await orderModel.aggregate([
                {
                    $unwind: "$items"
                },
                {
                    $match: {
                        date: { $gte: fromDate, $lte: toDate },
                        "items.itemStatus": "Delivered"
                    }
                },
                {
                    $project: {
                        year: { $year: "$date" },
                        revenue: { $multiply: ["$items.quantity", "$items.finalPrice"] }
                    }
                },
                {
                    $group: {
                        _id: { year: "$year" },
                        total: { $sum: "$revenue" }
                    }
                },
                {
                    $sort: { "_id.year": 1 }
                }
            ]);
        }

        function getMonthName(month) {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return months[month - 1];
        }

        function formatYear(year) {
            return year.toString();
        }
          
        const labels2 = results2.map((result) => {
            if (interval === 'week') {
                return getDayName(result._id);
            } else if (interval === 'month') {
                return getMonthName(result._id.month);
            } else if (interval === 'year') {
                return formatYear(result._id.year);
            }
        });
          
        const values2 = results2.map((result) => result.total);
        res.render('dashboard', {
            orders: orderData,
            revenue: revenue,
            totalOrders: totalOrders,
            discount: discount,
            bestProducts: bestProducts,
            bestCategories: bestCategories,
            labels: labels,
            values: values,
            labels2:labels2,
            values2:values2,
            interval:interval
        });
    } catch (error) {
        console.log(error)
    }
};

// Filter intervals
const filterInterval = async (req, res, next) => {
    try {
        const interval = req.query.interval;
        let startDate;
        let today = new Date();

        switch (interval) {
            case "daily":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 1
                );
                break;
            case "weekly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 7
                );
                break;
            case "monthly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    today.getDate()
                );
                break;
            case "yearly":
                startDate = new Date(
                    today.getFullYear() - 1,
                    today.getMonth(),
                    today.getDate()
                );
                break;
            default:
                startDate = new Date();
                break;
        }
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                    date: { $gte: startDate, $lte: new Date() },
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let totalSales = orderData.length;

        res.render("salesReport", {
            orders: orderData,
            totalSales: totalSales,
        });
    } catch (error) {
        console.log(error)
    }
};

// Filter report
const filterReport = async (req, res, next) => {
    try {
        const startDate = new Date(req?.query?.startDate);
        const endDate = new Date(req?.query?.endDate);
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let totalSales = orderData.length;

        res.render("salesReport", {
            orders: orderData,
            totalSales: totalSales,
        });
    } catch (error) {
        console.log(error)
    }
};

// Sales report
const loadSalesReport = async (req, res) => {
    try {
        let orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                },
            },
            {
                $sort: {
                    date: -1,
                },
            },
        ]);

        let totalSales = orderData.length;

        res.render("salesReport", {
            orders: orderData,
            totalSales: totalSales,
        });
    } catch (error) {
        console.log(error)
    }
};

module.exports = {
    loadDashboard,
    loadSalesReport,
    filterInterval,
    filterReport,
    loadSalesReport,
};
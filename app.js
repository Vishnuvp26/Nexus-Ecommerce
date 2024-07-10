const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require("uuid");
const nocache = require("nocache");
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// MongoDB Connection
const mongoDB_URI = process.env.MONGODB_URI;
mongoose.connect(mongoDB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Session setup
app.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: false
}));

// Middleware
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

const PORT = process.env.PORT

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// User Route
app.use('/', userRoute);

// Admin Route
app.use('/admin', adminRoute);

// app.use((err, req, res, next) => {
//   res.status(500).render('error');
// });

app.get('*', (req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {  
  console.log(`Server is running at http://localhost:${PORT}`);
});

const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require("uuid");
const app = express();
const nocache = require("nocache");


// MongoDB Connection
const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/COZA_Store");

app.use(session({
  secret:uuidv4(),
  resave: false,
  saveUninitialized: false
}));

// Middleware setup
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute')

const PORT = process.env.PORT || 3000;
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// User Route
app.use('/', userRoute);

// Admin route
app.use('/admin', adminRoute);

app.listen(PORT, () => {  
  console.log(`Server is running at http://localhost:${PORT}`);
});
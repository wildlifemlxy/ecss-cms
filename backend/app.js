var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var app = express(); // Initialize the Express app

// Use middleware
app.use(cors()); // Enable CORS
app.use(logger('dev')); // HTTP request logger
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: false })); // For parsing URL-encoded data
app.use(cookieParser()); // For parsing cookies

// Set up views (if you're using templates)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); // You can change to 'ejs' or others if needed

// Define a route for the root path
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

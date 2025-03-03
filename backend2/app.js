var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var app = express(); // Initialize the Express app

var cors = require("cors");
var indexRouter = require('./routes/index');
/*var usersRouter = require('./routes/users');
var loginRouter = require("./routes/login");
var coursesRegistrationRouter = require("./routes/courseregistration");
var accountDetailsRouter = require("./routes/accountDetails");
var accessRightsRouter = require("./routes/accessRights");
var receiptRouter = require("./routes/receipt");
var invoiceRouter = require("./routes/invoice");
var singpassRouter = require("./routes/singpass");*/

app.use(cors()); // Enable CORS
app.use(logger('dev')); // HTTP request logger
app.use(express.json()); // For parsing JSON
app.use(express.urlencoded({ extended: false })); // For parsing URL-encoded data
app.use(cookieParser()); // For parsing cookies

// Set up views (if you're using templates)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); // You can change to 'ejs' or others if needed

app.use(logger('dev'));
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Add any other methods you want to support
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition'], 
  exposedHeaders: ['Content-Disposition'], // Add this line to expose the header
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
/*app.use('/users', usersRouter);
app.use("/login", loginRouter);
app.use("/courseregistration", coursesRegistrationRouter);
app.use("/accountDetails", accountDetailsRouter);
app.use("/accessRights", accessRightsRouter);
app.use("/receipt", receiptRouter);
app.use("/invoice", invoiceRouter);
app.use("/singpass", singpassRouter);*/

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

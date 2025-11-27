require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileupload = require('express-fileupload');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var apiRouter = require('./routes/api');

var app = express();
const PORT = process.env.PORT || 4800;



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const buildpath = path.resolve(__dirname, "../client/build");

app.use(express.static(buildpath));
app.use(cookieParser());
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.use(fileupload());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/api',apiRouter);


app.get('*', (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});


app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

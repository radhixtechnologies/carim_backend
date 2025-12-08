require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fileupload = require('express-fileupload');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
// const apiRouter = require('./routes/api'); <- DO NOT USE THIS

const app = express();
const PORT = process.env.PORT || 4800;

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileupload());
app.use(cors());

// Static files
const buildpath = path.resolve(__dirname, "../client/build");
app.use(express.static(buildpath));

// Prevent caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ------------------------
// Create HTTP server & Socket.io
// ------------------------
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "http://localhost:6546", methods: ["GET", "POST"] }
});

// Socket logic
try {
  require("./socket/socket")(io);
} catch (error) {
  console.error("Socket initialization failed:", error);
}

// ------------------------
// Routes
// ------------------------
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

// Pass `io` to API router
const apiRouter = require('./routes/api')(io);
app.use('/api', apiRouter);

// SPA catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(buildpath, "index.html"));
});

// 404 handler
app.use((req, res, next) => next(createError(404)));

// General error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

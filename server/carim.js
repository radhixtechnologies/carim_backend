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
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket logic
try {
  require("./socket/socket")(io);
} catch (error) {
  console.error("Socket initialization failed:", error);
}

// Ensure database columns exist safely
(async () => {
  try {
    const db = require('./models');
    await db.sequelize.query("ALTER TABLE bookings ADD COLUMN cancelReason VARCHAR(255) DEFAULT ''").catch(() => {});
    await db.sequelize.query("ALTER TABLE transactions ADD COLUMN type VARCHAR(255) DEFAULT ''").catch(() => {});
    await db.sequelize.query("ALTER TABLE transactions ADD COLUMN description VARCHAR(255) DEFAULT ''").catch(() => {});
    await db.sequelize.query("ALTER TABLE users ADD COLUMN vehicleType VARCHAR(255) DEFAULT ''").catch(() => {});
    await db.sequelize.query("ALTER TABLE users ADD COLUMN rideOtp VARCHAR(255) DEFAULT ''").catch(() => {});
    console.log("✅ DB schema checks passed");
  } catch (dbErr) {
    console.log("DB check info:", dbErr.message);
  }
})();

// ------------------------
// Routes
// ------------------------
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Serve uploaded media from disk or persistent DB storage before /admin auth middleware
const serveUploadedMedia = async (req, res) => {
  try {
    const fs = require('fs');
    const safeName = path.basename(req.params.filename || '');
    if (!safeName || safeName === '.' || safeName === '..') {
      return res.status(400).json({ success: false, status: 400, message: 'Invalid filename' });
    }

    const diskPath = path.join(__dirname, 'public', 'images', safeName);
    if (fs.existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }

    const db = require('./models');
    if (db && db.uploadedFiles) {
      const storedFile = await db.uploadedFiles.findOne({
        where: { filename: safeName },
      });
      if (storedFile && storedFile.data) {
        res.setHeader('Content-Type', storedFile.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const payload = Buffer.isBuffer(storedFile.data)
          ? storedFile.data
          : Buffer.from(storedFile.data);
        return res.send(payload);
      }
    }

    return res.status(404).json({
      success: false,
      status: 404,
      message: 'File not found',
    });
  } catch (err) {
    console.error('Error serving uploaded media:', err);
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Failed to retrieve file',
    });
  }
};

app.get(['/admin/images/:filename', '/images/:filename'], serveUploadedMedia);

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
  console.error("Server Error:", err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    status: err.status || 500,
    message: err.message || "Internal Server Error"
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

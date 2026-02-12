require('dotenv').config();  
const express = require("express");

const bankilyRouter = require("./routers/bankily_router");
const sedadRouter = require("./routers/sedad_router");
const http = require('http');
const { Server } = require('socket.io');
const initSocket = require('./socket');

const app = express();

/* 🔑 BODY PARSERS (MOST IMPORTANT) */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);
initSocket(io);

app.use("/bankily", bankilyRouter);
app.use("/sedad", sedadRouter);

server.listen(4801, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:4801');
});

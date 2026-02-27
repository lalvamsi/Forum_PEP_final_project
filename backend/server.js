const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for dev
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const classroomRoutes = require('./routes/classrooms');
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/classrooms', classroomRoutes);

// Socket.io Events
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // User joins a specific classroom
    socket.on('join_room', (classroomId) => {
        socket.join(classroomId);
        console.log(`User ${socket.id} joined room ${classroomId}`);
    });

    // Listen for new messages in a specific classroom
    socket.on('send_message', (data) => {
        // Broadcast the message ONLY to users in that specific classroom room
        // data must include classroomId
        socket.to(data.classroomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

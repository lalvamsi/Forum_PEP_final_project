const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // save to backend/uploads
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET /api/messages/:classroomId
// Fetch all forum messages for a specific classroom
router.get('/:classroomId', async (req, res) => {
    try {
        const messages = await Message.find({ classroomId: req.params.classroomId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/messages
// Save a new forum message to a classroom
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { classroomId, author, content } = req.body;

        if (!classroomId || !author || !content) {
            return res.status(400).json({ message: 'Please provide classroomId, author, and content' });
        }

        let fileUrl = null;
        let fileName = null;

        if (req.file) {
            // Standardize path to use forwards slashes for URLs
            fileUrl = `/uploads/${req.file.filename}`;
            fileName = req.file.originalname;
        }

        const newMessage = new Message({
            classroomId,
            author,
            content,
            fileUrl,
            fileName
        });

        const savedMessage = await newMessage.save();
        res.json(savedMessage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/messages
// Fetch all global forum messages (No classroomId)
router.get('/', async (req, res) => {
    try {
        const messages = await Message.find({ classroomId: { $exists: false } }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/messages/global
// Save a new global forum message
router.post('/global', upload.single('file'), async (req, res) => {
    try {
        const { author, content } = req.body;

        if (!author || !content) {
            return res.status(400).json({ message: 'Please provide author and content' });
        }

        let fileUrl = null;
        let fileName = null;

        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
            fileName = req.file.originalname;
        }

        const newMessage = new Message({
            author,
            content,
            fileUrl,
            fileName
        });

        const savedMessage = await newMessage.save();
        res.json(savedMessage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const User = require('../models/User');

// Helper to generate 6 digit alphanumeric code
const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// GET /api/classrooms/:userId
// Fetch all classrooms a user belongs to (as teacher or student)
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let classrooms;
        if (user.role === 'teacher') {
            classrooms = await Classroom.find({ teacherId: user._id }).sort({ createdAt: -1 });
        } else {
            classrooms = await Classroom.find({ students: user._id }).sort({ createdAt: -1 });
        }

        res.json(classrooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/classrooms/room/:classroomId
// Fetch specific classroom details
router.get('/room/:classroomId', async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
        res.json(classroom);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/classrooms/create
// Teacher creates a new classroom
router.post('/create', async (req, res) => {
    try {
        const { name, teacherId, teacherName } = req.body;

        if (!name || !teacherId) {
            return res.status(400).json({ message: 'Classroom name and teacher ID required' });
        }

        // Ensure user is actually a teacher
        const user = await User.findById(teacherId);
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers can create classrooms' });
        }

        let accessCode;
        let isUnique = false;

        // Ensure unique code
        while (!isUnique) {
            accessCode = generateAccessCode();
            const existingClass = await Classroom.findOne({ accessCode });
            if (!existingClass) isUnique = true;
        }

        const newClassroom = new Classroom({
            name,
            teacherId,
            teacherName,
            accessCode,
            students: []
        });

        const savedClassroom = await newClassroom.save();
        res.json(savedClassroom);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/classrooms/join
// Student joins using an access code
router.post('/join', async (req, res) => {
    try {
        const { accessCode, studentId } = req.body;

        if (!accessCode || !studentId) {
            return res.status(400).json({ message: 'Access code and student ID required' });
        }

        // Find the classroom by code
        const classroom = await Classroom.findOne({ accessCode: accessCode.toUpperCase() });

        if (!classroom) {
            return res.status(404).json({ message: 'Invalid access code' });
        }

        // Check if student is already in the class
        if (classroom.students.includes(studentId)) {
            return res.status(400).json({ message: 'You are already in this classroom' });
        }

        // Add student to classroom
        classroom.students.push(studentId);
        await classroom.save();

        res.json(classroom);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

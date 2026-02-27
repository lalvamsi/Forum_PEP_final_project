const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    accessCode: {
        type: String,
        required: true,
        unique: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Classroom', ClassroomSchema);

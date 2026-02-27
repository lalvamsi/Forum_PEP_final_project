import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const isTeacher = auth.user?.role === 'teacher';

    const fetchClassrooms = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/classrooms/${auth.user.id}`);
            if (res.ok) {
                const data = await res.json();
                setClassrooms(data);
            }
        } catch (err) {
            console.error('Failed to fetch classrooms', err);
        }
    };

    useEffect(() => {
        if (auth.user) {
            fetchClassrooms();
        }
    }, [auth.user]);

    const handleCreateClassroom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!newClassName.trim()) return;

        try {
            const res = await fetch('http://localhost:5000/api/classrooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newClassName,
                    teacherId: auth.user.id,
                    teacherName: auth.user.name
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg(`Classroom created! Access Code: ${data.accessCode}`);
                setNewClassName('');
                fetchClassrooms();
            } else {
                setError(data.message || 'Failed to create classroom');
            }
        } catch (err) {
            setError('Cannot connect to server');
        }
    };

    const handleJoinClassroom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!joinCode.trim()) return;

        try {
            const res = await fetch('http://localhost:5000/api/classrooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessCode: joinCode,
                    studentId: auth.user.id
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg(`Successfully joined ${data.name}!`);
                setJoinCode('');
                fetchClassrooms();
            } else {
                setError(data.message || 'Failed to join classroom');
            }
        } catch (err) {
            setError('Cannot connect to server');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="welcome-header">
                <h1>Welcome, {auth.user?.name}</h1>
                <p>You are logged in as a <strong>{auth.user?.role}</strong>.</p>
            </div>

            <div className="dashboard-content">

                {/* ACTION PANEL */}
                <div className="glass-card action-panel">
                    <h2>{isTeacher ? 'Create a Classroom' : 'Join a Classroom'}</h2>

                    {error && <div className="error-msg">{error}</div>}
                    {successMsg && <div className="success-msg">{successMsg}</div>}

                    {isTeacher ? (
                        <form onSubmit={handleCreateClassroom} className="action-form">
                            <input
                                type="text"
                                className="dashboard-input"
                                placeholder="Classroom Name"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                            />
                            <button type="submit" className="action-btn">Create</button>
                        </form>
                    ) : (
                        <form onSubmit={handleJoinClassroom} className="action-form">
                            <input
                                type="text"
                                className="dashboard-input"
                                placeholder="Enter 6-digit Access Code"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                maxLength={6}
                                style={{ textTransform: 'uppercase' }}
                            />
                            <button type="submit" className="action-btn">Join</button>
                        </form>
                    )}
                </div>

                {/* LIST PANEL */}
                <div className="glass-card list-panel">
                    <h2>Your Classrooms</h2>

                    {classrooms.length === 0 ? (
                        <p className="no-class-msg">You are not in any classrooms yet.</p>
                    ) : (
                        <div className="class-grid">
                            {classrooms.map(cls => (
                                <div
                                    key={cls._id}
                                    className="class-card glass-card"
                                    onClick={() => navigate(`/classroom/${cls._id}`)}
                                >
                                    <h3>{cls.name}</h3>
                                    <p>Teacher: {cls.teacherName}</p>
                                    {isTeacher && (
                                        <div className="access-code-badge">
                                            Code: <strong>{cls.accessCode}</strong>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;

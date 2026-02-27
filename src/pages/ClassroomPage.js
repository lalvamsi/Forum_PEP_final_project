import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import './Homepage.css'; // Re-using the same styling

const ClassroomPage = () => {
    const { auth } = useAuth();
    const { id: classroomId } = useParams();
    const navigate = useNavigate();

    const [classroom, setClassroom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // 1. Fetch classroom details
        const fetchClassroomDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/classrooms/room/${classroomId}`);
                if (res.ok) {
                    const data = await res.json();
                    setClassroom(data);
                } else {
                    setError('Classroom not found');
                }
            } catch (err) {
                setError('Failed to load classroom');
            }
        };

        // 2. Fetch history for this specific classroom
        const fetchMessages = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/messages/${classroomId}`);
                const data = await res.json();
                setMessages(data);
                scrollToBottom();
            } catch (err) {
                console.error('Failed to fetch messages', err);
            }
        };

        fetchClassroomDetails();
        fetchMessages();

        // 3. Connect to Socket.IO and join the specific room
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Tell server we want to join this classroom's socket room
        newSocket.emit('join_room', classroomId);

        // Listen only for messages broadcasted to this room
        newSocket.on('receive_message', (messageData) => {
            setMessages((prevMessages) => [...prevMessages, messageData]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [classroomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (currentMessage.trim() !== '' || selectedFile) {

            const formData = new FormData();
            formData.append('classroomId', classroomId);
            formData.append('author', auth.user.name);
            formData.append('content', currentMessage.trim() || ' ');

            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            try {
                const res = await fetch('http://localhost:5000/api/messages', {
                    method: 'POST',
                    body: formData
                });

                const savedMessage = await res.json();

                // Emit to this specific socket room (now including the fileUrl)
                socket.emit('send_message', savedMessage);

                setMessages((prev) => [...prev, savedMessage]);
                setCurrentMessage('');
                setSelectedFile(null);

                // Reset file input UI
                const fileInput = document.getElementById('classroom-file-input');
                if (fileInput) fileInput.value = '';

            } catch (err) {
                console.error('Failed to save message', err);
            }
        }
    };

    // Render attachment depending on if it's an image or other file
    const renderAttachment = (fileUrl, fileName) => {
        if (!fileUrl) return null;
        const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

        if (isImage) {
            return (
                <div style={{ marginTop: '10px' }}>
                    <img src={`http://localhost:5000${fileUrl}`} alt={fileName} style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px' }} />
                </div>
            );
        }

        return (
            <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                <a href={`http://localhost:5000${fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: 'lightblue', textDecoration: 'underline' }}>
                    📎 {fileName}
                </a>
            </div>
        );
    };

    if (error) {
        return (
            <div className="home-container" style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>{error}</h2>
                <button className="chat-send-btn" onClick={() => navigate('/')}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>{classroom ? classroom.name : 'Loading...'}</h1>
                    <p>Teacher: {classroom ? classroom.teacherName : '...'}</p>
                </div>
                <button className="action-btn" onClick={() => navigate('/')}>← Dashboard</button>
            </div>

            <div className="glass-card chat-container">

                <div className="messages-area">
                    {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No messages in this classroom yet.</p>
                    ) : (
                        messages.map((msg, idx) => {
                            const isOwnMessage = msg.author === auth.user?.name;
                            return (
                                <div key={idx} className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
                                    <span className="message-author">{isOwnMessage ? 'You' : msg.author}</span>
                                    <span className="message-content">{msg.content}</span>
                                    {renderAttachment(msg.fileUrl, msg.fileName)}
                                    <span className="message-time">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage} style={{ alignItems: 'center' }}>
                    <input
                        type="file"
                        id="classroom-file-input"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="action-btn"
                        style={{ marginRight: '10px', padding: '10px 15px', borderRadius: '50%' }}
                        onClick={() => document.getElementById('classroom-file-input').click()}
                        title="Attach file"
                    >
                        📎
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {selectedFile && (
                            <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '5px' }}>
                                Attached: {selectedFile.name}
                                <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', marginLeft: '5px' }}>x</button>
                            </span>
                        )}
                        <input
                            type="text"
                            className="chat-input"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            placeholder={`Message ${classroom?.name || 'classroom'}...`}
                            autoComplete="off"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="chat-send-btn"
                        disabled={!currentMessage.trim() && !selectedFile}
                    >
                        Send
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ClassroomPage;

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import './Homepage.css';

const HomePage = () => {
  const { auth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [socket, setSocket] = useState(null);

  const messagesEndRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 1. Fetch initial message history from DB
    const fetchMessages = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/messages');
        const data = await res.json();
        setMessages(data);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };
    fetchMessages();

    // 2. Connect to Socket.IO server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // 3. Listen for incoming messages from others
    newSocket.on('receive_message', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Scroll whenever new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== '' || selectedFile) {

      const formData = new FormData();
      formData.append('author', auth.user.name);
      formData.append('content', currentMessage.trim() || ' '); // Send a space if only a file is attached

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      try {
        // Save to database for persistence and get the fileUrl back
        const res = await fetch('http://localhost:5000/api/messages/global', {
          method: 'POST',
          body: formData
        });

        const savedMessage = await res.json();

        // Emit to socket (so others see it instantly, including the uploaded file URL)
        socket.emit('send_message', savedMessage);

        // Add to local state
        setMessages((prev) => [...prev, savedMessage]);

        setCurrentMessage('');
        setSelectedFile(null);
        // Reset file input UI
        const fileInput = document.getElementById('home-file-input');
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

  return (
    <div className="home-container">
      <div className="welcome-header">
        <h1>Welcome, {auth.user?.name}</h1>
        <p>Join the real-time student and teacher forum discussion below.</p>
      </div>

      <div className="glass-card chat-container">

        <div className="messages-area">
          {messages.map((msg, idx) => {
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
          })}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage} style={{ alignItems: 'center' }}>
          <input
            type="file"
            id="home-file-input"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="action-btn"
            style={{ marginRight: '10px', padding: '10px 15px', borderRadius: '50%' }}
            onClick={() => document.getElementById('home-file-input').click()}
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
              placeholder="Type your message here..."
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

export default HomePage;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically log in the user after signup
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    }
  };

  const handleSendOtp = () => {
    console.log('OTP sent to', email);
  };

  return (
    <div className="signup-page">
      <div className="glass-card signup-form-container">
        <h1>Create Account</h1>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text"
            className="signup-input"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="email-otp-container">
            <input type="email"
              className="signup-input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="button" onClick={handleSendOtp} className="send-otp-btn">Send OTP</button>
          </div>
          <input type="text"
            className="signup-input"
            placeholder="Enter OTP (Optional)"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input type="password"
            className="signup-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select className="signup-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button type="submit" className="signup-submit">Sign up</button>
        </form>
        <div className="login-link">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Signup;
import React, { useState } from 'react';

export const AuthModal = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/register' : '/api/login';
    const body = isRegister ? { email, password, nickname } : { email, password };

    try {
      const res = await fetch(`https://nexus-os-backend-wft7.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка доступу');

      sessionStorage.setItem('nexus_user', data.nickname);
      onLoginSuccess(data.nickname);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="auth-box">
        <div className="auth-title">
          {isRegister ? 'NEXUS OS // REGISTRATION' : 'NEXUS OS // LOGIN'}
        </div>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="auth-input"
            placeholder="Operator Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Access Code (Password)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isRegister && (
            <input
              type="text"
              className="auth-input"
              placeholder="System Call-Sign (Nickname)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          )}
          <button type="submit" className="auth-submit-btn">
            {isRegister ? 'REGISTER OPERATOR' : 'INITIALIZE SYSTEM'}
          </button>
        </form>

        <button 
          type="button" 
          className="auth-toggle-btn"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Registered? Return to Login' : 'No Access Key? Create Operator Account'}
        </button>
      </div>
    </div>
  );
};
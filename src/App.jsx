import React, { useState, useEffect } from 'react';
import Desktop from './components/Desktop';
import { AuthModal } from './components/AuthModal';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Перевірка: якщо перевантажити сторінку, змушуємо заходити знову
    const savedUser = sessionStorage.getItem('nexus_user');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  return (
    <div className="App">
      {!user ? (
        <AuthModal onLoginSuccess={(nickname) => setUser(nickname)} />
      ) : (
        <Desktop userNickname={user} />
      )}
    </div>
  );
}

export default App;
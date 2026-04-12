import React, { useState } from 'react';
import './Login.css';
import { loginUser, setAuthSession } from '../services/api';


const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await loginUser({
        email: email.trim(),
        password,
      });

      setAuthSession({
        token: result.token,
        user: result.user,
      });

      onLogin(result.user);
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-branding">
        <h1>R.E.S.Q</h1>
        <p>(Rapid Emergency Surveillance & Quenching)</p>
      </div>

      <main className="login-container">
        <section className="login-card">
          <header>
            <h1>Welcome Back</h1>
            <p>Enter your details to sign in</p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>

            {error && <p className="profile-error">{error}</p>}

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>


          {/* In case if we add a sign up feature but since only the LGU will be using this I don't think we need to add a sign up page */}
          {/* <footer>
          <p>Don't Have an Account? <a href="/signup"></a>Sign Up</p>
        </footer> */}
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
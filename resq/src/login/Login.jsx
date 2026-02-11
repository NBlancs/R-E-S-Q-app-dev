import React, { useState } from 'react';
import './Login.css';


const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login Attempted with:', { email, password });


    // Hard coded muna credentials for presentation purposes
    const validEmail = 'admin@gmail.com';
    const validPassword = 'admin123';

    // login logic dri
    if (email === validEmail && password === validPassword) {
      console.log('Login successful');
      onLogin();
    } else {
      console.log('Invalid credentials');
      alert('Invalid credentials');
    }
  }

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
                placeholder="name@gmaill.com"
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

            <button type="submit" className="login-button">
              Sign In
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
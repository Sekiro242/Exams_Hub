import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import ErrorBoundary from '../components/ErrorBoundary'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const styles = useMemo(
    () => `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Inter', sans-serif; }
    .container { display: flex; height: 100vh; }
    .login-section { flex: 1; display: flex; justify-content: center; align-items: center; background: #f8f9fa; padding: 2rem; }
    .login-form { width: 100%; max-width: 400px; background: white; padding: 3rem 2.5rem; border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); }
    .login-form h1 { text-align: center; font-size: 2rem; margin-bottom: 2rem; font-weight: 600; }
    .input-group { margin-bottom: 1.5rem; position: relative; }
    .input-group input, .input-group select { width: 100%; padding: 1rem 1.25rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; background: #f9fafb; transition: border-color 0.3s ease; }
    .input-group input:focus, .input-group select:focus { outline: none; border-color: #3b82f6; background: white; }
    .toggle-password { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #6b7280; }
    .forgot-password { text-align: left; display: block; font-size: 0.9rem; color: #3b82f6; margin-bottom: 1.5rem; text-decoration: none; }
    .forgot-password:hover { text-decoration: underline; }
    .sign-in-btn { width: 100%; background: #dc2626; color: white; border: none; padding: 1rem; border-radius: 12px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.3s ease; margin-bottom: 1.5rem; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 1.5rem; }
    .sign-in-btn:hover { background: #b91c1c; }
    .divider { text-align: center; margin: 1.5rem 0; position: relative; color: #6b7280; }
    .divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e5e7eb; }
    .divider span { background: white; padding: 0 1rem; position: relative; }
    .google-btn { width: 100%; background: white; border: 2px solid #e5e7eb; padding: 1rem; border-radius: 12px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: border-color 0.3s ease, box-shadow 0.3s ease; margin-bottom: 1.5rem; }
    .google-btn:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    .signup-text { text-align: center; color: #6b7280; font-size: 0.9rem; }
    .signup-text a { color: #3b82f6; text-decoration: none; }
    .signup-text a:hover { text-decoration: underline; }
    .image-section { flex: 1; display: flex; justify-content: center; align-items: center; background-color: #f0f4f8; padding: 2rem; position: relative; }
    .image-section::before { content: ""; display: block; width: 90%; max-width: 500px; height: 90%; max-height: 500px; background-image: url('س.webp'); background-size: cover; background-repeat: no-repeat; background-position: center; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .loading { display: inline-flex; align-items: center; gap: 4px; margin-right: 8px; }
    .loading-dot { width: 6px; height: 6px; background: #ffffff; border-radius: 50%; animation: loading-dots 1.4s ease-in-out infinite both; }
    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }
    .loading-dot:nth-child(3) { animation-delay: 0s; }
    @keyframes loading-dots { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
    .sign-in-btn.loading { pointer-events: none; opacity: 0.8; }
    .sign-in-btn.loading .loading { margin-right: 8px; }
    .sign-in-btn.loading #btnText { margin-left: 4px; }
    .error-message { background: #fee2e2; color: #dc2626; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; border: 1px solid #fecaca; display: block; }
    .success-message { background: #dcfce7; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; border: 1px solid #bbf7d0; display: block; }
    @media (max-width: 768px) { .container { flex-direction: column; } .image-section { height: 250px; } }
  `,
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (successMessage) setSuccessMessage('')
      if (errorMessage) setErrorMessage('')
    }, 5000)
    return () => clearTimeout(timer)
  }, [successMessage, errorMessage])

  function validate() {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address')
      return false
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long')
      return false
    }
    setErrorMessage('')
    return true
  }

  function showLoading(isLoading) {
    setLoading(isLoading)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!validate()) return

    showLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, roles } = response.data
      localStorage.setItem('token', token)
      const roleArray = Array.isArray(roles) ? roles.map(r => String(r)) : []
      // Choose best landing role
      const primaryRole = roleArray.find(r => r.toLowerCase() === 'admin')
        || roleArray.find(r => r.toLowerCase() === 'teacher')
        || roleArray.find(r => r.toLowerCase() === 'student')
        || ''
      localStorage.setItem('userRole', primaryRole)
      setSuccessMessage('Login successful! Redirecting...')
      setTimeout(() => {
        const roleNorm = String(primaryRole || '').toLowerCase()
        if (roleNorm === 'admin') {
          navigate('/superadmin')
        } else if (roleNorm === 'teacher') {
          navigate('/teacher')
        } else if (roleNorm === 'student') {
          navigate('/student')
        } else {
          navigate('/')
        }
      }, 1000)
    } catch (err) {
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
        setErrorMessage('Failed to fetch (API error). Please check if the server is running and try again.')
      } else if (err.response?.status === 401) {
        setErrorMessage(err.response?.data?.message || 'Invalid email or password. Please check your credentials.')
      } else if (err.response?.status >= 500) {
        setErrorMessage('Server error. Please try again later.')
      } else {
        setErrorMessage(err.response?.data?.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      showLoading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="container">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{styles}</style>
        <div className="login-section">
          <div className="login-form">
            <h1>Nexa Exam System</h1>
            <div className="divider">
              <span>Sign in with email</span>
            </div>
            <form onSubmit={handleLogin}>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <a href="#" className="forgot-password">Forgot password?</a>
              <button type="submit" className={`sign-in-btn ${loading ? 'loading' : ''}`}>
                {loading && (
                  <div className="loading">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                )}
                <span id="btnText">{loading ? 'Signing in...' : 'Sign in'}</span>
              </button>
            </form>
            <div className="signup-text">
              Don't have an account? <a href="#">Sign up</a>
            </div>
          </div>
        </div>
        <div className="image-section"></div>
      </div>
    </ErrorBoundary>
  )
}

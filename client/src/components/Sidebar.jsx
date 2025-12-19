import React, { useState, useEffect } from 'react'
import api from '../api/axios'

export default function Sidebar({
  isQuizActive,
  currentSection,
  showSection,
  handleLogout,
  setCurrentSection,
  setIsReviewMode,
  userRole, // Add userRole prop
}) {
  const [userData, setUserData] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Parse user data from JWT token
  const parseUserFromToken = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null

      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || []
      }
    } catch (error) {
      console.error('Error parsing token:', error)
      return null
    }
  }

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const response = await api.get(`/auth/profile/${userId}`)
      setUserProfile(response.data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const tokenData = parseUserFromToken()
    setUserData(tokenData)

    if (tokenData?.id) {
      fetchUserProfile(tokenData.id)
    } else {
      setLoading(false)
    }
  }, [])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // Use actual profile data if available, fallback to email or role-based defaults
  const profileName = userProfile?.fullNameEn || userProfile?.fullNameAr || (userData?.email ? userData.email.split('@')[0] : (userRole === 'Teacher' ? 'Teacher User' : userRole === 'Student' ? 'Student User' : 'Unknown User'));
  const profileEmail = userProfile?.email || userData?.email || (userRole === 'Teacher' ? 'teacher@example.com' : userRole === 'Student' ? 'student@example.com' : 'unknown@example.com');

  return (
    <div className={`sidebar ${isQuizActive ? 'locked' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="profile-section">
          <div
            className="profile-picture"
            onClick={() => {
              if (!isQuizActive) {
                setCurrentSection('profile')
                setIsReviewMode(false)
              }
            }}
          >
            {getInitials(profileName)}
          </div>
          <div className="profile-info">
            <h3>{profileName}</h3>
            <p>{profileEmail}</p>
          </div>
        </div>
      </div>
      <div className="sidebar-divider" />
      <nav className="sidebar-nav">
        {userRole === 'Teacher' && (
          <>
            <div className="nav-item">
              <button
                className={`nav-button ${currentSection === 'main' ? 'active' : ''}`}
                onClick={() => showSection('main')}
                id="dashboard-btn"
              >
                <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="Dashboard"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v10zm0-18v6h8V3h-8z" /></svg>
                Dashboard
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-button ${currentSection === 'my-quizzes' ? 'active' : ''}`}
                onClick={() => showSection('my-quizzes')}
                id="my-quizzes-btn"
              >
                <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="My Exams"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                My Exams
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-button ${currentSection === 'question-banks' ? 'active' : ''}`}
                onClick={() => showSection('question-banks')}
                id="question-banks-btn"
              >
                <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="Question Banks"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Question Banks
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-button ${currentSection === 'students' ? 'active' : ''}`}
                onClick={() => showSection('students')}
                id="students-btn"
              >
                <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="Students"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 17.06 6c-.8 0-1.54.37-2.01.97l-2.05 2.58c-.26.33-.26.8 0 1.13l2.05 2.58c.47.6 1.21.97 2.01.97.35 0 .69-.07 1-.2V18H20v2h-4z" /></svg>
                Students
              </button>
            </div>
          </>
        )}
        {userRole === 'Student' && (
          <>
            <div className="nav-item">
              <button
                className={`nav-button ${currentSection === 'available' ? 'active' : ''}`}
                onClick={() => {
                  if (showSection('available') === false) return
                }}
                id="new-btn"
                disabled={isQuizActive && currentSection !== 'quiz'}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="Available Exams">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                Available Exams
              </button>
            </div>
            <div className="nav-item">
              <button
                className={`nav-button ${currentSection === 'completed' ? 'active' : ''}`}
                onClick={() => {
                  if (showSection('completed') === false) return
                }}
                id="last-btn"
                disabled={isQuizActive && currentSection !== 'quiz'}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="Completed Exams">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                </svg>
                Completed Exams
              </button>
            </div>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <div className="nav-item">
          <button className="nav-button logout-btn" onClick={handleLogout}>
            <svg className="nav-icon" viewBox="0 0 24 24" role="img" aria-label="Logout">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

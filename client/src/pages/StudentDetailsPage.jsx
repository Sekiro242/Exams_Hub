import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'

export default function StudentDetailsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [student, setStudent] = useState(null)

  useEffect(() => {
    // Get student data from location state or localStorage
    if (location.state?.student) {
      setStudent(location.state.student)
    } else {
      // Fallback to localStorage if direct navigation
      const storedStudent = localStorage.getItem('selectedStudentData')
      if (storedStudent) {
        setStudent(JSON.parse(storedStudent))
      } else {
        // No student data, redirect back
        navigate('/superadmin')
      }
    }
  }, [location, navigate])

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      // Clear all tokens and user state
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('selectedStudentData')
      // Clear any other user-related data
      localStorage.clear()
      // Reset state
      setStudent(null)
      // Redirect to login
      navigate('/')
    }
  }

  function goBack() {
    navigate('/superadmin')
  }

  if (!student) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh' }}>
          <div>Loading student data...</div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="dashboard-container">


        <div className="sidebar">
          <div className="sidebar-header">
            <div className="profile-section">
              <div className="profile-picture">SA</div>
              <div className="profile-info">
                <h3>Super Admin</h3>
                <p>admin@school.com</p>
              </div>
            </div>
          </div>
          <div className="sidebar-divider" />
          <nav className="sidebar-nav">
            <div className="nav-item">
              <button className="nav-button" onClick={goBack}>
                <svg className="nav-icon" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v10zm0-18v6h8V3h-8z" /></svg>
                Back to Dashboard
              </button>
            </div>
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-divider" />
            <div className="nav-item">
              <button className="nav-button logout-btn" onClick={handleLogout}>
                <svg className="nav-icon" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="main-content">
          <div>
            <button className="back-btn" onClick={goBack}>← Back to Dashboard</button>
            <div className="content-header">
              <h1 className="content-title">
                <svg className="title-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                Student Details: {student.name}
              </h1>
              <p className="content-subtitle">View and manage student data</p>
            </div>

            {/* Student Profile Section */}
            <div className="student-profile-section">
              <div className="student-profile-header">
                <div className="student-profile-avatar">{student.initials}</div>
                <div className="student-profile-info">
                  <h2>{student.name}</h2>
                  <p className="student-profile-email">{student.email}</p>
                  <p className="student-profile-id">ID: {student.studentId}</p>
                </div>
              </div>
            </div>

            {/* Student Information Grid */}
            <div className="student-info-grid">
              <div className="info-card">
                <div className="info-label">Class</div>
                <div className="info-value">{student.class}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Join Date</div>
                <div className="info-value">{student.joinDate}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Average Score</div>
                <div className="info-value">{student.avgScore}%</div>
              </div>
              <div className="info-card">
                <div className="info-label">Completed Quizzes</div>
                <div className="info-value">{student.completedQuizzes}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Performance Trend</div>
                <div className="info-value">
                  <span className={`trend-indicator ${student.avgScore >= 85 ? 'trend-up' : student.avgScore >= 70 ? 'trend-stable' : 'trend-down'}`}>
                    {student.avgScore >= 85 ? '↗ Excellent' : student.avgScore >= 70 ? '→ Good' : '↘ Needs Improvement'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subjects Enrolled */}
            <div className="student-subjects-section">
              <h3>Enrolled Subjects</h3>
              <div className="subjects-list">
                {(student.subjects || []).map((subject, index) => (
                  <span key={index} className="subject-tag">{subject}</span>
                ))}
              </div>
            </div>

            {/* Quiz History */}
            <div className="quiz-history-section">
              <h3>Recent Quiz Performance</h3>
              <div className="quiz-history-table">
                <div className="quiz-history-header">
                  <span>Subject</span>
                  <span>Quiz Name</span>
                  <span>Score</span>
                  <span>Date</span>
                </div>
                {(student.quizHistory || []).map((quiz, index) => (
                  <div key={index} className="quiz-history-row">
                    <span className="quiz-subject">{quiz.subject}</span>
                    <span className="quiz-name">{quiz.quizName}</span>
                    <span className={`quiz-score ${quiz.score >= 80 ? 'high' : quiz.score >= 60 ? 'medium' : 'low'}`}>
                      {(() => {
                        const scoreRounded = Math.round(quiz.score * 100) / 100
                        return scoreRounded % 1 === 0 ? scoreRounded : scoreRounded.toFixed(2)
                      })()}%
                    </span>
                    <span className="quiz-date">{quiz.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import UserProfile from '../components/UserProfile'
import Sidebar from '../components/Sidebar'
import QuizModal from '../components/QuizModal'
import ErrorBoundary from '../components/ErrorBoundary'
import api from '../api/axios'

export default function SuperAdminPage() {
  const navigate = useNavigate()

  // State management
  const [currentSection, setCurrentSection] = useState('main')
  const [currentView, setCurrentView] = useState('overview') // 'overview', 'teachers', 'students'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Real data from backend
  const [exams, setExams] = useState([])
  const [questionBanks, setQuestionBanks] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])

  // Modal state
  const [isModalActive, setIsModalActive] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const modalResolveRef = useRef(null)

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [examsRes, questionBanksRes] = await Promise.all([
          api.get('/examdetail'),
          api.get('/questionbank')
        ])

        setExams(examsRes.data || [])
        setQuestionBanks(questionBanksRes.data || [])

        // Extract unique teachers from question banks and exams
        const teacherAccounts = new Map()
        const studentAccounts = new Map()

        // Get teachers from question banks
        questionBanksRes.data?.forEach(qb => {
          if (qb.accountId && !teacherAccounts.has(qb.accountId)) {
            teacherAccounts.set(qb.accountId, {
              id: qb.accountId,
              name: `Teacher ${qb.accountId}`, // This will be updated when we fetch profile data
              email: `teacher${qb.accountId}@school.com`, // This will be updated when we fetch profile data
              subject: qb.questionSubject || 'Unknown',
              questionCount: 0
            })
          }
        })

        // Fetch profile data for each teacher
        const teacherProfiles = await Promise.all(
          Array.from(teacherAccounts.keys()).map(async (accountId) => {
            try {
              const profileRes = await api.get(`/auth/profile/${accountId}`)
              return { accountId, profile: profileRes.data }
            } catch (error) {
              console.error(`Error fetching profile for teacher ${accountId}:`, error)
              return { accountId, profile: null }
            }
          })
        )

        // Update teacher data with profile information
        teacherProfiles.forEach(({ accountId, profile }) => {
          if (profile && teacherAccounts.has(accountId)) {
            const teacher = teacherAccounts.get(accountId)
            teacher.name = profile.fullNameEn || profile.fullNameAr || `Teacher ${accountId}`
            teacher.email = profile.email || `teacher${accountId}@school.com`
            teacherAccounts.set(accountId, teacher)
          }
        })

        // Count questions per teacher
        questionBanksRes.data?.forEach(qb => {
          if (qb.accountId && teacherAccounts.has(qb.accountId)) {
            teacherAccounts.get(qb.accountId).questionCount++
          }
        })

        setTeachers(Array.from(teacherAccounts.values()))

        // For now, we'll show a message that student data needs to be implemented
        setStudents([])

      } catch (err) {
        console.error('Error fetching data:', err)
        // Handle different types of errors
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
          setError('Failed to fetch (API error). Please check if the server is running and try again.')
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.')
        } else {
          setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function showModal(title, message) {
    return new Promise((resolve) => {
      setIsModalActive(true)
      setModalTitle(title)
      setModalMessage(message)
      modalResolveRef.current = resolve
    })
  }

  const handleModalConfirm = () => {
    setIsModalActive(false)
    if (modalResolveRef.current) {
      modalResolveRef.current(true)
    }
  }

  const handleModalCancel = () => {
    setIsModalActive(false)
    if (modalResolveRef.current) {
      modalResolveRef.current(false)
    }
  }

  function handleLogout() {
    showModal('Confirm Logout', 'Are you sure you want to logout?').then((confirmed) => {
      if (confirmed) {
        // Clear all tokens and user state
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        // Clear any other user-related data
        localStorage.clear()
        // Reset state
        setCurrentSection('main')
        setCurrentView('overview')
        setExams([])
        setQuestionBanks([])
        setTeachers([])
        setStudents([])
        // Redirect to login
        navigate('/')
      }
    })
  }

  function showSection(section) {
    setCurrentSection(section)
  }

  function showView(view) {
    setCurrentView(view)
  }

  const getSubjectIcon = (subject) => {
    const icons = {
      'Mathematics': '🔢',
      'Arabic': '📚',
      'English': '📖',
      'Physics': '⚡',
      'Chemistry': '🧪',
      'Biology': '🧬',
      'History': '📜',
      'Geography': '🌍',
      'Science': '🔬'
    }
    return icons[subject] || '📝'
  }

  const getGradeIcon = (grade) => {
    if (grade?.toLowerCase().includes('junior')) return '🎓'
    if (grade?.toLowerCase().includes('senior')) return '👨‍🎓'
    if (grade?.toLowerCase().includes('wheel')) return '🦼'
    return '👨‍🎓'
  }

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          isQuizActive={false}
          currentSection={currentSection}
          showSection={showSection}
          handleLogout={handleLogout}
          setCurrentSection={setCurrentSection}
          setIsReviewMode={() => { }}
          userRole="Admin"
        />
        <div className="main-content" style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          isQuizActive={false}
          currentSection={currentSection}
          showSection={showSection}
          handleLogout={handleLogout}
          setCurrentSection={setCurrentSection}
          setIsReviewMode={() => { }}
          userRole="Admin"
        />
        <div className="main-content" style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              fill: '#ef4444',
              margin: '0 auto 1rem'
            }}>
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Error Loading Dashboard</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          isQuizActive={false}
          currentSection={currentSection}
          showSection={showSection}
          handleLogout={handleLogout}
          setCurrentSection={setCurrentSection}
          setIsReviewMode={() => { }}
          userRole="Admin"
        />

        <div className="main-content" style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
          {/* Profile Section */}
          {currentSection === 'profile' && (
            <UserProfile
              userRole="Admin"
              onBack={() => showSection('main')}
            />
          )}

          {/* Main Dashboard */}
          {currentSection === 'main' && (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {/* Header */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 18px rgba(0,0,0,.06)'
              }}>
                <h1 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0'
                }}>
                  <svg style={{ width: '32px', height: '32px', fill: '#dc2626' }} viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-6h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                  Super Admin Dashboard
                </h1>
                <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                  Manage the quiz system and monitor school activities
                </p>
              </div>

              {/* Navigation Tabs */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                background: 'white',
                padding: '1rem 2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,.06)'
              }}>
                <button
                  onClick={() => showView('overview')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: currentView === 'overview' ? '#dc2626' : 'white',
                    border: `2px solid ${currentView === 'overview' ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: currentView === 'overview' ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Overview
                </button>
                <button
                  onClick={() => showView('teachers')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: currentView === 'teachers' ? '#dc2626' : 'white',
                    border: `2px solid ${currentView === 'teachers' ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: currentView === 'teachers' ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Teachers
                </button>
                <button
                  onClick={() => showView('students')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: currentView === 'students' ? '#dc2626' : 'white',
                    border: `2px solid ${currentView === 'students' ? '#dc2626' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: currentView === 'students' ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Students
                </button>
              </div>

              {/* Overview Section */}
              {currentView === 'overview' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* Stats Cards */}
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                    border: '2px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        📊
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                          Total Exams
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          All created quizzes
                        </p>
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
                      {exams.length}
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                    border: '2px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        👨‍🏫
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                          Active Teachers
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          Teachers with content
                        </p>
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                      {teachers.length}
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                    border: '2px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        📚
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                          Question Banks
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          Total question collections
                        </p>
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                      {questionBanks.length}
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                    border: '2px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        🎯
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                          Total Questions
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          All questions in system
                        </p>
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                      {questionBanks.length}
                    </div>
                  </div>
                </div>
              )}

              {/* Teachers Section */}
              {currentView === 'teachers' && (
                <div>

                  {teachers.length === 0 ? (
                    <div style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '3rem',
                      textAlign: 'center',
                      boxShadow: '0 4px 18px rgba(0,0,0,.06)'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🏫</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        No Teachers Found
                      </h3>
                      <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                        No teachers have created content yet
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      {teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                            border: '2px solid transparent',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-4px)'
                            e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,.12)'
                            e.target.style.borderColor = '#dc2626'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = '0 4px 18px rgba(0,0,0,.06)'
                            e.target.style.borderColor = 'transparent'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              color: 'white'
                            }}>
                              {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                color: '#1f2937',
                                margin: '0 0 0.25rem 0'
                              }}>
                                {teacher.name}
                              </h3>
                              <p style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                margin: 0
                              }}>
                                {teacher.email}
                              </p>
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '1rem',
                            borderTop: '1px solid #e5e7eb'
                          }}>
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              fontWeight: '600'
                            }}>
                              {getSubjectIcon(teacher.subject)} {teacher.subject}
                            </span>
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>
                              {teacher.questionCount} Questions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Students Section */}
              {currentView === 'students' && (
                <div>
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,.06)'
                  }}>
                    <h1 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Students
                    </h1>
                    <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                      Student management system
                    </p>
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '3rem',
                    textAlign: 'center',
                    boxShadow: '0 4px 18px rgba(0,0,0,.06)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🎓</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      Student Management
                    </h3>
                    <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                      Student management features will be implemented in a future update.
                      This will include student registration, class management, and performance tracking.
                    </p>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      padding: '1rem',
                      color: '#0c4a6e',
                      fontSize: '0.875rem'
                    }}>
                      <strong>Coming Soon:</strong> Student registration, class assignments, quiz results tracking, and performance analytics.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        <QuizModal
          title={modalTitle}
          message={modalMessage}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          isActive={isModalActive}
        />
      </div>
    </ErrorBoundary>
  )
}
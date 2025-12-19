import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'

export default function FileUpload({ onQuestionsExtracted, onClose }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid Excel file (.xlsx, .xls) or CSV file')
      return
    }

    setIsUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90 }
          return prev + 10
        })
      }, 100)

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          const questions = parseQuestionsFromExcel(jsonData)
          if (questions.length === 0) {
            setError('No valid questions found in the file. Please check the format.')
            setIsUploading(false)
            setUploadProgress(0)
            return
          }
          setUploadProgress(100)
          setSuccess(`Successfully imported ${questions.length} questions!`)
          if (onQuestionsExtracted) {
            onQuestionsExtracted(questions)
          }
          setTimeout(() => { onClose?.() }, 1200)
        } catch (parseError) {
          setError('Error parsing the file. Please check the format.')
          setIsUploading(false)
          setUploadProgress(0)
        }
      }
      reader.onerror = () => { setError('Error reading the file'); setIsUploading(false); setUploadProgress(0) }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      setError('Error processing the file')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const parseQuestionsFromExcel = (data) => {
    const questions = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length < 3) continue
      try {
        const questionType = (row[0] || '').toString().toLowerCase().trim()
        const questionText = (row[1] || '').toString().trim()
        const correctAnswer = (row[2] || '').toString().trim()
        const marks = parseFloat(row[3]) || 1
        if (!questionText) continue
        let question = { type: 'mcq', question: questionText, marks }
        if (questionType.includes('mcq') || questionType.includes('multiple') || questionType.includes('choice')) {
          const options = []
          for (let j = 4; j < 8; j++) { if (row[j] && row[j].toString().trim()) options.push(row[j].toString().trim()) }
          if (options.length >= 2) {
            question.type = 'mcq'
            question.options = options
            const correctIndex = options.findIndex(opt => opt.toLowerCase() === correctAnswer.toLowerCase())
            question.correct = correctIndex >= 0 ? correctIndex : 0
          } else {
            question.type = 'mcq'
            question.options = [correctAnswer, 'Option B', 'Option C', 'Option D']
            question.correct = 0
          }
        } else if (questionType.includes('true') || questionType.includes('false') || questionType.includes('tf')) {
          question.type = 'true_false'
          question.correct = correctAnswer.toLowerCase().includes('true')
        } else if (questionType.includes('fill') || questionType.includes('blank') || questionType.includes('fill_blank')) {
          question.type = 'fill_blank'
          question.correct = correctAnswer
        } else {
          question.type = 'mcq'
          question.options = [correctAnswer, 'Option B', 'Option C', 'Option D']
          question.correct = 0
        }
        questions.push(question)
      } catch { continue }
    }
    return questions
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files
      handleFileUpload({ target: { files: dataTransfer.files } })
    }
  }
  const handleDragOver = (event) => { event.preventDefault(); event.currentTarget.classList.add('dragover') }
  const handleDragLeave = (event) => { event.preventDefault(); event.currentTarget.classList.remove('dragover') }

  const downloadTemplate = () => {
    const templateData = [
      ['Question Type', 'Question Text', 'Correct Answer', 'Marks', 'Option A', 'Option B', 'Option C', 'Option D'],
      ['MCQ', 'What is 2 + 2?', '4', '1', '4', '3', '5', '6'],
      ['MCQ', 'What is the capital of Egypt?', 'Cairo', '1', 'Alexandria', 'Cairo', 'Giza', 'Luxor'],
      ['True/False', 'The Earth is round.', 'True', '1', '', '', '', ''],
      ['True/False', 'Water boils at 100°C at sea level.', 'True', '1', '', '', '', ''],
      ['Fill Blank', 'The capital of France is _____.', 'Paris', '1', '', '', '', ''],
      ['Fill Blank', 'The chemical symbol for gold is _____.', 'Au', '1', '', '', '', ''],
      ['MCQ', 'What is the largest planet in our solar system?', 'Jupiter', '1', 'Mars', 'Jupiter', 'Saturn', 'Earth'],
      ['MCQ', 'Which of these is a prime number?', '7', '1', '4', '6', '7', '8']
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Questions Template')
    XLSX.writeFile(wb, 'questions_template.xlsx')
  }

  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
  const modalStyle = { width: 'min(720px, 92vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,.3)', border: '1px solid #e5e7eb' }
  const headerStyle = { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' }
  const bodyStyle = { padding: '1.25rem 1.5rem' }
  const footerStyle = { padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }
  const primaryBtn = { background: '#10b981', color: '#fff', border: 'none', padding: '.6rem 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }
  const secondaryBtn = { background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', padding: '.6rem 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }
  const closeXStyle = { position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div style={{ position: 'relative', ...modalStyle }}>
        <button type="button" aria-label="Close" onClick={onClose} style={closeXStyle}>×</button>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Upload Questions from File</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>Upload an Excel or CSV file to import questions into this bank.</p>
        </div>
        <div style={bodyStyle}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', background: '#f8fafc' }}
          >
            <div style={{ marginBottom: '.5rem' }}>
              <svg viewBox="0 0 24 24" width="42" height="42" fill="#60a5fa"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>
            </div>
            <p style={{ margin: 0, color: '#334155' }}>
              Drag and drop your file here, or{' '}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>browse files</button>
            </p>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '.9rem' }}>Supports .xlsx, .xls, and .csv files</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
          </div>

          {isUploading && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '999px' }}>
                <div style={{ width: `${uploadProgress}%`, height: '10px', background: '#10b981', borderRadius: '999px', transition: 'width .2s ease' }}></div>
              </div>
              <p style={{ marginTop: '.5rem', color: '#64748b' }}>Processing... {uploadProgress}%</p>
            </div>
          )}

          {error ? (<div style={{ marginTop: '1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '.75rem 1rem', borderRadius: '8px' }}>{error}</div>) : null}
          {success ? (<div style={{ marginTop: '1rem', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '.75rem 1rem', borderRadius: '8px' }}>{success}</div>) : null}
        </div>
        <div style={footerStyle}>
          <button type="button" style={secondaryBtn} onClick={downloadTemplate}>Download Template</button>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button type="button" style={secondaryBtn} onClick={onClose} disabled={isUploading}>Close</button>
            <button type="button" style={primaryBtn} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>Choose File</button>
          </div>
        </div>
      </div>
    </div>
  )
}

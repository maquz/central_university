import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, addDoc, getDoc, setDoc } from 'firebase/firestore';

export default function QuizCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [timer, setTimer] = useState(30);
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      if (db) {
        const docSnap = await getDoc(doc(db, 'quizzes', id!));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setTimer(data.timer || 30);
          setQuestions(data.questions || []);
        }
      } else {
        throw new Error('No DB');
      }
    } catch (e) {
      const existing = JSON.parse(localStorage.getItem('quizzes') || '[]');
      let quiz;
      if (isNaN(Number(id))) {
        quiz = existing.find((q: any) => q.id === id);
      } else {
        quiz = existing[Number(id)];
      }
      if (quiz) {
        setTitle(quiz.title || '');
        setTimer(quiz.timer || 30);
        setQuestions(quiz.questions || []);
      }
    }
    setLoading(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Please enter a quiz title');
    
    const quizData = {
      title,
      timer,
      questions,
      updatedAt: new Date().toISOString()
    };

    setLoading(true);
    try {
      if (db) {
        if (isEditMode) {
          await setDoc(doc(db, 'quizzes', id!), quizData, { merge: true });
        } else {
          quizData.createdAt = new Date().toISOString() as any;
          await addDoc(collection(db, 'quizzes'), quizData);
        }
      } else {
        throw new Error("Firebase unconfigured");
      }
    } catch (e) {
      // Fallback to local storage
      const existing = JSON.parse(localStorage.getItem('quizzes') || '[]');
      if (isEditMode) {
        if (isNaN(Number(id))) {
          const idx = existing.findIndex((q: any) => q.id === id);
          if (idx >= 0) existing[idx] = { ...existing[idx], ...quizData };
        } else {
          existing[Number(id)] = { ...existing[Number(id)], ...quizData };
        }
      } else {
        quizData.createdAt = new Date().toISOString() as any;
        existing.push({ id: Date.now().toString(), ...quizData });
      }
      localStorage.setItem('quizzes', JSON.stringify(existing));
    }
    
    setLoading(false);
    navigate('/admin');
  };

  if (loading && !title) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>{isEditMode ? 'Edit Quiz' : 'Create New Quiz'}</h2>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Quiz Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Intro to Health Informatics"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time Limit (Minutes)</label>
            <input 
              type="number" 
              className="form-input" 
              value={timer}
              onChange={e => setTimer(parseInt(e.target.value) || 0)}
              min={1}
            />
          </div>
        </div>
      </div>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
            <button 
              onClick={() => removeQuestion(qIndex)}
              style={{ background: 'none', border: 'none', color: 'var(--color-needs-improvement)', cursor: 'pointer' }}
            >
              <Trash2 size={20} />
            </button>
          </div>
          
          <h4 style={{ margin: '0 0 1rem 0' }}>Question {qIndex + 1}</h4>
          
          <div className="form-group">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter question text here..."
              value={q.text}
              onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '1.5rem' }}>
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="radio" 
                  name={`correct-${qIndex}`}
                  checked={q.correctIndex === optIndex}
                  onChange={() => updateQuestion(qIndex, 'correctIndex', optIndex)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--cu-red)' }}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={`Option ${optIndex + 1}`}
                  value={opt}
                  onChange={e => updateOption(qIndex, optIndex, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
        <button className="btn btn-outline" onClick={addQuestion} style={{ flex: 1, borderStyle: 'dashed' }}>
          <Plus size={20} /> Add Question
        </button>
        <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }} disabled={loading}>
          <Save size={20} /> {loading ? 'Saving...' : (isEditMode ? 'Update Quiz' : 'Save & Publish Quiz')}
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

export default function ExamView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quiz = state?.quiz;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz ? quiz.timer * 60 : 0);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (!quiz) {
      navigate('/candidate');
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (!quiz) return null;

  const handleSelectOption = (optIndex: number) => {
    setAnswers({ ...answers, [currentQuestion]: optIndex });
  };

  const getCandidateIndex = async (email: string) => {
    try {
      if (db) {
        const docSnap = await getDoc(doc(db, 'candidates', email));
        if (docSnap.exists()) {
          return docSnap.data().indexNumber;
        }
      }
    } catch (e) {}
    // Fallback
    const local = JSON.parse(localStorage.getItem('candidates') || '[]');
    const found = local.find((c: any) => c.email === email);
    return found ? found.indexNumber : 'UNKNOWN';
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    let score = 0;
    quiz.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctIndex) score++;
    });
    
    const percentage = Math.round((score / quiz.questions.length) * 100);
    
    // Save Result
    const email = localStorage.getItem('userEmail') || 'unknown@example.com';
    const indexNumber = await getCandidateIndex(email);
    
    const resultData = {
      candidateEmail: email,
      indexNumber: indexNumber,
      quizTitle: quiz.title,
      score,
      total: quiz.questions.length,
      percentage,
      timestamp: new Date().toISOString()
    };

    try {
      if (db) {
        await addDoc(collection(db, 'results'), resultData);
      } else {
        throw new Error("No DB");
      }
    } catch (e) {
      const existing = JSON.parse(localStorage.getItem('results') || '[]');
      localStorage.setItem('results', JSON.stringify([...existing, { id: Date.now().toString(), ...resultData }]));
    }
    
    navigate('/candidate/results', { 
      state: { 
        ...resultData
      } 
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const q = quiz.questions[currentQuestion];

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {/* Header / Timer */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{quiz.title}</h2>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          backgroundColor: timeLeft < 60 ? 'var(--bg-needs-improvement)' : 'rgba(0,0,0,0.05)',
          color: timeLeft < 60 ? 'var(--cu-red)' : 'inherit',
          padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold'
        }}>
          {timeLeft < 60 ? <AlertTriangle size={18} /> : <Clock size={18} />}
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
        Question {currentQuestion + 1} of {quiz.questions.length}
      </div>

      {/* Question Card */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.4rem', lineHeight: '1.5' }}>{q.text}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {q.options.map((opt: string, idx: number) => (
            <div 
              key={idx}
              onClick={() => handleSelectOption(idx)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${answers[currentQuestion] === idx ? 'var(--cu-red)' : 'var(--border-color)'}`,
                backgroundColor: answers[currentQuestion] === idx ? 'rgba(179,33,40,0.05)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                fontWeight: answers[currentQuestion] === idx ? 600 : 400
              }}
            >
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                border: `2px solid ${answers[currentQuestion] === idx ? 'var(--cu-red)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {answers[currentQuestion] === idx && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--cu-red)' }} />}
              </div>
              <span style={{ fontSize: '1.1rem' }}>{opt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          className="btn btn-outline" 
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
        >
          Previous
        </button>
        
        {currentQuestion === quiz.questions.length - 1 ? (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}>
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}

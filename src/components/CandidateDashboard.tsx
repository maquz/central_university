import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, PlayCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    setQuizzes(localQuizzes);
    
    if (db) {
      getDocs(collection(db, 'quizzes')).then(snapshot => {
        const fbQuizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fbQuizzes.length > 0) setQuizzes(fbQuizzes);
      }).catch(e => console.warn("Firebase fetch failed, using local fallback."));
    }
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <h2 style={{ marginBottom: '2rem' }}>Available Exams</h2>
      
      {quizzes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No exams are currently available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {quizzes.map((q, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--cu-red)' }}>{q.title}</h3>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={16} /> {q.timer} Minutes Limit</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>{q.questions?.length || 0} Questions</span>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => navigate(`/candidate/exam/${q.id || i}`, { state: { quiz: q } })}
              >
                <PlayCircle size={18} /> Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

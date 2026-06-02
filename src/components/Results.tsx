import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="page-container">
        <p>No results found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/candidate')}>Go Back</button>
      </div>
    );
  }

  const { score, total, percentage, quizTitle } = state;

  // The logic directly from the prompt:
  const rubric = percentage >= 80 ? { label: 'Excellent', color: '#2DD4A8', bg: 'rgba(45,212,168,0.1)', emoji: '🏆' } :
                 percentage >= 65 ? { label: 'Good', color: '#C9A84C', bg: 'rgba(201,168,76,0.1)', emoji: '🎓' } :
                 percentage >= 50 ? { label: 'Average', color: '#4A90E2', bg: 'rgba(74,144,226,0.1)', emoji: '📚' } :
                 { label: 'Needs Improvement', color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)', emoji: '📖' };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{quizTitle}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Exam Results</p>
        
        <div style={{ 
          width: '120px', height: '120px', borderRadius: '50%', 
          backgroundColor: rubric.bg, color: rubric.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', margin: '0 auto 1.5rem',
          border: `4px solid ${rubric.color}`
        }}>
          {percentage}%
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span>{rubric.emoji}</span>
          <span style={{ color: rubric.color }}>{rubric.label}</span>
        </div>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          You scored {score} out of {total} questions correctly.
        </p>

        <button className="btn btn-primary" onClick={() => navigate('/candidate')} style={{ width: '100%' }}>
          <ArrowLeft size={18} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
}

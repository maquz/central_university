import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, PlayCircle, CheckCircle, TimerOff, CalendarClock } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Returns a human-readable countdown string from now to targetDate
function useCountdown(targetDate: string | null) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeStr('');
        return;
      }
      const hrs  = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setTimeStr(
        hrs > 0
          ? `${hrs}h ${mins}m ${secs}s`
          : mins > 0
          ? `${mins}m ${secs}s`
          : `${secs}s`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeStr;
}

function QuizCard({
  quiz,
  index,
  alreadyTaken,
  onStart,
}: {
  quiz: any;
  index: number;
  alreadyTaken: boolean;
  onStart: () => void;
}) {
  const countdown = useCountdown(quiz.scheduledStart || null);
  const hasSchedule = !!quiz.scheduledStart;
  const started = hasSchedule ? new Date(quiz.scheduledStart) <= new Date() : true;
  const locked = !started; // countdown still running
  const scheduledLabel = hasSchedule
    ? new Date(quiz.scheduledStart).toLocaleString()
    : null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        opacity: alreadyTaken ? 0.75 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Completed ribbon */}
      {alreadyTaken && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: -22,
            background: 'var(--color-excellent)',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 28px',
            transform: 'rotate(40deg)',
            letterSpacing: 1,
          }}
        >
          DONE
        </div>
      )}

      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'var(--cu-red)' }}>{quiz.title}</h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={16} /> {quiz.timer} min limit
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {quiz.questions?.length || 0} questions
          </span>
          {scheduledLabel && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarClock size={16} /> Opens: {scheduledLabel}
            </span>
          )}
        </div>
      </div>

      {/* Action area */}
      {alreadyTaken ? (
        <div
          className="quiz-countdown"
          style={{ background: 'rgba(45,212,168,0.1)', borderColor: 'var(--color-excellent)', color: 'var(--color-excellent)' }}
        >
          <CheckCircle size={18} /> Already Submitted
        </div>
      ) : locked ? (
        <div className="quiz-countdown">
          <TimerOff size={18} />
          <span>Exam starts in&nbsp;<strong>{countdown}</strong></span>
        </div>
      ) : (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onStart}>
          <PlayCircle size={18} /> Start Exam
        </button>
      )}
    </div>
  );
}

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes]       = useState<any[]>([]);
  const [takenIds, setTakenIds]     = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const candidateEmail              = localStorage.getItem('userEmail') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);

    // --- Quizzes ---
    let qList: any[] = JSON.parse(localStorage.getItem('quizzes') || '[]');
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'quizzes'));
        const fb = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (fb.length > 0) qList = fb;
      }
    } catch {}
    setQuizzes(qList);

    // --- Already-taken quiz IDs ---
    let taken: string[] = [];
    try {
      if (db && candidateEmail) {
        const q = query(
          collection(db, 'results'),
          where('candidateEmail', '==', candidateEmail)
        );
        const snap = await getDocs(q);
        taken = snap.docs.map(d => d.data().quizTitle as string);
      } else {
        throw new Error('no db');
      }
    } catch {
      const local: any[] = JSON.parse(localStorage.getItem('results') || '[]');
      taken = local
        .filter(r => r.candidateEmail === candidateEmail)
        .map(r => r.quizTitle);
    }
    setTakenIds(new Set(taken));
    setLoading(false);
  }, [candidateEmail]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 s so countdown-to-start auto-unlocks
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleStart = (quiz: any, index: number) => {
    navigate(`/candidate/exam/${quiz.id || index}`, { state: { quiz } });
  };

  return (
    <div className="page-container animate-fade-in">
      <h2 style={{ marginBottom: '0.5rem' }}>Available Exams</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Welcome, <strong>{candidateEmail}</strong>. Each exam can only be taken once.
      </p>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading exams…</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No exams are currently available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {quizzes.map((q, i) => (
            <QuizCard
              key={q.id || i}
              quiz={q}
              index={i}
              alreadyTaken={takenIds.has(q.title)}
              onStart={() => handleStart(q, i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

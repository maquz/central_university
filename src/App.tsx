import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import QuizCreator from './components/QuizCreator';
import CandidateManagement from './components/CandidateManagement';
import ScoresView from './components/ScoresView';
import CandidateDashboard from './components/CandidateDashboard';
import ExamView from './components/ExamView';
import Results from './components/Results';

import AdminApproval from './components/AdminApproval';

const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole?: string }) => {
  const role = localStorage.getItem('userRole');
  if (!role) {
    return <Navigate to="/" replace />;
  }
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/candidate'} replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="create-quiz" element={<QuizCreator />} />
          <Route path="edit-quiz/:id" element={<QuizCreator />} />
          <Route path="candidates" element={<CandidateManagement />} />
          <Route path="scores" element={<ScoresView />} />
          <Route path="approvals" element={<AdminApproval />} />
        </Route>

        {/* Candidate Routes */}
        <Route path="/candidate" element={
          <ProtectedRoute requiredRole="candidate">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CandidateDashboard />} />
          <Route path="exam/:id" element={<ExamView />} />
          <Route path="results" element={<Results />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

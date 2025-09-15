import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { IntroSlides } from './components/onboarding/IntroSlides';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { XpGainNotification } from './components/ui/XpGainNotification';

const queryClient = new QueryClient();

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Auth routes */}
            <Route 
              path="/auth/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
            />
            <Route 
              path="/auth/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterForm />} 
            />
            
            {/* Onboarding */}
            <Route 
              path="/onboarding/intro" 
              element={
                isAuthenticated
                  ? (!user?.introCompleted ? <IntroSlides /> : <Navigate to="/dashboard" replace />)
                  : <Navigate to="/auth/login" replace />
              } 
            />
            
            {/* Protected layout + nested app routes */}
            <Route
              element={
                isAuthenticated
                  ? (user?.introCompleted ? <AppShell /> : <Navigate to="/onboarding/intro" replace />)
                  : <Navigate to="/auth/login" replace />
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Placeholder routes for other pages */}
              <Route path="/checklist" element={<div className="p-6"><h1 className="text-2xl font-bold">Checklist Page (Coming Soon)</h1></div>} />
              <Route path="/modules" element={<div className="p-6"><h1 className="text-2xl font-bold">Modules Page (Coming Soon)</h1></div>} />
              <Route path="/flashcards" element={<div className="p-6"><h1 className="text-2xl font-bold">Flashcards Page (Coming Soon)</h1></div>} />
              <Route path="/leaderboard" element={<div className="p-6"><h1 className="text-2xl font-bold">Leaderboard Page (Coming Soon)</h1></div>} />
              <Route path="/achievements" element={<div className="p-6"><h1 className="text-2xl font-bold">Achievements Page (Coming Soon)</h1></div>} />
              <Route path="/profile" element={<div className="p-6"><h1 className="text-2xl font-bold">Profile Page (Coming Soon)</h1></div>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth/login"} replace />} />
          </Routes>
          
          {/* Global notifications */}
          <XpGainNotification />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
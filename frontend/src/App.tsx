import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import History from '@/pages/History';
import Body from '@/pages/Body';
import Workout from '@/pages/Workout';
import ActiveWorkout from '@/pages/ActiveWorkout';
import Library from '@/pages/Library';
import Profile from '@/pages/Profile';
import Trophees from '@/pages/Trophees';
import Settings from '@/pages/Settings';
import ImportLFY from '@/pages/ImportLFY';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/body" element={<ProtectedRoute><Body /></ProtectedRoute>} />
        <Route path="/workout" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
        <Route path="/workout/active" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/trophees" element={<ProtectedRoute><Trophees /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/import" element={<ProtectedRoute><ImportLFY /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

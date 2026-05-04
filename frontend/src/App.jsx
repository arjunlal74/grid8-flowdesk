import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useBootstrapAuth } from './hooks/useAuth.js';
import { useThemeStore, applyTheme } from './store/themeStore.js';
import AppShell from './components/layout/AppShell.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import LeadsPage from './pages/leads/LeadsPage.jsx';
import LeadFormPage from './pages/leads/LeadFormPage.jsx';
import LeadDetailPage from './pages/leads/LeadDetailPage.jsx';
import TasksPage from './pages/tasks/TasksPage.jsx';
import TaskFormPage from './pages/tasks/TaskFormPage.jsx';
import TaskDetailPage from './pages/tasks/TaskDetailPage.jsx';
import ProjectsPage from './pages/projects/ProjectsPage.jsx';
import ProjectFormPage from './pages/projects/ProjectFormPage.jsx';
import ProjectDetailPage from './pages/projects/ProjectDetailPage.jsx';
import EmployeesPage from './pages/employees/EmployeesPage.jsx';
import EmployeeFormPage from './pages/employees/EmployeeFormPage.jsx';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage.jsx';
import AttendancePage from './pages/attendance/AttendancePage.jsx';
import NotesPage from './pages/notes/NotesPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';
import LeadSettingsLayout from './pages/settings/LeadSettingsLayout.jsx';
import TaskSettingsLayout from './pages/settings/TaskSettingsLayout.jsx';
import LeadStatusesPage from './pages/settings/LeadStatusesPage.jsx';
import TaskStatusesPage from './pages/settings/TaskStatusesPage.jsx';
import CategoriesPage from './pages/settings/CategoriesPage.jsx';
import TagsPage from './pages/settings/TagsPage.jsx';

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  useBootstrapAuth();
  const theme = useThemeStore(s => s.theme);
  useEffect(() => applyTheme(theme), [theme]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/new" element={<LeadFormPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />

        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/new" element={<TaskFormPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />

        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />

        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/new" element={<EmployeeFormPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />

        <Route path="attendance" element={<AttendancePage />} />
        <Route path="notes" element={<NotesPage />} />

        <Route path="settings" element={<SettingsPage />}>
          <Route path="leads" element={<LeadSettingsLayout />}>
            <Route index element={<CategoriesPage />} />
            <Route path="statuses" element={<LeadStatusesPage />} />
            <Route path="tags" element={<TagsPage />} />
          </Route>
          <Route path="tasks" element={<TaskSettingsLayout />}>
            <Route index element={<TaskStatusesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

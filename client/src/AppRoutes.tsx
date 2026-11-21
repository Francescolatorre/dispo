import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { PlanningPage } from './pages/PlanningPage';
import { PeoplePage } from './pages/PeoplePage';
import { ProjectsPage } from './pages/ProjectsPage';

export const AppRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<PlanningPage />} />
      <Route path="people" element={<PeoplePage />} />
      <Route path="projects" element={<ProjectsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

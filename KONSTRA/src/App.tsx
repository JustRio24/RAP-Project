import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage }      from '@/pages/DashboardPage';
import { ProjectsPage }       from '@/pages/ProjectsPage';
import { ProjectDetailPage }  from '@/pages/ProjectDetailPage';
import { CalculatorPage }     from '@/pages/CalculatorPage';
import { TeamPage }           from '@/pages/TeamPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"                element={<DashboardPage />}     />
          <Route path="/projects"        element={<ProjectsPage />}      />
          <Route path="/projects/:id"    element={<ProjectDetailPage />} />
          <Route path="/calculator"      element={<CalculatorPage />}    />
          <Route path="/team"            element={<TeamPage />}          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

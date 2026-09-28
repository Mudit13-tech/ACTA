import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Welcome from '../pages/Welcome';
import Home from '../pages/Home';
import NewTask from '../pages/NewTask';
import Tasks from '../pages/Tasks';
import Run from '../pages/Run';
import Approvals from '../pages/Approvals';
import Limits from '../pages/Limits';
import Settings from '../pages/Settings';
import About from '../pages/About';
import NotFound from '../pages/NotFound';
import { useProfile } from '../context/ProfileContext';

/** Nobody sees the app until the agent knows who it is acting for. */
const RequireSetup = () => {
  const { profile } = useProfile();
  return profile.signedIn ? <Outlet /> : <Navigate to="/welcome" replace />;
};

/** And nobody who is already set up gets sent back to the door. */
const WelcomeRoute = () => {
  const { profile } = useProfile();
  return profile.signedIn ? <Navigate to="/" replace /> : <Welcome />;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/welcome" element={<WelcomeRoute />} />

      <Route element={<RequireSetup />}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewTask />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/run/:id" element={<Run />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/limits" element={<Limits />} />
        <Route path="/about" element={<About />} />
        {/* The old names, kept so existing links still land somewhere sensible. */}
        <Route path="/policy" element={<Navigate to="/limits" replace />} />
        <Route path="/agent" element={<Navigate to="/new" replace />} />
        <Route path="/activity" element={<Navigate to="/tasks" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default AppRoutes;

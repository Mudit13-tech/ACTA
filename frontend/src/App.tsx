import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { PolicyProvider } from './context/PolicyContext';
import { AgentProvider } from './context/AgentContext';
import AppRoutes from './routes/AppRoutes';
import './index.css';

const App = () => (
  <ThemeProvider>
    <ProfileProvider>
      <PolicyProvider>
      <AgentProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AgentProvider>
      </PolicyProvider>
    </ProfileProvider>
  </ThemeProvider>
);

export default App;

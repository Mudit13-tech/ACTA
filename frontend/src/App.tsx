import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import ThemeToggle from './components/ThemeToggle';
import Home from './routes/Home';
import Products from './routes/Products';
import Itinerary from './routes/Itinerary';
import Checkout from './routes/Checkout';
import NotFound from './routes/NotFound';
import { useAuthStore } from './store/useStore';
import { setupAxiosInterceptors } from './services/api';

const App: React.FC = () => {
  const { token, setToken } = useAuthStore();

  useEffect(() => {
    const saved = localStorage.getItem('authToken');
    if (saved) setToken(saved);
  }, [setToken]);

  useEffect(() => {
    setupAxiosInterceptors(token);
  }, [token]);

  return (
    <div className="app">
      <NavBar />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/itinerary/:id" element={<Itinerary />} />
        <Route path="/checkout/:orderId" element={<Checkout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './NavBar.css';

const NavBar: React.FC = () => (
  <motion.nav
    className="glass-card nav"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <div className="logo">ACTCA</div>
    <ul className="nav-links">
      <li><Link to="/">Home</Link></li>
      <li><Link to="/products">Products</Link></li>
      <li><Link to="/itinerary/1">Itinerary</Link></li>
    </ul>
  </motion.nav>
);

export default NavBar;

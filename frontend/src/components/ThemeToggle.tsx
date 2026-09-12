import React from 'react';
import { motion } from 'framer-motion';

const ThemeToggle: React.FC = () => {
  const toggle = () => document.body.classList.toggle('dark');
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className="theme-toggle"
      onClick={toggle}
    >
      🌙 / ☀️
    </motion.button>
  );
};

export default ThemeToggle;

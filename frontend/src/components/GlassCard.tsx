import React, { PropsWithChildren } from 'react';
import './GlassCard.css';

const GlassCard: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`glass-card ${className}`}>{children}</div>
);

export default GlassCard;

import React from 'react';
import { PortfolioScene } from '../components/portfolio/PortfolioScene';

export const PortfolioView: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-hidden">
      <PortfolioScene />
    </div>
  );
};

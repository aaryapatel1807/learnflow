import React from 'react';
import { Scroll } from '@react-three/drei';
import { Link } from 'react-router-dom';

export const HtmlOverlays: React.FC = () => {
  return (
    <Scroll html style={{ width: '100%', height: '100%' }}>
      {/* Page 1: Core */}
      <div className="h-screen flex flex-col justify-center items-start p-12 lg:p-24 w-full md:w-1/2">
        <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Creative <br/><span className="text-glow-violet">Technologist</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            I build high-performance, immersive web experiences bridging the gap between design engineering and 3D storytelling.
          </p>
          <Link to="/roadmap" className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
            View Developer Roadmap
          </Link>
        </div>
      </div>

      {/* Page 2: Architecture */}
      <div className="h-screen flex flex-col justify-center items-end p-12 lg:p-24 w-full">
        <div className="w-full md:w-1/2 p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Robust <span className="text-glow-emerald">Architecture</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Scalable modular components, strict TypeScript integrations, and fluid state management forming the backbone of complex interactive applications.
          </p>
        </div>
      </div>

      {/* Page 3: Projects */}
      <div className="h-screen flex flex-col justify-end items-center p-12 lg:p-24 w-full">
        <div className="w-full max-w-2xl text-center p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl mb-24">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Interactive <span className="text-blue-500">Playground</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Explore case studies and experiments pushing the boundaries of WebGL and React.
          </p>
          <button className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors">
            Contact Me
          </button>
        </div>
      </div>
    </Scroll>
  );
};

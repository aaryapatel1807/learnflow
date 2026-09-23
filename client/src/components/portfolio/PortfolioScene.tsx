// @ts-nocheck
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Preload } from '@react-three/drei';
import { ScrollRig } from './ScrollRig';

export const PortfolioScene: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-950">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#030712']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        
        <Suspense fallback={null}>
          <ScrollRig />
          {/* Default environment lighting */}
          <Environment preset="city" />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
};

// @ts-nocheck
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

export const CoreChapter: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      
      // React to scroll progress (0 to 1 over the whole page)
      const r1 = scroll.range(0, 1/3); // animate during first third
      meshRef.current.scale.setScalar(1 + r1 * 2);
      meshRef.current.position.y = -r1 * 5; // Move down as we scroll past
    }
  });

  return (
    <group position={[0, 0, -5]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[2, 0]} />
        <meshPhysicalMaterial 
          color="#8b5cf6"
          emissive="#4c1d95"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Particles around the core */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={100}
            array={new Float32Array(300).map(() => (Math.random() - 0.5) * 10)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#10b981" transparent opacity={0.6} />
      </points>
    </group>
  );
};

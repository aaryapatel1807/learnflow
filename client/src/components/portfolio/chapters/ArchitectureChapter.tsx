// @ts-nocheck
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

export const ArchitectureChapter: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (groupRef.current) {
      // Assemble/disassemble blocks based on scroll in the middle third
      const r2 = scroll.range(1/3, 1/3);
      groupRef.current.children.forEach((child, i) => {
        const targetY = (i % 3) - 1;
        const targetX = Math.floor(i / 3) - 1;
        
        // Starts spread out, assembles as r2 -> 1
        child.position.x = THREE.MathUtils.lerp(targetX * 5, targetX * 1.5, r2);
        child.position.y = THREE.MathUtils.lerp(targetY * 5, targetY * 1.5, r2);
        child.rotation.z = THREE.MathUtils.lerp(Math.PI * i, 0, r2);
      });
      
      groupRef.current.position.y = THREE.MathUtils.lerp(10, 0, r2) - scroll.range(2/3, 1/3) * 10;
    }
  });

  return (
    <group ref={groupRef} position={[0, 10, -8]}>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#10b981' : '#3b82f6'} />
        </mesh>
      ))}
    </group>
  );
};

// @ts-nocheck
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

interface ProjectCardProps {
  position: [number, number, number];
  color: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ position, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
      
      // Tilt to mouse if hovered
      if (hovered) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, (state.mouse.y * Math.PI) / 4, 0.1);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, (state.mouse.x * Math.PI) / 4, 0.1);
      } else {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[3, 2, 0.1]} />
      <meshStandardMaterial color={hovered ? '#ffffff' : color} emissive={hovered ? color : '#000000'} emissiveIntensity={hovered ? 0.5 : 0} />
    </mesh>
  );
};

export const ProjectsChapter: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (groupRef.current) {
      // Come up from bottom in the last third
      const r3 = scroll.range(2/3, 1/3);
      groupRef.current.position.y = THREE.MathUtils.lerp(-10, 0, r3);
    }
  });

  return (
    <group ref={groupRef} position={[0, -10, -5]}>
      <ProjectCard position={[-4, 0, 0]} color="#8b5cf6" />
      <ProjectCard position={[0, 0, 0]} color="#10b981" />
      <ProjectCard position={[4, 0, 0]} color="#3b82f6" />
    </group>
  );
};

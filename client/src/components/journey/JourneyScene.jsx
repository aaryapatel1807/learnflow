// @ts-nocheck
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A single floating "subject island" orbiting the learner core.
 */
function FloatingIsland({ baseY = 0, color, size = 0.55, orbitRadius = 3, orbitSpeed = 0.25, angleOffset = 0, floatSpeed = 1 }) {
  const group = useRef();
  const mesh = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = angleOffset + t * orbitSpeed;
    if (group.current) {
      group.current.position.set(
        Math.cos(angle) * orbitRadius,
        baseY + Math.sin(t * floatSpeed + angleOffset) * 0.35,
        Math.sin(angle) * orbitRadius * 0.55 - 1.5
      );
    }
    if (mesh.current) {
      mesh.current.rotation.x = t * 0.25 * floatSpeed;
      mesh.current.rotation.y = t * 0.35 * floatSpeed;
    }
  });

  return (
    <group ref={group} position={[orbitRadius, baseY, -1.5]}>
      <mesh ref={mesh}>
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      {/* faint orbit halo around the island */}
      <mesh rotation={[Math.PI / 2.2, 0.2, 0]}>
        <torusGeometry args={[size * 1.7, 0.015, 8, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

/**
 * The glowing learner core at the centre of the journey.
 */
function LearnerCore() {
  const core = useRef();
  const wire = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 1.6) * 0.08;
    if (core.current) {
      core.current.scale.setScalar(pulse);
      core.current.rotation.y = t * 0.3;
    }
    if (wire.current) {
      wire.current.scale.setScalar(pulse * 1.35);
      wire.current.rotation.x = t * 0.18;
      wire.current.rotation.y = -t * 0.22;
    }
  });

  return (
    <group position={[0, 0, -1.5]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#6d28d9"
          emissiveIntensity={0.9}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial color="#c4b5fd" wireframe transparent opacity={0.55} />
      </mesh>
      <pointLight color="#a78bfa" intensity={1.4} distance={9} />
    </group>
  );
}

/**
 * Drifting stardust particles.
 */
function StarDust({ count = 220 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 15;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#c4b5fd" transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

/**
 * Gentle mouse-parallax camera rig.
 */
function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 1.1 - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 0.7 + 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -1.5);
  });
  return null;
}

const ISLANDS = [
  { color: '#10b981', size: 0.55, orbitRadius: 3.1, orbitSpeed: 0.22, angleOffset: 0.0, baseY: 0.5, floatSpeed: 1.0 },
  { color: '#f59e0b', size: 0.45, orbitRadius: 3.8, orbitSpeed: -0.16, angleOffset: 2.1, baseY: -0.7, floatSpeed: 1.3 },
  { color: '#0ea5e9', size: 0.5, orbitRadius: 2.6, orbitSpeed: 0.3, angleOffset: 4.2, baseY: -0.2, floatSpeed: 0.8 },
  { color: '#f43f5e', size: 0.4, orbitRadius: 4.4, orbitSpeed: 0.12, angleOffset: 5.3, baseY: 0.9, floatSpeed: 1.1 },
];

export function JourneyScene() {
  return (
    <group>
      <LearnerCore />
      {ISLANDS.map((props, i) => (
        <FloatingIsland key={i} {...props} />
      ))}
      {/* faint orbit path rings */}
      {[2.6, 3.1, 3.8, 4.4].map((r, i) => (
        <mesh key={`ring-${i}`} position={[0, [-0.2, 0.5, -0.7, 0.9][i], -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.008, 8, 80]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.18} />
        </mesh>
      ))}
      <StarDust />
      <CameraRig />
    </group>
  );
}

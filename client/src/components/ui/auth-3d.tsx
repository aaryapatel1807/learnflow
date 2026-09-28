import { Canvas } from "@react-three/fiber";
import { Float, RoundedBox, Sparkles } from "@react-three/drei";

type Vec3 = [number, number, number];

function Book({
  position,
  rotation = [0, 0, 0],
  color,
  speed = 2.4,
}: {
  position: Vec3;
  rotation?: Vec3;
  color: string;
  speed?: number;
}) {
  return (
    <Float speed={speed} rotationIntensity={0.35} floatIntensity={1.15}>
      <group position={position} rotation={rotation}>
        {/* cover */}
        <RoundedBox args={[1.15, 1.55, 0.32]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={color} roughness={0.45} />
        </RoundedBox>
        {/* page block peeking out */}
        <mesh position={[0.12, 0, 0]}>
          <boxGeometry args={[0.95, 1.4, 0.3]} />
          <meshStandardMaterial color="#fffdf9" roughness={0.85} />
        </mesh>
        {/* bookmark ribbon */}
        <mesh position={[-0.28, -0.3, 0.17]}>
          <boxGeometry args={[0.12, 0.95, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

function Pencil({ position, rotation = [0, 0, 0], speed = 3 }: { position: Vec3; rotation?: Vec3; speed?: number }) {
  return (
    <Float speed={speed} rotationIntensity={0.55} floatIntensity={1.4}>
      <group position={position} rotation={rotation}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 1.6, 6]} />
          <meshStandardMaterial color="#f5b942" roughness={0.5} />
        </mesh>
        {/* sharpened tip */}
        <mesh position={[0, 0.95, 0]}>
          <coneGeometry args={[0.09, 0.3, 6]} />
          <meshStandardMaterial color="#f7e9d0" roughness={0.6} />
        </mesh>
        {/* eraser */}
        <mesh position={[0, -0.86, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.14, 6]} />
          <meshStandardMaterial color="#e14d7a" roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function StudyScene() {
  return (
    <>
      <ambientLight intensity={1.05} />
      <directionalLight position={[5, 6, 4]} intensity={1.15} />
      <directionalLight position={[-4, -2, 2]} intensity={0.45} color="#dcd4f5" />

      {/* floating books, kept toward the edges so the centred quote stays readable */}
      <Book position={[-2.1, 1.05, -0.6]} rotation={[0.1, 0.35, 0.12]} color="#e14d7a" speed={2.2} />
      <Book position={[2.15, 1.2, -1.1]} rotation={[-0.08, -0.35, -0.1]} color="#8b7fd4" speed={2.8} />
      <Book position={[1.55, -1.75, -0.7]} rotation={[0.05, 0.2, 0.22]} color="#2bbfa9" speed={2.5} />
      <Book position={[-1.9, -1.5, -1.2]} rotation={[-0.06, -0.25, -0.18]} color="#f0a35e" speed={3.1} />

      {/* floating pencil */}
      <Pencil position={[0.15, 1.9, -1.4]} rotation={[0.2, 0.1, 1.15]} speed={2.9} />

      {/* drifting pastel dust */}
      <Sparkles count={45} scale={[9, 6, 3]} position={[0, 0, -1]} size={4} speed={0.4} opacity={0.55} color="#e14d7a" />
      <Sparkles count={30} scale={[8, 5, 3]} position={[0, 0, -2]} size={6} speed={0.25} opacity={0.4} color="#8b7fd4" />
    </>
  );
}

export function Auth3DScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <StudyScene />
    </Canvas>
  );
}

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { JourneyScene } from './JourneyScene';
import './JourneyHero.css';

/**
 * 3D Learning Journey Hero — replaces the flat dashboard banner.
 * A glowing learner core orbited by subject islands, with the
 * greeting / level / XP overlay floating on top.
 */
export function JourneyHero({ user, level, xpPercent, xpInCurrentLevel, xpForNextLevel }) {
  return (
    <div className="journey-hero animate-rise">
      <div className="journey-canvas" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0.4, 7], fov: 60 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[6, 6, 4]} intensity={1.1} />
          <directionalLight position={[-6, -4, -2]} intensity={0.45} color="#8b5cf6" />
          <Suspense fallback={null}>
            <JourneyScene />
          </Suspense>
        </Canvas>
      </div>

      <div className="journey-overlay">
        <div className="journey-left">
          <span className="journey-greeting">Welcome back</span>
          <h1 className="journey-name">{user?.name}</h1>
          <p className="journey-tagline">Your learning journey continues — pick up where you left off.</p>
        </div>
        <div className="journey-right">
          <div className="journey-level-wrap">
            <div className="journey-level-display">{level}</div>
            <div className="journey-level-label">Level</div>
          </div>
          <div className="journey-xp-section">
            <div className="journey-xp-bar">
              <div className="journey-xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="journey-xp-text">
              {xpInCurrentLevel} / {xpForNextLevel} XP to next level
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

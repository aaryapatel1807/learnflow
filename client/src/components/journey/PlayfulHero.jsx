import './PlayfulHero.css';

/**
 * PlayfulHero — light, whitish, colourful hero for the dashboard.
 * Soft pastel blobs, floating sparkles, a sticker-style level badge
 * and a chunky rainbow XP bar.
 */
export function PlayfulHero({ user, level, xpPercent, xpInCurrentLevel, xpForNextLevel }) {
  return (
    <div className="playful-hero animate-rise">
      <div className="playful-blobs" aria-hidden="true">
        <span className="blob blob-pink" />
        <span className="blob blob-mint" />
        <span className="blob blob-sky" />
        <span className="blob blob-lemon" />
      </div>
      <div className="playful-sparkles" aria-hidden="true">
        <span className="sparkle s1">✨</span>
        <span className="sparkle s2">⭐</span>
        <span className="sparkle s3">🎈</span>
        <span className="sparkle s4">🌈</span>
      </div>

      <div className="playful-hero-inner">
        <div className="playful-left">
          <span className="playful-eyebrow">👋 Hey there,</span>
          <h1 className="playful-name">{user?.name}</h1>
          <p className="playful-tagline">
            Ready for today&rsquo;s learning adventure? Let&rsquo;s make it fun!
          </p>
        </div>

        <div className="playful-right">
          <div className="playful-level-sticker" title={`Level ${level}`}>
            <span className="playful-level-num">{level}</span>
            <span className="playful-level-cap">level</span>
          </div>
          <div className="playful-xp">
            <div className="playful-xp-track">
              <div className="playful-xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="playful-xp-text">
              {xpInCurrentLevel} / {xpForNextLevel} XP to next level 🚀
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

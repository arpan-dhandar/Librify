import { useEffect, useRef, useState } from 'react';

function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return display;
}

export default function StatCard({ label, value, foot, accent, delay = 0 }) {
  const display = useCountUp(value);

  return (
    <div
      className="stat-card"
      style={{
        '--card-accent': accent,
        animation: `page-rise 0.5s cubic-bezier(0.16,1,0.3,1) both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="label">{label}</div>
      <div className="value">{display}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  );
}
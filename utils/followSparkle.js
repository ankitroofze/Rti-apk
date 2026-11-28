const TRICOLOR = ['#ff9933', '#ffffff', '#138808'];

export function showFollowSparkle(button) {
  const doc = button?.ownerDocument;
  const browser = doc?.defaultView;
  if (!button?.isConnected || !doc?.body || typeof button.animate !== 'function') return;
  if (browser?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const rect = button.getBoundingClientRect();
  if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= browser.innerHeight) return;

  const layer = doc.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: '2147483647',
  });
  doc.body.appendChild(layer);

  try {
    const particles = Array.from({ length: 9 }, (_, index) => {
      const angle = (index / 9) * 2 * Math.PI - Math.PI / 2;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      const spread = index % 2 === 0 ? 16 : 11;
      const sparkle = doc.createElement('span');
      sparkle.textContent = '✦';
      Object.assign(sparkle.style, {
        position: 'absolute',
        left: `${rect.left + rect.width / 2 + x * rect.width / 2}px`,
        top: `${rect.top + rect.height / 2 + y * rect.height / 2}px`,
        color: TRICOLOR[index % TRICOLOR.length],
        fontSize: index % 2 === 0 ? '13px' : '9px',
        lineHeight: '1',
        textShadow: '0 1px 3px rgba(15, 23, 42, 0.5)',
      });
      layer.appendChild(sparkle);

      return sparkle.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.4)' },
        { opacity: 1, offset: 0.2 },
        { opacity: 1, offset: 0.52 },
        { opacity: 0, transform: `translate(calc(-50% + ${x * spread}px), calc(-50% + ${y * spread}px)) rotate(35deg) scale(0.65)` },
      ], { duration: 460, delay: (index % 3) * 24, easing: 'ease-out', fill: 'both' }).finished;
    });
    Promise.allSettled(particles).then(() => layer.remove());
  } catch {
    layer.remove();
  }
}

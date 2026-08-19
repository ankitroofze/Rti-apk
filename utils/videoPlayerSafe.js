export function safePause(player) {
  if (!player) return false;
  try {
    const result = player.pause();
    if (result && typeof result.then === 'function') {
      result.catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

export function safePlay(player) {
  if (!player) return false;
  try {
    const result = player.play();
    if (result && typeof result.then === 'function') {
      result.catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

export function safeSetMuted(player, muted) {
  if (!player) return false;
  try {
    player.muted = muted;
    return true;
  } catch {
    return false;
  }
}


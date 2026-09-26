// One source of truth for quiz result and certificate eligibility.
export const getQuizResultTier = (percentage = 0) => {
  const value = Number(percentage);
  const pct = Number.isFinite(value) ? Math.max(0, value) : 0;

  if (pct < 40) return { percentage: pct, passed: false, result: 'Fail', badge: '', color: '#dc2626', backgroundColor: '#fef2f2', dot: '🔴' };
  if (pct <= 54) return { percentage: pct, passed: true, result: 'Pass', badge: 'Learner', color: '#ca8a04', backgroundColor: '#fefce8', dot: '🟡' };
  if (pct <= 79) return { percentage: pct, passed: true, result: 'Good', badge: 'Aware', color: '#4338ca', backgroundColor: '#eef2ff', dot: '🔵' };
  return { percentage: pct, passed: true, result: 'Excellent', badge: 'Expert', color: '#059669', backgroundColor: '#ecfdf5', dot: '🟢' };
};

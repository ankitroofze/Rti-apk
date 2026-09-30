// One source of truth for quiz result and certificate eligibility.
export const getScoreText = (r = {}) => {
  const pct = Number(r?.percentage ?? r?.score ?? 0) || 0;
  const totalQ = Number(r?.total_questions) || 0;
  const total = totalQ || Number(r?.total_marks) || 0;
  if (!total) return { text: '', full: `${pct}%` };
  let obtained = totalQ && r?.correct_answers != null ? Number(r.correct_answers)
    : (!totalQ && r?.obtained_marks != null ? Number(r.obtained_marks) : NaN);
  if (!Number.isFinite(obtained) || (obtained === 0 && pct > 0)) obtained = Math.round((pct / 100) * total);
  return { text: `${obtained}/${total}`, full: `${obtained}/${total} (${pct}%)` };
};
export const getQuizResultTier = (percentage = 0) => {
  const value = Number(percentage);
  const pct = Number.isFinite(value) ? Math.max(0, value) : 0;

  if (pct < 40) return { percentage: pct, passed: false, result: 'Fail', badge: '', color: '#dc2626', backgroundColor: '#fef2f2', dot: '🔴' };
  if (pct <= 54) return { percentage: pct, passed: true, result: 'Pass', badge: 'Learner', color: '#ca8a04', backgroundColor: '#fefce8', dot: '🟡' };
  if (pct <= 79) return { percentage: pct, passed: true, result: 'Good', badge: 'Aware', color: '#4338ca', backgroundColor: '#eef2ff', dot: '🔵' };
  return { percentage: pct, passed: true, result: 'Excellent', badge: 'Expert', color: '#059669', backgroundColor: '#ecfdf5', dot: '🟢' };
};

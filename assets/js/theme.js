// Runs before first paint: marks JS as available and applies the saved theme.
document.documentElement.classList.add('js');
try {
  const saved = localStorage.getItem('kohs-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch (err) { /* storage unavailable */ }

// Applies the saved light/dark theme before first paint (kept external so the CSP needs no inline scripts).
try {
  var t = localStorage.getItem('easyjson.theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
} catch (e) {}

// translateStatic.js
document.addEventListener('DOMContentLoaded', () => {
  const userLang = localStorage.getItem('siteLanguage') || 'en';
  // For each element that has data-fr (or data-en),
  // set its .innerHTML to the correct language attribute.
  document.querySelectorAll('[data-fr]').forEach(el => {
    const preferred = [userLang, 'en', 'fr'];
    let text = null;
    for (const lang of preferred) {
      const value = el.getAttribute(`data-${lang}`);
      if (value != null) {
        text = value;
        break;
      }
    }
    if (text != null) {
      el.innerHTML = text;
    }
  });
});

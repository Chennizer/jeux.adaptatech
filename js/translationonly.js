// translateStatic.js
document.addEventListener('DOMContentLoaded', () => {
  const userLang = localStorage.getItem('siteLanguage') || 'fr';
  // For each element that has data-fr (or data-en),
  // set its .innerHTML to the correct language attribute.
  document.querySelectorAll('[data-fr]').forEach(el => {
    const text = el.getAttribute(`data-${userLang}`);
    if (text != null) {
      el.innerHTML = text;
    }
  });
});

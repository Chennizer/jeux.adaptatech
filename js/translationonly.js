// translateStatic.js
document.addEventListener('DOMContentLoaded', () => {
  const supported = ['en', 'fr', 'ja'];
  const userLang = (localStorage.getItem('siteLanguage') || 'en');
  const lang = supported.includes(userLang) ? userLang : 'en';

  const getText = (el) => {
    for (const code of [lang, ...supported.filter(code => code !== lang)]) {
      const text = el.getAttribute(`data-${code}`);
      if (text != null) {
        return text;
      }
    }
    return null;
  };

  // For each element that has any language attribute, set its .innerHTML accordingly.
  document.querySelectorAll('[data-fr], [data-en], [data-ja]').forEach(el => {
    const text = getText(el);
    if (text != null) {
      el.innerHTML = text;
    }
  });
});

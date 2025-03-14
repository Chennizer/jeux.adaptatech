
// Update every element with data-fr attribute based on the stored language.
function updateLanguage() {
  var lang = localStorage.getItem('siteLanguage') || 'fr';
  document.querySelectorAll('[data-fr]').forEach(function(el) {
    el.innerHTML = el.getAttribute('data-' + lang);
  });
  var toggleBtn = document.getElementById('language-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = (lang === 'fr') ? 'English' : 'Français';
  }
}
// Toggle language between French and English.
function toggleLanguage() {
  var current = localStorage.getItem('siteLanguage') || 'fr';
  var newLang = (current === 'fr') ? 'en' : 'fr';
  localStorage.setItem('siteLanguage', newLang);
  updateLanguage();
}
document.addEventListener('DOMContentLoaded', updateLanguage);

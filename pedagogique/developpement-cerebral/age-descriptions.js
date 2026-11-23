// Display windows are editorial; source ages retain their original meaning.
// No colour, profile value or inferred "mental age" enters this selection.
export function descriptionAtMonth(catalog, month, domain = 'auto') {
  if (!Number.isFinite(month) || month < 0 || month > 240) return null;
  return catalog.records.find(record => month >= record.fromMonths && month < record.toMonths
    && (domain === 'auto' ? record.automatic : record.domains.includes(domain))) ?? null;
}

export function mountAgeDescriptions({ root, button, filter, domains, getAge }) {
  const $ = id => root.querySelector(`#${id}`);
  const kinds = { milestone: 'Compétence observable', brain_trend: 'Évolution cérébrale', general_trend: 'Tendance générale', practice: 'Piste de pratique' };
  let catalog = null, active = false, currentKey = '';
  for (const domain of domains) {
    const option = document.createElement('option'); option.value = domain.id; option.textContent = domain.label;
    filter.append(option);
  }
  function update() {
    if (!active || !catalog) return;
    const record = descriptionAtMonth(catalog, Math.round(getAge() * 12), filter.value);
    const key = `${filter.value}:${record?.id ?? 'empty'}`;
    if (key === currentKey) return;
    currentKey = key;
    root.dataset.record = record?.id ?? '';
    $('repere-content').hidden = !record;
    $('repere-empty').hidden = Boolean(record);
    if (!record) return;
    $('repere-kind').textContent = kinds[record.kind];
    $('repere-title').textContent = record.title;
    $('repere-description').textContent = record.description;
    $('repere-region').textContent = record.region;
    $('repere-region').hidden = !record.region;
    const source = catalog.sources[record.sourceId];
    $('repere-source').textContent = `${source.label} · ${record.sourceAge.label} ↗`;
    $('repere-source').href = source.url;
    $('repere-source').setAttribute('aria-label', `${source.label}, ${record.sourceAge.label} : consulter la source (nouvel onglet)`);
  }
  filter.addEventListener('change', update);
  // Load independently of the 3D assets: a missing catalog never breaks the brain.
  fetch('./data/age-descriptions.fr.json').then(response => {
    if (!response.ok) throw new Error(`Repères HTTP ${response.status}`);
    return response.json();
  }).then(data => {
    catalog = data; button.disabled = false; update();
  }).catch(() => { button.title = 'Les repères sont indisponibles. Rechargez la page pour réessayer.'; });
  return {
    update,
    setActive(value) { active = value; root.hidden = !value; update(); },
    reset() { filter.value = 'auto'; currentKey = ''; }
  };
}

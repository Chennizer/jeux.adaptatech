import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { descriptionAtMonth } from '../age-descriptions.js';
import { PROFILE_DOMAINS } from '../development-profiles.js';

const catalog = JSON.parse(await readFile(new URL('../data/age-descriptions.fr.json', import.meta.url), 'utf8'));
const domainIds = new Set(PROFILE_DOMAINS.map(domain => domain.id));

test('the local catalog retains traceable ages and distinguishes observations, imaging and practice', () => {
  const ids = new Set(), covered = new Set();
  for (const record of catalog.records) {
    assert(!ids.has(record.id)); ids.add(record.id);
    assert(Number.isInteger(record.fromMonths) && Number.isInteger(record.toMonths));
    assert(record.fromMonths >= 0 && record.toMonths <= 241 && record.fromMonths < record.toMonths);
    assert(record.description.length > 0 && record.description.split(/\s+/u).length <= 40);
    for (const domain of record.domains) { assert(domainIds.has(domain)); covered.add(domain); }
    const source = catalog.sources[record.sourceId];
    assert(source && new URL(source.url).protocol === 'https:');
    assert(record.sourceAge.label);
    assert(['milestone', 'brain_trend', 'general_trend', 'practice'].includes(record.kind));
    if (source.type === 'milestone_checklist') {
      assert.equal(record.kind, 'milestone');
      assert(Number.isInteger(record.sourceAge.byMonths));
      assert(record.fromMonths >= record.sourceAge.byMonths, 'CDC display does not move the checklist to an earlier age');
    }
    if (source.type === 'activity_guide') assert.equal(record.kind, 'practice');
    if (source.type === 'original_imaging_study') assert.equal(record.kind, 'brain_trend');
  }
  assert.deepEqual(covered, domainIds, 'all thirteen existing domains have at least one sourced entry');
  assert(catalog.provenance.includes('not imported'));
});

test('automatic playback has exactly one age-appropriate entry for every selectable month', () => {
  for (let month = 0; month <= 240; month++) {
    const matches = catalog.records.filter(record => record.automatic && month >= record.fromMonths && month < record.toMonths);
    assert.equal(matches.length, 1, `month ${month}`);
    assert.equal(descriptionAtMonth(catalog, month), matches[0]);
  }
  for (const record of catalog.records.filter(record => record.automatic)) {
    assert.equal(descriptionAtMonth(catalog, record.fromMonths), record);
    if (record.toMonths <= 240) assert.notEqual(descriptionAtMonth(catalog, record.toMonths), record);
  }
});

test('filtered entries enter and leave at their window boundaries without inventing missing milestones', () => {
  const hearing = catalog.records.find(record => record.id === 'sound-toys');
  assert.equal(descriptionAtMonth(catalog, 4, 'hearing'), hearing);
  assert.equal(descriptionAtMonth(catalog, 6, 'hearing'), hearing);
  assert.notEqual(descriptionAtMonth(catalog, 7, 'hearing'), hearing);
  assert.equal(descriptionAtMonth(catalog, 192, 'hearing'), null);
  assert.equal(descriptionAtMonth(catalog, 60, 'inhibition').kind, 'practice');
  assert.equal(descriptionAtMonth(catalog, 100, 'inhibition'), null);
  assert(descriptionAtMonth(catalog, 240), 'the last entry includes twenty years');
  for (const month of [-1, 241, NaN, Infinity]) assert.equal(descriptionAtMonth(catalog, month), null);
  assert.equal(descriptionAtMonth(catalog, 60, 'unknown'), null);
});

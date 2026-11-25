/** Latest approved UI scope: Rivoli Media vs EDIT; Union Coop Creative vs Carrefour/LuLu.
 * Dependency-free source contract, not an integration/browser test. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const root=join(__dirname,'..');
const read=(relative)=>readFileSync(join(root,relative),'utf8');
const pages=Object.fromEntries(['MediaDashboardPage','CreativeDashboardPage','ConsumerDashboardPage','SearchDashboardPage'].map(name=>[name,read(`client/src/pages/${name}.tsx`)]));
const media=pages.MediaDashboardPage;
assert.match(media,/union\?<UnionCoopMediaView\/>:<RivoliMediaPage\/>/);
const coop=read('client/src/pages/UnionCoopMediaView.tsx');
assert.match(coop,/useContextualCompetition\('union-coop'/);
assert.doesNotMatch(coop,/rivoli-shop/);
assert.match(media,/useContextualCompetition\('rivoli-shop'/);
assert.match(media,/<CompetitionDropdown context=\{competitionContext\}/);
assert.match(media,/<ContextualCompetitionPanel context=\{competitionContext\} view="media"/);
assert.match(media,/label="Competition"/);
assert.match(media,/Client: Rivoli/);
assert.match(media,/next\.delete\('client'\)/);
assert.doesNotMatch(media,/next\.delete\('competition'\)/);
assert.match(media,/label="Campaigns"/);
assert.match(media,/label="Channels"/);
assert.match(pages.CreativeDashboardPage,/creativeCompetitionEnabled \? 'union-coop' : 'no-approved-creative-competitors'/);
assert.match(pages.CreativeDashboardPage,/creativeCompetitionEnabled \? <CompetitionDropdown/);
assert.match(pages.CreativeDashboardPage,/creativeCompetitionEnabled \? <section className=\"creative-competition-strip/);
assert.match(pages.CreativeDashboardPage,/<CompetitionDropdown context=\{competitionContext\}/);
assert.match(pages.CreativeDashboardPage,/<ContextualCompetitionPanel context=\{competitionContext\}/);
for (const tab of ['ConsumerDashboardPage','SearchDashboardPage']) {
  assert.doesNotMatch(pages[tab],/CompetitionDropdown|ContextualCompetitionPanel|useContextualCompetition/,`${tab} must not expose competitor comparison`);
}
const config=read('server/src/modules/competition/config/competition.config.ts');
assert.match(config,/id: 'edit-by-ahmed-seddiqi',[\s\S]*?clientId: 'rivoli-shop'/);
assert.match(config,/id: 'carrefour-uae',[\s\S]*?clientId: 'union-coop'/);
assert.match(config,/id: 'lulu-hypermarket',[\s\S]*?clientId: 'union-coop'/);
const shell=read('client/src/layouts/AppLayout.tsx');
assert.match(shell,/mediaClient/);
assert.match(shell,/: 'Rivoli'/);
assert.match(read('client/src/App.tsx'),/path="\/competition" element=\{<Navigate to="\/creative\?brand=union-coop"/);
console.log('PASS: Rivoli Media compares EDIT; Union Coop Media and Creative compare Carrefour and LuLu; Consumer and Search have no comparison controls.');

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),manager=read('tournament-manager.js'),official=read('official-ui.js'),draw=read('draw-ui.js'),gfx=read('graphics-ui.js'),publicUI=read('public-standings-ui.js');
test('accessible unified dashboard and no duplicate navigation choices',()=>{
 assert.match(html,/data-page="manager"/);
 assert.match(html,/data-page="scoresheet"/);
 assert.doesNotMatch(html,/<button data-page="online">/);
 assert.doesNotMatch(html,/<button data-page="tournament">/);
 assert.match(html,/themeSwitch/);
 assert.ok(html.includes('design.css')&&html.includes('ux-core.js'));
});
test('core modules imported and available',()=>{
 for(const name of ['tournament-manager.js','official-ui.js','draw-ui.js','graphics-ui.js','public-standings-ui.js','suite-core.js','design.css','ux-core.js']){
  assert.ok(existsSync(new URL('../'+name,import.meta.url)),name+' missing');
  if(name.endsWith('.js')&&!['suite-core.js','ux-core.js'].includes(name))assert.ok(html.includes(name),name+' not linked');
 }
});
test('organizer edit/delete and success notifications',()=>{
 for(const name of ['delete_tournament_draft','delete_match_draft','rename_tournament_draft','move_team_pool','mgrEditor','notify'])assert.ok(manager.includes(name),name);
});
test('official court is primary view and set-based direct entry',()=>{
 for(const name of ['offCourtA','offCourtB','offSetTabs','save_court_both','offSaveBoth','court-positions','offTournament','offMatch'])assert.ok(official.includes(name),name);
 assert.ok(!html.includes('<script src="position-check.js"'));
});
test('draw wheel has separate order and grouping stages',()=>{
 for(const name of ['wheelDisc','drawStart','drawSpin','start_draw_steps','draw_one_step','drawOrderStage','drawGroupStage'])assert.ok(draw.includes(name),name);
});
test('public schedule uses match picker, not UUID entry',()=>{
 assert.ok(publicUI.includes('pubMatchPick'));
 assert.ok(!publicUI.includes('id=\\\"pubMatchId\\\"'));
});
test('graphics and UI typography use Thai',()=>{
 assert.ok(gfx.includes('สร้างกราฟิกการแข่งขัน'));
 assert.ok(gfx.includes('สร้างจากข้อมูลการแข่งขัน'));
 assert.ok(read('design.css').includes('font-family:"Prompt"'));
});

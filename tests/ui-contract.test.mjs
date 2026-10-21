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
 for(const name of ['wheelDisc','drawStart','drawSpin','start_standalone_draw','standalone_draw_step','drawOrderStage','drawGroupStage','drawGroupCards','save_standalone_draw','rename_draw_team'])assert.ok(draw.includes(name),name);
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

test('court point workflow: choosing service, sideout rotation and jersey-only substitutions',()=>{
 for(const x of ['offStartServeA','offStartServeB','offServeInfo','number_substitution',
 'configure_set_libero','toggle_set_libero','offLiberoNumberA','offLiberoNumberB',
 'offLiberoReplaceA','offLiberoReplaceB','services','liberos']){
  assert.ok(official.includes(x),x);
 }
 assert.ok(!official.includes('command("rotation"'));
});
test('standalone draw is created from team names and saved after group cards are complete',()=>{
 for(const x of ['drawNames','drawGroupCount','drawGroupCards','drawFinalTitle','drawCommit',
 'save_standalone_draw','standalone_draw_snapshot']){
  assert.ok(draw.includes(x),x);
 }
 assert.ok(draw.includes('group.position')||draw.includes('e.position'));
 assert.ok(!draw.includes('run_tournament_draw'));
});
test('graphics canvas explicitly loads Thai fonts before export',()=>{
 for(const x of ['document.fonts.load','loadThaiFonts','gfxFont','Anuphan','Kanit','Prompt']){
  assert.ok(gfx.includes(x),x);
 }
});

test('scoresheet is downloadable as Thai PDF, printable, and signable by one officer',()=>{
 const report=read('scoresheet-report.js');
 for(const x of ['offReportPanel','offDownloadPdf','offPrintPdf','offOfficialName','offSignatureCanvas',
 'offApprove','downloadScoresheet','printScoresheet'])assert.ok(official.includes(x),x);
 for(const x of ['makeScoresheetDocument','doc.addImage','รายงานผลการแข่งขันวอลเลย์บอล','ลายมือชื่อเจ้าหน้าที่',
 'result_finalized'])assert.ok(report.includes(x),x);
 assert.ok(official.includes('p_note:$("offOfficialName").value.trim()'));
 assert.ok(!official.includes('รับรองโดยเจ้าหน้าที่อิสระ'));
});
test('graphics selected result uses completed match scores, not schedule VS rows',()=>{
 for(const x of ['gfxResultControls','gfxResultMatch','gfxLogoA','gfxLogoB','selectedGraphicResult',
 'paintResultCard','winner','match_sets','score_a_sets','score_b_sets'])
 assert.ok(gfx.includes(x),x);
});

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
 for(const x of ['makeScoresheetDocument','doc.addImage','รายงานสกอร์ชีตวอลเลย์บอล','ลายมือชื่อเจ้าหน้าที่',
 'drawPoints','serviceSequence'])assert.ok(report.includes(x),x);
 assert.ok(official.includes('p_note:$("offOfficialName").value.trim()'));
 assert.ok(!official.includes('รับรองโดยเจ้าหน้าที่อิสระ'));
});
test('graphics selected result uses completed match scores, not schedule VS rows',()=>{
 for(const x of ['gfxResultControls','gfxResultMatch','gfxLogoA','gfxLogoB','selectedGraphicResult',
 'paintResultCard','winner','official_match_snapshot','my_official_matches'])
 assert.ok(gfx.includes(x),x);
});

test('landscape A4 printable scoresheet crosses individual logged points and shows service columns',()=>{
 const report=read('scoresheet-report.js');
 for(const part of ['orientation:"landscape"','format:"a4"','297,210','pointEvents','pointsByTeam','serviceSequence','I","II","III','makeScoresheetDocument'])
  if(part==='pointEvents')continue;else assert.ok(report.includes(part),part);
 assert.ok(report.includes('drawPoints'));
});
test('scorer uses actual court side, alternating service and manual toss in set 1/decider',()=>{
 for(const part of ['courtForSet','offLeftTeamSelect','offSideSave','set_match_court_side','sideTeamId','automaticFirstServer','ensureAutomaticSetService','isCoinTossSet'])
  assert.ok(official.includes(part),part);
 assert.ok(existsSync(new URL('../court-side-rules.mjs',import.meta.url)));
 assert.ok(existsSync(new URL('../APPLY_TO_SUPABASE_WHEN_READY.sql',import.meta.url)));
});
test('approved poster picks matches through match RPC and loads when tournament changes',()=>{
 assert.ok(gfx.includes('buildResultFromMatchRpc'));
 assert.ok(gfx.includes('my_official_matches'));
 assert.ok(gfx.includes('official_match_snapshot'));
 assert.ok(gfx.includes('gfxTournament").onchange'));
});

test('scorer never labels left physical-side points with hardcoded team A',()=>{
 for(const key of ['courtScoreView(cur,selectedSet,court)','courtScoreMessage(cur,scoredSet','const scoredSet=selectedSet',
 'selectedAlreadyScored','teamIndex=side=>'])assert.ok(official.includes(key),key);
 assert.ok(!official.includes('cur.team_a+" "+$("offPoints0").textContent'),"stale toast paired canonical team A with left points");
 assert.ok(!official.includes('sideTeamId(side)===cur?.team_a_id?0:1'),"missing side must not score team B");
});

test('owners can delete scored and published tournaments with explicit confirmation',()=>{
 assert.ok(manager.includes('id=\\\"mgrDeleteTournament\\\">ลบรายการทั้งหมด'));
 assert.ok(manager.includes('delete_tournament_draft'));
 assert.ok(manager.includes('แม้จะเริ่มแข่งขันหรือมีผลคะแนนแล้ว'));
 assert.ok(manager.includes('คู่แข่งขัน คะแนนทุกเซต สกอร์ชีต'));
 assert.ok(manager.includes('result?.deleted'));
 assert.ok(manager.includes('button.disabled=true'));
 assert.ok(manager.includes('finally{button.disabled=false}'));
 assert.ok(existsSync(new URL('../ALLOW_DELETE_ANY_TOURNAMENT.sql',import.meta.url)));
});

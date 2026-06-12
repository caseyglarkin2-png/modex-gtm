import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const TOKEN = (env.match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const APPLY = process.argv[2] === 'apply';
const now = '2026-06-11';
const dir = new URL('.', import.meta.url);
const files = readdirSync(dir).filter(f => /^verdicts-\d+\.jsonl$/.test(f));
const SEG = new Set(['cpg_food_beverage','retail_grocery','3pl_carrier','building_materials_industrial','chemicals_plastics','paper_packaging','ecommerce_parcel','cold_chain','ports_intermodal','automotive_heavy_mfg','agriculture_food_processing','wholesale_distribution']);
const updates = []; const counts = { in: 0, out: 0, review: 0, bad: 0 };
for (const f of files) {
  for (const line of readFileSync(new URL(f, dir), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let v; try { v = JSON.parse(line); } catch { counts.bad++; continue; }
    if (!v.id || !['in','out','review'].includes(v.verdict)) { counts.bad++; continue; }
    counts[v.verdict]++;
    if (v.verdict === 'review') continue; // leave as review
    const props = { yardflow_tam: v.verdict, tam_source: 'web_research_2026-06-11', tam_evaluated_at: now, tam_reason: (v.reason||'').slice(0,300) };
    if (v.verdict === 'in') { props.na_operating = 'true'; if (SEG.has(v.segment)) props.tam_segment = v.segment; if (['A','B','C'].includes(v.tier)) props.tam_tier = v.tier; }
    updates.push({ id: String(v.id), properties: props });
  }
}
const seen=new Map(); for(const u of updates) seen.set(u.id,u); const deduped=[...seen.values()]; console.log(JSON.stringify({ files: files.length, counts, toWrite: deduped.length }, null, 2));
if (APPLY) { for (let i=0;i<deduped.length;i+=100){ const r=await fetch("https://api.hubapi.com/crm/v3/objects/companies/batch/update",{method:"POST",headers:H,body:JSON.stringify({inputs:deduped.slice(i,i+100)})}); if(!r.ok)console.error('fail',r.status,(await r.text()).slice(0,150)); } console.log('applied'); }

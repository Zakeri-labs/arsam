// Moves already-uploaded contract files from the public `uploads` bucket into the private
// `contract-media` bucket and rewrites car_contracts.attachments to store bucket paths.
//
// NOT run automatically — run only after owner sign-off, and after supabase_migration_private_contract_media.sql.
//
//   node --env-file=.env.local scripts/migrate-contract-media.mjs           # dry run: only reports
//   node --env-file=.env.local scripts/migrate-contract-media.mjs --apply   # copy files + update rows
//   node --env-file=.env.local scripts/migrate-contract-media.mjs --purge   # delete the old public copies
//                                                                           # (only after checking the app works)
//
// Copying never deletes anything, and re-running is safe: files already copied are skipped.

import { createClient } from '@supabase/supabase-js';

const OLD_BUCKET = 'uploads';
const NEW_BUCKET = 'contract-media';
const apply = process.argv.includes('--apply');
const purge = process.argv.includes('--purge');

const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
if (!base || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const supabase = createClient(base, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const prefix = `${base}/storage/v1/object/public/${OLD_BUCKET}/`;
const pathOf = url => (typeof url === 'string' && url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null);

const { data: rows, error } = await supabase.from('car_contracts').select('id, attachments');
if (error) throw error;

const oldPaths = new Set();
let copied = 0, skipped = 0, failed = 0, rewritten = 0;

async function copy(path) {
  const { data: blob, error: dErr } = await supabase.storage.from(OLD_BUCKET).download(path);
  if (dErr || !blob) throw new Error(`download ${path}: ${dErr?.message}`);
  const { error: uErr } = await supabase.storage.from(NEW_BUCKET).upload(path, blob, { contentType: blob.type || undefined, upsert: false });
  if (uErr && !/already exists|Duplicate/i.test(uErr.message)) throw new Error(`upload ${path}: ${uErr.message}`);
  return !uErr;
}

for (const row of rows) {
  const list = Array.isArray(row.attachments) ? row.attachments : [];
  let changed = false;
  const next = [];
  for (const a of list) {
    const path = pathOf(a.url);
    const posterPath = pathOf(a.posterUrl);
    if (!path && !posterPath) { next.push(a); continue; }
    try {
      for (const p of [path, posterPath].filter(Boolean)) {
        oldPaths.add(p);
        if (!apply) continue;
        (await copy(p)) ? copied++ : skipped++;
      }
      const { url, posterUrl, ...rest } = a;
      next.push({ ...rest, ...(path ? { path } : {}), ...(posterPath ? { posterPath } : {}) });
      changed = true;
    } catch (e) {
      failed++;
      console.error(`contract ${row.id}: ${e.message}`);
      next.push(a);
    }
  }
  if (changed) {
    console.log(`${apply ? 'updating' : 'would update'} contract ${row.id}: ${list.length} attachment(s)`);
    if (apply) {
      const { error: uErr } = await supabase.from('car_contracts').update({ attachments: next }).eq('id', row.id);
      if (uErr) { failed++; console.error(`contract ${row.id}: ${uErr.message}`); } else rewritten++;
    }
  }
}

console.log(`\nfiles to move: ${oldPaths.size}${apply ? ` | copied ${copied}, already there ${skipped}, contracts rewritten ${rewritten}, failed ${failed}` : ' (dry run — pass --apply)'}`);

if (purge) {
  // Remove the public copies of every file that now exists in the private bucket
  const { data: files, error: lErr } = await supabase.storage.from(OLD_BUCKET).list('contracts', { limit: 1000 });
  if (lErr) throw lErr;
  const doomed = [];
  for (const f of files || []) {
    const p = `contracts/${f.name}`;
    const { data } = await supabase.storage.from(NEW_BUCKET).list('contracts', { search: f.name, limit: 1 });
    if (data?.some(x => x.name === f.name)) doomed.push(p);
  }
  const { error: rErr } = await supabase.storage.from(OLD_BUCKET).remove(doomed);
  if (rErr) throw rErr;
  console.log(`purged ${doomed.length} public file(s) from ${OLD_BUCKET}/contracts`);
}
if (failed) process.exitCode = 1;

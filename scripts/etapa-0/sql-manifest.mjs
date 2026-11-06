import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../../', import.meta.url);
async function sqlFiles(directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? sqlFiles(`${directory}${entry.name}/`) : entry.name.endsWith('.sql') ? [`${directory}${entry.name}`] : []));
  return groups.flat().sort();
}
const entries = await Promise.all((await sqlFiles('supabase/')).map(async path => {
  const content = await readFile(new URL(path, root));
  return { path, sha256: createHash('sha256').update(content).digest('hex'), bytes: content.length,
    usage: path.startsWith('supabase/etapa-0/') ? 'diagnostico-somente-leitura' : 'historico-nao-executar-automaticamente' };
}));
const actual = JSON.stringify({ version: 1, note: 'Inventário de arquivos, NÃO é uma ordem de migração nem histórico do banco remoto.', files: entries }, null, 2) + '\n';
if (process.argv.includes('--check')) {
  const saved = await readFile(new URL('supabase/etapa-0/sql-manifest.json', root), 'utf8');
  if (saved !== actual) { console.error('Manifesto SQL desatualizado. Revise os arquivos e gere novamente.'); process.exitCode = 1; }
  else console.log(`Manifesto SQL íntegro: ${entries.length} arquivos.`);
} else process.stdout.write(actual);

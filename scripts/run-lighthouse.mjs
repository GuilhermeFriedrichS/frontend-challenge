/**
 * Lighthouse audit — 3 runs per page/profile, median reported.
 *
 * Usage:
 *   npm run build && npm run preview   (in another terminal, serves http://localhost:4173)
 *   npm run audit:lighthouse
 *
 * Outputs (reports/lighthouse/):
 *   - <page>_<profile>_run_<n>.report.html / .report.json  (raw Lighthouse reports)
 *   - summary.md   (median table, ready to paste into ARCHITECTURE.md)
 *   - summary.json (medians + environment: Node, Lighthouse, Chrome, OS, date)
 *
 * IMPORTANT: if a run fails, the script reports the failure and exits non-zero.
 * It never substitutes placeholder values.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const BASE_URL = process.env.LH_BASE_URL || 'http://localhost:4173'
const RUNS = Number(process.env.LH_RUNS || 3)
const REPORT_DIR = path.resolve('reports', 'lighthouse')
fs.mkdirSync(REPORT_DIR, { recursive: true })

const TARGETS = [
  { name: 'Início', slug: 'inicio', path: '/' },
  { name: 'Detalhe do NFT', slug: 'detalhe', path: '/nft/nft-042' },
]
const PROFILES = ['desktop', 'mobile']

const isWin = process.platform === 'win32'
const npx = isWin ? 'npx.cmd' : 'npx'

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', shell: isWin, stdio: ['ignore', 'pipe', 'pipe'] })
}

// Pre-flight: server must be up
try {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
} catch (e) {
  console.error(`❌ Servidor não acessível em ${BASE_URL} (${e.message}).`)
  console.error('   Rode "npm run build && npm run preview" em outro terminal antes da auditoria.')
  process.exit(1)
}

const lighthouseVersion = run(npx, ['lighthouse', '--version']).trim()
console.log(`🚀 Lighthouse ${lighthouseVersion} — ${RUNS} medições por página/perfil em ${BASE_URL}\n`)

const results = []
let chromeVersion = 'unknown'
let failures = 0

for (const target of TARGETS) {
  for (const profile of PROFILES) {
    const label = `${target.name} (${profile === 'desktop' ? 'Desktop' : 'Mobile'})`
    console.log(`🔍 ${label}`)
    const runs = []

    for (let i = 1; i <= RUNS; i++) {
      const base = path.join(REPORT_DIR, `${target.slug}_${profile}_run_${i}`)
      const args = [
        'lighthouse',
        `${BASE_URL}${target.path}`,
        '--output=json',
        '--output=html',
        `--output-path=${base}`,
        '--chrome-flags=--headless=new --no-sandbox',
        '--quiet',
      ]
      if (profile === 'desktop') args.push('--preset=desktop')

      try {
        run(npx, args)
        const report = JSON.parse(fs.readFileSync(`${base}.report.json`, 'utf8'))
        chromeVersion = report.environment?.hostUserAgent?.match(/Chrome\/([\d.]+)/)?.[1] || chromeVersion
        const score = k => Math.round((report.categories[k]?.score ?? 0) * 100)
        const r = {
          performance: score('performance'),
          accessibility: score('accessibility'),
          bestPractices: score('best-practices'),
          seo: score('seo'),
          lcpMs: report.audits['largest-contentful-paint'].numericValue,
          cls: report.audits['cumulative-layout-shift'].numericValue,
          tbtMs: report.audits['total-blocking-time'].numericValue,
        }
        runs.push(r)
        console.log(`   run ${i}: P${r.performance} A${r.accessibility} BP${r.bestPractices} SEO${r.seo}`)
      } catch (e) {
        failures++
        console.error(`   ❌ run ${i} falhou: ${(e.stderr || e.message || '').toString().split('\n')[0]}`)
      }
    }

    if (runs.length === 0) continue
    const med = key => median(runs.map(r => r[key]))
    results.push({
      label,
      runs: runs.length,
      performance: med('performance'),
      accessibility: med('accessibility'),
      bestPractices: med('bestPractices'),
      seo: med('seo'),
      lcp: `${(med('lcpMs') / 1000).toFixed(2)} s`,
      cls: med('cls').toFixed(3),
      tbt: `${Math.round(med('tbtMs'))} ms`,
    })
  }
}

const env = {
  date: new Date().toISOString(),
  node: process.version,
  lighthouse: lighthouseVersion,
  chrome: chromeVersion,
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  cpu: os.cpus()[0]?.model,
  baseUrl: BASE_URL,
  runsPerTarget: RUNS,
}

const table = [
  '| Página / Perfil | Performance | Acessibilidade | Melhores Práticas | SEO | LCP | CLS | TBT | Medições |',
  '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |',
  ...results.map(
    r =>
      `| ${r.label} | **${r.performance}** | **${r.accessibility}** | **${r.bestPractices}** | **${r.seo}** | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.runs} |`
  ),
].join('\n')

const envMd = Object.entries(env).map(([k, v]) => `- **${k}**: ${v}`).join('\n')
fs.writeFileSync(path.join(REPORT_DIR, 'summary.md'), `${table}\n\n**Ambiente**\n\n${envMd}\n`)
fs.writeFileSync(path.join(REPORT_DIR, 'summary.json'), JSON.stringify({ env, results }, null, 2))

console.log(`\n${table}\n`)
console.log('✅ Resumo salvo em reports/lighthouse/summary.md e summary.json')

if (failures > 0) {
  console.error(`⚠️ ${failures} medição(ões) falharam — veja os erros acima. Nenhum valor foi inventado.`)
  process.exit(1)
}

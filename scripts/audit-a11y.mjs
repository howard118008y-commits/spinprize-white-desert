import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const baseURL = new URL(process.env.A11Y_URL || 'http://127.0.0.1:5180/');
const output = resolve(process.env.A11Y_OUTPUT || '.qa/a11y');
const report = {
  startedAt: new Date().toISOString(),
  baseURL: baseURL.href,
  axeVersion: require('axe-core/package.json').version,
  playwrightVersion: require('playwright/package.json').version,
  browser: 'Chromium',
  rules: 'axe-core default rules; no exclusions or disabled rules',
  results: [],
  errors: [],
};
const viewports = [
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];
const states = [
  ...['works', 'services', 'pricing', 'about', 'contact'].map((view) => ({ name: view, view })),
  { name: 'contact-dialog', view: 'contact', trigger: '.contact-cta', dialog: '#contact-dialog' },
  { name: 'work-dialog', view: 'works', trigger: '#orbit-open', dialog: '#work-dialog' },
];

async function audit(page, state) {
  const url = new URL(baseURL);
  url.hash = state.view;
  const response = await page.goto(url.href, { waitUntil: 'load' });
  if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status() ?? 'no response'}`);
  await page.locator('body.app-enhanced').waitFor();
  await page.locator(`#${state.view}:not([hidden])`).waitFor();
  if (state.trigger) {
    await page.locator(state.trigger).click();
    await page.locator(`${state.dialog}[open]`).waitFor();
  }
  if (state.name === 'work-dialog') {
    await page.waitForFunction(() => {
      const img = document.querySelector('#work-full-image');
      return img.complete && img.naturalWidth > 0 && !img.hidden;
    });
  }
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(() => window.axe.run(document));
}

function details(kind, result) {
  return result[kind].flatMap((rule) => [
    `- **${rule.id}** (${rule.impact || 'review'}): [${rule.help}](${rule.helpUrl})`,
    ...rule.nodes.map((node) => `  - \`${node.target.join(' → ')}\`: ${(node.failureSummary || 'Needs manual review; see JSON checks.').replaceAll('\n', ' ')}`),
  ]);
}

let browser;
try {
  browser = await chromium.launch();
  report.browserVersion = browser.version();
  for (const { name, ...options } of viewports) {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
    for (const state of states) {
      const page = await context.newPage();
      page.on('pageerror', (error) => {
        report.errors.push({ viewport: name, state: state.name, url: page.url(), message: error.message });
        console.error(`${name}/${state.name}: PAGE ERROR ${error.message}`);
      });
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(30000);
      try {
        const result = await audit(page, state);
        report.results.push({ viewport: name, dimensions: options.viewport, state: state.name, ...result });
        console.log(`${name}/${state.name}: ${result.violations.length} violations, ${result.incomplete.length} incomplete`);
      } catch (error) {
        report.errors.push({ viewport: name, state: state.name, url: page.url(), message: error.message });
        console.error(`${name}/${state.name}: ERROR ${error.message}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
} catch (error) {
  report.errors.push({ message: error.message });
  console.error(error.message);
} finally {
  await browser?.close();
}

report.finishedAt = new Date().toISOString();
report.summary = {
  expectedStates: viewports.length * states.length,
  completedStates: report.results.length,
  violationInstances: report.results.reduce((sum, result) => sum + result.violations.length, 0),
  violationNodes: report.results.reduce((sum, result) => sum + result.violations.reduce((count, rule) => count + rule.nodes.length, 0), 0),
  uniqueViolationRules: [...new Set(report.results.flatMap((result) => result.violations.map((rule) => rule.id)))],
  incompleteInstances: report.results.reduce((sum, result) => sum + result.incomplete.length, 0),
  errors: report.errors.length,
};
report.exitCode = report.errors.length ? 2 : report.summary.violationInstances ? 1 : 0;
const markdown = [
  '# Hey Cheng accessibility audit',
  '',
  `- Started: ${report.startedAt}`,
  `- Finished: ${report.finishedAt}`,
  `- Target: ${report.baseURL}`,
  `- Engine: axe-core ${report.axeVersion}; Playwright ${report.playwrightVersion}; Chromium ${report.browserVersion || 'not launched'}`,
  `- Rules: ${report.rules}`,
  `- Exit code: **${report.exitCode}** (0 = no automated violations; 1 = violations; 2 = incomplete run / runtime error)`,
  `- States: ${report.summary.completedStates}/${report.summary.expectedStates}; violation rule/state instances: **${report.summary.violationInstances}**; affected node/state instances: **${report.summary.violationNodes}**; incomplete rule/state instances: **${report.summary.incompleteInstances}**`,
  '',
  'Counts may repeat across states and viewports. Incomplete results require human review. Zero automated violations does not establish WCAG conformance. Keyboard, screen reader, content quality, and real touch-device checks remain part of delivery acceptance.',
  '',
  '| Viewport | State | Violations | Incomplete |',
  '| --- | --- | ---: | ---: |',
  ...report.results.map((result) => `| ${result.viewport} | ${result.state} | ${result.violations.length} | ${result.incomplete.length} |`),
  ...report.results.flatMap((result) => [
    '', `## ${result.viewport} / ${result.state}`, '',
    `URL: ${result.url} — ${result.timestamp}`, '',
    '### Violations', '', ...(details('violations', result).length ? details('violations', result) : ['None detected.']),
    '', '### Incomplete / manual review', '', ...(details('incomplete', result).length ? details('incomplete', result) : ['None reported.']),
  ]),
  ...(report.errors.length ? ['', '## Runtime errors', '', ...report.errors.map((error) => `- ${error.viewport || 'browser'}/${error.state || 'launch'}: ${error.message}`)] : []),
  '',
];
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(resolve(output, 'report.md'), markdown.join('\n'));
console.log(`Reports: ${output}/report.{json,md}; exit ${report.exitCode}`);
process.exitCode = report.exitCode;

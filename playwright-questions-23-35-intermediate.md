# Playwright Interview Questions 23-35: Detailed Production-Grade Answers

This file contains self-contained, production-grade answers for Questions 23–35 (Playwright intermediate). Each answer includes runnable code snippets, file names where appropriate, and notes on how to run them.

Prerequisites
- Node.js (>=14)
- A Playwright project (install dev deps):

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Run tests:

```bash
npx playwright test
```

---

### Question 23: Explain different test reporters and how to configure them.

Answer:

Playwright supports several built-in reporters and custom reporters. Built-ins: `list`, `line`, `dot`, `json`, `junit`, `html`. Third-party: `allure-playwright`, Percy, and custom reporters implemented via Playwright's Reporter API.

Config example (in `playwright.config.ts`):

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
});
```

Allure example (install + usage):

```bash
npm install --save-dev allure-playwright
```

Add to config:

```typescript
reporter: [ ['allure-playwright'] ]
```

Generate Allure report (after running tests):

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

Custom reporter (minimal) - `tools/slack-reporter.js`:

```javascript
class SlackReporter {
  onBegin(config, suite) {
    console.log('Starting tests');
  }
  async onTestEnd(test, result) {
    if (result.status !== 'passed') {
      // send to webhook (example)
      // await fetch(process.env.SLACK_WEBHOOK, { method: 'POST', body: JSON.stringify({ text: `${test.title} failed` }) })
      console.log('Notify: ', test.title, result.status);
    }
  }
}
module.exports = SlackReporter;
```

Configure it:

```typescript
reporter: [ ['./tools/slack-reporter.js'] ]
```

Best practices:
- Use `html` or `allure` for human-friendly CI artifacts.
- Use `junit` for CI test parsers and gating.
- Keep reporters lightweight if they run in CI agents.
- Attach traces/screenshots in the reporter for failed tests.

---

### Question 24: How do you perform cross-browser testing with Playwright?

Answer:

Playwright ships with Chromium, Firefox and WebKit; configure each as a `project` in `playwright.config.ts` to run the same tests in multiple browsers.

Example config:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

Test file example `tests/cross-browser.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads in all browsers', async ({ page, browserName }) => {
  await page.goto('https://example.com');
  await expect(page.locator('h1')).toBeVisible();
  console.log('Browser:', browserName);
});
```

Run all projects:

```bash
npx playwright test
```

Run specific project:

```bash
npx playwright test --project=firefox
```

Best practices:
- Mark or skip tests with browser-specific differences using `test.skip()`.
- Keep critical paths run across all browsers.
- Report aggregated results per browser in CI.

---

### Question 25: What is accessibility testing and how do you implement it in Playwright?

Answer:

Accessibility testing checks ARIA roles, labels, keyboard navigation and semantic correctness. Use Playwright's accessibility tree and integrate `axe-core` for automated scans.

Install `axe-core`:

```bash
npm install --save-dev axe-core
```

Example using axe in `tests/a11y.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// NOTE: This test injects axe-core into the page and runs it.

test('run axe accessibility checks', async ({ page }) => {
  await page.goto('https://example.com');
  await page.addScriptTag({ path: require.resolve('axe-core') });
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await axe.run();
  });
  // Fail when there are serious violations
  const violations = results.violations || [];
  if (violations.length) {
    console.error('Accessibility violations:', JSON.stringify(violations, null, 2));
  }
  expect(violations.length).toBe(0);
});
```

Use Playwright's `page.accessibility.snapshot()` to inspect roles programmatically.

Best practices:
- Run automated a11y checks in CI for key pages.
- Fix high-impact violations first (labels, roles, keyboard focus).
- Combine automated checks with manual screen reader audits.

---

### Question 26: How do you implement visual regression testing?

Answer:

Visual regression compares screenshots to a stored baseline. Playwright has snapshot matching built-in via `expect(page.screenshot()).toMatchSnapshot()`.

Example `tests/visual.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('homepage visual snapshot', async ({ page }) => {
  await page.goto('https://example.com');
  // Use consistent viewport and test data
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot('homepage.png', { threshold: 0.02 });
});
```

Notes:
- Baseline images will be created under `tests/__snapshots__` when approved.
- `threshold` allows for small pixel differences.

Advanced integrations:
- Percy, Applitools, or Loki for robust diff management and review workflow.

Percy quick setup:

```bash
npm install --save-dev @percy/cli @percy/playwright
```

Usage in test:

```typescript
import { percySnapshot } from '@percy/playwright';

await percySnapshot(page, 'Homepage');
```

Best practices:
- Stabilize fonts, test data and network to reduce false positives.
- Limit visual tests to critical pages/components.
- Review diffs in PRs and store accepted baselines in repo or artifact store.

---

### Question 27: Explain the Playwright Trace Viewer and debugging tools.

Answer:

Trace Viewer records a trace (actions, DOM snapshots, screenshots, network and console) that can be inspected interactively.

Enable tracing globally in `playwright.config.ts`:

```typescript
export default {
  use: { trace: 'on-first-retry' }
};
```

Programmatic tracing inside tests:

```typescript
// tests/trace-example.spec.ts
import { test } from '@playwright/test';

test('manual trace', async ({ context, page }) => {
  await context.tracing.start({ screenshots: true, snapshots: true });
  await page.goto('https://example.com');
  await page.click('text=More information');
  await context.tracing.stop({ path: 'trace.zip' });
});
```

Open the trace:

```bash
npx playwright show-trace trace.zip
```

Other debugging tools:
- `page.pause()` opens Inspector at runtime
- `PWDEBUG=1 npx playwright test` starts an interactive session
- Run with `headless: false` and `slowMo` to visually observe actions

Best practices:
- Keep traces for failed tests in CI artifacts.
- Use Inspector to craft stable selectors.

---

### Question 28: How do you configure and use the Playwright Inspector?

Answer:

Playwright Inspector provides a GUI to step through test execution and build selectors.

Run inspector:

```bash
PWDEBUG=1 npx playwright test
# or
npx playwright test --debug
```

In-test usage:

```typescript
import { test } from '@playwright/test';

test('use inspector', async ({ page }) => {
  await page.goto('https://example.com');
  await page.pause(); // opens inspector before continuing
  await page.click('text=Some action');
});
```

Inspector features:
- Step, resume, and inspect DOM
- Highlight selectors and try actions from the UI

Best practices:
- Use Inspector when authoring new tests.
- Combine with `page.pause()` for reproducing flaky behavior.

---

### Question 29: What are the best practices for organizing test data?

Answer:

Organize test data to be deterministic, isolated, and maintainable. Use fixtures, factories and external files.

Patterns:
- Static fixtures: JSON or YAML files under `test-data/`
- Dynamic factories: functions that generate unique records for each test
- API-driven setup/teardown: create and clean data via test API

Example static data `test-data/users.json`:

```json
[
  { "email": "user1@example.com", "password": "pass1" },
  { "email": "user2@example.com", "password": "pass2" }
]
```

Factory example `utils/factories.ts`:

```typescript
export function userFactory(prefix = 'user') {
  const ts = Date.now();
  return {
    email: `${prefix}.${ts}@example.com`,
    password: 'Test123!'
  };
}
```

Fixture (Playwright) example in `fixtures/user.fixture.ts`:

```typescript
import { test as base } from '@playwright/test';
import { userFactory } from '../utils/factories';

export const test = base.extend({
  testUser: async ({ request }, use) => {
    const user = userFactory('ci');
    const res = await request.post('/api/users', { data: user });
    const created = await res.json();
    await use(created);
    await request.delete(`/api/users/${created.id}`);
  }
});
```

Best practices:
- Keep test data isolated per test.
- Use unique identifiers to avoid collisions.
- Always cleanup created data.
- Avoid hard-coded credentials in repo; use env vars or CI secrets.

---

### Question 30: How do you handle database operations in tests?

Answer:

Database operations can be done via API calls, direct DB connections, or using DB fixtures. Prefer API for maintainability; use direct DB access for heavy setup/teardown when needed.

Example using `pg` to reset tables (`utils/db.ts`):

```typescript
// utils/db.ts
import { Client } from 'pg';

export async function resetTables() {
  const client = new Client({ connectionString: process.env.TEST_DB_URL });
  await client.connect();
  await client.query('TRUNCATE TABLE users, orders, products RESTART IDENTITY CASCADE');
  await client.end();
}
```

Use in tests/setup:

```typescript
import { test } from '@playwright/test';
import { resetTables } from '../utils/db';

test.beforeEach(async () => {
  await resetTables();
});
```

Transactional isolation (advanced):
- Open a transaction at start of test and roll it back after test. Requires sharing connection/transactions across app code – typically feasible in backend-integrated test runners.

Best practices:
- Prefer API for setup/teardown when possible.
- Run DB reset/seed in `beforeEach` or `beforeAll` depending on isolation requirements.
- Keep DB credentials in CI secrets.

---

### Question 31: Explain timeouts configuration and management.

Answer:

Playwright provides multiple timeout levels: global test timeout, `expect` timeout, navigation and action timeouts. Tuning prevents false negatives and helps tests fail fast on real issues.

Config example (`playwright.config.ts`):

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 30_000, // test timeout
  expect: { timeout: 5_000 },
  use: {
    navigationTimeout: 15_000,
    actionTimeout: 5_000,
  }
});
```

Per-test override:

```typescript
import { test } from '@playwright/test';

test('slow test', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('https://example.com/slow');
});
```

Best practices:
- Set conservative global defaults suitable for CI environment.
- Use focused per-test timeouts for known slow tests.
- Avoid `waitForTimeout` except for debugging; prefer `expect(...).toBeVisible({ timeout })`.

---

### Question 32: How do you implement custom reporters?

Answer:

Custom reporters implement the Playwright Reporter API to receive lifecycle events and produce custom outputs (dashboards, alerts, etc.).

Example reporter `tools/custom-reporter.js` (simple file logger):

```javascript
class FileReporter {
  constructor() { this.fs = require('fs'); this.out = 'test-report.log'; }
  onBegin(config, suite) { this.fs.writeFileSync(this.out, 'Run started\n'); }
  onTestEnd(test, result) { this.fs.appendFileSync(this.out, `${test.title} - ${result.status}\n`); }
  onEnd(result) { this.fs.appendFileSync(this.out, `Run finished: ${result.status}\n`); }
}
module.exports = FileReporter;
```

Add to `playwright.config.ts`:

```typescript
reporter: [ ['./tools/custom-reporter.js'] ]
```

Best practices:
- Keep reporter code resilient to exceptions.
- Offload heavy work (network calls) to background tasks to avoid slowing CI.
- Include key artifacts (screenshots, traces) for failed tests.

---

### Question 33: What are Page Object Model advanced patterns?

Answer:

Advanced POM uses composition, small focused components, factories, and test-specific helpers to keep tests readable and maintainable.

Base page `pages/base.page.ts`:

```typescript
import { Page } from '@playwright/test';

export class BasePage {
  constructor(public page: Page) {}
  async goto(path = '/') { await this.page.goto(path); }
  locator(selector: string) { return this.page.locator(selector); }
}
```

Composed page `pages/login.page.ts`:

```typescript
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  emailField() { return this.page.locator('#email'); }
  passwordField() { return this.page.locator('#password'); }
  async login(email: string, password: string) {
    await this.emailField().fill(email);
    await this.passwordField().fill(password);
    await this.page.click('button[type=submit]');
    await this.page.waitForLoadState('networkidle');
  }
}
```

Factory usage:

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('login flow', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto('/login');
  await login.login('user@example.com', 'password123');
});
```

Best practices:
- Keep page objects small and focused.
- Avoid putting assertions into page objects; return data instead.
- Reuse components (e.g., header/footer objects) via composition.

---

### Question 34: How do you test keyboard accessibility and screen readers?

Answer:

Keyboard accessibility: use `page.keyboard` to simulate Tab, Enter, Arrow keys and `expect(...).toBeFocused()` to assert correct focus order. For screen readers, inspect Playwright's accessibility tree.

Tab navigation test `tests/keyboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('keyboard tab order', async ({ page }) => {
  await page.goto('https://example.com');
  await page.keyboard.press('Tab');
  await expect(page.locator('#first')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#second')).toBeFocused();
});
```

Screen reader checks:

```typescript
test('accessibility tree has labeled button', async ({ page }) => {
  await page.goto('https://example.com');
  const snapshot = await page.accessibility.snapshot();
  // Basic check: some node has name 'Submit' and role 'button'
  const hasSubmit = (node) => {
    if (!node) return false;
    if (node.role === 'button' && node.name === 'Submit') return true;
    return (node.children || []).some(hasSubmit);
  };
  expect(hasSubmit(snapshot)).toBe(true);
});
```

Best practices:
- Validate focus order and ARIA attributes.
- Use `axe-core` as automated guardrails, and manual screen reader checks for critical flows.

---

### Question 35: Explain browser performance testing in Playwright.

Answer:

Playwright can collect PerformanceTiming metrics and custom metrics exposed by the page. For deeper audits, integrate Lighthouse.

Collect simple metrics:

```typescript
import { test, expect } from '@playwright/test';

test('page load performance', async ({ page }) => {
  await page.goto('https://example.com', { waitUntil: 'load' });
  const timing = await page.evaluate(() => JSON.stringify(window.performance.timing));
  const t = JSON.parse(timing);
  const loadTime = t.loadEventEnd - t.navigationStart;
  console.log('loadTime', loadTime);
  expect(loadTime).toBeLessThan(3000);
});
```

Lighthouse integration (example run):

```bash
npm install -g lighthouse
lighthouse https://example.com --output html --output-path=./lighthouse-report.html
```

Best practices:
- Run performance tests in CI on representative infra.
- Keep network conditions stable (or emulate desired conditions with `page.context().setOffline()` / `route` throttling).
- Track performance trends over time and fail builds on regressions.

---

If you want, I can:
- Insert these answers back into `playwright-questions-16-35-intermediate.md` as a second section or replace the question placeholders, or
- Add test files and a tiny README + `package.json` scripts to run the examples end-to-end.

Tell me which option you prefer and I'll proceed.

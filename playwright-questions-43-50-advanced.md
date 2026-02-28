# Playwright Interview Questions 43-50: Advanced Level

## Advanced Level (Questions 43-50)

### Question 43: How do you migrate test suites from Selenium to Playwright?

**Answer:**

Migration should be iterative, low-risk, and aim to preserve test value while improving reliability and speed. Key phases:

- Inventory & classification: identify flaky vs stable, UI vs API, slow tests, and tests that require browser features (alerts, downloads, uploads).
- Design migration plan: run Selenium in parallel, migrate high-value stable tests first, keep CI passing, and phase out Selenium per module.
- Create compatibility helpers: wrap common Selenium idioms into thin Playwright helpers to speed porting.
- Improve patterns: replace brittle waits with Playwright's auto-waiting, use locators, and adopt fixtures.
- Validate: run baselines, compare results, and gradually remove Selenium dependency.

Example: Converting a Selenium JavaScript-style test to Playwright TypeScript.

```typescript
// before (selenium-webdriver pseudo)
// const {Builder, By, until} = require('selenium-webdriver');
// let driver = new Builder().forBrowser('chrome').build();
// await driver.get('https://example.com');
// await driver.findElement(By.css('button.primary')).click();
// await driver.wait(until.elementLocated(By.css('.result')));

// after (playwright)
import { test, expect } from '@playwright/test';

test('example action', async ({ page }) => {
  await page.goto('https://example.com');
  // Playwright locators are resilient and auto-wait
  await page.locator('button.primary').click();
  await expect(page.locator('.result')).toBeVisible();
});
```

Helpful porting utilities (thin wrappers):

```typescript
// utils/selenium-compat.ts
import { Page } from '@playwright/test';

export function $$(page: Page, selector: string) {
  return page.locator(selector);
}

export async function clickWhenVisible(page: Page, selector: string) {
  await page.locator(selector).waitFor({ state: 'visible' });
  await page.locator(selector).click();
}
```

CI strategy: run Playwright tests on a feature branch, gate migration with a flaky-test dashboard, and keep Selenium as a fallback until full coverage.

---

### Question 44: What are advanced Page Object Model patterns and anti-patterns?

**Answer:**

Advanced POM patterns emphasize composition, single responsibility, and test readability. Anti-patterns include huge page classes, exposing raw selectors, and putting assertions inside page objects.

Good patterns:

- Encapsulated components: represent reusable components as small objects.
- Composition over inheritance: build pages from components.
- Expose behaviors, not selectors: methods like `login()` or `getCartItems()`.
- Use `Locator` objects lazily: store locator factories rather than resolved elements.
- Keep assertions in tests; page objects return data/state for verification.

Example production-grade POM in TypeScript:

```typescript
// pageobjects/Header.ts
import { Locator, Page } from '@playwright/test';

export class Header {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly cartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[aria-label="Search"]');
    this.cartButton = page.locator('button[data-test="cart"]');
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }

  async openCart() {
    await this.cartButton.click();
  }
}

// pageobjects/ProductPage.ts
import { Header } from './Header';
import { Page } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly header: Header;
  constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
  }

  async goto(id: string) {
    await this.page.goto(`/products/${id}`);
    await this.page.waitForLoadState('networkidle');
  }

  async addToCart() {
    await this.page.locator('button.add-to-cart').click();
  }

  async getTitle() {
    return this.page.locator('h1.product-title').innerText();
  }
}
```

Anti-patterns to avoid:

- Putting asserts inside page objects.
- Returning raw handles (ElementHandle) to tests.
- Large monolithic page classes mixing multiple responsibilities.

---

### Question 45: How do you implement flaky test detection and analysis?

**Answer:**

Implement flaky detection via retries + telemetry + triage tooling. Key parts:

- Instrument tests to capture metadata on retries, timing, and screenshots/traces.
- Aggregate retry results and produce a daily flaky-test report grouped by test, owner, and root cause category.
- Use smoke gates: require flaky rate below threshold before merging.

Example: collect flaky metadata inside tests and a GitHub Action to publish a report.

```typescript
// tests/_collectFlaky.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{ }>({}
);

// reporter collects retries via testInfo
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class FlakyReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.retry > 0 || result.status === 'flaky') {
      // send metrics to an external store or append to JSON
      // include stack, duration, artifact links
    }
  }
}

export default FlakyReporter;
```

CI snippet to enable retries and collect artifacts:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npx playwright install --with-deps
      - name: Run tests with retries
        run: npx playwright test --retries=2 --reporter=dot,json
      - name: Upload traces and screenshots on failure
        if: failure()
        run: |-
          # artifacts uploaded by test runner or custom script
```

Detecting root causes:

- Network/timeouts: check logs for timeouts and use mock servers.
- Race conditions: enable Playwright trace collection and reproduce locally.
- Test data: ensure idempotent fixtures and deterministic data setup.

Automate triage: script parses JSON results and ranks tests by retry frequency.

---

### Question 46: Explain test cost optimization strategies at scale.

**Answer:**

Cost drivers: total runtime, parallel workers, cloud instance types, and test data setup/teardown. Optimize by:

- Selective execution: run only affected tests on PR using git-diff and test impact analysis.
- Sharding and parallelization: balance shards by historical duration.
- Use headless browsers and lightweight containers in CI.
- Cache browser downloads, dependencies, and build artifacts.
- Split fast unit/integration tests from slow end-to-end suites and run them on different runners.
- Use emulators and stubbing for expensive external services.

Example: PR selection script (simple heuristic)

```bash
# scripts/changed-tests.sh
#!/usr/bin/env bash
set -euo pipefail
CHANGED_FILES=$(git diff --name-only origin/main...HEAD)
node ./tools/select-tests.js "$CHANGED_FILES"
```

select-tests.js (outline):

```js
// Map changed files to test globs via static mapping
const changes = process.argv[2];
// return patterns that CI will pass to Playwright
```

GitHub Actions: use matrix with dynamic include to run only selected test groups.

---

### Question 47: How do you handle memory leaks and resource cleanup?

**Answer:**

Memory issues often arise from dangling pages/contexts, retained closures, or global listeners. Strategies:

- Use fixtures to scope browser/context lifecycle and always close contexts/pages in teardown.
- Enable Playwright's `--detect-leaks` style checks by instrumenting environments and monitoring process memory.
- Capture heap snapshots for long-running services and analyze with Chrome DevTools.

Fixture example ensuring cleanup:

```typescript
// test-fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext();
    try {
      await use(context);
    } finally {
      await context.close();
    }
  }
});

// Global teardown (playwright.config.ts)
// export default defineConfig({ globalTeardown: require.resolve('./global-teardown') })

// global-teardown.ts
export default async function globalTeardown() {
  // detect orphaned processes or contexts and kill if necessary
}
```

Monitoring memory in CI: record process RSS after suite run and fail if above threshold.

---

### Question 48: What are best practices for test documentation and knowledge sharing?

**Answer:**

Treat test code as living documentation. Best practices:

- Maintain a `tests/README.md` describing folder structure, conventions, and how to run locally.
- Use README in each domain folder explaining test intent and data preconditions.
- Tag tests with metadata (e.g., `@smoke`, `@integration`) in names or using custom annotations.
- Keep example data and fixtures in `testData/` with clear reset scripts.
- Generate a living test catalog: a JSON/Markdown page listing tests, owners, runtimes, and flaky scores.

Example: generate simple test catalog using Playwright JSON reporter then convert to Markdown.

```bash
npx playwright test --reporter=json > playwright-results.json
node ./scripts/generate-test-catalog.js playwright-results.json > TEST_CATALOG.md
```

---

### Question 49: How do you implement test analytics and observability?

**Answer:**

Collect metrics (runtime, pass/fail, retry counts, environment, test owner) and push to an analytics backend. Use custom reporters or middleware to emit events.

Example custom reporter that emits metrics to an HTTP endpoint:

```typescript
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';

class MetricsReporter implements Reporter {
  async onEnd() {
    // optionally summarize
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const payload = {
      title: test.title,
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      workerIndex: result.workerIndex,
      timestamp: new Date().toISOString(),
    };
    // send non-blocking
    fetch(process.env.METRICS_ENDPOINT || 'https://metrics.example/api/tests', {
      method: 'POST', body: JSON.stringify(payload), headers: {'Content-Type':'application/json'}
    }).catch(() => {});
  }
}

export default MetricsReporter;
```

Visualization: feed metrics into Grafana/Datadog and create dashboards for flaky rates, median runtime, and top failing tests. Correlate test failures with commits and infra events.

---

### Question 50: Discuss real production challenges and solutions in enterprise test automation.

**Answer:**

Common challenges and practical solutions:

- Flakiness: reduce by improving waits, deterministic test data, and mock external services.
- Long run-times: shard tests, optimize slow tests, and split smoke vs full suites.
- Environment drift: use infrastructure-as-code and containerized test environments.
- Secrets and credentials: use vaults and ephemeral credentials per job.
- Test data management: create disposable fixtures, use DB snapshots, and avoid shared mutable state.
- Third-party integrations: use contract testing, service virtualization, or recorded responses.

Example: service virtualization with Playwright route interception to stub an expensive upstream call:

```typescript
test('product page with stubbed pricing', async ({ page }) => {
  await page.route('https://pricing-api.example.com/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ price: 199.99, currency: 'USD' }),
    });
  });

  await page.goto('/products/widget-1');
  await expect(page.locator('.price')).toHaveText('$199.99');
});
```

Conclusion: enterprise test automation succeeds when teams invest equally in reliability, observability, and developer ergonomics. Migrations, observability, and culture matter as much as tooling.

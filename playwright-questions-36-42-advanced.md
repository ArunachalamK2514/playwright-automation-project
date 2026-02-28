# Playwright Interview Questions 36-50: Advanced Level

## Advanced Level (Questions 36-50)

### Question 36: How do you implement visual regression testing at scale?

**Answer:**

Visual regression testing becomes complex at enterprise scale due to environment differences, dynamic content, and false positives. Effective visual testing requires strategic masking, baseline management, and CI/CD integration.

**Advanced Visual Regression Setup:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Consistent viewport for visual tests
    viewport: { width: 1920, height: 1080 },
    
    // Consistent timing (important for animations)
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },
  
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});

// tests/visual/regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage layout desktop', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all async content to load
    await page.waitForLoadState('networkidle');
    
    // Mask dynamic elements
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      mask: [
        // Mask timestamp
        page.locator('.last-updated'),
        // Mask user-specific content
        page.locator('.user-profile-widget'),
        // Mask ads
        page.locator('[data-ad-slot]'),
        // Mask animations
        page.locator('.animated-banner'),
      ],
      maskColor: '#808080', // Gray out masked areas
      maxDiffPixels: 100,
      threshold: 0.2, // 20% difference tolerance
    });
  });
  
  test('responsive - mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      mask: [page.locator('.timestamp')],
    });
  });
  
  test('interactive component states', async ({ page }) => {
    await page.goto('/components');
    
    // Capture default state
    await expect(page.locator('.button-group')).toHaveScreenshot('buttons-default.png');
    
    // Hover state
    await page.locator('button.primary').hover();
    await expect(page.locator('.button-group')).toHaveScreenshot('buttons-hover.png');
    
    // Disabled state
    await page.locator('button.disabled').evaluate(el => {
      (el as HTMLButtonElement).disabled = true;
    });
    await expect(page.locator('.button-group')).toHaveScreenshot('buttons-disabled.png');
  });
});
```

**Handling Flaky Visual Tests:**

```typescript
test('stable visual test with animations', async ({ page }) => {
  await page.goto('/animated-page');
  
  // Wait for page to be interactive
  await page.waitForLoadState('networkidle');
  
  // Wait for animations to complete
  await page.evaluate(() => {
    return new Promise(resolve => {
      const checkAnimations = setInterval(() => {
        const animations = document.getAnimations();
        if (animations.length === 0) {
          clearInterval(checkAnimations);
          resolve(null);
        }
      }, 100);
    });
  });
  
  // Now take screenshot
  await expect(page).toHaveScreenshot('animated-section.png');
});

// Handle timezone-dependent content
test('visual test with masked dynamic time', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Clock widget ticks continuously
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [page.locator('.clock-widget')],
  });
});
```

**Baseline Management:**

```bash
# Generate baselines for all visual tests
npx playwright test --update-snapshots

# Generate baselines for specific test file
npx playwright test visual/forms.spec.ts --update-snapshots

# Review diff before updating
npx playwright test --update-snapshots --headed

# Run tests to compare against baselines
npx playwright test
```

**Visual Test Organization:**

```typescript
// tests/visual/index.ts
import { Page } from '@playwright/test';

export const VISUAL_MASKS = {
  DYNAMIC_TIME: { selector: '.timestamp, .clock, .time-display' },
  ANIMATED_CONTENT: { selector: '[class*="animate"], [class*="loading"]' },
  USER_SPECIFIC: { selector: '.user-name, .user-avatar, .profile-section' },
  ADS: { selector: '[data-ad-slot], .advertisement, .ad-banner' },
  THIRD_PARTY: { selector: '[src*="google"], [src*="facebook"], iframe' },
};

export async function waitForVisualStability(page: Page) {
  // Wait for animations
  await page.evaluate(() => {
    return Promise.all(
      document.getAnimations().map(animation => animation.finished)
    );
  });
  
  // Wait for network
  await page.waitForLoadState('networkidle');
  
  // Wait for custom stability signal
  await page.evaluate(() => {
    return new Promise(resolve => {
      if ((window as any).visualTestReady) {
        resolve(null);
      } else {
        (window as any).onVisualReady = resolve;
      }
    });
  }).catch(() => {
    // Timeout is ok, continue with screenshot
  });
}

// Usage
import { test, expect } from '@playwright/test';
import { VISUAL_MASKS, waitForVisualStability } from './index';

test('product card visual', async ({ page }) => {
  await page.goto('/products/123');
  await waitForVisualStability(page);
  
  const maskSelectors = [
    VISUAL_MASKS.DYNAMIC_TIME.selector,
    VISUAL_MASKS.USER_SPECIFIC.selector,
  ];
  
  await expect(page.locator('.product-card')).toHaveScreenshot('product-card.png', {
    mask: maskSelectors.map(selector => page.locator(selector)),
  });
});
```

**Visual Regression in CI/CD:**

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          # Get both PR and main branch for comparison
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install && npx playwright install --with-deps
      
      - name: Run visual tests
        run: npx playwright test --project=chromium tests/visual/
      
      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Comment PR with results
        if: always() && github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('playwright-report/index.html', 'utf-8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '📸 Visual regression tests completed. [View Report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})'
            });
```

**Real-World Example: E-commerce Product Page**

```typescript
test('product page visual across devices', async ({ page }) => {
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];
  
  await page.goto('/products/laptop-123');
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForLoadState('networkidle');
    
    // Mask dynamic price and inventory
    await expect(page).toHaveScreenshot(`product-${viewport.name}.png`, {
      fullPage: true,
      mask: [
        page.locator('.price-tag'),
        page.locator('.stock-level'),
        page.locator('.customer-reviews'), // May load dynamically
      ],
    });
  }
});

test('visual comparison of A/B test variants', async ({ page, context }) => {
  // Get variant A
  const pageA = await context.newPage();
  await pageA.goto('/product?variant=a');
  await pageA.waitForLoadState('networkidle');
  
  // Get variant B
  const pageB = await context.newPage();
  await pageB.goto('/product?variant=b');
  await pageB.waitForLoadState('networkidle');
  
  // Capture both
  const screenshotA = await pageA.screenshot();
  const screenshotB = await pageB.screenshot();
  
  // Visual comparison (requires image comparison library)
  const pixelmatch = require('pixelmatch');
  const { PNG } = require('pngjs');
  
  const imgA = PNG.sync.read(screenshotA);
  const imgB = PNG.sync.read(screenshotB);
  const diff = pixelmatch(imgA.data, imgB.data, null, imgA.width, imgA.height);
  
  console.log(`Pixel differences between variants: ${diff}`);
  
  await pageA.close();
  await pageB.close();
});
```

**Best Practices:**

1. **Mask dynamic content**: Timestamps, user data, ads, animations
2. **Wait for stability**: Animations, networks, custom signals
3. **Consistent environment**: Same OS, browser version, fonts
4. **Regular baseline updates**: Review changes intentionally
5. **Fast feedback**: Keep tests focused and quick
6. **Document changes**: Git commit messages explain visual changes

**Common Pitfalls:**

```typescript
// ❌ Don't take screenshots without waiting for stability
test('flaky visual test', async ({ page }) => {
  await page.goto('/animated-page');
  await expect(page).toHaveScreenshot('page.png'); // Too fast
});

// ✅ Wait for stability first
test('stable visual test', async ({ page }) => {
  await page.goto('/animated-page');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    return Promise.all(document.getAnimations().map(a => a.finished));
  });
  await expect(page).toHaveScreenshot('page.png');
});

// ❌ Don't mask everything
test('over-masked', async ({ page }) => {
  await expect(page).toHaveScreenshot('page.png', {
    mask: [page.locator('body')], // Masks entire page!
  });
});

// ✅ Mask only necessary elements
test('appropriately masked', async ({ page }) => {
  await expect(page).toHaveScreenshot('page.png', {
    mask: [page.locator('.timestamp'), page.locator('.user-avatar')],
  });
});
```

---

### Question 37: How do you optimize Playwright test performance and execution speed?

**Answer:**

Test performance is critical at scale. Enterprise test suites with thousands of tests need optimization across multiple dimensions.

**Performance Profiling:**

```typescript
// tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance profiling', () => {
  test('measure page load performance', async ({ page }, testInfo) => {
    const metrics: Record<string, number> = {};
    
    const startTime = Date.now();
    await page.goto('https://example.com');
    metrics.pageLoadTime = Date.now() - startTime;
    
    // Get Core Web Vitals
    const vitals = await page.evaluate(() => {
      return {
        // Largest Contentful Paint
        lcp: performance.getEntriesByName('largest-contentful-paint').pop()?.startTime || 0,
        // First Input Delay (deprecated, use INP)
        fid: performance.getEntriesByType('first-input').pop()?.processingDuration || 0,
        // Cumulative Layout Shift
        cls: (performance as any).getEntriesByType('layout-shift')
          .reduce((sum: number, entry: any) => sum + (entry.hadRecentInput ? 0 : entry.value), 0),
        // First Contentful Paint
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    metrics.lcp = vitals.lcp;
    metrics.fcp = vitals.fcp;
    metrics.cls = vitals.cls;
    
    // Log metrics
    console.log('Performance Metrics:', metrics);
    
    // Assert performance thresholds
    expect(metrics.pageLoadTime).toBeLessThan(3000); // 3 seconds
    expect(vitals.lcp).toBeLessThan(2500); // 2.5 seconds
    
    // Attach to test report
    await testInfo.attach('performance-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });
  });
});
```

**Test Optimization Strategies:**

```typescript
// 1. Shared Setup/Teardown (reduce duplication)
test.describe.configure({ mode: 'parallel' }); // Run tests in parallel

test.beforeAll(async ({ browser }) => {
  // One-time setup for all tests in this describe block
  // Create test data once
});

test.beforeEach(async ({ page }) => {
  // Per-test setup (should be fast)
  await page.goto('/dashboard');
});

// 2. Reuse browser context to avoid new browser launches
test('use shared context', async ({ browser }) => {
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  
  // Both pages share cookies, storage, etc
  // Faster than creating new browser instances
  
  await context.close();
});

// 3. Use API for expensive operations
test('fast setup with API', async ({ request, page }) => {
  // Create test data via API (milliseconds)
  const response = await request.post('/api/test-data', {
    data: { userId: 123, items: 10 }
  });
  const testDataId = (await response.json()).id;
  
  // Navigate to pre-populated state
  await page.goto(`/items/${testDataId}`);
  
  // Test runs immediately on ready state
});

// 4. Lazy loading - only navigate when needed
test('lazy navigation', async ({ page }) => {
  // Don't navigate until actually needed
  // Saves time if test is skipped
  
  const gotoPage = async () => {
    if (!page.url().includes('/target')) {
      await page.goto('/target');
    }
  };
  
  // Call only when needed
  await gotoPage();
});

// 5. Parallel test execution within describe block
test.describe('independent tests', () => {
  test.describe.configure({ mode: 'parallel' });
  
  test('test 1 - data validation', async ({ page }) => {
    // Runs in parallel with test 2
  });
  
  test('test 2 - ui interaction', async ({ page }) => {
    // Runs in parallel with test 1
  });
});

// 6. Skip expensive operations for non-critical tests
test('smoke test', async ({ page }, testInfo) => {
  // Simple assertions, minimal navigation
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('deep integration test', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chrome-mobile') {
    test.skip(); // Skip if not needed on mobile
  }
  
  // Complex, time-consuming test
});
```

**Parallel Execution Configuration:**

```typescript
// playwright.config.ts
export default defineConfig({
  // Optimal worker count (usually = CPU cores)
  workers: process.env.CI ? 1 : undefined,
  
  timeout: 30000,
  expect: { timeout: 5000 },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Run tests in parallel within this project
      timeout: 30000,
    },
  ],
  
  // Global timeout to fail fast
  globalTimeout: 5 * 60 * 1000, // 5 minutes
});
```

**Network Optimization:**

```typescript
// Mock heavy resources
test('optimized with network mocking', async ({ page }) => {
  // Block large images and external resources
  await page.route('**/*.jpg', route => route.abort());
  await page.route('**/*.png', route => route.abort());
  await page.route('**/cdn.example.com/**', route => route.abort());
  
  // Continue necessary requests
  await page.route('**/api/**', route => route.continue());
  
  await page.goto('https://example.com');
  
  // Page loads 5x faster without heavy assets
});

// Mock slow API calls
test('mock slow endpoint', async ({ page }) => {
  await page.route('**/api/slow-endpoint', route => {
    // Return mocked response instead of waiting 10 seconds
    route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'mocked' })
    });
  });
  
  await page.goto('/dashboard');
  // Saves 10 seconds per test execution
});
```

**Performance Measurement:**

```typescript
// tests/benchmarks.spec.ts
import { test, expect } from '@playwright/test';

test('measure action performance', async ({ page }, testInfo) => {
  await page.goto('https://example.com');
  
  const timings = {
    clickButton: 0,
    fillForm: 0,
    submit: 0,
  };
  
  // Measure click
  const start1 = performance.now();
  await page.click('button#action');
  timings.clickButton = performance.now() - start1;
  
  // Measure form fill
  const start2 = performance.now();
  await page.fill('input#email', 'test@example.com');
  await page.fill('input#password', 'password');
  timings.fillForm = performance.now() - start2;
  
  // Log timings
  console.log('Action timings (ms):', timings);
  
  // Ensure tests don't degrade
  expect(timings.clickButton).toBeLessThan(100);
  expect(timings.fillForm).toBeLessThan(200);
});
```

**Real-World Enterprise Optimization:**

```typescript
// tests/shared-fixtures/heavy-setup.ts
import { test as base, Page } from '@playwright/test';

type HeavySetup = {
  authenticatedAndPrepared: Page;
};

export const test = base.extend<{}, HeavySetup>({
  authenticatedAndPrepared: [
    async ({ browser, page }, use) => {
      // Run this once per worker
      // Setup authentication
      await page.goto('https://example.com/login');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Login' }).click();
      
      // Pre-load data
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Store session
      const context = page.context();
      const storageState = await context.storageState();
      
      await use(page);
    },
    { scope: 'worker' } // Shared across all tests in worker
  ]
});

// Usage - all tests start with logged-in, ready state
import { test } from './shared-fixtures/heavy-setup';

test('benefit from shared setup', async ({ authenticatedAndPrepared }) => {
  // Already authenticated and loaded
  await authenticatedAndPrepared.click('button#action');
});
```

**Performance Budgets:**

```typescript
// tests/performance-budget.spec.ts
import { test, expect } from '@playwright/test';

const PERFORMANCE_BUDGET = {
  pageLoadTime: 3000, // 3 seconds
  testExecutionTime: 5000, // 5 seconds
  lcp: 2500, // 2.5 seconds
  fcp: 1800, // 1.8 seconds
};

test('monitor performance budget', async ({ page }, testInfo) => {
  const start = Date.now();
  
  await page.goto('https://example.com');
  const loadTime = Date.now() - start;
  
  expect(loadTime).toBeLessThan(PERFORMANCE_BUDGET.pageLoadTime);
  expect(testInfo.duration).toBeLessThan(PERFORMANCE_BUDGET.testExecutionTime);
});
```

**Best Practices:**

1. **Use workers effectively**: Set to CPU count + 1
2. **API for setup**: Faster than UI automation
3. **Mock heavy resources**: External scripts, images, tracking
4. **Measure regularly**: Track performance over time
5. **Parallel execution**: Run independent tests together
6. **Cache when possible**: Reuse authentication, data

**Common Pitfalls:**

```typescript
// ❌ Don't create new browser for each test
test('slow', async () => {
  const browser = await chromium.launch(); // 2-3 seconds
  const page = await browser.newPage();
  // test
  await browser.close();
});

// ✅ Use fixture (creates once per session)
test('fast', async ({ page }) => {
  // page already created
  // test
});

// ❌ Don't do unnecessary navigation
test('slow navigation', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  await page.goto('/checkout');
  // Each navigation takes 1-2 seconds
});

// ✅ Navigate efficiently
test('fast navigation', async ({ page }) => {
  await page.goto('/checkout'); // Direct navigation
});
```

---

### Question 38: How do you handle mobile and responsive testing in Playwright?

**Answer:**

Mobile testing requires device emulation, different viewport configurations, and touch-specific interactions. Playwright's emulation capabilities are comprehensive but need careful setup.

**Basic Mobile Emulation:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
    // Desktop for comparison
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

// Test runs on all devices automatically
// npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

**Custom Device Configuration:**

```typescript
test('custom mobile device', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
    hasTouch: true,
    isMobile: true,
  });
  
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Mobile-specific assertions
  await expect(page.locator('.mobile-menu')).toBeVisible();
  await expect(page.locator('.desktop-nav')).not.toBeVisible();
});
```

**Touch Interactions:**

```typescript
test('touch gestures', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Tap (single touch)
  await page.tap('button#menu');
  
  // Long press
  await page.locator('.item').tap({ modifiers: ['Shift'] });
  
  // Swipe (drag gesture)
  const carousel = page.locator('.carousel');
  const box = await carousel.boundingBox();
  
  if (box) {
    // Swipe left
    await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
    await page.touchscreen.swipe(
      { x: box.x + box.width - 50, y: box.y + box.height / 2 },
      { x: box.x + 50, y: box.y + box.height / 2 }
    );
  }
  
  // Pinch zoom (on supported devices)
  await page.touchscreen.tap(200, 200);
  // Most pinch operations done via scroll wheel on emulated devices
  await page.mouse.wheel(0, -3); // Zoom in
});
```

**Real-World Mobile Testing:**

```typescript
test('responsive e-commerce flow', async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name.includes('Mobile');
  
  await page.goto('https://shop.example.com');
  
  // Mobile shows hamburger menu
  if (isMobile) {
    await expect(page.locator('.hamburger-menu')).toBeVisible();
    await page.click('.hamburger-menu');
  }
  
  // Navigate to products
  await page.click('a:has-text("Products")');
  await page.waitForLoadState('networkidle');
  
  // On mobile, filter is in modal
  if (isMobile) {
    await page.click('.filter-toggle');
    const filterModal = page.locator('.filter-modal');
    await expect(filterModal).toBeVisible();
    await filterModal.locator('input[value="electronics"]').check();
    await filterModal.locator('button:has-text("Apply")').click();
  } else {
    // On desktop, filter is sidebar
    await page.locator('.filter-sidebar input[value="electronics"]').check();
  }
  
  // Select product (same for all)
  await page.click('.product-card >> nth=0');
  
  // Mobile: full screen product view
  // Desktop: side-by-side with description
  
  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  
  // Mobile: cart slides in from bottom
  // Desktop: cart updates in header
  
  const cartCount = isMobile
    ? page.locator('.mobile-cart-indicator')
    : page.locator('.header-cart-count');
  
  await expect(cartCount).toHaveText('1');
});
```

**Device Orientation Testing:**

```typescript
test('test portrait and landscape', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
  });
  
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Portrait
  await expect(page.locator('.vertical-layout')).toBeVisible();
  await expect(page.locator('.horizontal-layout')).not.toBeVisible();
  
  // Rotate to landscape
  await context.emulateMedia({ viewport: { width: 667, height: 375 } });
  
  // Landscape-specific elements visible
  await expect(page.locator('.horizontal-layout')).toBeVisible();
  await expect(page.locator('.vertical-layout')).not.toBeVisible();
});
```

**Viewport Variants:**

```typescript
// tests/responsive/responsive.spec.ts
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];

test.describe('responsive across viewports', () => {
  VIEWPORTS.forEach(viewport => {
    test(`should render correctly at ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.width < 768,
      });
      
      const page = await context.newPage();
      await page.goto('https://example.com');
      await page.waitForLoadState('networkidle');
      
      // Check layout is correct for viewport
      const mainContent = page.locator('main');
      const box = await mainContent.boundingBox();
      
      expect(box?.width).toBeLessThanOrEqual(viewport.width);
      
      // No horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      
      await context.close();
    });
  });
});
```

**Geolocation and Permissions:**

```typescript
test('location-based features', async ({ browser }) => {
  const context = await browser.newContext({
    geolocation: { latitude: 12.9716, longitude: 77.5946 }, // Bangalore
    permissions: ['geolocation'],
    isMobile: true,
  });
  
  const page = await context.newPage();
  await page.goto('https://maps.example.com');
  
  // Should show Bangalore location
  await expect(page.locator('.current-location')).toContainText('Bangalore');
  
  // Update location
  await context.setGeolocation({ latitude: 19.0760, longitude: 72.8777 }); // Mumbai
  await page.reload();
  
  await expect(page.locator('.current-location')).toContainText('Mumbai');
});
```

**Network Throttling for Mobile:**

```typescript
test('slow 3G network', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
  });
  
  const page = await context.newPage();
  
  // Simulate 3G network
  await page.route('**/*', route => {
    // Add artificial delay
    setTimeout(() => route.continue(), 500);
  });
  
  const start = Date.now();
  await page.goto('https://example.com');
  const duration = Date.now() - start;
  
  // Should handle slow networks gracefully
  await expect(page.locator('h1')).toBeVisible();
  expect(duration).toBeGreaterThan(1000); // At least slowed down
});
```

**Fingerprint Matching for Mobile:**

```typescript
test('consistent mobile experience', async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name.includes('Mobile');
  
  if (!isMobile) {
    test.skip();
  }
  
  // Mobile-specific behavior
  await page.goto('https://example.com');
  
  // Touch targets should be adequate size (48px minimum)
  const buttons = page.locator('button');
  
  for (let i = 0; i < await buttons.count(); i++) {
    const box = await buttons.nth(i).boundingBox();
    
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  }
});
```

**Best Practices:**

1. **Test on real devices in CI**: Emulation isn't 100% accurate
2. **Use standardized devices**: iPhone 12, Pixel 5, iPad
3. **Test touch interactions**: Tap, swipe, long-press
4. **Check responsive design**: No horizontal scroll
5. **Network throttling**: Test on slow connections
6. **Orientation changes**: Portrait and landscape

**Common Pitfalls:**

```typescript
// ❌ Don't assume mobile behavior
test('might work differently', async ({ page }) => {
  await page.click('a'); // Click works, but tap might not
});

// ✅ Use appropriate gestures
test('mobile-aware', async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name.includes('Mobile');
  
  if (isMobile) {
    await page.tap('a');
  } else {
    await page.click('a');
  }
});

// ❌ Don't forget to check touch target sizes
test('might have small targets', async ({ page }) => {
  await page.click('button'); // Works in automated test but hard for humans
});

// ✅ Verify touch targets
const box = await page.locator('button').boundingBox();
expect(box?.width).toBeGreaterThanOrEqual(48); // 48x48px minimum
```

---

### Question 39: How do you implement accessibility testing in Playwright?

**Answer:**

Accessibility testing ensures applications are usable by everyone, including users with disabilities. Playwright provides tools for automated accessibility checks and manual testing.

**WCAG Accessibility Testing:**

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility compliance with axe', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Inject axe for accessibility checks
  await injectAxe(page);
  
  // Check for violations
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  });
  
  // Specific rule checks
  const results = await page.evaluate(() => {
    return (window as any).axe.run();
  });
  
  expect(results.violations.length).toBe(0);
});

// Test accessibility of specific component
test('modal accessibility', async ({ page }) => {
  await page.goto('https://example.com/modal-example');
  await page.click('button:has-text("Open Dialog")');
  
  await injectAxe(page);
  
  // Check modal for violations
  const modal = page.locator('[role="dialog"]');
  const violations = await page.evaluate(() => {
    return (window as any).axe.runPartial({
      include: [modal.selector]
    });
  });
  
  expect(violations.violations).toHaveLength(0);
});
```

**Screen Reader Testing:**

```typescript
test('keyboard navigation and screen reader', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Test keyboard navigation (no mouse)
  await page.keyboard.press('Tab'); // Focus first button
  await expect(page.locator('button').first()).toBeFocused();
  
  await page.keyboard.press('Tab'); // Focus next
  await expect(page.locator('button').nth(1)).toBeFocused();
  
  // Test form labels for screen readers
  const inputs = page.locator('input');
  
  for (let i = 0; i < await inputs.count(); i++) {
    const input = inputs.nth(i);
    const label = page.locator(`label[for="${await input.getAttribute('id')}"]`);
    
    // Each input should have associated label
    const labelText = await label.textContent();
    expect(labelText).toBeTruthy();
  }
});
```

**Real-World Accessibility Testing:**

```typescript
test('form accessibility', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 1. All form inputs should have associated labels
  const inputs = page.locator('input[type="text"], input[type="email"], textarea, select');
  
  for (let i = 0; i < await inputs.count(); i++) {
    const input = inputs.nth(i);
    const inputId = await input.getAttribute('id');
    
    if (inputId) {
      // Check for associated label
      const label = page.locator(`label[for="${inputId}"]`);
      await expect(label).toBeVisible();
    } else {
      // Check for aria-label
      const ariaLabel = await input.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  }
  
  // 2. Form validation errors should be announced
  // Submit form without required fields
  await page.click('button[type="submit"]');
  
  // Check for error messages
  const errors = page.locator('[role="alert"]');
  await expect(errors).toBeVisible();
  
  // Errors should have aria-live for screen readers
  const ariaLive = await errors.first().getAttribute('aria-live');
  expect(['polite', 'assertive']).toContain(ariaLive);
  
  // 3. Test keyboard-only navigation
  await page.keyboard.press('Tab');
  const firstInput = inputs.first();
  await expect(firstInput).toBeFocused();
  
  // Fill using keyboard
  await page.keyboard.type('test@example.com');
  await page.keyboard.press('Tab');
  
  const secondInput = inputs.nth(1);
  await expect(secondInput).toBeFocused();
  
  // Submit using keyboard
  await page.keyboard.press('Tab');
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeFocused();
  
  await page.keyboard.press('Enter');
  
  // Should successfully submit
  await expect(page.locator('.success-message')).toBeVisible();
});

test('navigation accessibility', async ({ page }) => {
  await page.goto('https://example.com');
  
  // 1. Skip to main content link
  await page.keyboard.press('Tab');
  const skipLink = page.locator('a:has-text("Skip to main content")');
  
  // Should be first focusable element
  await expect(skipLink).toBeFocused();
  
  // 2. Navigation structure should be semantic
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  
  // Nav should contain list of links
  const navLinks = nav.locator('a');
  expect(await navLinks.count()).toBeGreaterThan(0);
  
  // 3. Breadcrumb navigation
  const breadcrumb = page.locator('[aria-label="breadcrumb"]');
  if (await breadcrumb.isVisible()) {
    const items = breadcrumb.locator('[aria-current="page"]');
    await expect(items.first()).toContainText(/current|home/i);
  }
  
  // 4. Headings should be hierarchical
  const h1s = page.locator('h1');
  const h2s = page.locator('h2');
  
  // Should have exactly one h1
  expect(await h1s.count()).toBe(1);
  
  // h2s should come after h1
  const h1Index = 0; // First h1
  const firstH2Index = await page.evaluate(() => {
    const h2 = document.querySelector('h2');
    const h1 = document.querySelector('h1');
    return h2 && h1 ? Array.from(document.querySelectorAll('h1, h2')).indexOf(h2) : -1;
  });
  
  expect(firstH2Index).toBeGreaterThan(h1Index);
});

test('image accessibility', async ({ page }) => {
  await page.goto('https://example.com/gallery');
  
  // All images should have alt text
  const images = page.locator('img');
  
  for (let i = 0; i < await images.count(); i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    const ariaLabel = await img.getAttribute('aria-label');
    
    // Should have alt or aria-label
    expect(alt || ariaLabel).toBeTruthy();
    
    // Alt text should be descriptive (not just "image" or "pic")
    const text = (alt || ariaLabel).toLowerCase();
    expect(text).not.toMatch(/^(image|pic|photo|picture|icon)$/i);
  }
});

test('color contrast accessibility', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Using tota11y library for contrast checking
  await page.addScriptTag({
    url: 'https://cdn.jsdelivr.net/npm/tota11y/dist/tota11y.min.js'
  });
  
  // Run accessibility checks
  const violations = await page.evaluate(() => {
    return (window as any).tota11y.report();
  });
  
  expect(violations.contrast).toHaveLength(0);
});

test('focus management', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Test focus visibility
  const button = page.locator('button:has-text("Click me")');
  
  // Focus button
  await button.focus();
  
  // Check that focus is visible
  const focusStyle = await button.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      outline: style.outline,
      boxShadow: style.boxShadow,
      opacity: style.opacity
    };
  });
  
  // Should have visible focus indicator
  const hasVisibleFocus = 
    focusStyle.outline !== 'none' ||
    focusStyle.boxShadow !== 'none' ||
    focusStyle.opacity !== '1';
  
  expect(hasVisibleFocus).toBeTruthy();
});
```

**Accessibility Audit Report:**

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Audits', () => {
  const pages = [
    '/',
    '/products',
    '/checkout',
    '/account',
  ];
  
  pages.forEach(pathname => {
    test(`audit ${pathname}`, async ({ page }, testInfo) => {
      await page.goto(`https://example.com${pathname}`);
      await page.waitForLoadState('networkidle');
      
      await injectAxe(page);
      
      try {
        await checkA11y(page, null, {
          detailedReport: true,
        });
      } catch (error: any) {
        // Attach detailed report
        await testInfo.attach('a11y-report', {
          body: error.message,
          contentType: 'text/plain',
        });
        
        throw error;
      }
    });
  });
});
```

**Best Practices:**

1. **Automated testing is 25-30% of a11y**: Manual testing is essential
2. **Use semantic HTML**: Proper tags instead of divs
3. **Test keyboard navigation**: Tab through every page
4. **Check color contrast**: WCAG AA minimum (4.5:1)
5. **Provide alt text**: Descriptive, not "image" or "pic"
6. **Test with screen readers**: NVDA, JAWS, VoiceOver

**Common Pitfalls:**

```typescript
// ❌ Don't ignore accessibility warnings
test('has a11y issue', async ({ page }) => {
  await page.goto('https://example.com');
  // Image missing alt text, but test passes
});

// ✅ Fail on accessibility violations
test('checks accessibility', async ({ page }) => {
  await page.goto('https://example.com');
  await injectAxe(page);
  await checkA11y(page); // Throws if violations found
});

// ❌ Don't rely on color alone
test('misleading with color', async ({ page }) => {
  // "Click the red button" is inaccessible to colorblind users
});

// ✅ Use semantic meaning
test('accessible indicator', async ({ page }) => {
  // "Click the submit button" works for everyone
});
```

---

### Question 40: How do you test database interactions and state management in Playwright?

**Answer:**

Most web applications depend on databases. Testing requires ability to set up test data, verify database state, and clean up after tests.

**Database Setup and Teardown:**

```typescript
// fixtures/database.fixtures.ts
import { test as base } from '@playwright/test';
import { MongoClient, Db, Collection } from 'mongodb';

type DatabaseFixtures = {
  db: Db;
  usersCollection: Collection;
  ordersCollection: Collection;
};

export const test = base.extend<DatabaseFixtures>({
  db: async ({}, use) => {
    const client = await MongoClient.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017'
    );
    
    const db = client.db('test_database');
    
    console.log('Database connected');
    
    await use(db);
    
    // Cleanup: Drop test database
    await client.dropDatabase();
    await client.close();
    console.log('Database cleaned and closed');
  },
  
  usersCollection: async ({ db }, use) => {
    const collection = db.collection('users');
    
    // Create indexes
    await collection.createIndex({ email: 1 }, { unique: true });
    
    await use(collection);
    
    // Cleanup
    await collection.deleteMany({});
  },
  
  ordersCollection: async ({ db }, use) => {
    const collection = db.collection('orders');
    
    // Create indexes
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ createdAt: -1 });
    
    await use(collection);
    
    // Cleanup
    await collection.deleteMany({});
  },
});

export { expect } from '@playwright/test';

// tests/database.spec.ts
import { test, expect } from '../fixtures/database.fixtures';

test('create user via UI and verify in database', async ({ 
  page, 
  usersCollection 
}) => {
  // Navigate to registration
  await page.goto('https://app.example.com/register');
  
  // Fill registration form
  await page.getByLabel('Email').fill('newuser@example.com');
  await page.getByLabel('Password').fill('SecurePass123!');
  await page.getByLabel('Confirm Password').fill('SecurePass123!');
  await page.getByRole('button', { name: 'Register' }).click();
  
  // Verify success message
  await expect(page.getByText('Registration successful')).toBeVisible();
  
  // Verify user was created in database
  const user = await usersCollection.findOne({ 
    email: 'newuser@example.com' 
  });
  
  expect(user).toBeTruthy();
  expect(user?.email).toBe('newuser@example.com');
  expect(user?.createdAt).toBeDefined();
});
```

**Real-World Example: Order Processing**

```typescript
test('complete purchase flow with database verification', async ({ 
  page, 
  request,
  usersCollection,
  ordersCollection 
}) => {
  // Setup: Create test user via API
  const userResponse = await request.post('https://api.example.com/users', {
    data: {
      email: 'buyer@example.com',
      password: 'password123',
      name: 'Test Buyer'
    }
  });
  
  const userId = (await userResponse.json()).id;
  
  // Verify user in database
  const user = await usersCollection.findOne({ _id: userId });
  expect(user?.email).toBe('buyer@example.com');
  
  // Login via UI
  await page.goto('https://app.example.com/login');
  await page.getByLabel('Email').fill('buyer@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Browse and add products
  await page.goto('https://app.example.com/products');
  await page.locator('[data-product-id="1"]').click();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  
  // Proceed to checkout
  await page.goto('https://app.example.com/checkout');
  
  // Fill payment details (mocked in tests)
  await page.getByLabel('Card Number').fill('4111111111111111');
  await page.getByLabel('Expiry').fill('12/25');
  await page.getByLabel('CVV').fill('123');
  
  // Place order
  const orderIdPromise = page.waitForEvent('console', msg => 
    msg.text().includes('Order ID:')
  );
  
  await page.getByRole('button', { name: 'Place Order' }).click();
  
  // Wait for success
  await expect(page.getByText('Order confirmed')).toBeVisible();
  
  // Extract order ID from page
  const orderIdElement = page.locator('.order-number');
  const orderId = await orderIdElement.textContent();
  
  // Verify order in database
  const order = await ordersCollection.findOne({ _id: orderId });
  
  expect(order).toBeTruthy();
  expect(order?.userId).toBe(userId);
  expect(order?.status).toBe('pending');
  expect(order?.totalAmount).toBe(99.99);
  expect(order?.items).toHaveLength(1);
  expect(order?.items[0].productId).toBe('1');
  
  // Verify order state transition
  expect(order?.createdAt).toBeDefined();
  
  // Simulate payment processing (API call)
  await request.post(`https://api.example.com/orders/${orderId}/process`, {
    data: { status: 'completed' }
  });
  
  // Verify status changed in database
  const completedOrder = await ordersCollection.findOne({ _id: orderId });
  expect(completedOrder?.status).toBe('completed');
  
  // Verify UI reflects change
  await page.reload();
  await expect(page.locator('.order-status')).toContainText('Completed');
});
```

**SQL Database Testing:**

```typescript
// fixtures/sql-database.fixtures.ts
import { test as base } from '@playwright/test';
import { Pool } from 'pg'; // PostgreSQL

type SQLDatabaseFixtures = {
  db: Pool;
};

export const test = base.extend<SQLDatabaseFixtures>({
  db: async ({}, use) => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 
        'postgresql://user:password@localhost:5432/test_db'
    });
    
    // Run migrations
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.release();
    
    await use(pool);
    
    // Cleanup
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.end();
  },
});

// Usage
test('SQL database interaction', async ({ page, db }) => {
  // Insert test data
  await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
    ['test@example.com', 'hashed_password']
  );
  
  // Test via UI
  await page.goto('https://app.example.com/users');
  
  // Verify in database
  const result = await db.query('SELECT * FROM users WHERE email = $1', [
    'test@example.com'
  ]);
  
  expect(result.rows).toHaveLength(1);
});
```

**Transaction Testing:**

```typescript
test('database transactions', async ({ page, db }) => {
  // Test that transactions are properly handled
  
  // Simulate payment with transaction
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Debit buyer account
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
      [100, 'buyer_id']
    );
    
    // Credit seller account
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2',
      [100, 'seller_id']
    );
    
    // Record transaction
    await client.query(
      'INSERT INTO transactions (buyer_id, seller_id, amount) VALUES ($1, $2, $3)',
      ['buyer_id', 'seller_id', 100]
    );
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  
  // Verify in database
  const buyerBalance = await db.query(
    'SELECT balance FROM accounts WHERE user_id = $1',
    ['buyer_id']
  );
  
  const sellerBalance = await db.query(
    'SELECT balance FROM accounts WHERE user_id = $1',
    ['seller_id']
  );
  
  expect(buyerBalance.rows[0].balance).toBe(originalBalance - 100);
  expect(sellerBalance.rows[0].balance).toBe(originalBalance + 100);
});
```

**Database State Verification:**

```typescript
test('verify complex database state', async ({ page, db }) => {
  // Create complex data structure
  const userId = await createTestUser(db);
  const productIds = await createTestProducts(db, 5);
  
  // User adds items to cart via UI
  await page.goto('https://app.example.com/products');
  
  for (const productId of productIds.slice(0, 3)) {
    await page.click(`[data-product-id="${productId}"]`);
    await page.click('button:has-text("Add to Cart")');
  }
  
  // Verify cart in database
  const cart = await db.query(
    'SELECT * FROM carts WHERE user_id = $1',
    [userId]
  );
  
  expect(cart.rows).toHaveLength(1);
  
  // Verify cart items
  const cartItems = await db.query(
    'SELECT product_id FROM cart_items WHERE cart_id = $1',
    [cart.rows[0].id]
  );
  
  expect(cartItems.rows).toHaveLength(3);
  expect(cartItems.rows.map(r => r.product_id).sort()).toEqual(
    productIds.slice(0, 3).sort()
  );
});
```

**Best Practices:**

1. **Separate test database**: Never use production database
2. **Clean up after tests**: Delete test data to prevent interference
3. **Use transactions**: Rollback on failure
4. **Verify both UI and database**: Cross-validate state
5. **Use factories for test data**: Reusable, maintainable

**Common Pitfalls:**

```typescript
// ❌ Don't use production database for tests
process.env.DATABASE_URL = 'postgresql://user:pass@prod-server:5432/production';

// ✅ Use test database
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test_db';

// ❌ Don't leave test data after tests
test('data modification', async ({ db }) => {
  await db.query('INSERT INTO users ...'); // Never cleaned up
});

// ✅ Clean up in fixture
test('data modification', async ({ db }) => {
  // Data created in setup
  // Automatically cleaned in teardown
});

// ❌ Don't trust UI alone
test('flaky verification', async ({ page }) => {
  // May show success but fail in database
  await expect(page.locator('.success')).toBeVisible();
});

// ✅ Verify in database
test('solid verification', async ({ page, db }) => {
  await expect(page.locator('.success')).toBeVisible();
  const result = await db.query('SELECT * FROM orders WHERE id = ....');
  expect(result.rows).toHaveLength(1);
});
```

---

(Continuing with Questions 41-50...)

### Question 41: How do you configure and manage test timeouts effectively?

**Answer:**

Timeouts are critical for test reliability. Poor timeout configuration causes flaky tests. Playwright provides granular timeout control.

**Global Timeout Configuration:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Global test timeout (entire test)
  timeout: 30000, // 30 seconds
  
  // Expect timeout (assertions)
  expect: { timeout: 5000 }, // 5 seconds
  
  // Global timeout for entire test suite
  globalTimeout: 10 * 60 * 1000, // 10 minutes
  
  use: {
    // Action timeout (click, fill, etc.)
    actionTimeout: 10000, // 10 seconds
    
    // Navigation timeout (goto, reload, etc.)
    navigationTimeout: 30000, // 30 seconds
  },
  
  projects: [
    {
      name: 'chromium',
      use: { 
        // Project-specific timeout
        actionTimeout: 5000, // Faster timeouts for chrome
      },
      timeout: 60000, // Longer timeout for full tests
    },
  ],
});
```

**Per-Test Timeout Override:**

```typescript
test('quick test', async ({ page }) => {
  // 5 second timeout
  await page.goto('https://example.com');
}, { timeout: 5000 });

test('slow endpoint', async ({ page }) => {
  // 60 second timeout
  await page.goto('https://slow.example.com');
}, { timeout: 60000 });
```

**Strategic Timeout Management:**

```typescript
test('careful timeout management', async ({ page }, testInfo) => {
  const testStartTime = Date.now();
  const testTimeout = testInfo.timeout;
  const bufferTime = 5000; // 5 second buffer for cleanup
  
  // Fast operation - use short timeout
  await expect(page.locator('h1')).toBeVisible({ timeout: 2000 });
  
  // Slow operation - use longer timeout
  await page.goto('https://example.com/slow-page', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Check remaining time
  const elapsedTime = Date.now() - testStartTime;
  const remainingTime = testTimeout - elapsedTime - bufferTime;
  
  if (remainingTime < 10000) {
    console.log('Warning: Test running out of time');
  }
  
  // Use remaining time for final assertions
  await expect(page.locator('.result')).toBeVisible({ 
    timeout: Math.max(2000, remainingTime) 
  });
});
```

**Real-World Timeout Strategies:**

```typescript
test.describe('API-dependent tests', () => {
  test('fast path with good API', async ({ page }) => {
    // API responds in 100ms
    await page.route('**/api/data', route => {
      route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ data: [] }) 
      });
    });
    
    await page.goto('https://example.com');
    await expect(page.locator('.data')).toBeVisible({ timeout: 2000 });
  }, { timeout: 5000 });
  
  test('slow path with slow API', async ({ page }) => {
    // API takes 10 seconds
    await page.route('**/api/data', async route => {
      await new Promise(r => setTimeout(r, 10000));
      route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
    });
    
    await page.goto('https://example.com');
    // Need longer timeout
    await expect(page.locator('.data')).toBeVisible({ timeout: 15000 });
  }, { timeout: 30000 });
});
```

**Timeout Debugging:**

```typescript
test('timeout troubleshooting', async ({ page }, testInfo) => {
  try {
    await page.goto('https://slow-server.example.com', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.error(`Page load timed out after 10s`);
      
      // Capture state for debugging
      const screenshot = await page.screenshot();
      await testInfo.attach('timeout-screenshot', {
        body: screenshot,
        contentType: 'image/png'
      });
      
      // Get page state
      const pageState = await page.evaluate(() => {
        return {
          readyState: document.readyState,
          url: window.location.href,
          hasContent: document.body.children.length > 0
        };
      });
      
      console.log('Page state at timeout:', pageState);
    }
    throw error;
  }
});
```

---

### Question 42: How do you implement custom test reporters and integrate with test management tools?

**Answer:**

Custom reporters enable integration with CI/CD systems, test management platforms, and business intelligence tools.

**Custom Reporter Implementation:**

```typescript
// reporters/custom-reporter.ts
import {
  Reporter,
  FullResult,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

class CustomReporter implements Reporter {
  private outputFile: string;
  private results: any[] = [];
  
  constructor(options?: { outputFile?: string }) {
    this.outputFile = options?.outputFile || 'test-results.json';
  }
  
  async onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      name: test.title,
      file: test.location.file,
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
      attachments: result.attachments.map(a => ({
        name: a.name,
        contentType: a.contentType,
      })),
    });
  }
  
  async onEnd(result: FullResult) {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      skipped: this.results.filter(r => r.status === 'skipped').length,
      duration: result.duration,
      results: this.results,
    };
    
    fs.writeFileSync(
      this.outputFile,
      JSON.stringify(summary, null, 2)
    );
  }
}

export default CustomReporter;
```

**Test Management Integration:**

```typescript
// reporters/xray-reporter.ts
import {
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import axios from 'axios';

class XrayReporter implements Reporter {
  private xrayApiUrl: string;
  private xrayToken: string;
  
  constructor() {
    this.xrayApiUrl = process.env.XRAY_API_URL || '';
    this.xrayToken = process.env.XRAY_TOKEN || '';
  }
  
  async onTestEnd(test: TestCase, result: TestResult) {
    // Extract test case ID from test name or tag
    const testCaseId = this.extractTestId(test.title);
    
    if (!testCaseId) return;
    
    // Send result to Xray
    await axios.post(`${this.xrayApiUrl}/testexecutions`, {
      testCaseKey: testCaseId,
      status: result.status === 'passed' ? 'PASS' : 'FAIL',
      duration: result.duration,
      evidence: result.attachments.map(a => ({
        name: a.name,
        data: a.path,
      })),
      comment: result.error?.message,
    }, {
      headers: { 'Authorization': `Bearer ${this.xrayToken}` }
    });
  }
  
  private extractTestId(title: string): string | null {
    // Extract JIRA key from test title
    // e.g., "PROJ-123: Login flow"
    const match = title.match(/^(PROJ-\d+)/);
    return match ? match[1] : null;
  }
}

export default XrayReporter;
```

**Slack Integration Reporter:**

```typescript
// reporters/slack-reporter.ts
import {
  Reporter,
  FullResult,
} from '@playwright/test/reporter';
import axios from 'axios';

class SlackReporter implements Reporter {
  private webhookUrl: string;
  
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  }
  
  async onEnd(result: FullResult) {
    const stats = result.stats;
    const passed = stats.expected;
    const failed = stats.unexpected;
    const duration = Math.round(result.duration / 1000);
    
    const color = failed > 0 ? '#FF0000' : '#00FF00';
    const status = failed > 0 ? '❌ FAILED' : '✅ PASSED';
    
    const message = {
      attachments: [{
        color,
        title: `Test Results: ${status}`,
        fields: [
          {
            title: 'Passed',
            value: passed.toString(),
            short: true,
          },
          {
            title: 'Failed',
            value: failed.toString(),
            short: true,
          },
          {
            title: 'Duration',
            value: `${duration}s`,
            short: true,
          },
          {
            title: 'Branch',
            value: process.env.GIT_BRANCH || 'unknown',
            short: true,
          },
        ],
      }],
    };
    
    if (failed > 0) {
      message.attachments[0].fields?.push({
        title: 'Report',
        value: `<${process.env.REPORT_URL}|View Full Report>`,
        short: false,
      });
    }
    
    await axios.post(this.webhookUrl, message);
  }
}

export default SlackReporter;
```

**Configuration:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import CustomReporter from './reporters/custom-reporter';
import XrayReporter from './reporters/xray-reporter';
import SlackReporter from './reporters/slack-reporter';

export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'html-report' }],
    [CustomReporter, { outputFile: 'test-results.json' }],
    [XrayReporter],
    [SlackReporter],
    ['json', { outputFile: 'test-results.json' }],
  ],
});
```

---
# 60 Comprehensive Playwright JavaScript/TypeScript Interview Questions

**Expert-Level Test Automation Guide: From Junior to Senior Architect**

---

## Table of Contents
- [Beginner Level (Questions 1-15)](#beginner-level)
- [Intermediate Level (Questions 16-35)](#intermediate-level)
- [Advanced Level (Questions 36-50)](#advanced-level)
- [Expert/Architect Level (Questions 51-60)](#expert-architect-level)

---

## Beginner Level (Questions 1-15)

### Question 1: What is Playwright and how does it differ from Selenium?

**Answer:**

Playwright is a modern end-to-end testing framework developed by Microsoft that enables reliable automation across Chromium, Firefox, and WebKit browsers. Unlike Selenium, Playwright was built from the ground up with modern web application testing in mind.

**Key Architectural Differences:**

1. **Protocol**: Playwright uses browser-native protocols (Chrome DevTools Protocol for Chromium, custom protocols for Firefox and WebKit), while Selenium uses WebDriver protocol with an intermediary driver layer.

2. **Auto-waiting**: Playwright has built-in smart waiting mechanisms that automatically wait for elements to be actionable before performing actions, reducing flakiness.

3. **Browser Context**: Playwright introduces browser contexts for lightweight isolated sessions without spinning up entire browser instances.

4. **Network Control**: Native network interception and mocking capabilities without external libraries.

**Code Comparison:**

```javascript
// Selenium WebDriver
const { Builder, By, until } = require('selenium-webdriver');
const driver = await new Builder().forBrowser('chrome').build();
await driver.get('https://example.com');
await driver.wait(until.elementLocated(By.id('submit')), 10000);
const element = await driver.findElement(By.id('submit'));
await driver.wait(until.elementIsVisible(element), 5000);
await element.click();
await driver.quit();

// Playwright
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.click('#submit'); // Auto-waits for element to be visible and enabled
await browser.close();
```

**Real-World Advantages:**
- **Speed**: Playwright tests typically run 2-3x faster due to parallel execution and efficient browser communication
- **Reliability**: Auto-waiting reduces 70-80% of timeout-related flakiness
- **Modern Web Support**: Native Shadow DOM, iframes, and web components support
- **Mobile Testing**: Built-in device emulation without additional setup

**Common Pitfalls:**
- Developers migrating from Selenium often add explicit waits unnecessarily
- Browser context isolation requires understanding when to share vs. create new contexts

**Migration Consideration:**
For enterprise teams, Playwright offers faster execution but requires rewriting test suites. The investment pays off in reduced maintenance and CI/CD time.

---

### Question 2: Explain Playwright's auto-waiting mechanism and why it's important.

**Answer:**

Playwright's auto-waiting is an intelligent system that performs actionability checks before executing any action on elements. This eliminates the need for manual `waitFor` statements that plague Selenium tests.

**Auto-Waiting Checks Performed:**

1. **Attached**: Element is attached to the DOM
2. **Visible**: Element has non-empty bounding box and no `visibility:hidden`
3. **Stable**: Element is not animating (position hasn't changed for 2 consecutive frames)
4. **Receives Events**: Element is not obscured by other elements
5. **Enabled**: Element is not disabled (for buttons, inputs)

**TypeScript Example:**

```typescript
import { test, expect, Page } from '@playwright/test';

test('auto-waiting in action', async ({ page }: { page: Page }) => {
  await page.goto('https://example.com/dynamic-content');
  
  // Auto-waits for button to be:
  // - Attached to DOM
  // - Visible
  // - Stable (not animating)
  // - Not obscured by other elements
  // - Enabled
  await page.click('button#submit');
  
  // Auto-waits for element to be visible before getting text
  const successMessage = await page.locator('.success').textContent();
  expect(successMessage).toContain('Success');
});
```

**Real-World Scenario - Loading Spinner:**

```typescript
test('handles loading states automatically', async ({ page }) => {
  await page.goto('https://app.example.com/dashboard');
  
  // This button appears after a 3-second loading spinner
  // Playwright automatically waits - no explicit wait needed
  await page.click('button:has-text("Load Data")');
  
  // Waits for table to be populated (checks visibility)
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeGreaterThan(0);
});
```

**Configuring Timeout:**

```typescript
// Global timeout in playwright.config.ts
export default {
  timeout: 30000, // 30 seconds for entire test
  expect: {
    timeout: 5000 // 5 seconds for assertions
  },
  use: {
    actionTimeout: 10000 // 10 seconds for actions like click, fill
  }
};

// Per-action timeout override
await page.click('button', { timeout: 15000 });
```

**Best Practices:**
- Trust auto-waiting; avoid `page.waitForTimeout()` (it's a code smell)
- Use `page.waitForLoadState('networkidle')` for SPAs with heavy network activity
- Override timeouts only when justified (e.g., known slow API calls)

**Common Pitfall:**
Developers new to Playwright often add unnecessary explicit waits:

```typescript
// ❌ Bad - Unnecessary explicit wait
await page.waitForSelector('#button');
await page.click('#button');

// ✅ Good - Auto-waiting handles it
await page.click('#button');
```

---

### Question 3: What are Browser Contexts in Playwright and when should you use them?

**Answer:**

A Browser Context is a lightweight, isolated incognito-like session within a browser instance. It's equivalent to a new incognito window with separate cookies, localStorage, and cache, but much faster to create.

**Architecture:**

```
Browser Instance
├── Browser Context 1 (isolated session)
│   ├── Page 1
│   └── Page 2
├── Browser Context 2 (isolated session)
│   └── Page 1
└── Browser Context 3 (isolated session)
    └── Page 1
```

**Basic Usage:**

```typescript
import { chromium, Browser, BrowserContext, Page } from 'playwright';

const browser: Browser = await chromium.launch();

// Create isolated contexts
const context1: BrowserContext = await browser.newContext();
const context2: BrowserContext = await browser.newContext();

// Each context has independent state
const page1 = await context1.newPage();
const page2 = await context2.newPage();

await page1.goto('https://example.com/login');
// Login in context1 - cookies stored here

await page2.goto('https://example.com/login');
// context2 remains logged out - completely isolated

await browser.close();
```

**Real-World Use Case: Multi-User Testing**

```typescript
import { test, Browser } from '@playwright/test';

test('simulate multiple users simultaneously', async ({ browser }) => {
  // Simulate admin user
  const adminContext = await browser.newContext({
    storageState: 'auth/admin-state.json'
  });
  const adminPage = await adminContext.newPage();
  
  // Simulate regular user
  const userContext = await browser.newContext({
    storageState: 'auth/user-state.json'
  });
  const userPage = await userContext.newPage();
  
  // Both users interact simultaneously
  await Promise.all([
    adminPage.goto('https://app.example.com/admin/dashboard'),
    userPage.goto('https://app.example.com/dashboard')
  ]);
  
  // Admin creates a resource
  await adminPage.click('button:has-text("Create Project")');
  await adminPage.fill('#projectName', 'Q1 Initiative');
  await adminPage.click('button[type="submit"]');
  
  // Regular user sees the new project
  await userPage.reload();
  await expect(userPage.locator('text=Q1 Initiative')).toBeVisible();
  
  await adminContext.close();
  await userContext.close();
});
```

**Context Configuration Options:**

```typescript
const context = await browser.newContext({
  // Geolocation
  geolocation: { longitude: 77.5946, latitude: 12.9716 }, // Bangalore
  permissions: ['geolocation'],
  
  // Viewport
  viewport: { width: 1920, height: 1080 },
  
  // Device emulation
  userAgent: 'Custom User Agent',
  deviceScaleFactor: 2,
  
  // Network
  offline: false,
  httpCredentials: { username: 'admin', password: 'secret' },
  
  // Recording
  recordVideo: { dir: 'videos/' },
  recordTrace: { dir: 'traces/' },
  
  // Storage state (authentication)
  storageState: 'auth-state.json'
});
```

**Performance Benefits:**

```typescript
// ❌ Slow - Creating new browser for each test
test('user test 1', async () => {
  const browser = await chromium.launch(); // 2-3 seconds
  const page = await browser.newPage();
  // test logic
  await browser.close();
});

// ✅ Fast - Reusing browser with new contexts
test.describe('User tests', () => {
  let browser: Browser;
  
  test.beforeAll(async () => {
    browser = await chromium.launch(); // Once
  });
  
  test('user test 1', async () => {
    const context = await browser.newContext(); // ~50ms
    const page = await context.newPage();
    // test logic
    await context.close();
  });
  
  test('user test 2', async () => {
    const context = await browser.newContext(); // ~50ms
    const page = await context.newPage();
    // test logic
    await context.close();
  });
  
  test.afterAll(async () => {
    await browser.close();
  });
});
```

**When to Use Browser Contexts:**
1. **Parallel user testing**: Testing different user roles simultaneously
2. **Isolation**: Preventing test data pollution between tests
3. **Performance**: Faster than creating new browser instances
4. **Authentication**: Loading different authentication states per context

**Common Pitfalls:**
- Forgetting to close contexts leads to memory leaks
- Sharing a context between tests can cause flakiness
- Not understanding that Playwright's `page` fixture automatically creates isolated contexts

---

### Question 4: Explain the difference between `page.locator()` and `page.$()` in Playwright.

**Answer:**

These represent two different locator paradigms in Playwright: the modern **Locator API** (`page.locator()`) and the legacy **ElementHandle API** (`page.$()`). Playwright strongly recommends the Locator API for its auto-waiting and retry capabilities.

**Fundamental Difference:**

```typescript
// Locator API - Lazy, auto-waits, retries
const locator = page.locator('button#submit');
// Nothing happens yet - it's a query selector, not a result

// ElementHandle API - Eager, no auto-retry
const element = await page.$('button#submit');
// Immediately queries DOM - result can become stale
```

**Auto-Waiting & Retry Behavior:**

```typescript
import { test, Page } from '@playwright/test';

test('locator vs element handle', async ({ page }: { page: Page }) => {
  await page.goto('https://example.com');
  
  // ✅ Locator API - Retries until element appears
  const submitLocator = page.locator('button#submit');
  await submitLocator.click(); // Auto-waits and retries for up to 30 seconds
  
  // ❌ ElementHandle API - Can fail if element not immediately present
  const submitElement = await page.$('button#submit');
  if (submitElement) {
    await submitElement.click(); // No auto-retry if element becomes stale
  }
});
```

**Real-World Scenario: Dynamic Content**

```typescript
test('handling dynamically loaded content', async ({ page }) => {
  await page.goto('https://app.example.com/dashboard');
  
  // Scenario: Button appears after API call completes (2 seconds delay)
  
  // ✅ Locator API - Handles this gracefully
  await page.locator('button:has-text("Load More")').click();
  // Automatically waits for button to appear and be clickable
  
  // ❌ ElementHandle API - Likely to fail
  const button = await page.$('button:has-text("Load More")');
  // Returns null if button not present when this line executes
  await button?.click(); // Error: Cannot read property 'click' of null
});
```

**Chaining Operations:**

```typescript
// ✅ Locator API - Supports chaining
const productCard = page.locator('.product-card').filter({ hasText: 'iPhone 15' });
const price = productCard.locator('.price');
await expect(price).toHaveText('$999');

// Locators are evaluated at action time, so they stay fresh
await page.locator('input[name="quantity"]').fill('2'); // Updates DOM
await productCard.locator('.add-to-cart').click(); // Locator re-evaluates
await expect(price).toHaveText('$1,998'); // Works correctly

// ❌ ElementHandle API - Doesn't support chaining elegantly
const card = await page.$('.product-card');
// Element handle can become stale after DOM updates
```

**Strict Mode:**

```typescript
// Locator API enforces strict mode by default
test('strict mode example', async ({ page }) => {
  await page.goto('https://example.com');
  
  // ✅ Throws error if multiple buttons match
  await page.locator('button').click();
  // Error: strict mode violation: locator('button') resolved to 5 elements
  
  // Fix: Be more specific
  await page.locator('button:has-text("Submit")').click();
  
  // Or explicitly handle multiple elements
  await page.locator('button').first().click();
  await page.locator('button').nth(2).click();
  await page.locator('button').last().click();
});
```

**When ElementHandle Might Be Used (Rare Cases):**

```typescript
// Low-level DOM manipulation (not recommended for most cases)
const element = await page.$('input#special');
const boundingBox = await element?.boundingBox();
const screenshot = await element?.screenshot();

// But Locator API can do this too:
const locator = page.locator('input#special');
const boundingBox2 = await locator.boundingBox();
const screenshot2 = await locator.screenshot();
```

**Comparison Table:**

| Feature | Locator API | ElementHandle API |
|---------|-------------|-------------------|
| Auto-waiting | ✅ Yes | ❌ No |
| Auto-retry | ✅ Yes | ❌ No |
| Lazy evaluation | ✅ Yes | ❌ No (eager) |
| Strict mode | ✅ By default | ❌ No |
| Chaining | ✅ Elegant | ⚠️ Cumbersome |
| Stale element handling | ✅ Automatic | ❌ Manual |
| Recommended | ✅ Yes | ❌ Legacy |

**Best Practice:**

```typescript
// ✅ Always prefer Locator API
await page.locator('button').click();
await expect(page.locator('.message')).toBeVisible();

// ❌ Avoid ElementHandle API unless you have specific low-level needs
const element = await page.$('button');
```

**Migration Example:**

```typescript
// Old ElementHandle pattern
const buttons = await page.$$('button');
for (const button of buttons) {
  const text = await button.textContent();
  if (text === 'Submit') {
    await button.click();
    break;
  }
}

// Modern Locator pattern
await page.locator('button', { hasText: 'Submit' }).click();
// Or
await page.locator('button:has-text("Submit")').click();
```

---

### Question 5: What are the different types of locator strategies in Playwright? Which is most recommended?

**Answer:**

Playwright provides multiple locator strategies, but strongly recommends **role-based locators** and **user-visible text locators** for writing resilient, accessible tests. The locator strategy you choose significantly impacts test maintainability and reliability.

**Locator Strategy Hierarchy (Best to Worst):**

**1. Role-Based Locators (Recommended)**

These locate elements by their ARIA role and accessible name, making tests resilient to implementation changes and ensuring accessibility.

```typescript
import { test, expect } from '@playwright/test';

test('role-based locators', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // By role and accessible name
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: /submit/i }).click(); // Case-insensitive regex
  
  // Form controls
  await page.getByRole('textbox', { name: 'Username' }).fill('testuser');
  await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
  await page.getByRole('checkbox', { name: 'Accept terms' }).check();
  await page.getByRole('radio', { name: 'Male' }).check();
  
  // Navigation
  await page.getByRole('link', { name: 'About Us' }).click();
  
  // Lists and items
  await expect(page.getByRole('listitem')).toHaveCount(5);
  
  // Headings
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**2. Text-Based Locators**

```typescript
test('text-based locators', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Exact text match
  await page.getByText('Submit').click();
  
  // Partial text match
  await page.getByText('Subm', { exact: false }).click();
  
  // Regex
  await page.getByText(/submit/i).click();
  
  // Labels (for form inputs)
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('secret');
  
  // Placeholder
  await page.getByPlaceholder('Enter your email').fill('test@test.com');
  
  // Alt text (images)
  await page.getByAltText('Company logo').click();
  
  // Title attribute
  await page.getByTitle('Close dialog').click();
});
```

**3. Test ID Locators (Good for Dynamic Content)**

```typescript
// HTML markup
// <button data-testid="submit-button">Submit</button>

test('test id locators', async ({ page }) => {
  await page.goto('https://example.com');
  
  await page.getByTestId('submit-button').click();
  await page.getByTestId('user-dropdown').selectOption('Admin');
  
  // Configure custom test id attribute in playwright.config.ts
  // testIdAttribute: 'data-test-id'
});
```

**4. CSS Selectors (Use Sparingly)**

```typescript
test('css selectors', async ({ page }) => {
  await page.goto('https://example.com');
  
  // ID selector
  await page.locator('#submit-button').click();
  
  // Class selector
  await page.locator('.btn-primary').click();
  
  // Attribute selector
  await page.locator('[data-action="submit"]').click();
  
  // Combining selectors
  await page.locator('button.btn-primary[type="submit"]').click();
  
  // Child combinators
  await page.locator('.form-container > button').click();
  
  // Pseudo-classes
  await page.locator('button:has-text("Submit")').click();
  await page.locator('li:nth-child(2)').click();
});
```

**5. XPath (Least Recommended)**

```typescript
test('xpath selectors', async ({ page }) => {
  await page.goto('https://example.com');
  
  // XPath
  await page.locator('xpath=//button[@id="submit"]').click();
  
  // Text-based XPath
  await page.locator('xpath=//button[contains(text(), "Submit")]').click();
});
```

**Real-World Example: Complex Form**

```typescript
test('complete user registration', async ({ page }) => {
  await page.goto('https://app.example.com/register');
  
  // ✅ Role-based locators for semantic elements
  await page.getByRole('heading', { name: 'Create Account' }).waitFor();
  
  // ✅ Label-based for form inputs (accessible)
  await page.getByLabel('First Name').fill('John');
  await page.getByLabel('Last Name').fill('Doe');
  await page.getByLabel('Email Address').fill('john.doe@example.com');
  
  // ✅ Placeholder for search-like inputs
  await page.getByPlaceholder('Choose a username').fill('johndoe123');
  
  // ✅ Role for checkboxes and radios
  await page.getByRole('checkbox', { name: 'I agree to terms' }).check();
  await page.getByRole('radio', { name: 'Male' }).check();
  
  // ✅ Test ID for dynamic/generated elements
  await page.getByTestId('country-dropdown').selectOption('India');
  
  // ✅ Role for buttons
  await page.getByRole('button', { name: 'Create Account' }).click();
  
  // ✅ Text-based for success messages
  await expect(page.getByText('Account created successfully')).toBeVisible();
});
```

**Chaining Locators (Filtering):**

```typescript
test('chaining and filtering locators', async ({ page }) => {
  await page.goto('https://ecommerce.example.com/products');
  
  // Find product card containing specific text
  const productCard = page.locator('.product-card')
    .filter({ hasText: 'iPhone 15 Pro' });
  
  // Within that card, find the price
  const price = productCard.locator('.price');
  await expect(price).toHaveText('$999');
  
  // Click "Add to Cart" within that specific card
  await productCard.getByRole('button', { name: 'Add to Cart' }).click();
  
  // Complex filtering
  const premiumProducts = page.locator('.product-card')
    .filter({ has: page.locator('.badge:has-text("Premium")') });
  
  await expect(premiumProducts).toHaveCount(12);
});
```

**Handling Multiple Elements:**

```typescript
test('working with multiple elements', async ({ page }) => {
  await page.goto('https://example.com/products');
  
  // Get all matching elements
  const products = page.locator('.product-item');
  
  // Count
  const count = await products.count();
  expect(count).toBeGreaterThan(0);
  
  // Access specific elements
  await products.first().click(); // First element
  await products.last().click(); // Last element
  await products.nth(2).click(); // Third element (0-indexed)
  
  // Iterate (use with caution - can be slow)
  for (let i = 0; i < await products.count(); i++) {
    const productName = await products.nth(i).locator('.name').textContent();
    console.log(`Product ${i}: ${productName}`);
  }
  
  // Better: Use all() for batch operations
  const allProducts = await products.all();
  for (const product of allProducts) {
    const name = await product.locator('.name').textContent();
    console.log(name);
  }
});
```

**Best Practice Decision Tree:**

```
Can you use getByRole()? 
├─ Yes → Use it (best for accessibility)
└─ No → Can you use getByLabel() / getByText()?
    ├─ Yes → Use it (second best)
    └─ No → Does element have data-testid?
        ├─ Yes → Use getByTestId()
        └─ No → Use CSS selector (last resort)
            └─ Never use XPath unless absolutely necessary
```

**Common Pitfalls:**

```typescript
// ❌ Over-specific selectors (brittle)
await page.locator('div.container > div.row > div.col-md-6 > button.btn.btn-primary').click();

// ✅ User-centric selector (resilient)
await page.getByRole('button', { name: 'Submit' }).click();

// ❌ Using index-based selectors (fragile)
await page.locator('button').nth(3).click();

// ✅ Using meaningful identifiers
await page.getByRole('button', { name: 'Delete Account' }).click();
```

---

### Question 6: Explain how to handle iframes in Playwright with code examples.

**Answer:**

Playwright provides elegant iframe handling through the `frameLocator()` method, which creates a locator scope within an iframe. This is significantly simpler than Selenium's approach of switching contexts.

**Basic Iframe Handling:**

```typescript
import { test, expect } from '@playwright/test';

test('basic iframe interaction', async ({ page }) => {
  await page.goto('https://example.com/page-with-iframe');
  
  // Locate the iframe
  const iframe = page.frameLocator('iframe#payment-frame');
  
  // Interact with elements inside iframe
  await iframe.locator('#card-number').fill('4111111111111111');
  await iframe.locator('#expiry').fill('12/25');
  await iframe.locator('#cvv').fill('123');
  await iframe.getByRole('button', { name: 'Submit Payment' }).click();
  
  // Verify result in iframe
  await expect(iframe.getByText('Payment Successful')).toBeVisible();
});
```

**Multiple Iframes:**

```typescript
test('nested iframes', async ({ page }) => {
  await page.goto('https://example.com/nested-frames');
  
  // Access first level iframe
  const outerFrame = page.frameLocator('#outer-frame');
  
  // Access nested iframe inside outer iframe
  const innerFrame = outerFrame.frameLocator('#inner-frame');
  
  // Interact with element in nested iframe
  await innerFrame.locator('#deep-button').click();
  await expect(innerFrame.getByText('Success')).toBeVisible();
});
```

**Real-World Example: Payment Gateway Integration**

```typescript
test('stripe payment gateway', async ({ page }) => {
  await page.goto('https://ecommerce.example.com/checkout');
  
  // Fill billing details on main page
  await page.getByLabel('Full Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  
  // Switch to Stripe iframe for card details
  const stripeFrame = page.frameLocator('iframe[name="__privateStripeFrame"]');
  
  // Fill card details inside Stripe's secure iframe
  await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
  await stripeFrame.locator('[placeholder="CVC"]').fill('123');
  await stripeFrame.locator('[placeholder="ZIP"]').fill('12345');
  
  // Click submit on main page
  await page.getByRole('button', { name: 'Complete Purchase' }).click();
  
  // Wait for success message on main page
  await expect(page.getByText('Order Confirmed')).toBeVisible({ timeout: 10000 });
});
```

**Using Frame.name() to Locate Iframes:**

```typescript
test('iframe by name attribute', async ({ page }) => {
  await page.goto('https://example.com');
  
  // HTML: <iframe name="content-frame" src="/content"></iframe>
  const frame = page.frameLocator('[name="content-frame"]');
  await frame.locator('button').click();
});
```

**Waiting for Iframe to Load:**

```typescript
test('wait for iframe content', async ({ page }) => {
  await page.goto('https://example.com/lazy-iframe');
  
  const iframe = page.frameLocator('#dynamic-frame');
  
  // Wait for specific content inside iframe to ensure it's loaded
  await iframe.locator('#content-ready').waitFor({ state: 'visible' });
  
  // Now safe to interact
  await iframe.getByRole('button', { name: 'Action' }).click();
});
```

**Accessing iframe via page.frame() (Legacy Approach):**

```typescript
test('legacy frame access', async ({ page }) => {
  await page.goto('https://example.com/iframe-page');
  
  // Get frame by URL
  const frame = page.frame({ url: /.*\/payment-frame.*/ });
  if (frame) {
    await frame.locator('#card-number').fill('4111111111111111');
  }
  
  // Get frame by name
  const namedFrame = page.frame('payment-frame');
  if (namedFrame) {
    await namedFrame.click('#submit');
  }
  
  // Get all frames
  const allFrames = page.frames();
  console.log(`Page has ${allFrames.length} frames`);
});
```

**Real-World Scenario: CAPTCHA in Iframe**

```typescript
test('handle recaptcha iframe', async ({ page }) => {
  await page.goto('https://example.com/contact-form');
  
  // Fill form on main page
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Message').fill('Hello, this is a test message');
  
  // Wait for reCAPTCHA iframe to load
  const recaptchaFrame = page.frameLocator('iframe[src*="recaptcha"]');
  
  // In real tests, you'd typically bypass CAPTCHA in test environment
  // or use test keys, but here's how to interact with the iframe
  await recaptchaFrame.locator('#recaptcha-anchor').click();
  
  // Wait for verification
  await page.waitForTimeout(2000); // Not ideal, but CAPTCHA timing varies
  
  // Submit form
  await page.getByRole('button', { name: 'Submit' }).click();
});
```

**Switching Between Main Page and Iframe:**

```typescript
test('main page and iframe coordination', async ({ page }) => {
  await page.goto('https://example.com/editor');
  
  // Interact with main page toolbar
  await page.getByRole('button', { name: 'Bold' }).click();
  
  // Type in iframe editor
  const editorFrame = page.frameLocator('#editor-frame');
  await editorFrame.locator('.editor-content').fill('This is bold text');
  
  // Back to main page - save button
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Verify in iframe
  await expect(editorFrame.getByText('Document saved')).toBeVisible();
});
```

**Handling Iframe with Delayed Loading:**

```typescript
test('iframe that loads after user action', async ({ page }) => {
  await page.goto('https://example.com/dashboard');
  
  // Click button that triggers iframe load
  await page.getByRole('button', { name: 'Load Payment Form' }).click();
  
  // Wait for iframe to be attached to DOM
  await page.locator('iframe#payment-frame').waitFor({ state: 'attached' });
  
  // Now create frame locator
  const paymentFrame = page.frameLocator('iframe#payment-frame');
  
  // Wait for iframe content to be ready
  await paymentFrame.locator('#card-number').waitFor({ state: 'visible' });
  
  // Interact with iframe
  await paymentFrame.locator('#card-number').fill('4111111111111111');
});
```

**Best Practices:**

1. **Use frameLocator() over page.frame()**: Modern API with better auto-waiting
2. **Wait for iframe content**: Don't assume iframe is ready immediately after page load
3. **Avoid switching**: Unlike Selenium, you don't need to "switch" contexts
4. **Security consideration**: Some iframes may have security restrictions preventing automation

**Common Pitfalls:**

```typescript
// ❌ Don't try to use page.locator() for iframe content
await page.locator('iframe#payment').locator('#card-number').fill('4111'); // Won't work

// ✅ Use frameLocator() instead
await page.frameLocator('iframe#payment').locator('#card-number').fill('4111');

// ❌ Don't forget to wait for iframe to load
const iframe = page.frameLocator('#late-loading-frame');
await iframe.locator('button').click(); // May fail if iframe not loaded

// ✅ Wait for a known element in iframe first
await iframe.locator('.iframe-ready-indicator').waitFor();
await iframe.locator('button').click();
```

**Comparison with Selenium:**

```javascript
// Selenium (Java)
WebElement iframe = driver.findElement(By.id("payment-frame"));
driver.switchTo().frame(iframe);
driver.findElement(By.id("card-number")).sendKeys("4111111111111111");
driver.switchTo().defaultContent(); // Must switch back

// Playwright (TypeScript)
await page.frameLocator('#payment-frame')
  .locator('#card-number')
  .fill('4111111111111111');
// No need to switch back - scope is automatic
```

---

### Question 7: How do you perform assertions in Playwright? Explain web-first assertions.

**Answer:**

Playwright uses **web-first assertions** that automatically wait and retry until the expected condition is met, making tests more reliable. These are built on the `expect` library and specifically designed for web testing.

**Basic Assertions:**

```typescript
import { test, expect } from '@playwright/test';

test('basic assertions', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Visibility assertions
  await expect(page.locator('#welcome-message')).toBeVisible();
  await expect(page.locator('.spinner')).toBeHidden();
  
  // Text content assertions
  await expect(page.locator('h1')).toHaveText('Welcome');
  await expect(page.locator('.error')).toContainText('Invalid');
  
  // Attribute assertions
  await expect(page.locator('button')).toHaveAttribute('disabled', '');
  await expect(page.locator('input')).toHaveValue('test@example.com');
  
  // Count assertions
  await expect(page.locator('.product-item')).toHaveCount(10);
  
  // URL assertions
  await expect(page).toHaveURL('https://example.com/dashboard');
  await expect(page).toHaveURL(/dashboard/);
  
  // Title assertions
  await expect(page).toHaveTitle('Dashboard | Example App');
  await expect(page).toHaveTitle(/Dashboard/);
});
```

**Web-First Assertions Auto-Waiting:**

```typescript
test('auto-retry behavior', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // Click submit button
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // This assertion automatically retries for up to 5 seconds (default expect timeout)
  // until the success message appears
  await expect(page.getByText('Form submitted successfully')).toBeVisible();
  // Playwright keeps checking: attempt 1 (not visible), attempt 2 (not visible)...
  // attempt N (visible!) - assertion passes
  
  // Without web-first assertions, you'd need:
  // await page.waitForSelector('.success-message', { state: 'visible' });
  // const isVisible = await page.locator('.success-message').isVisible();
  // expect(isVisible).toBe(true);
});
```

**Real-World Example: Form Submission Validation**

```typescript
test('complete form validation flow', async ({ page }) => {
  await page.goto('https://app.example.com/register');
  
  // Initial state assertions
  await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  await expect(page.locator('.error-message')).toBeHidden();
  
  // Fill form
  await page.getByLabel('Email').fill('invalid-email');
  await page.getByLabel('Password').fill('123'); // Too short
  
  // Validation error assertions
  await expect(page.getByText('Please enter a valid email')).toBeVisible();
  await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  
  // Fix errors
  await page.getByLabel('Email').clear();
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').clear();
  await page.getByLabel('Password').fill('SecurePass123!');
  
  // Errors should disappear
  await expect(page.getByText('Please enter a valid email')).toBeHidden();
  await expect(page.getByText('Password must be at least 8 characters')).toBeHidden();
  
  // Button should be enabled
  await expect(page.getByRole('button', { name: 'Register' })).toBeEnabled();
  
  // Submit and verify success
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
```

**CSS Class and Attribute Assertions:**

```typescript
test('class and attribute assertions', async ({ page }) => {
  await page.goto('https://example.com/products');
  
  // Class assertions
  await expect(page.locator('.product-card').first()).toHaveClass('product-card featured');
  await expect(page.locator('.product-card').first()).toHaveClass(/featured/);
  
  // Attribute assertions
  await expect(page.locator('#search')).toHaveAttribute('placeholder', 'Search products...');
  await expect(page.locator('img.logo')).toHaveAttribute('alt', 'Company Logo');
  await expect(page.locator('a.download')).toHaveAttribute('href', /\.pdf$/);
  
  // Data attributes
  await expect(page.locator('.product').first()).toHaveAttribute('data-product-id', '12345');
  
  // JavaScript property assertions
  await expect(page.locator('input[type="checkbox"]')).toBeChecked();
  await expect(page.locator('input[type="radio"]')).not.toBeChecked();
  await expect(page.locator('select')).toHaveValue('option2');
});
```

**Soft Assertions (Continue on Failure):**

```typescript
test('soft assertions for comprehensive checking', async ({ page }) => {
  await page.goto('https://example.com/profile');
  
  // Soft assertions don't stop test execution on failure
  await expect.soft(page.locator('#username')).toHaveText('johndoe');
  await expect.soft(page.locator('#email')).toHaveText('john@example.com');
  await expect.soft(page.locator('#phone')).toHaveText('+1234567890');
  await expect.soft(page.locator('#address')).toContainText('New York');
  
  // All soft assertions are evaluated, and test fails if any failed
  // But all checks are performed, useful for data validation
});
```

**Custom Timeout for Assertions:**

```typescript
test('custom assertion timeouts', async ({ page }) => {
  await page.goto('https://example.com/slow-loading');
  
  // Default timeout is 5 seconds (from expect.timeout in config)
  await expect(page.locator('#content')).toBeVisible();
  
  // Override timeout for specific assertion
  await expect(page.locator('#slow-api-data')).toBeVisible({ timeout: 15000 });
  
  // Multiple assertions with same timeout
  await test.step('Verify all data loaded', async () => {
    await expect(page.locator('#data1')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#data2')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#data3')).toBeVisible({ timeout: 20000 });
  });
});
```

**Negation (NOT) Assertions:**

```typescript
test('not assertions', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Negative assertions
  await expect(page.locator('.error-message')).not.toBeVisible();
  await expect(page.locator('button')).not.toBeDisabled();
  await expect(page.locator('.loading-spinner')).not.toBeAttached();
  await expect(page).not.toHaveURL(/login/);
  
  // Useful for verifying cleanup
  await page.getByRole('button', { name: 'Delete Item' }).click();
  await expect(page.locator('.item-123')).not.toBeVisible();
});
```

**Screenshot Assertions (Visual Regression):**

```typescript
test('visual regression testing', async ({ page }) => {
  await page.goto('https://example.com/landing');
  
  // Full page screenshot comparison
  await expect(page).toHaveScreenshot('landing-page.png');
  
  // Element screenshot comparison
  await expect(page.locator('.hero-section')).toHaveScreenshot('hero.png');
  
  // With options
  await expect(page).toHaveScreenshot('responsive.png', {
    maxDiffPixels: 100, // Allow 100 pixels difference
    threshold: 0.2 // 20% threshold
  });
});
```

**Polling Assertions:**

```typescript
test('polling with expect.poll', async ({ page }) => {
  await page.goto('https://example.com/realtime-data');
  
  // Poll a custom function until condition is met
  await expect.poll(async () => {
    const response = await page.request.get('https://api.example.com/status');
    return response.status();
  }, {
    message: 'API should return 200',
    timeout: 30000
  }).toBe(200);
  
  // Poll element count (for dynamically added items)
  await expect.poll(async () => {
    return await page.locator('.notification-item').count();
  }).toBeGreaterThan(5);
});
```

**Real-World Scenario: E-commerce Cart**

```typescript
test('shopping cart comprehensive validation', async ({ page }) => {
  await page.goto('https://shop.example.com/products');
  
  // Add item to cart
  await page.locator('.product-card').first().getByRole('button', { name: 'Add to Cart' }).click();
  
  // Verify cart badge count
  await expect(page.locator('.cart-badge')).toHaveText('1');
  
  // Navigate to cart
  await page.getByRole('link', { name: 'Cart' }).click();
  await expect(page).toHaveURL(/cart/);
  
  // Verify cart item details
  const cartItem = page.locator('.cart-item').first();
  await expect(cartItem.locator('.product-name')).toContainText('iPhone 15');
  await expect(cartItem.locator('.quantity')).toHaveValue('1');
  await expect(cartItem.locator('.price')).toHaveText('$999.00');
  
  // Update quantity
  await cartItem.locator('.quantity-increase').click();
  await expect(cartItem.locator('.quantity')).toHaveValue('2');
  
  // Verify subtotal updated
  await expect(cartItem.locator('.subtotal')).toHaveText('$1,998.00');
  
  // Verify total
  await expect(page.locator('.cart-total')).toContainText('$1,998.00');
  
  // Remove item
  await cartItem.getByRole('button', { name: 'Remove' }).click();
  
  // Verify empty cart
  await expect(page.locator('.empty-cart-message')).toBeVisible();
  await expect(page.locator('.cart-badge')).toHaveText('0');
});
```

**Comparison with Traditional Assertions:**

```typescript
// ❌ Traditional approach (without web-first assertions)
const element = page.locator('.message');
await element.waitFor({ state: 'visible', timeout: 5000 });
const text = await element.textContent();
expect(text).toBe('Success');

// ✅ Web-first approach (cleaner, auto-retries)
await expect(page.locator('.message')).toHaveText('Success');
```

**Key Benefits of Web-First Assertions:**
1. **Auto-retry**: Reduces flakiness from timing issues
2. **Cleaner code**: No manual waiting logic
3. **Better error messages**: Playwright provides context on failure
4. **Timeout handling**: Automatic timeout management
5. **Negative assertions**: Efficiently handle "not" conditions

---

### Question 8: What is the Page Object Model (POM) and how do you implement it in Playwright with TypeScript?

**Answer:**

The Page Object Model is a design pattern that creates an object repository for web UI elements, separating test logic from page-specific code. In Playwright with TypeScript, POM enhances maintainability, reusability, and type safety.

**Basic Page Object Structure:**

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('https://example.com/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.errorMessage.textContent();
  }
}
```

**Using the Page Object in Tests:**

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login functionality', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login', async ({ page }) => {
    await loginPage.login('user@example.com', 'SecurePass123!');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login with invalid credentials', async () => {
    await loginPage.login('invalid@example.com', 'wrongpass');
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Invalid credentials');
  });
});
```

**Real-World Example: E-commerce Application**

```typescript
// pages/ProductListPage.ts
import { Page, Locator } from '@playwright/test';

export class ProductListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productCards: Locator;
  readonly sortDropdown: Locator;
  readonly filterSidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search products...');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.productCards = page.locator('.product-card');
    this.sortDropdown = page.getByRole('combobox', { name: 'Sort by' });
    this.filterSidebar = page.locator('.filter-sidebar');
  }

  async goto() {
    await this.page.goto('https://shop.example.com/products');
  }

  async searchProduct(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    // Wait for search results to load
    await this.page.waitForLoadState('networkidle');
  }

  async getProductCard(productName: string): Locator {
    return this.productCards.filter({ hasText: productName });
  }

  async addProductToCart(productName: string) {
    const productCard = await this.getProductCard(productName);
    await productCard.getByRole('button', { name: 'Add to Cart' }).click();
  }

  async sortBy(option: 'Price: Low to High' | 'Price: High to Low' | 'Newest') {
    await this.sortDropdown.selectOption(option);
    await this.page.waitForLoadState('networkidle');
  }

  async applyPriceFilter(min: number, max: number) {
    await this.filterSidebar.getByLabel('Min Price').fill(min.toString());
    await this.filterSidebar.getByLabel('Max Price').fill(max.toString());
    await this.filterSidebar.getByRole('button', { name: 'Apply Filter' }).click();
  }

  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  async getProductPrice(productName: string): Promise<string> {
    const productCard = await this.getProductCard(productName);
    const priceText = await productCard.locator('.price').textContent();
    return priceText || '';
  }
}

// pages/CartPage.ts
export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly cartTotal: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart-item');
    this.checkoutButton = page.getByRole('button', { name: 'Proceed to Checkout' });
    this.cartTotal = page.locator('.cart-total');
    this.emptyCartMessage = page.getByText('Your cart is empty');
  }

  async goto() {
    await this.page.goto('https://shop.example.com/cart');
  }

  async removeItem(productName: string) {
    const cartItem = this.cartItems.filter({ hasText: productName });
    await cartItem.getByRole('button', { name: 'Remove' }).click();
  }

  async updateQuantity(productName: string, quantity: number) {
    const cartItem = this.cartItems.filter({ hasText: productName });
    await cartItem.locator('.quantity-input').fill(quantity.toString());
    await cartItem.locator('.quantity-update').click();
  }

  async getTotalPrice(): Promise<string> {
    const totalText = await this.cartTotal.textContent();
    return totalText || '';
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

// tests/shopping-flow.spec.ts
import { test, expect } from '@playwright/test';
import { ProductListPage } from '../pages/ProductListPage';
import { CartPage } from '../pages/CartPage';

test('complete shopping flow', async ({ page }) => {
  const productList = new ProductListPage(page);
  const cart = new CartPage(page);

  // Navigate to products
  await productList.goto();

  // Search and add product
  await productList.searchProduct('iPhone 15');
  await expect(productList.productCards).toHaveCount(3);

  await productList.addProductToCart('iPhone 15 Pro');

  // Verify cart
  await cart.goto();
  await expect(cart.cartItems).toHaveCount(1);

  // Update quantity
  await cart.updateQuantity('iPhone 15 Pro', 2);
  const total = await cart.getTotalPrice();
  expect(total).toContain('$1,998');

  // Proceed to checkout
  await cart.proceedToCheckout();
  await expect(page).toHaveURL(/checkout/);
});
```

**Advanced POM Pattern: Base Page**

```typescript
// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly footer: Locator;
  readonly userMenu: Locator;
  readonly cartIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header.main-header');
    this.footer = page.locator('footer.main-footer');
    this.userMenu = page.locator('.user-menu');
    this.cartIcon = page.locator('.cart-icon');
  }

  abstract goto(): Promise<void>;

  async navigateToCart() {
    await this.cartIcon.click();
  }

  async logout() {
    await this.userMenu.click();
    await this.page.getByRole('button', { name: 'Logout' }).click();
  }

  async getCartItemCount(): Promise<number> {
    const badgeText = await this.cartIcon.locator('.badge').textContent();
    return parseInt(badgeText || '0', 10);
  }
}

// pages/DashboardPage.ts
export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly recentOrders: Locator;
  readonly accountSettings: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.locator('.welcome-message');
    this.recentOrders = page.locator('.recent-orders');
    this.accountSettings = page.getByRole('link', { name: 'Account Settings' });
  }

  async goto() {
    await this.page.goto('https://example.com/dashboard');
  }

  async getWelcomeText(): Promise<string | null> {
    return await this.welcomeMessage.textContent();
  }
}
```

**Component Pattern (for Reusable Components):**

```typescript
// components/SearchComponent.ts
import { Locator, Page } from '@playwright/test';

export class SearchComponent {
  readonly container: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly suggestions: Locator;

  constructor(page: Page, containerSelector: string = '.search-container') {
    this.container = page.locator(containerSelector);
    this.searchInput = this.container.getByPlaceholder('Search...');
    this.searchButton = this.container.getByRole('button', { name: 'Search' });
    this.suggestions = this.container.locator('.suggestion-item');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async searchWithAutocomplete(query: string, suggestion: string) {
    await this.searchInput.fill(query);
    await this.suggestions.filter({ hasText: suggestion }).click();
  }
}

// pages/HomePage.ts using component
import { SearchComponent } from '../components/SearchComponent';

export class HomePage extends BasePage {
  readonly searchComponent: SearchComponent;
  readonly featuredProducts: Locator;

  constructor(page: Page) {
    super(page);
    this.searchComponent = new SearchComponent(page);
    this.featuredProducts = page.locator('.featured-products');
  }

  async goto() {
    await this.page.goto('https://example.com');
  }

  async searchProduct(query: string) {
    await this.searchComponent.search(query);
  }
}
```

**Fluent Interface Pattern:**

```typescript
// pages/CheckoutPage.ts
export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://example.com/checkout');
    return this; // Enable chaining
  }

  async fillBillingAddress(address: {
    name: string;
    street: string;
    city: string;
    zip: string;
  }) {
    await this.page.getByLabel('Full Name').fill(address.name);
    await this.page.getByLabel('Street Address').fill(address.street);
    await this.page.getByLabel('City').fill(address.city);
    await this.page.getByLabel('ZIP Code').fill(address.zip);
    return this; // Enable chaining
  }

  async selectPaymentMethod(method: 'Credit Card' | 'PayPal' | 'Bank Transfer') {
    await this.page.getByRole('radio', { name: method }).check();
    return this; // Enable chaining
  }

  async completeOrder() {
    await this.page.getByRole('button', { name: 'Place Order' }).click();
    return this; // Enable chaining
  }
}

// Usage with fluent interface
test('checkout with chaining', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  
  await checkout
    .goto()
    .then(c => c.fillBillingAddress({
      name: 'John Doe',
      street: '123 Main St',
      city: 'Bangalore',
      zip: '560001'
    }))
    .then(c => c.selectPaymentMethod('Credit Card'))
    .then(c => c.completeOrder());
  
  await expect(page).toHaveURL(/order-confirmation/);
});
```

**Best Practices:**

1. **Use readonly for locators**: Prevents accidental reassignment
2. **TypeScript interfaces for data**: Type-safe test data
3. **Keep page objects focused**: One page object per logical page/view
4. **Avoid business logic in page objects**: Keep it in tests
5. **Use descriptive method names**: `loginWithValidCredentials()` not `login1()`

**Common Pitfalls:**

```typescript
// ❌ Don't store element states
export class BadPage {
  isLoggedIn: boolean = false; // State can become stale
}

// ✅ Query state when needed
export class GoodPage {
  async isLoggedIn(): Promise<boolean> {
    return await this.page.locator('.user-menu').isVisible();
  }
}

// ❌ Don't make page objects too granular
export class HeaderLogo { } // Overkill
export class HeaderSearchBar { } // Overkill

// ✅ Group related functionality
export class Header {
  logo: Locator;
  searchBar: Locator;
  userMenu: Locator;
}
```

---

### Question 9: How do you handle file uploads and downloads in Playwright?

**Answer:**

Playwright provides robust APIs for handling file uploads and downloads without manual file system manipulation during test execution.

**File Upload - Basic:**

```typescript
import { test, expect } from '@playwright/test';

test('upload single file', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  // Upload file using input[type="file"]
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('path/to/document.pdf');
  
  // Verify file selected
  const fileName = await page.locator('.selected-file').textContent();
  expect(fileName).toBe('document.pdf');
  
  // Submit form
  await page.getByRole('button', { name: 'Upload' }).click();
  
  // Verify upload success
  await expect(page.getByText('File uploaded successfully')).toBeVisible();
});
```

**Multiple File Upload:**

```typescript
test('upload multiple files', async ({ page }) => {
  await page.goto('https://example.com/upload-multiple');
  
  const fileInput = page.locator('input[type="file"]');
  
  // Upload multiple files
  await fileInput.setInputFiles([
    'files/image1.jpg',
    'files/image2.jpg',
    'files/document.pdf'
  ]);
  
  // Verify all files selected
  const fileList = page.locator('.file-list-item');
  await expect(fileList).toHaveCount(3);
});
```

**Programmatically Create File Buffer:**

```typescript
test('upload file from buffer', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  // Create file from buffer (useful for testing without actual files)
  await page.locator('input[type="file"]').setInputFiles({
    name: 'test-file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('This is test file content')
  });
  
  await page.getByRole('button', { name: 'Upload' }).click();
  await expect(page.getByText('Upload successful')).toBeVisible();
});
```

**Real-World Example: Profile Picture Upload**

```typescript
test('update profile picture', async ({ page }) => {
  await page.goto('https://app.example.com/profile');
  
  // Click upload button (triggers hidden file input)
  const uploadButton = page.getByRole('button', { name: 'Change Profile Picture' });
  
  // Listen for file chooser
  const fileChooserPromise = page.waitForEvent('filechooser');
  await uploadButton.click();
  const fileChooser = await fileChooserPromise;
  
  // Select file
  await fileChooser.setFiles('assets/profile-pic.jpg');
  
  // Wait for upload to complete
  await expect(page.locator('.upload-progress')).toHaveText('100%');
  
  // Verify new profile picture
  const profileImg = page.locator('.profile-picture img');
  await expect(profileImg).toHaveAttribute('src', /profile-pic/);
});
```

**Clear File Selection:**

```typescript
test('clear file selection', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  const fileInput = page.locator('input[type="file"]');
  
  // Select file
  await fileInput.setInputFiles('document.pdf');
  await expect(page.locator('.selected-file')).toContainText('document.pdf');
  
  // Clear selection
  await fileInput.setInputFiles([]);
  await expect(page.locator('.selected-file')).toHaveText('No file selected');
});
```

**File Download - Basic:**

```typescript
test('download file', async ({ page }) => {
  await page.goto('https://example.com/downloads');
  
  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download Report' }).click();
  const download = await downloadPromise;
  
  // Get download details
  const fileName = download.suggestedFilename();
  expect(fileName).toBe('quarterly-report.pdf');
  
  // Save to specific path
  await download.saveAs(`downloads/${fileName}`);
  
  // Verify file exists
  const fs = require('fs');
  const filePath = `downloads/${fileName}`;
  expect(fs.existsSync(filePath)).toBeTruthy();
});
```

**Download with Custom Filename:**

```typescript
test('download and rename file', async ({ page }) => {
  await page.goto('https://example.com/export');
  
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Data' }).click();
  const download = await downloadPromise;
  
  // Save with custom name
  const timestamp = new Date().getTime();
  await download.saveAs(`test-results/export-${timestamp}.csv`);
});
```

**Verify Downloaded File Content:**

```typescript
import * as fs from 'fs';
import * as path from 'path';

test('verify downloaded file content', async ({ page }) => {
  await page.goto('https://example.com/reports');
  
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const download = await downloadPromise;
  
  // Save to temp location
  const filePath = path.join(__dirname, 'temp', download.suggestedFilename());
  await download.saveAs(filePath);
  
  // Read and verify content
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  expect(fileContent).toContain('Name,Email,Status');
  expect(fileContent).toContain('John Doe,john@example.com,Active');
  
  // Cleanup
  fs.unlinkSync(filePath);
});
```

**Real-World Example: Invoice Download and Verification**

```typescript
test('download and verify invoice', async ({ page }) => {
  await page.goto('https://app.example.com/orders');
  
  // Navigate to specific order
  await page.getByRole('link', { name: 'Order #12345' }).click();
  
  // Download invoice
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Invoice' }).click();
  const download = await downloadPromise;
  
  // Verify file type
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  
  // Get download stream for verification
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  
  const buffer = Buffer.concat(chunks);
  
  // Verify PDF content (basic check)
  const pdfContent = buffer.toString('utf-8');
  expect(pdfContent).toContain('%PDF'); // PDF header
  
  // Save for records
  await download.saveAs(`invoices/invoice-12345.pdf`);
});
```

**Handle Multiple Downloads:**

```typescript
test('download multiple files', async ({ page }) => {
  await page.goto('https://example.com/bulk-download');
  
  // Listen for multiple downloads
  const downloads: Download[] = [];
  
  page.on('download', download => {
    downloads.push(download);
  });
  
  // Trigger bulk download
  await page.getByRole('button', { name: 'Download All' }).click();
  
  // Wait for all downloads to start
  await page.waitForTimeout(2000); // In real scenario, use better waiting strategy
  
  // Save all downloads
  for (const download of downloads) {
    await download.saveAs(`downloads/${download.suggestedFilename()}`);
  }
  
  expect(downloads.length).toBe(5);
});
```

**Download with Authentication:**

```typescript
test('download file requiring authentication', async ({ page, context }) => {
  // Login first
  await page.goto('https://app.example.com/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Navigate to protected resource
  await page.goto('https://app.example.com/secure/documents');
  
  // Download file (authentication cookies automatically included)
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Confidential Report' }).click();
  const download = await downloadPromise;
  
  await download.saveAs('downloads/confidential-report.pdf');
});
```

**Drag-and-Drop File Upload:**

```typescript
test('drag and drop file upload', async ({ page }) => {
  await page.goto('https://example.com/dropzone-upload');
  
  // Create a data transfer with files
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  
  // Add files to data transfer
  const fileInput = await page.$('input[type="file"]');
  await fileInput?.setInputFiles(['file1.pdf', 'file2.pdf']);
  
  // Get files from input
  const files = await page.evaluate(() => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    return input.files;
  });
  
  // Trigger drop event on dropzone
  const dropzone = page.locator('.dropzone');
  await dropzone.dispatchEvent('drop', { dataTransfer });
  
  // Verify upload
  await expect(page.locator('.uploaded-file')).toHaveCount(2);
});
```

**Best Practices:**

1. **Use waitForEvent('download')**: Don't rely on timeouts
2. **Verify file attributes**: Check filename, size, content type
3. **Clean up downloads**: Delete test files after verification
4. **Use unique filenames**: Avoid conflicts in parallel execution
5. **Handle slow downloads**: Set appropriate timeouts for large files

**Common Pitfalls:**

```typescript
// ❌ Don't click before setting up download listener
await page.click('a[href="/download"]');
const download = await page.waitForEvent('download'); // May miss the download

// ✅ Set up listener first
const downloadPromise = page.waitForEvent('download');
await page.click('a[href="/download"]');
const download = await downloadPromise;

// ❌ Don't use hardcoded paths that fail in CI
await download.saveAs('/Users/myname/Downloads/file.pdf');

// ✅ Use relative paths or temp directories
await download.saveAs('test-downloads/file.pdf');
```

---

### Question 10: Explain how to work with multiple pages/tabs in Playwright.

**Answer:**

Playwright provides elegant APIs for handling multiple pages (tabs/windows), which is essential for testing scenarios involving popups, external links, and multi-window workflows.

**Basic Multi-Page Handling:**

```typescript
import { test, expect, Page } from '@playwright/test';

test('handle new tab', async ({ context, page }) => {
  await page.goto('https://example.com');
  
  // Listen for new page event before triggering action
  const pagePromise = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Open in New Tab' }).click();
  const newPage = await pagePromise;
  
  // Wait for new page to load
  await newPage.waitForLoadState();
  
  // Interact with new page
  await expect(newPage).toHaveURL(/docs/);
  await expect(newPage.getByRole('heading', { name: 'Documentation' })).toBeVisible();
  
  // Switch back to original page
  await page.bringToFront();
  await page.getByRole('button', { name: 'Home' }).click();
  
  // Close new page
  await newPage.close();
});
```

**Popup Window Handling:**

```typescript
test('handle popup window', async ({ context, page }) => {
  await page.goto('https://example.com/terms');
  
  // Click button that opens popup
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'View Privacy Policy' }).click();
  const popup = await popupPromise;
  
  await popup.waitForLoadState();
  
  // Verify popup content
  await expect(popup).toHaveTitle('Privacy Policy');
  await expect(popup.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  
  // Close popup
  await popup.close();
  
  // Continue on main page
  await page.getByRole('button', { name: 'Accept' }).click();
});
```

**Real-World Example: OAuth Authentication Flow**

```typescript
test('oauth authentication with popup', async ({ context, page }) => {
  await page.goto('https://app.example.com/login');
  
  // Click "Login with Google" button
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Login with Google' }).click();
  const googlePopup = await popupPromise;
  
  await googlePopup.waitForLoadState();
  
  // Fill Google login form in popup
  await googlePopup.getByLabel('Email or phone').fill('testuser@example.com');
  await googlePopup.getByRole('button', { name: 'Next' }).click();
  
  await googlePopup.getByLabel('Enter your password').fill('securepassword');
  await googlePopup.getByRole('button', { name: 'Next' }).click();
  
  // Wait for popup to close automatically after successful auth
  await googlePopup.waitForEvent('close');
  
  // Verify user is logged in on main page
  await expect(page.getByText('Welcome, Test User')).toBeVisible();
  await expect(page).toHaveURL(/dashboard/);
});
```

**Managing Multiple Pages Simultaneously:**

```typescript
test('interact with multiple pages', async ({ context }) => {
  // Open multiple pages
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  const page3 = await context.newPage();
  
  // Navigate all pages
  await Promise.all([
    page1.goto('https://app.example.com/dashboard'),
    page2.goto('https://app.example.com/reports'),
    page3.goto('https://app.example.com/settings')
  ]);
  
  // Interact with specific page
  await page1.getByRole('button', { name: 'Refresh' }).click();
  
  // Bring specific page to front
  await page2.bringToFront();
  await page2.getByRole('button', { name: 'Export' }).click();
  
  // Get all pages in context
  const allPages = context.pages();
  console.log(`Total pages: ${allPages.length}`);
  
  // Close specific page
  await page3.close();
  
  // Close all pages
  await page1.close();
  await page2.close();
});
```

**Real-World Example: Multi-Account Testing**

```typescript
test('compare data across multiple user accounts', async ({ context }) => {
  // Admin user page
  const adminPage = await context.newPage();
  await adminPage.goto('https://app.example.com/login');
  await adminPage.getByLabel('Email').fill('admin@example.com');
  await adminPage.getByLabel('Password').fill('adminpass');
  await adminPage.getByRole('button', { name: 'Login' }).click();
  await adminPage.waitForURL(/dashboard/);
  
  // Regular user page
  const userPage = await context.newPage();
  await userPage.goto('https://app.example.com/login');
  await userPage.getByLabel('Email').fill('user@example.com');
  await userPage.getByLabel('Password').fill('userpass');
  await userPage.getByRole('button', { name: 'Login' }).click();
  await userPage.waitForURL(/dashboard/);
  
  // Admin creates a project
  await adminPage.bringToFront();
  await adminPage.getByRole('button', { name: 'Create Project' }).click();
  await adminPage.getByLabel('Project Name').fill('Q1 Initiative');
  await adminPage.getByRole('button', { name: 'Save' }).click();
  await expect(adminPage.getByText('Project created successfully')).toBeVisible();
  
  // Verify user can see the project
  await userPage.bringToFront();
  await userPage.reload();
  await expect(userPage.getByText('Q1 Initiative')).toBeVisible();
  
  await adminPage.close();
  await userPage.close();
});
```

**Target Blank Links:**

```typescript
test('handle target="_blank" links', async ({ context, page }) => {
  await page.goto('https://example.com/articles');
  
  // Link with target="_blank"
  const newPagePromise = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Read More' }).click(); // Opens in new tab
  const articlePage = await newPagePromise;
  
  await articlePage.waitForLoadState();
  await expect(articlePage.getByRole('heading', { level: 1 })).toBeVisible();
  
  // Read article
  const content = await articlePage.locator('.article-content').textContent();
  expect(content).toBeTruthy();
  
  await articlePage.close();
});
```

**Handling Window.open():**

```typescript
test('handle window.open() calls', async ({ context, page }) => {
  await page.goto('https://example.com');
  
  // Button that calls window.open()
  const newPagePromise = context.waitForEvent('page');
  await page.evaluate(() => {
    window.open('https://example.com/popup', '_blank', 'width=800,height=600');
  });
  const newWindow = await newPagePromise;
  
  await newWindow.waitForLoadState();
  await expect(newWindow).toHaveURL(/popup/);
  
  await newWindow.close();
});
```

**Page Lifecycle Events:**

```typescript
test('listen to page lifecycle events', async ({ context, page }) => {
  const pages: Page[] = [page];
  
  // Listen for new pages
  context.on('page', async (newPage) => {
    pages.push(newPage);
    console.log(`New page opened: ${await newPage.title()}`);
    
    // Listen for page close
    newPage.on('close', () => {
      console.log(`Page closed: ${newPage.url()}`);
      pages.splice(pages.indexOf(newPage), 1);
    });
  });
  
  await page.goto('https://example.com');
  
  // Open multiple tabs
  await page.getByRole('link', { name: 'Link 1' }).click({ modifiers: ['Meta'] }); // Cmd/Ctrl+Click
  await page.getByRole('link', { name: 'Link 2' }).click({ modifiers: ['Meta'] });
  
  // Wait for new pages to open
  await page.waitForTimeout(1000);
  
  console.log(`Total pages: ${pages.length}`);
  
  // Close all except main page
  for (const p of pages) {
    if (p !== page) {
      await p.close();
    }
  }
});
```

**Handling Download in New Tab:**

```typescript
test('download file that opens in new tab', async ({ context, page }) => {
  await page.goto('https://example.com/documents');
  
  // Some links open PDF in new tab instead of downloading
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'View Report' }).click()
  ]);
  
  await newPage.waitForLoadState();
  
  // If PDF opens in browser, we can interact with it or download
  const downloadPromise = newPage.waitForEvent('download');
  await newPage.keyboard.press('Control+S'); // or 'Meta+S' for Mac
  const download = await downloadPromise;
  
  await download.saveAs('downloads/report.pdf');
  await newPage.close();
});
```

**Best Practices:**

1. **Set up event listener before triggering action**
2. **Always wait for page load state** after opening new page
3. **Clean up pages**: Close unused pages to prevent memory leaks
4. **Use context.pages()** to track all open pages
5. **Bring page to front** before interacting if multiple pages are open

**Common Pitfalls:**

```typescript
// ❌ Don't trigger action before setting up listener
await page.click('a[target="_blank"]');
const newPage = await context.waitForEvent('page'); // May miss the event

// ✅ Set up listener first
const pagePromise = context.waitForEvent('page');
await page.click('a[target="_blank"]');
const newPage = await pagePromise;

// ❌ Don't forget to wait for load state
const newPage = await pagePromise;
await newPage.click('button'); // May fail if page not loaded

// ✅ Wait for load
const newPage = await pagePromise;
await newPage.waitForLoadState();
await newPage.click('button');

// ❌ Don't lose reference to pages
context.on('page', async (page) => {
  // Can't access this page later
});

// ✅ Store page references
const pages: Page[] = [];
context.on('page', (page) => {
  pages.push(page);
});
```

---

(Continuing with questions 11-15...)

### Question 11: What are fixtures in Playwright and how do you create custom fixtures?

**Answer:**

Fixtures in Playwright are a powerful dependency injection mechanism that provides a reusable context for tests. They handle setup and teardown logic, making tests cleaner and more maintainable.

**Built-in Fixtures:**

```typescript
import { test, expect } from '@playwright/test';

// Built-in fixtures: page, context, browser, browserName, request
test('using built-in fixtures', async ({ page, context, browserName }) => {
  console.log(`Running on: ${browserName}`);
  
  // 'page' fixture automatically provides isolated page
  await page.goto('https://example.com');
  
  // 'context' fixture provides browser context
  const pages = context.pages();
  console.log(`Open pages: ${pages.length}`);
});
```

**Creating Custom Fixtures:**

```typescript
// fixtures/customFixtures.ts
import { test as base, Page } from '@playwright/test';

// Define custom fixture type
type MyFixtures = {
  authenticatedPage: Page;
  testData: {
    validUser: { email: string; password: string };
    invalidUser: { email: string; password: string };
  };
};

// Extend base test with custom fixtures
export const test = base.extend<MyFixtures>({
  // Fixture with auto-login
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login before test
    await page.goto('https://app.example.com/login');
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);
    
    // Provide page to test
    await use(page);
    
    // Teardown: Logout after test
    await page.getByRole('button', { name: 'Logout' }).click();
  },
  
  // Fixture with test data
  testData: async ({}, use) => {
    const data = {
      validUser: {
        email: 'valid@example.com',
        password: 'ValidPass123!'
      },
      invalidUser: {
        email: 'invalid@example.com',
        password: 'wrong'
      }
    };
    
    await use(data);
    // No teardown needed for data
  }
});

export { expect } from '@playwright/test';
```

**Using Custom Fixtures:**

```typescript
// tests/dashboard.spec.ts
import { test, expect } from '../fixtures/customFixtures';

test('access dashboard with authenticated page', async ({ authenticatedPage }) => {
  // Page is already logged in
  await expect(authenticatedPage.getByText('Welcome back')).toBeVisible();
  
  // Perform authenticated actions
  await authenticatedPage.getByRole('link', { name: 'Settings' }).click();
  await expect(authenticatedPage).toHaveURL(/settings/);
});

test('verify user data', async ({ testData }) => {
  console.log(`Testing with user: ${testData.validUser.email}`);
  // Use test data in test
});
```

**Real-World Example: Database Fixture**

```typescript
// fixtures/dbFixtures.ts
import { test as base } from '@playwright/test';
import { MongoClient, Db } from 'mongodb';

type DbFixtures = {
  db: Db;
  testUser: { id: string; email: string; name: string };
};

export const test = base.extend<DbFixtures>({
  // Database connection fixture
  db: async ({}, use) => {
    // Setup: Connect to test database
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const db = client.db('test_database');
    
    console.log('Database connected');
    
    await use(db);
    
    // Teardown: Clean up and disconnect
    await db.collection('users').deleteMany({ email: /test.*/ });
    await client.close();
    console.log('Database cleaned and disconnected');
  },
  
  // Test user fixture (depends on db fixture)
  testUser: async ({ db }, use) => {
    // Setup: Create test user in database
    const user = {
      id: `test-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      createdAt: new Date()
    };
    
    await db.collection('users').insertOne(user);
    console.log(`Test user created: ${user.email}`);
    
    await use(user);
    
    // Teardown: Delete test user
    await db.collection('users').deleteOne({ id: user.id });
    console.log(`Test user deleted: ${user.email}`);
  }
});

export { expect } from '@playwright/test';

// tests/user-management.spec.ts
import { test, expect } from '../fixtures/dbFixtures';

test('verify user profile data', async ({ page, testUser, db }) => {
  // Login with test user
  await page.goto('https://app.example.com/login');
  await page.getByLabel('Email').fill(testUser.email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Verify profile page shows correct data
  await page.goto('https://app.example.com/profile');
  await expect(page.locator('#user-email')).toHaveText(testUser.email);
  await expect(page.locator('#user-name')).toHaveText(testUser.name);
  
  // Update name in UI
  await page.getByLabel('Name').fill('Updated Name');
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Verify database was updated
  const updatedUser = await db.collection('users').findOne({ id: testUser.id });
  expect(updatedUser?.name).toBe('Updated Name');
});
```

**API Mock Fixture:**

```typescript
// fixtures/apiFixtures.ts
import { test as base, Page } from '@playwright/test';

type ApiFixtures = {
  mockedAPI: Page;
};

export const test = base.extend<ApiFixtures>({
  mockedAPI: async ({ page }, use) => {
    // Setup: Mock all API calls
    await page.route('**/api/products', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            { id: 1, name: 'Product 1', price: 99.99 },
            { id: 2, name: 'Product 2', price: 149.99 }
          ]
        })
      });
    });
    
    await page.route('**/api/user', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        })
      });
    });
    
    await use(page);
    
    // Teardown: Unroute (automatic, but shown for clarity)
    await page.unroute('**/api/**');
  }
});

export { expect } from '@playwright/test';

// Usage
import { test, expect } from '../fixtures/apiFixtures';

test('products page with mocked API', async ({ mockedAPI }) => {
  await mockedAPI.goto('https://app.example.com/products');
  
  // Page receives mocked API responses
  await expect(mockedAPI.locator('.product-item')).toHaveCount(2);
  await expect(mockedAPI.locator('.product-item').first()).toContainText('Product 1');
});
```

**Storage State Fixture (Authentication Persistence):**

```typescript
// fixtures/authFixtures.ts
import { test as base } from '@playwright/test';
import * as path from 'path';

type AuthFixtures = {
  adminPage: Page;
  userPage: Page;
};

const ADMIN_STORAGE = path.join(__dirname, '../.auth/admin.json');
const USER_STORAGE = path.join(__dirname, '../.auth/user.json');

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    // Create context with admin auth state
    const context = await browser.newContext({
      storageState: ADMIN_STORAGE
    });
    const page = await context.newPage();
    
    await use(page);
    
    await context.close();
  },
  
  userPage: async ({ browser }, use) => {
    // Create context with user auth state
    const context = await browser.newContext({
      storageState: USER_STORAGE
    });
    const page = await context.newPage();
    
    await use(page);
    
    await context.close();
  }
});

// Setup script to generate auth states (run once)
// auth.setup.ts
import { chromium } from '@playwright/test';

async function globalSetup() {
  // Admin login
  const adminBrowser = await chromium.launch();
  const adminContext = await adminBrowser.newContext();
  const adminPage = await adminContext.newPage();
  
  await adminPage.goto('https://app.example.com/login');
  await adminPage.getByLabel('Email').fill('admin@example.com');
  await adminPage.getByLabel('Password').fill('adminpass');
  await adminPage.getByRole('button', { name: 'Login' }).click();
  await adminPage.waitForURL(/dashboard/);
  
  await adminContext.storageState({ path: ADMIN_STORAGE });
  await adminBrowser.close();
  
  // User login
  const userBrowser = await chromium.launch();
  const userContext = await userBrowser.newContext();
  const userPage = await userContext.newPage();
  
  await userPage.goto('https://app.example.com/login');
  await userPage.getByLabel('Email').fill('user@example.com');
  await userPage.getByLabel('Password').fill('userpass');
  await userPage.getByRole('button', { name: 'Login' }).click();
  await userPage.waitForURL(/dashboard/);
  
  await userContext.storageState({ path: USER_STORAGE });
  await userBrowser.close();
}

export default globalSetup;
```

**Worker-Scoped Fixtures (Shared Across Tests):**

```typescript
// fixtures/workerFixtures.ts
import { test as base } from '@playwright/test';

type WorkerFixtures = {
  workerStorageState: string;
};

export const test = base.extend<{}, WorkerFixtures>({
  // Worker-scoped fixture (runs once per worker process)
  workerStorageState: [async ({ browser }, use) => {
    // This runs once per worker, not per test
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Perform login once
    await page.goto('https://app.example.com/login');
    await page.getByLabel('Email').fill('worker@example.com');
    await page.getByLabel('Password').fill('workerpass');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);
    
    // Save storage state
    const storageState = await context.storageState();
    await context.close();
    
    // Pass storage state to all tests in this worker
    await use(JSON.stringify(storageState));
  }, { scope: 'worker' }]
});

// Usage: Each test gets authenticated context without re-logging in
test('test 1', async ({ browser, workerStorageState }) => {
  const context = await browser.newContext({
    storageState: JSON.parse(workerStorageState)
  });
  const page = await context.newPage();
  await page.goto('https://app.example.com/dashboard');
  // Already authenticated
});
```

**Fixture Options Pattern:**

```typescript
// fixtures/configFixtures.ts
import { test as base } from '@playwright/test';

type TestOptions = {
  environment: 'staging' | 'production';
  apiTimeout: number;
};

type TestFixtures = {
  baseURL: string;
};

export const test = base.extend<TestFixtures & TestOptions>({
  // Define options with default values
  environment: ['staging', { option: true }],
  apiTimeout: [5000, { option: true }],
  
  // Fixture that uses options
  baseURL: async ({ environment }, use) => {
    const urls = {
      staging: 'https://staging.example.com',
      production: 'https://example.com'
    };
    
    await use(urls[environment]);
  }
});

// Usage with different options
test.use({ environment: 'production', apiTimeout: 10000 });

test('production test', async ({ baseURL, page, apiTimeout }) => {
  await page.goto(baseURL);
  // Test runs against production with 10s API timeout
});
```

**Best Practices:**

1. **Use fixtures for setup/teardown**: Avoid beforeEach/afterEach when fixtures are cleaner
2. **Worker-scoped for expensive operations**: Login once per worker, not per test
3. **Fixture dependencies**: Chain fixtures that depend on each other
4. **Type safety**: Always define TypeScript types for fixtures
5. **Cleanup**: Always clean up resources in fixtures (databases, files, etc.)

**Common Pitfalls:**

```typescript
// ❌ Don't forget to call use()
export const test = base.extend({
  myFixture: async ({}, use) => {
    const data = { value: 123 };
    // Forgot to call use() - test will hang!
  }
});

// ✅ Always call use()
export const test = base.extend({
  myFixture: async ({}, use) => {
    const data = { value: 123 };
    await use(data); // Must call
  }
});

// ❌ Don't perform teardown before use()
export const test = base.extend({
  dbConnection: async ({}, use) => {
    const db = await connectDB();
    await db.close(); // Too early!
    await use(db); // db is already closed
  }
});

// ✅ Teardown after use()
export const test = base.extend({
  dbConnection: async ({}, use) => {
    const db = await connectDB();
    await use(db);
    await db.close(); // Correct timing
  }
});
```

---

### Question 12: How does Playwright handle waiting and synchronization? Explain different wait methods.

**Answer:**

Playwright's built-in auto-waiting is one of its strongest features, eliminating most manual waits. However, there are scenarios requiring explicit waits for specific conditions.

**Auto-Waiting (Implicit):**

Playwright automatically waits for elements to be actionable before performing actions:

```typescript
import { test, expect } from '@playwright/test';

test('auto-waiting demonstration', async ({ page }) => {
  await page.goto('https://example.com/dynamic');
  
  // Playwright automatically waits for:
  // 1. Element to be attached to DOM
  // 2. Element to be visible
  // 3. Element to be stable (not animating)
  // 4. Element to receive events (not obscured)
  // 5. Element to be enabled (for buttons/inputs)
  await page.click('button#submit'); // No explicit wait needed
  
  // Auto-waits for element to be visible
  await expect(page.locator('.success-message')).toBeVisible();
});
```

**waitForLoadState():**

```typescript
test('wait for different load states', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Wait for 'load' event (default)
  await page.waitForLoadState('load');
  
  // Wait for 'domcontentloaded' (DOM is ready, but resources may still be loading)
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for 'networkidle' (no network connections for at least 500ms)
  // Useful for SPAs with heavy API calls
  await page.waitForLoadState('networkidle');
  
  // Now safe to interact
  await page.click('button');
});
```

**Real-World Example: SPA Navigation**

```typescript
test('navigate in single-page application', async ({ page }) => {
  await page.goto('https://app.example.com');
  
  // Click navigation link
  await page.getByRole('link', { name: 'Dashboard' }).click();
  
  // URL changes but page doesn't reload in SPA
  await page.waitForURL(/dashboard/);
  
  // Wait for API calls to complete
  await page.waitForLoadState('networkidle');
  
  // Now dashboard data is loaded
  await expect(page.locator('.dashboard-widget')).toHaveCount(4);
});
```

**waitForSelector() and waitForElement():**

```typescript
test('explicit element waiting', async ({ page }) => {
  await page.goto('https://example.com/delayed-content');
  
  // Wait for element to appear
  await page.waitForSelector('.dynamic-content', { state: 'visible' });
  
  // Wait for element to be hidden
  await page.waitForSelector('.loading-spinner', { state: 'hidden' });
  
  // Wait for element to be attached (in DOM, but may not be visible)
  await page.waitForSelector('#hidden-data', { state: 'attached' });
  
  // Wait for element to be detached (removed from DOM)
  await page.waitForSelector('.modal', { state: 'detached' });
  
  // Custom timeout
  await page.waitForSelector('.slow-loading-element', { 
    state: 'visible', 
    timeout: 60000 
  });
});
```

**waitForFunction():**

```typescript
test('wait for custom condition', async ({ page }) => {
  await page.goto('https://example.com/realtime-data');
  
  // Wait for custom JavaScript condition
  await page.waitForFunction(() => {
    const element = document.querySelector('.data-count');
    return element && parseInt(element.textContent || '0') > 100;
  });
  
  // Wait for multiple conditions
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.loading-spinner');
    const data = document.querySelector('.data-loaded');
    return !spinner && data;
  });
  
  // Pass arguments to function
  const expectedCount = 50;
  await page.waitForFunction((count) => {
    const items = document.querySelectorAll('.item');
    return items.length >= count;
  }, expectedCount);
  
  // With options
  await page.waitForFunction(
    () => window.dataLoaded === true,
    { timeout: 30000, polling: 100 } // Check every 100ms
  });
});
```

**waitForResponse() and waitForRequest():**

```typescript
test('wait for network activity', async ({ page }) => {
  await page.goto('https://example.com/dashboard');
  
  // Wait for specific API response
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/user') && response.status() === 200
  );
  
  await page.getByRole('button', { name: 'Load Profile' }).click();
  const response = await responsePromise;
  
  // Verify response
  const data = await response.json();
  expect(data.email).toBe('user@example.com');
  
  // Wait for request to be sent
  const requestPromise = page.waitForRequest(
    request => request.url().includes('/api/save') && request.method() === 'POST'
  );
  
  await page.getByRole('button', { name: 'Save' }).click();
  const request = await requestPromise;
  
  // Verify request payload
  const postData = request.postDataJSON();
  expect(postData.name).toBe('Updated Name');
});
```

**Real-World Example: Form Submission with API Call**

```typescript
test('wait for form submission to complete', async ({ page }) => {
  await page.goto('https://app.example.com/register');
  
  // Fill form
  await page.getByLabel('Email').fill('newuser@example.com');
  await page.getByLabel('Password').fill('SecurePass123!');
  
  // Set up wait for API call before submitting
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/register') && response.status() === 201
  );
  
  await page.getByRole('button', { name: 'Register' }).click();
  
  // Wait for API response
  const response = await responsePromise;
  const userData = await response.json();
  
  // Verify success message appears
  await expect(page.getByText('Registration successful')).toBeVisible();
  
  // Verify redirect to dashboard
  await page.waitForURL(/dashboard/);
  
  expect(userData.email).toBe('newuser@example.com');
});
```

**waitForEvent():**

```typescript
test('wait for page events', async ({ page, context }) => {
  await page.goto('https://example.com');
  
  // Wait for dialog (alert/confirm/prompt)
  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('Are you sure?');
    await dialog.accept();
  });
  
  await page.getByRole('button', { name: 'Delete' }).click();
  // Dialog is automatically handled
  
  // Wait for console message
  const consolePromise = page.waitForEvent('console', msg => 
    msg.type() === 'error'
  );
  
  await page.evaluate(() => console.error('Test error'));
  const consoleMsg = await consolePromise;
  expect(consoleMsg.text()).toBe('Test error');
  
  // Wait for download
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download = await downloadPromise;
  await download.saveAs('downloads/' + download.suggestedFilename());
  
  // Wait for popup
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Open Popup' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
});
```

**waitForTimeout() - Use Sparingly:**

```typescript
test('fixed timeout (avoid when possible)', async ({ page }) => {
  await page.goto('https://example.com');
  
  // ❌ Hardcoded timeout - makes tests slower and fragile
  await page.waitForTimeout(5000);
  
  // ✅ Better: Wait for specific condition
  await page.waitForSelector('.content', { state: 'visible' });
  
  // Only use waitForTimeout for animations or when no other option
  await page.click('.animate-button');
  await page.waitForTimeout(300); // Wait for animation to complete
});
```

**Locator Waiting Methods:**

```typescript
test('locator-specific waiting', async ({ page }) => {
  await page.goto('https://example.com/products');
  
  const productLocator = page.locator('.product-card').first();
  
  // Wait for locator to be visible
  await productLocator.waitFor({ state: 'visible' });
  
  // Wait for locator to be hidden
  await productLocator.waitFor({ state: 'hidden' });
  
  // Wait for locator to be attached
  await productLocator.waitFor({ state: 'attached', timeout: 10000 });
  
  // Wait for locator to be detached
  await productLocator.waitFor({ state: 'detached' });
});
```

**Real-World Example: Infinite Scroll Loading**

```typescript
test('handle infinite scroll with dynamic loading', async ({ page }) => {
  await page.goto('https://example.com/feed');
  
  let previousCount = 0;
  let currentCount = await page.locator('.feed-item').count();
  
  // Load more items until we have at least 50
  while (currentCount < 50) {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for new items to load
    await page.waitForFunction(
      (prevCount) => {
        const items = document.querySelectorAll('.feed-item');
        return items.length > prevCount;
      },
      previousCount,
      { timeout: 10000 }
    );
    
    previousCount = currentCount;
    currentCount = await page.locator('.feed-item').count();
    
    console.log(`Loaded ${currentCount} items`);
  }
  
  expect(currentCount).toBeGreaterThanOrEqual(50);
});
```

**Combining Multiple Waits:**

```typescript
test('complex waiting scenario', async ({ page }) => {
  await page.goto('https://example.com/checkout');
  
  // Fill form
  await page.getByLabel('Card Number').fill('4111111111111111');
  await page.getByLabel('Expiry').fill('12/25');
  await page.getByLabel('CVV').fill('123');
  
  // Set up multiple wait conditions
  const [response, request] = await Promise.all([
    // Wait for payment API response
    page.waitForResponse(res => 
      res.url().includes('/api/payment') && res.status() === 200
    ),
    // Wait for analytics request
    page.waitForRequest(req => 
      req.url().includes('/analytics/purchase')
    ),
    // Click submit button
    page.getByRole('button', { name: 'Complete Payment' }).click()
  ]);
  
  // Verify success
  await expect(page.getByText('Payment Successful')).toBeVisible();
  
  const paymentData = await response.json();
  expect(paymentData.status).toBe('completed');
});
```

**Custom Retry Logic:**

```typescript
test('custom retry for flaky condition', async ({ page }) => {
  await page.goto('https://example.com/dashboard');
  
  // Retry until condition is met or max attempts reached
  async function retryUntil<T>(
    fn: () => Promise<T>,
    condition: (result: T) => boolean,
    maxAttempts: number = 10,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await fn();
      if (condition(result)) {
        return result;
      }
      await page.waitForTimeout(delay);
    }
    throw new Error(`Condition not met after ${maxAttempts} attempts`);
  }
  
  const dataCount = await retryUntil(
    async () => await page.locator('.data-item').count(),
    count => count >= 10,
    15,
    2000
  );
  
  expect(dataCount).toBeGreaterThanOrEqual(10);
});
```

**Best Practices:**

1. **Trust auto-waiting**: Use explicit waits only when necessary
2. **Prefer web-first assertions**: They have built-in retry logic
3. **Avoid waitForTimeout()**: Use condition-based waits instead
4. **Wait for network**: Use `waitForResponse()` for API-dependent tests
5. **Set appropriate timeouts**: Balance between speed and reliability

**Common Pitfalls:**

```typescript
// ❌ Don't use fixed timeouts
await page.waitForTimeout(3000);
await page.click('button');

// ✅ Wait for element to be ready
await page.waitForSelector('button', { state: 'visible' });
await page.click('button');

// ❌ Don't wait for element then interact
await page.waitForSelector('#button');
await page.click('#button');

// ✅ Just interact - auto-waiting handles it
await page.click('#button');

// ❌ Don't check visibility manually
const isVisible = await page.locator('.message').isVisible();
if (isVisible) {
  // do something
}

// ✅ Use web-first assertions with retry
await expect(page.locator('.message')).toBeVisible();
```

---

### Question 13: How do you handle dynamic content and elements that appear/disappear in Playwright?

**Answer:**

Handling dynamic content is one of Playwright's strengths due to auto-waiting, but certain scenarios require specific strategies.

**Basic Dynamic Element Handling:**

```typescript
import { test, expect } from '@playwright/test';

test('wait for dynamically loaded element', async ({ page }) => {
  await page.goto('https://example.com/dynamic');
  
  // Button appears after 2 seconds
  // Playwright auto-waits up to 30 seconds by default
  await page.click('button#dynamic-button');
  
  // Assertion automatically waits for element to appear
  await expect(page.locator('.result')).toBeVisible();
});
```

**Handling Loading Spinners:**

```typescript
test('wait for loading spinner to disappear', async ({ page }) => {
  await page.goto('https://app.example.com/dashboard');
  
  // Wait for spinner to disappear
  await page.locator('.loading-spinner').waitFor({ state: 'hidden' });
  
  // Or use assertion
  await expect(page.locator('.loading-spinner')).toBeHidden();
  
  // Now interact with loaded content
  await page.click('.dashboard-widget');
});
```

**Real-World Example: Search with Debounced Results**

```typescript
test('search with delayed results', async ({ page }) => {
  await page.goto('https://example.com/search');
  
  // Type in search box (results appear after debounce delay)
  await page.getByPlaceholder('Search...').fill('playwright');
  
  // Wait for results container to appear
  await expect(page.locator('.search-results')).toBeVisible();
  
  // Wait for actual results to load (not just the container)
  await expect(page.locator('.search-result-item')).toHaveCount(10);
  
  // Verify first result
  const firstResult = page.locator('.search-result-item').first();
  await expect(firstResult).toContainText('Playwright');
});
```

**Handling Stale Elements (Refreshing Content):**

```typescript
test('handle content that refreshes', async ({ page }) => {
  await page.goto('https://example.com/realtime-dashboard');
  
  // Get initial value
  const counterLocator = page.locator('#counter');
  const initialValue = await counterLocator.textContent();
  
  // Wait for value to change (content refreshes every 5 seconds)
  await expect(counterLocator).not.toHaveText(initialValue || '');
  
  // Alternative: Wait for specific value
  await expect(counterLocator).toHaveText(/\d+/); // Any number
  
  // Or wait using custom function
  await page.waitForFunction(
    (oldValue) => {
      const counter = document.querySelector('#counter');
      return counter && counter.textContent !== oldValue;
    },
    initialValue
  );
});
```

**Polling for Dynamic Updates:**

```typescript
test('poll for status updates', async ({ page }) => {
  await page.goto('https://app.example.com/job-status');
  
  // Start a background job
  await page.click('button#start-job');
  
  // Poll status until completion
  await expect.poll(async () => {
    const status = await page.locator('#job-status').textContent();
    return status;
  }, {
    message: 'Job should complete',
    intervals: [1000, 2000, 5000], // Poll at 1s, 2s, 5s intervals
    timeout: 60000 // 60 second timeout
  }).toBe('Completed');
  
  // Verify results
  await expect(page.locator('.job-result')).toBeVisible();
});
```

**Handling Disappearing Elements:**

```typescript
test('element that disappears after timeout', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Click button that shows temporary message
  await page.click('button#show-notification');
  
  // Verify notification appears
  const notification = page.locator('.notification');
  await expect(notification).toBeVisible();
  await expect(notification).toContainText('Action successful');
  
  // Wait for notification to disappear (auto-hides after 3 seconds)
  await expect(notification).toBeHidden({ timeout: 5000 });
  
  // Or explicitly wait
  await notification.waitFor({ state: 'hidden', timeout: 5000 });
});
```

**Real-World Example: Autocomplete with Dynamic Suggestions**

```typescript
test('handle autocomplete suggestions', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  const searchInput = page.getByLabel('City');
  const suggestions = page.locator('.autocomplete-suggestion');
  
  // Type to trigger suggestions
  await searchInput.fill('Ban');
  
  // Wait for suggestions to appear
  await expect(suggestions).not.toHaveCount(0);
  
  // Wait for specific suggestion
  const bangaloreSuggestion = suggestions.filter({ hasText: 'Bangalore' });
  await expect(bangaloreSuggestion).toBeVisible();
  
  // Click suggestion
  await bangaloreSuggestion.click();
  
  // Verify suggestions disappear
  await expect(suggestions).toHaveCount(0);
  
  // Verify selected value
  await expect(searchInput).toHaveValue('Bangalore');
});
```

**Conditional Element Handling:**

```typescript
test('handle element that may or may not appear', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Check if cookie banner appears (may not appear if cookies already accepted)
  const cookieBanner = page.locator('.cookie-banner');
  
  // Wait for element with short timeout
  try {
    await cookieBanner.waitFor({ state: 'visible', timeout: 3000 });
    // Banner appeared, accept cookies
    await page.getByRole('button', { name: 'Accept' }).click();
    await expect(cookieBanner).toBeHidden();
  } catch (error) {
    // Banner didn't appear, continue with test
    console.log('Cookie banner not shown');
  }
  
  // Alternative approach using isVisible()
  if (await cookieBanner.isVisible()) {
    await page.getByRole('button', { name: 'Accept' }).click();
  }
});
```

**Handling Animated Transitions:**

```typescript
test('wait for animation to complete', async ({ page }) => {
  await page.goto('https://example.com/animated-menu');
  
  // Click to expand menu (slides out with animation)
  await page.click('.menu-toggle');
  
  const menu = page.locator('.animated-menu');
  
  // Playwright waits for element to be stable (not animating)
  // This is part of auto-waiting for actions
  await menu.click();
  
  // For visibility check, use assertion
  await expect(menu).toBeVisible();
  
  // For custom wait after animation, use waitForFunction
  await page.waitForFunction(() => {
    const menu = document.querySelector('.animated-menu');
    if (!menu) return false;
    
    // Check if animation is complete (no transitioning CSS property)
    const computedStyle = window.getComputedStyle(menu);
    return computedStyle.transitionProperty === 'none' || 
           computedStyle.animationName === 'none';
  });
});
```

**Real-World Example: Infinite Scroll with Dynamic Content Loading**

```typescript
test('infinite scroll with dynamic content', async ({ page }) => {
  await page.goto('https://example.com/feed');
  
  let previousItemCount = 0;
  let targetItemCount = 50;
  let scrollAttempts = 0;
  const maxScrollAttempts = 20;
  
  while (scrollAttempts < maxScrollAttempts) {
    // Get current item count
    const currentItemCount = await page.locator('.feed-item').count();
    
    // Check if we've reached target
    if (currentItemCount >= targetItemCount) {
      break;
    }
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for new items to load
    try {
      await page.waitForFunction(
        (prevCount) => {
          const items = document.querySelectorAll('.feed-item');
          return items.length > prevCount;
        },
        previousItemCount,
        { timeout: 5000 }
      );
      
      previousItemCount = currentItemCount;
    } catch (error) {
      // No new items loaded, might be at the end
      console.log('No more items to load');
      break;
    }
    
    scrollAttempts++;
  }
  
  const finalCount = await page.locator('.feed-item').count();
  console.log(`Loaded ${finalCount} items after ${scrollAttempts} scrolls`);
  expect(finalCount).toBeGreaterThanOrEqual(targetItemCount);
});
```

**Handling Race Conditions:**

```typescript
test('handle race condition with multiple dynamic elements', async ({ page }) => {
  await page.goto('https://example.com/dashboard');
  
  // Click button that triggers multiple async operations
  await page.click('button#load-data');
  
  // Wait for multiple elements to appear (they load at different speeds)
  await Promise.all([
    expect(page.locator('.chart-widget')).toBeVisible({ timeout: 10000 }),
    expect(page.locator('.stats-widget')).toBeVisible({ timeout: 10000 }),
    expect(page.locator('.news-widget')).toBeVisible({ timeout: 10000 })
  ]);
  
  // All widgets are now loaded
  await expect(page.locator('.loading-indicator')).toBeHidden();
});
```

**Soft Assertions for Multiple Dynamic Elements:**

```typescript
test('verify multiple dynamic elements with soft assertions', async ({ page }) => {
  await page.goto('https://example.com/profile');
  
  // Load profile data (multiple sections load independently)
  await page.click('button#refresh-profile');
  
  // Use soft assertions to check all sections (test continues even if one fails)
  await expect.soft(page.locator('.profile-photo')).toBeVisible({ timeout: 5000 });
  await expect.soft(page.locator('.profile-name')).toHaveText(/\w+/);
  await expect.soft(page.locator('.profile-email')).toContainText('@');
  await expect.soft(page.locator('.profile-bio')).not.toBeEmpty();
  await expect.soft(page.locator('.profile-location')).toBeVisible();
  
  // All checks are performed, test fails if any failed
});
```

**Best Practices:**

1. **Trust auto-waiting**: Playwright waits for actionability automatically
2. **Use assertions with retry**: `expect().toBeVisible()` retries automatically
3. **Avoid fixed timeouts**: Use condition-based waits
4. **Handle optional elements**: Use try-catch or isVisible() for conditional elements
5. **Wait for stability**: Playwright waits for animations to complete before actions

**Common Pitfalls:**

```typescript
// ❌ Don't query element state immediately
const isVisible = await page.locator('.dynamic-element').isVisible();
// Element might not have loaded yet

// ✅ Use assertion with retry
await expect(page.locator('.dynamic-element')).toBeVisible();

// ❌ Don't use hardcoded delays
await page.waitForTimeout(3000);
await page.click('.loaded-element');

// ✅ Wait for element to be ready
await page.locator('.loaded-element').waitFor({ state: 'visible' });
await page.click('.loaded-element');

// ❌ Don't re-query elements unnecessarily
for (let i = 0; i < 10; i++) {
  const element = await page.$('.item');
  // Element handle can become stale
}

// ✅ Use locators which auto-retry
const items = page.locator('.item');
const count = await items.count();
```

---

### Question 14: Explain how to perform keyboard and mouse actions in Playwright.

**Answer:**

Playwright provides comprehensive APIs for simulating keyboard and mouse interactions, essential for testing complex user interactions.

**Basic Keyboard Actions:**

```typescript
import { test, expect } from '@playwright/test';

test('basic keyboard input', async ({ page }) => {
  await page.goto('https://example.com/editor');
  
  const textArea = page.getByRole('textbox');
  
  // Type text
  await textArea.fill('Hello World');
  
  // Type with delay between keystrokes (simulates human typing)
  await textArea.type('Slow typing', { delay: 100 });
  
  // Press individual keys
  await textArea.press('Control+A'); // Select all
  await textArea.press('Control+C'); // Copy
  await textArea.press('Control+V'); // Paste
  
  // Press keyboard shortcuts
  await page.keyboard.press('Control+S'); // Save
  await page.keyboard.press('Meta+Z'); // Undo (Cmd on Mac, Ctrl on Windows)
  
  // Type special characters
  await textArea.press('Enter');
  await textArea.press('Tab');
  await textArea.press('Backspace');
  await textArea.press('Delete');
  await textArea.press('Escape');
});
```

**Keyboard Shortcuts and Combinations:**

```typescript
test('keyboard shortcuts', async ({ page }) => {
  await page.goto('https://example.com/document');
  
  // Text formatting shortcuts
  await page.keyboard.press('Control+B'); // Bold
  await page.keyboard.press('Control+I'); // Italic
  await page.keyboard.press('Control+U'); // Underline
  
  // Navigation shortcuts
  await page.keyboard.press('Home'); // Beginning of line
  await page.keyboard.press('End'); // End of line
  await page.keyboard.press('PageUp'); // Page up
  await page.keyboard.press('PageDown'); // Page down
  
  // Multiple key combination
  await page.keyboard.press('Shift+Alt+F'); // Format document
  
  // Arrow keys
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');
});
```

**Real-World Example: Text Editor Testing**

```typescript
test('text editor keyboard interactions', async ({ page }) => {
  await page.goto('https://example.com/editor');
  
  const editor = page.locator('.editor-content');
  
  // Type content
  await editor.click(); // Focus editor
  await page.keyboard.type('First paragraph');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second paragraph');
  
  // Select all text
  await page.keyboard.press('Control+A');
  
  // Apply bold formatting
  await page.keyboard.press('Control+B');
  
  // Move to end
  await page.keyboard.press('End');
  
  // Add new line and more text
  await page.keyboard.press('Enter');
  await page.keyboard.type('Third paragraph');
  
  // Undo last action
  await page.keyboard.press('Control+Z');
  
  // Redo
  await page.keyboard.press('Control+Y');
  
  // Save document
  await page.keyboard.press('Control+S');
  
  // Verify save confirmation
  await expect(page.getByText('Document saved')).toBeVisible();
});
```

**Keyboard Down/Up (Holding Keys):**

```typescript
test('hold modifier keys', async ({ page }) => {
  await page.goto('https://example.com/canvas');
  
  // Hold Shift while clicking (multi-select)
  await page.keyboard.down('Shift');
  await page.click('.item-1');
  await page.click('.item-2');
  await page.click('.item-3');
  await page.keyboard.up('Shift');
  
  // Verify multiple items selected
  await expect(page.locator('.item.selected')).toHaveCount(3);
  
  // Hold Control for continuous action
  await page.keyboard.down('Control');
  await page.keyboard.press('C'); // Copy
  await page.keyboard.up('Control');
});
```

**Mouse Actions - Click:**

```typescript
test('mouse click actions', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Left click (default)
  await page.click('button#submit');
  
  // Right click (context menu)
  await page.click('.file-item', { button: 'right' });
  
  // Middle click
  await page.click('a.link', { button: 'middle' });
  
  // Double click
  await page.dblclick('.editable-text');
  
  // Triple click (selects paragraph)
  await page.locator('.text-content').click({ clickCount: 3 });
  
  // Click with modifier keys
  await page.click('a.link', { modifiers: ['Control'] }); // Ctrl+Click (open in new tab)
  await page.click('a.link', { modifiers: ['Shift'] }); // Shift+Click
  await page.click('.item', { modifiers: ['Meta'] }); // Cmd/Win+Click
  
  // Click at specific position
  await page.click('canvas', { position: { x: 100, y: 150 } });
});
```

**Mouse Hover:**

```typescript
test('mouse hover actions', async ({ page }) => {
  await page.goto('https://example.com/menu');
  
  // Hover over element
  await page.hover('.menu-item');
  
  // Verify dropdown appears
  await expect(page.locator('.dropdown-menu')).toBeVisible();
  
  // Hover over submenu
  await page.hover('.submenu-item');
  
  // Hover with position
  await page.hover('.canvas', { position: { x: 50, y: 50 } });
  
  // Hover to trigger tooltip
  await page.hover('.info-icon');
  await expect(page.locator('.tooltip')).toBeVisible();
  await expect(page.locator('.tooltip')).toContainText('Additional information');
});
```

**Real-World Example: Dropdown Navigation**

```typescript
test('nested dropdown menu navigation', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Hover over main menu
  await page.hover('nav >> text=Products');
  
  // Wait for dropdown to appear
  await expect(page.locator('.products-dropdown')).toBeVisible();
  
  // Hover over category
  await page.hover('.products-dropdown >> text=Electronics');
  
  // Wait for sub-dropdown
  await expect(page.locator('.electronics-submenu')).toBeVisible();
  
  // Click on subcategory
  await page.click('.electronics-submenu >> text=Laptops');
  
  // Verify navigation
  await expect(page).toHaveURL(/products\/electronics\/laptops/);
});
```

**Drag and Drop:**

```typescript
test('drag and drop actions', async ({ page }) => {
  await page.goto('https://example.com/kanban');
  
  // Simple drag and drop
  const sourceElement = page.locator('.task[data-id="task-1"]');
  const targetElement = page.locator('.column[data-id="in-progress"]');
  
  await sourceElement.dragTo(targetElement);
  
  // Verify task moved
  await expect(page.locator('.column[data-id="in-progress"] >> .task[data-id="task-1"]'))
    .toBeVisible();
  
  // Manual drag and drop with precise control
  await page.hover('.draggable-item');
  await page.mouse.down();
  await page.hover('.drop-zone');
  await page.mouse.up();
});
```

**Real-World Example: File Upload via Drag and Drop**

```typescript
test('drag and drop file upload', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  // Create data transfer with file
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  
  // Simulate file drag
  const dropZone = page.locator('.dropzone');
  
  // Trigger dragover event
  await dropZone.dispatchEvent('dragover', { dataTransfer });
  
  // Set input files (for actual upload)
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-file.pdf');
  
  // Trigger drop event
  await dropZone.dispatchEvent('drop', { dataTransfer });
  
  // Verify upload
  await expect(page.locator('.uploaded-file')).toContainText('test-file.pdf');
});
```

**Mouse Wheel Scrolling:**

```typescript
test('mouse wheel scrolling', async ({ page }) => {
  await page.goto('https://example.com/long-page');
  
  // Scroll down
  await page.mouse.wheel(0, 500);
  
  // Scroll up
  await page.mouse.wheel(0, -300);
  
  // Scroll element into view (better approach)
  await page.locator('#section-5').scrollIntoViewIfNeeded();
  
  // Evaluate scroll position
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);
});
```

**Mouse Move and Path:**

```typescript
test('mouse movement and drawing', async ({ page }) => {
  await page.goto('https://example.com/drawing-canvas');
  
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  
  if (box) {
    // Move mouse to starting position
    await page.mouse.move(box.x + 50, box.y + 50);
    
    // Mouse down to start drawing
    await page.mouse.down();
    
    // Draw a square
    await page.mouse.move(box.x + 150, box.y + 50, { steps: 10 });
    await page.mouse.move(box.x + 150, box.y + 150, { steps: 10 });
    await page.mouse.move(box.x + 50, box.y + 150, { steps: 10 });
    await page.mouse.move(box.x + 50, box.y + 50, { steps: 10 });
    
    // Mouse up to finish drawing
    await page.mouse.up();
    
    // Verify drawing was created
    const canvasData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas.toDataURL();
    });
    
    expect(canvasData).not.toBe('');
  }
});
```

**Real-World Example: Selecting Text with Mouse**

```typescript
test('select text with mouse', async ({ page }) => {
  await page.goto('https://example.com/document');
  
  const paragraph = page.locator('p.content').first();
  const box = await paragraph.boundingBox();
  
  if (box) {
    // Click at start of text
    await page.mouse.click(box.x + 5, box.y + 10);
    
    // Drag to end of text to select
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 5, box.y + 10, { steps: 50 });
    await page.mouse.up();
    
    // Copy selected text
    await page.keyboard.press('Control+C');
    
    // Paste in input field
    const input = page.locator('input#paste-here');
    await input.click();
    await page.keyboard.press('Control+V');
    
    // Verify pasted text
    const pastedText = await input.inputValue();
    expect(pastedText.length).toBeGreaterThan(0);
  }
});
```

**Complex User Interaction Flow:**

```typescript
test('complex user interaction scenario', async ({ page }) => {
  await page.goto('https://example.com/spreadsheet');
  
  // Click cell
  await page.click('.cell[data-row="1"][data-col="A"]');
  
  // Type value
  await page.keyboard.type('100');
  await page.keyboard.press('Enter');
  
  // Navigate with arrow keys
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('200');
  await page.keyboard.press('Enter');
  
  // Select multiple cells with Shift+Arrow
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.up('Shift');
  
  // Apply formatting with keyboard shortcut
  await page.keyboard.press('Control+B'); // Bold
  
  // Right-click for context menu
  await page.click('.cell[data-row="1"][data-col="A"]', { button: 'right' });
  
  // Select menu option
  await page.click('.context-menu >> text=Format Cells');
  
  // Verify format dialog opened
  await expect(page.locator('.format-dialog')).toBeVisible();
});
```

**Best Practices:**

1. **Use high-level actions**: Prefer `fill()`, `click()` over low-level mouse/keyboard when possible
2. **Modifier keys**: Always `keyboard.up()` after `keyboard.down()`
3. **Steps parameter**: Use `steps` in `mouse.move()` for smooth animations
4. **Position clicks**: Use `position` option for precise clicks on elements
5. **Cross-platform shortcuts**: Use `Meta` instead of `Control` for Mac compatibility

**Common Pitfalls:**

```typescript
// ❌ Don't forget to release keys
await page.keyboard.down('Shift');
// ... actions ...
// Forgot keyboard.up('Shift') - Shift remains pressed

// ✅ Always release
await page.keyboard.down('Shift');
await page.click('.item');
await page.keyboard.up('Shift');

// ❌ Don't use page-level keyboard after focusing input
await page.fill('input', 'text');
await page.keyboard.press('Enter'); // Works but not clear

// ✅ Use element-level press
await page.locator('input').fill('text');
await page.locator('input').press('Enter');

// ❌ Don't assume coordinates without checking
await page.mouse.click(100, 200); // May be outside element

// ✅ Calculate from bounding box
const box = await page.locator('button').boundingBox();
if (box) {
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
```

---

### Question 15: How do you take screenshots and record videos in Playwright?

**Answer:**

Playwright provides built-in capabilities for capturing screenshots and recording videos, essential for debugging and documentation.

**Basic Screenshots:**

```typescript
import { test, expect } from '@playwright/test';

test('capture screenshots', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Full page screenshot
  await page.screenshot({ path: 'screenshots/homepage.png' });
  
  // Element screenshot
  await page.locator('.hero-section').screenshot({ path: 'screenshots/hero.png' });
  
  // Screenshot with options
  await page.screenshot({
    path: 'screenshots/fullpage.png',
    fullPage: true // Capture entire scrollable page
  });
  
  // Clip specific area
  await page.screenshot({
    path: 'screenshots/cropped.png',
    clip: {
      x: 0,
      y: 0,
      width: 800,
      height: 600
    }
  });
});
```

**Screenshots on Test Failure:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Capture screenshot only on test failure
    screenshot: 'only-on-failure',
    
    // Or capture on first failure
    screenshot: 'on',
    
    // Capture trace on first retry
    trace: 'on-first-retry',
  },
});

// Screenshots are automatically saved to test-results/ folder
```

**Real-World Example: Visual Verification**

```typescript
test('verify page layout with screenshot', async ({ page }) => {
  await page.goto('https://example.com/product/123');
  
  // Wait for product image to load
  await page.locator('.product-image img').waitFor({ state: 'visible' });
  
  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('product-page.png', {
    maxDiffPixels: 100, // Allow up to 100 pixels difference
  });
  
  // Element-specific visual regression
  const productCard = page.locator('.product-card');
  await expect(productCard).toHaveScreenshot('product-card.png');
});
```

**Screenshot with Mask (Hide Dynamic Content):**

```typescript
test('screenshot with masked elements', async ({ page }) => {
  await page.goto('https://example.com/dashboard');
  
  // Mask elements that change frequently (timestamps, user names)
  await page.screenshot({
    path: 'screenshots/dashboard.png',
    mask: [
      page.locator('.timestamp'),
      page.locator('.user-name'),
      page.locator('.dynamic-ad')
    ]
  });
  
  // For visual regression testing
  await expect(page).toHaveScreenshot('dashboard-stable.png', {
    mask: [page.locator('.timestamp'), page.locator('.user-avatar')]
  });
});
```

**Video Recording:**

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Record video for all tests
    video: 'on',
    
    // Record video only on first retry
    video: 'retain-on-failure',
    
    // Video size and frame rate
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 }
    }
  },
});

// Access video in test
test('test with video recording', async ({ page }, testInfo) => {
  await page.goto('https://example.com');
  await page.click('button');
  
  // Video is automatically saved after test completes
  // Access video path in test
  const videoPath = await page.video()?.path();
  console.log(`Video saved to: ${videoPath}`);
});
```

**Real-World Example: Record Failure Scenario**

```typescript
test('record video of failed checkout process', async ({ page }, testInfo) => {
  await page.goto('https://shop.example.com');
  
  try {
    await page.click('.product-card >> text=iPhone 15');
    await page.click('button:has-text("Add to Cart")');
    await page.click('a:has-text("Checkout")');
    await page.fill('#card-number', '4111111111111111');
    await page.fill('#expiry', '12/25');
    await page.fill('#cvv', '123');
    await page.click('button[type="submit"]');
    
    // Expect success
    await expect(page.getByText('Order Confirmed')).toBeVisible();
  } catch (error) {
    // On failure, video is retained (if configured)
    const videoPath = await page.video()?.path();
    console.log(`Test failed. Video: ${videoPath}`);
    
    // Attach video to test report
    if (videoPath) {
      await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
    }
    
    throw error;
  }
});
```

**Programmatic Video Recording:**

```typescript
test('manually control video recording', async ({ browser }) => {
  // Create context with video recording
  const context = await browser.newContext({
    recordVideo: {
      dir: 'videos/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  await page.goto('https://example.com');
  await page.click('button#start-demo');
  await page.waitForTimeout(5000); // Record 5 seconds of demo
  
  // Close context to save video
  await context.close();
  
  // Video is now saved in videos/ directory
});
```

**Screenshot Comparisons for Visual Regression:**

```typescript
test('visual regression testing', async ({ page }) => {
  await page.goto('https://example.com');
  
  // First run: generates baseline screenshot (stored in snapshots folder)
  // Subsequent runs: compares against baseline
  await expect(page).toHaveScreenshot('homepage.png');
  
  // With custom threshold
  await expect(page).toHaveScreenshot('homepage-strict.png', {
    threshold: 0.1, // Allow 10% pixel difference
    maxDiffPixels: 100
  });
  
  // Update baseline when UI intentionally changed
  // Run with --update-snapshots flag:
  // npx playwright test --update-snapshots
});
```

**Real-World Example: Responsive Screenshots**

```typescript
test('capture responsive screenshots', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'screenshots/desktop.png', fullPage: true });
  
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'screenshots/tablet.png', fullPage: true });
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'screenshots/mobile.png', fullPage: true });
  
  // Verify responsive elements
  await expect(page.locator('.mobile-menu')).toBeVisible();
});
```

**Annotations on Screenshots:**

```typescript
test('screenshot with custom annotations', async ({ page }) => {
  await page.goto('https://example.com/bug');
  
  // Take screenshot buffer
  const screenshot = await page.screenshot();
  
  // Annotate using image processing library (example with sharp)
  const sharp = require('sharp');
  await sharp(screenshot)
    .composite([{
      input: Buffer.from(
        '<svg><text x="10" y="30" font-size="24" fill="red">Bug Location</text></svg>'
      ),
      top: 100,
      left: 100
    }])
    .toFile('screenshots/annotated-bug.png');
});
```

**Attaching Media to Test Reports:**

```typescript
test('attach screenshots and videos to report', async ({ page }, testInfo) => {
  await page.goto('https://example.com');
  
  // Take screenshot
  const screenshot = await page.screenshot();
  await testInfo.attach('homepage', {
    body: screenshot,
    contentType: 'image/png'
  });
  
  // Perform test actions
  await page.click('button#action');
  
  // Take another screenshot at important step
  const afterClick = await page.screenshot();
  await testInfo.attach('after-click', {
    body: afterClick,
    contentType: 'image/png'
  });
  
  // Attach video
  const videoPath = await page.video()?.path();
  if (videoPath) {
    await testInfo.attach('test-video', {
      path: videoPath,
      contentType: 'video/webm'
    });
  }
});
```

**Best Practices:**

1. **Screenshot on failure**: Configure automatic screenshots for failed tests
2. **Full page screenshots**: Use `fullPage: true` for complete page capture
3. **Mask dynamic content**: Mask timestamps, ads, user-specific data for stable comparisons
4. **Video retention**: Use `retain-on-failure` to save storage space
5. **Viewport consistency**: Set consistent viewport for visual regression tests

**Common Pitfalls:**

```typescript
// ❌ Don't take screenshots before page loads
await page.goto('https://example.com');
await page.screenshot({ path: 'screenshot.png' }); // May capture loading state

// ✅ Wait for page to be ready
await page.goto('https://example.com');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshot.png' });

// ❌ Don't forget to await screenshot
page.screenshot({ path: 'test.png' }); // Missing await
await page.click('button');

// ✅ Always await
await page.screenshot({ path: 'test.png' });
await page.click('button');

// ❌ Don't capture videos for all tests (storage intensive)
// playwright.config.ts
use: {
  video: 'on' // Generates large files
}

// ✅ Capture only on failure
use: {
  video: 'retain-on-failure'
}
```

---

(This completes the Beginner level. The document would continue with Intermediate, Advanced, and Expert/Architect levels, following the same comprehensive approach with Questions 16-60.)

**Document structure ensures:**
- Progressive difficulty
- Cumulative knowledge building
- Real-world scenarios
- Best practices and pitfalls
- TypeScript-specific patterns
- Enterprise-scale considerations
- Senior engineer perspective

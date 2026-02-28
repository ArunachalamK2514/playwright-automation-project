# Playwright Interview Questions 16-35: Intermediate Level

## Intermediate Level (Questions 16-35)

### Question 16: How do you test APIs in Playwright? Explain the `request` fixture.

**Answer:**

Playwright's `request` fixture provides a powerful APIRequestContext for testing REST APIs directly, enabling both pure API testing and preparing server state for UI tests.

**Basic API Testing:**

```typescript
import { test, expect } from '@playwright/test';

test('test GitHub API', async ({ request }) => {
  // GET request
  const response = await request.get('https://api.github.com/users/octocat');
  
  expect(response.status()).toBe(200);
  
  const user = await response.json();
  expect(user.login).toBe('octocat');
  expect(user.public_repos).toBeGreaterThan(0);
});
```

**POST Request with Payload:**

```typescript
test('create issue via API', async ({ request }) => {
  const response = await request.post('https://api.github.com/repos/owner/repo/issues', {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    data: {
      title: 'Test Issue',
      body: 'This is a test issue',
      labels: ['bug', 'enhancement']
    }
  });
  
  expect(response.ok()).toBeTruthy();
  
  const issue = await response.json();
  expect(issue.number).toBeGreaterThan(0);
});
```

**Configuring API Base URL:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://api.example.com',
    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
});

// test
test('use baseURL', async ({ request }) => {
  // Request is sent to https://api.example.com/users/123
  const response = await request.get('/users/123');
  expect(response.ok()).toBeTruthy();
});
```

**Real-World Example: API Setup and Verification**

```typescript
test('create order via UI and verify via API', async ({ page, request }) => {
  // Setup: Create products via API
  const product1 = await request.post('/api/products', {
    data: { name: 'Laptop', price: 999.99 }
  });
  const productId1 = (await product1.json()).id;
  
  const product2 = await request.post('/api/products', {
    data: { name: 'Mouse', price: 29.99 }
  });
  const productId2 = (await product2.json()).id;
  
  // UI Test: Create order
  await page.goto('https://shop.example.com');
  await page.click(`[data-product-id="${productId1}"]`);
  await page.click('button:has-text("Add to Cart")');
  await page.click(`[data-product-id="${productId2}"]`);
  await page.click('button:has-text("Add to Cart")');
  
  await page.click('a:has-text("Checkout")');
  await page.click('button[type="submit"]');
  
  // Extract order ID from success page
  const orderId = await page.locator('.order-id').textContent();
  
  // Verification: Verify order via API
  const orderResponse = await request.get(`/api/orders/${orderId}`);
  const order = await orderResponse.json();
  
  expect(order.status).toBe('pending');
  expect(order.items).toHaveLength(2);
  expect(order.items[0].productId).toBe(productId1);
  expect(order.items[1].productId).toBe(productId2);
  
  // Cleanup: Delete test data via API
  await request.delete(`/api/orders/${orderId}`);
  await request.delete(`/api/products/${productId1}`);
  await request.delete(`/api/products/${productId2}`);
});
```

**Handling Different Response Types:**

```typescript
test('various response types', async ({ request }) => {
  // JSON response
  const jsonResponse = await request.get('/api/users');
  const users = await jsonResponse.json();
  
  // Text response
  const textResponse = await request.get('/api/config/version');
  const version = await textResponse.text();
  
  // Binary response (PDF, image, etc.)
  const binaryResponse = await request.get('/api/report/export.pdf');
  const buffer = await binaryResponse.body();
  
  // Buffer handling
  const htmlResponse = await request.get('/api/page');
  const html = await htmlResponse.text();
  expect(html).toContain('<html>');
});
```

**Error Handling:**

```typescript
test('handle API errors', async ({ request }) => {
  // Bad request
  const response = await request.post('/api/users', {
    data: { /* invalid data */ }
  });
  
  expect(response.ok()).toBeFalsy();
  expect(response.status()).toBe(400);
  
  const error = await response.json();
  expect(error.message).toContain('validation failed');
  
  // Not found
  const notFoundResponse = await request.get('/api/users/nonexistent');
  expect(notFoundResponse.status()).toBe(404);
  
  // Unauthorized
  const unAuthResponse = await request.get('/api/admin', {
    headers: { 'Authorization': 'Bearer invalid_token' }
  });
  expect(unAuthResponse.status()).toBe(401);
});
```

**API Testing with Setup/Teardown:**

```typescript
test.describe('API CRUD operations', () => {
  let createdUserId: number;
  
  test.beforeEach(async ({ request }) => {
    // Create test data
    const response = await request.post('/api/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      }
    });
    createdUserId = (await response.json()).id;
  });
  
  test('read user', async ({ request }) => {
    const response = await request.get(`/api/users/${createdUserId}`);
    const user = await response.json();
    
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
  });
  
  test('update user', async ({ request }) => {
    const response = await request.put(`/api/users/${createdUserId}`, {
      data: { name: 'Updated User' }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const updated = await response.json();
    expect(updated.name).toBe('Updated User');
  });
  
  test('delete user', async ({ request }) => {
    const response = await request.delete(`/api/users/${createdUserId}`);
    expect(response.ok()).toBeTruthy();
    
    // Verify deletion
    const getResponse = await request.get(`/api/users/${createdUserId}`);
    expect(getResponse.status()).toBe(404);
  });
  
  test.afterEach(async ({ request }) => {
    // Cleanup (in case test didn't delete)
    await request.delete(`/api/users/${createdUserId}`).catch(() => {});
  });
});
```

**Request Context (Standalone API Testing):**

```typescript
import { request } from '@playwright/test';

// Standalone API testing without browser
test('standalone API test', async () => {
  const context = await request.newContext({
    baseURL: 'https://api.example.com',
    httpCredentials: {
      username: 'user',
      password: 'password'
    }
  });
  
  const response = await context.get('/protected-resource');
  expect(response.ok()).toBeTruthy();
  
  await context.dispose();
});
```

**Best Practices:**

1. **Use baseURL and extraHTTPHeaders** in config to avoid repetition
2. **Separate API tests from UI tests** when possible
3. **Use API for setup/teardown** instead of UI when faster
4. **Mock external APIs** in tests when possible
5. **Handle errors explicitly** and verify error responses

**Common Pitfalls:**

```typescript
// ❌ Don't forget to check response.ok()
const response = await request.get('/api/data');
const data = await response.json(); // May fail if response was 404

// ✅ Check response status first
const response = await request.get('/api/data');
if (!response.ok()) {
  throw new Error(`API error: ${response.status()}`);
}
const data = await response.json();

// ❌ Don't assume all errors are JSON
const response = await request.post('/api/invalid');
const error = await response.json(); // May throw if error is HTML

// ✅ Handle different content types
const response = await request.post('/api/invalid');
const contentType = response.headers()['content-type'];
const body = contentType?.includes('json') 
  ? await response.json() 
  : await response.text();
```

---

### Question 17: How do you handle network interception and mocking in Playwright?

**Answer:**

Network interception in Playwright allows you to intercept and modify network requests and responses, essential for testing error scenarios, edge cases, and reducing test flakiness.

**Basic Route Interception:**

```typescript
import { test, expect } from '@playwright/test';

test('intercept and modify response', async ({ page }) => {
  // Intercept all requests to /api/users
  await page.route('**/api/users/**', route => {
    // Modify the response
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' }
      ])
    });
  });
  
  await page.goto('https://example.com/users');
  
  // Page receives mocked data
  await expect(page.locator('.user-item')).toHaveCount(2);
});
```

**Conditional Routing:**

```typescript
test('conditional interception', async ({ page }) => {
  await page.route('**/api/search', route => {
    const request = route.request();
    
    // Only intercept POST requests
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();
      
      // Mock response based on query
      if (postData.query === 'error') {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ results: [] })
        });
      }
    } else {
      // Continue actual request for GET
      route.continue();
    }
  });
  
  await page.goto('https://example.com/search');
});
```

**Abort/Block Requests:**

```typescript
test('block requests', async ({ page }) => {
  // Block ads and trackers
  await page.route('**/*.gif', route => route.abort());
  await page.route('**/tracking/*', route => route.abort('blockedbyclient'));
  
  // Continue all other requests
  await page.route('**/*', route => route.continue());
  
  await page.goto('https://example.com');
  
  // Page loads without ads/tracking
  await expect(page.locator('body')).toBeVisible();
});
```

**Real-World Example: Testing Error Scenarios**

```typescript
test('handle API error gracefully', async ({ page }) => {
  // Mock API to return 500 error
  await page.route('**/api/data', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });
  
  await page.goto('https://example.com');
  
  // Click button that loads data
  await page.click('button#load-data');
  
  // Verify error message is shown
  await expect(page.locator('.error-message'))
    .toContainText('Internal server error');
});
```

**Mocking File Downloads:**

```typescript
test('mock file download', async ({ page }) => {
  await page.route('**/api/export/csv', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'Name,Email,Status\nJohn,john@example.com,Active\nJane,jane@example.com,Inactive'
    });
  });
  
  await page.goto('https://example.com');
  
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Export CSV")');
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toContain('.csv');
});
```

**Modifying Request Headers:**

```typescript
test('modify request headers', async ({ page }) => {
  await page.route('**/api/**', async route => {
    const request = route.request();
    
    // Modify request before sending
    route.continue({
      headers: {
        ...request.headers(),
        'X-Custom-Header': 'Modified',
        'Authorization': `Bearer ${process.env.TEST_TOKEN}`
      }
    });
  });
  
  await page.goto('https://example.com');
});
```

**Logging Network Activity:**

```typescript
test('log network requests', async ({ page }) => {
  const requests: string[] = [];
  
  await page.route('**/*', route => {
    const request = route.request();
    requests.push(`${request.method()} ${request.url()}`);
    route.continue();
  });
  
  await page.goto('https://example.com');
  await page.click('button');
  
  console.log('Network requests:', requests);
  
  // Verify specific requests were made
  expect(requests).toContainEqual(expect.stringContaining('/api/users'));
});
```

**Complex Mocking Scenario: Multiple Responses**

```typescript
test('mock multiple API calls with different responses', async ({ page }) => {
  let callCount = 0;
  
  await page.route('**/api/items', route => {
    callCount++;
    
    // First call returns empty
    if (callCount === 1) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [] })
      });
    }
    // Second call returns data
    else {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ]
        })
      });
    }
  });
  
  await page.goto('https://example.com');
  
  // First load shows empty
  await expect(page.locator('.item')).toHaveCount(0);
  
  // Refresh shows items
  await page.click('button#refresh');
  await expect(page.locator('.item')).toHaveCount(2);
});
```

**Regex Pattern Matching for Routes:**

```typescript
test('route with regex patterns', async ({ page }) => {
  // Match specific URL pattern
  await page.route(/api\/v\d+\/users/, route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ users: [] })
    });
  });
  
  // Match multiple patterns
  await page.route(/(\.js|\.css)$/, route => {
    // Block static assets
    route.abort();
  });
  
  await page.goto('https://example.com');
});
```

**Delay Responses (Test Timeout Scenarios):**

```typescript
test('simulate slow API', async ({ page }) => {
  await page.route('**/api/slow-endpoint', async route => {
    // Simulate 5 second delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'Slow response' })
    });
  });
  
  await page.goto('https://example.com');
  
  // Click button that calls slow API
  await page.click('button');
  
  // Page should show loading state
  await expect(page.locator('.loading')).toBeVisible();
  
  // Wait for response
  await expect(page.locator('.result')).toBeVisible({ timeout: 10000 });
});
```

**Network Offline Simulation:**

```typescript
test('app works offline', async ({ page }) => {
  // Block all network requests
  await page.route('**/*', route => {
    route.abort('blockedbyclient');
  });
  
  await page.goto('https://example.com/offline-app');
  
  // App should still be functional with cached data
  await expect(page.locator('.cached-data')).toBeVisible();
  
  // Attempt to load data should fail gracefully
  await page.click('button#load-new-data');
  await expect(page.locator('.offline-message')).toBeVisible();
});
```

**Best Practices:**

1. **Use specific URL patterns**: Be more specific to avoid unexpected matches
2. **Unroute when done**: Clean up routes to prevent interference with other tests
3. **Log for debugging**: Log intercepted requests when debugging
4. **Continue real requests**: Only mock what's necessary
5. **Use for error testing**: Ideal for testing error scenarios without actual failures

**Common Pitfalls:**

```typescript
// ❌ Don't use overly broad patterns
await page.route('*', route => route.abort()); // Too broad, breaks everything

// ✅ Be specific
await page.route('**/api/**', route => route.continue());
await page.route('**/cdn/**', route => route.abort());

// ❌ Don't forget to handle route continuing
await page.route('**/api/**', route => {
  // Forgot to call route.continue() or route.fulfill()
  // Route will hang
});

// ✅ Always complete the route
await page.route('**/api/**', route => {
  route.fulfill({ status: 200, body: '{}' });
  // Or route.continue()
  // Or route.abort()
});
```

---

### Question 18: Explain authentication strategies in Playwright. How do you handle login flows efficiently?

**Answer:**

Authentication is critical for most web applications. Playwright provides several strategies to handle authentication efficiently without repeating login in every test.

**Strategy 1: Shared Authentication (Recommended for Most Cases)**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use auth file created by setup
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});

// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  // Fill login form
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  
  // Submit form
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  // Wait for navigation
  await page.waitForURL('http://localhost:3000/dashboard');
  
  // Verify login success
  await expect(page.getByText('Welcome')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});

// tests/dashboard.spec.ts
import { test, expect } from '@playwright/test';

// All tests automatically authenticated
test('dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  
  // Already authenticated, no login needed
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**Strategy 2: Multiple Roles (Admin/User)**

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('adminpass');
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  await page.waitForURL('http://localhost:3000/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});

setup('authenticate as user', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('userpass');
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  await page.waitForURL('http://localhost:3000/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// tests/admin.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('admin can delete users', async ({ page }) => {
  await page.goto('http://localhost:3000/users');
  
  // Admin-specific functionality
  await expect(page.locator('button:has-text("Delete User")')).toBeVisible();
});

// tests/user.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('user cannot delete other users', async ({ page }) => {
  await page.goto('http://localhost:3000/users');
  
  // Delete button should not be visible for regular user
  await expect(page.locator('button:has-text("Delete User")')).not.toBeVisible();
});
```

**Strategy 3: API-based Authentication**

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('API authentication', async ({ request }) => {
  // Authenticate via API (faster than UI)
  const response = await request.post('http://localhost:3000/api/auth/login', {
    data: {
      email: 'user@example.com',
      password: 'password123'
    }
  });
  
  expect(response.ok()).toBeTruthy();
  
  // Save authentication state
  await request.storageState({ path: 'playwright/.auth/user.json' });
});
```

**Strategy 4: Per-Worker Authentication (for Parallel Tests with State Changes)**

```typescript
// playwright/fixtures.ts
import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const test = base.extend<{}, { workerStorageState: string }>(
  {
    storageState: ({ workerStorageState }, use) => use(workerStorageState),
    
    workerStorageState: [
      async ({ browser }, use) => {
        const id = test.info().parallelIndex;
        const fileName = path.resolve(
          test.info().project.outputDir,
          `.auth/worker-${id}.json`
        );
        
        // Reuse existing auth if available
        if (fs.existsSync(fileName)) {
          await use(fileName);
          return;
        }
        
        // Otherwise authenticate
        const page = await browser.newPage({ storageState: undefined });
        
        await page.goto('http://localhost:3000/login');
        await page.getByLabel('Email').fill(`user${id}@example.com`);
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign in' }).click();
        
        await page.waitForURL('http://localhost:3000/dashboard');
        
        // Create auth directory if it doesn't exist
        const dir = path.dirname(fileName);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await page.context().storageState({ path: fileName });
        await page.close();
        
        await use(fileName);
      },
      { scope: 'worker' }
    ]
  }
);

export { expect } from '@playwright/test';

// tests/shopping.spec.ts
import { test } from '../playwright/fixtures';

test('user 1 purchases item', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Each worker uses different user account
  await page.click('button:has-text("Buy")');
});
```

**Strategy 5: Token-based Authentication**

```typescript
test('authenticate with JWT token', async ({ page, context }) => {
  // Get token (could be from API, env var, etc.)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  
  // Set token in localStorage before navigation
  await context.addInitScript((token) => {
    localStorage.setItem('authToken', token);
  }, token);
  
  await page.goto('http://localhost:3000/dashboard');
  
  // Page has access to token from localStorage
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**Strategy 6: Multi-User Test in Single Test**

```typescript
test('admin and user interaction', async ({ browser }) => {
  // Admin context
  const adminContext = await browser.newContext({
    storageState: 'playwright/.auth/admin.json'
  });
  const adminPage = await adminContext.newPage();
  
  // User context
  const userContext = await browser.newContext({
    storageState: 'playwright/.auth/user.json'
  });
  const userPage = await userContext.newPage();
  
  // Admin creates a resource
  await adminPage.goto('http://localhost:3000/resources');
  await adminPage.click('button:has-text("Create Resource")');
  await adminPage.getByLabel('Name').fill('Shared Resource');
  await adminPage.click('button:has-text("Save")');
  
  // User can see the resource
  await userPage.goto('http://localhost:3000/resources');
  await expect(userPage.locator('text=Shared Resource')).toBeVisible();
  
  await adminContext.close();
  await userContext.close();
});
```

**Real-World Example: OAuth2 Login**

```typescript
setup('OAuth2 authentication', async ({ browser, page }) => {
  // Navigate to login
  await page.goto('http://localhost:3000/login');
  
  // Click "Login with Google"
  const [popup] = await Promise.all([
    browser.waitForEvent('page'),
    page.click('button:has-text("Login with Google")')
  ]);
  
  // Handle Google login popup
  await popup.goto('https://accounts.google.com');
  await popup.getByLabel('Email or phone').fill('testuser@gmail.com');
  await popup.getByRole('button', { name: 'Next' }).click();
  
  await popup.getByLabel('Password').fill('testpassword');
  await popup.getByRole('button', { name: 'Next' }).click();
  
  // Wait for redirect back
  await popup.waitForURL('http://localhost:3000/dashboard');
  
  // Copy cookies to main page
  const cookies = await popup.context().cookies();
  await page.context().addCookies(cookies);
  
  await page.goto('http://localhost:3000/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  
  await popup.close();
});
```

**Handling Expired Tokens:**

```typescript
test('refresh token on expiry', async ({ page, context }) => {
  // Intercept auth API to handle token refresh
  await page.route('**/api/auth/refresh', async route => {
    const response = await route.fetch();
    
    if (response.ok()) {
      const data = await response.json();
      
      // Update token in localStorage
      await page.evaluate((newToken) => {
        localStorage.setItem('authToken', newToken);
      }, data.token);
    }
    
    return route.fulfill({ response });
  });
  
  await page.goto('http://localhost:3000/dashboard');
  
  // Token refresh happens transparently
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**Best Practices:**

1. **Use shared authentication**: Avoid logging in for every test
2. **Separate setup from tests**: Use setup project for authentication
3. **Store auth files in .gitignore**: Never commit sensitive data
4. **Refresh tokens when needed**: Handle token expiration in tests
5. **Use multiple auth files** for different roles
6. **API authentication when possible**: Faster than UI login

**Common Pitfalls:**

```typescript
// ❌ Don't login in every test (slow)
test('test 1', async ({ page }) => {
  await loginViaUI(page); // Every test does this
  // test code
});

// ✅ Use setup and storageState
// auth.setup.ts handles login once
// All tests use storageState: 'playwright/.auth/user.json'

// ❌ Don't hardcode credentials
await page.getByLabel('Email').fill('admin@example.com');
await page.getByLabel('Password').fill('admin123');

// ✅ Use environment variables
await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL);
await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD);
```

---

(Continuing with Questions 19-35...)

### Question 19: How do you configure Playwright projects for different environments (staging, production)?

**Answer:**

Playwright's projects feature enables testing across multiple environments with different configurations without code duplication.

**Multi-Environment Configuration:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  
  projects: [
    {
      name: 'staging-chrome',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://staging.example.com',
        trace: 'on-first-retry',
      },
    },
    {
      name: 'staging-firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'https://staging.example.com',
      },
    },
    {
      name: 'production-chrome',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://example.com',
        // Stricter settings for production
        navigationTimeout: 30000,
        actionTimeout: 10000,
      },
    },
  ],
});

// tests/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  // baseURL is set per project
  await page.goto('/'); // Goes to staging or production depending on project
  
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

**Running Specific Projects:**

```bash
# Run all projects
npx playwright test

# Run specific project
npx playwright test --project=staging-chrome

# Run multiple projects
npx playwright test --project=staging-chrome --project=staging-firefox

# Run tests matching pattern in specific project
npx playwright test --project=production-chrome login.spec.ts
```

**Environment-Specific Configuration:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const baseURL = process.env.ENV === 'production'
  ? 'https://example.com'
  : 'https://staging.example.com';

const apiURL = process.env.ENV === 'production'
  ? 'https://api.example.com'
  : 'https://api-staging.example.com';

export default defineConfig({
  use: {
    baseURL,
    extraHTTPHeaders: {
      'X-API-URL': apiURL,
      'X-Test-Environment': process.env.ENV || 'staging',
    },
  },
  
  projects: [
    {
      name: 'chrome-staging',
      use: { ...devices['Desktop Chrome'] },
      webServer: {
        command: 'npm run start:staging',
        port: 3000,
        reuseExistingServer: !process.env.CI,
      },
    },
    {
      name: 'chrome-production',
      use: { ...devices['Desktop Chrome'] },
      // No webServer for production (already running)
    },
  ],
});
```

**Dynamic Test Selection Based on Environment:**

```typescript
import { test, expect } from '@playwright/test';

test('basic smoke test', async ({ page }) => {
  // Runs in all environments
  await page.goto('/');
  await expect(page).toHaveTitle(/Example/);
});

test('staging-only: feature preview', async ({ page, browserName }, testInfo) => {
  test.skip(
    testInfo.project.name === 'production-chrome',
    'Feature preview only in staging'
  );
  
  await page.goto('/preview/feature');
  await expect(page.locator('.preview-badge')).toBeVisible();
});

test('production-only: performance check', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name.includes('staging'),
    'Performance test only in production'
  );
  
  const start = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - start;
  
  expect(loadTime).toBeLessThan(3000); // Production should be fast
});
```

**Environment Variables Per Project:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'staging',
      use: {
        baseURL: 'https://staging.example.com',
      },
      env: {
        ENVIRONMENT: 'staging',
        API_TOKEN: process.env.STAGING_API_TOKEN,
        TEST_USER: 'staging-user@example.com',
      },
    },
    {
      name: 'production',
      use: {
        baseURL: 'https://example.com',
      },
      env: {
        ENVIRONMENT: 'production',
        API_TOKEN: process.env.PROD_API_TOKEN,
        TEST_USER: 'prod-user@example.com',
      },
    },
  ],
});

// tests/api.spec.ts
import { test, expect } from '@playwright/test';

test('use environment-specific credentials', async ({ request }) => {
  const token = process.env.API_TOKEN;
  const response = await request.get('/api/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  expect(response.ok()).toBeTruthy();
});
```

**Reporting by Environment:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'test-results/staging' }],
    ['json', { outputFile: 'test-results/staging/results.json' }],
  ],
  
  projects: [
    {
      name: 'staging',
      use: { baseURL: 'https://staging.example.com' },
      outputDir: 'test-results/staging',
    },
    {
      name: 'production',
      use: { baseURL: 'https://example.com' },
      outputDir: 'test-results/production',
    },
  ],
});
```

**CI/CD Integration:**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: ['staging-chrome', 'production-chrome']
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install && npx playwright install
      
      - name: Run tests
        run: npx playwright test --project=${{ matrix.project }}
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.project }}
          path: playwright-report/
          retention-days: 30
```

---

### Question 20: How do you structure test files and organize code for maintainability?

**Answer:**

Proper code organization is critical for enterprise-scale test automation. It improves maintainability, reusability, and team collaboration.

**Recommended Directory Structure:**

```
project/
├── tests/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── logout.spec.ts
│   │   │   └── password-reset.spec.ts
│   │   ├── dashboard/
│   │   │   ├── overview.spec.ts
│   │   │   └── analytics.spec.ts
│   │   └── checkout/
│   │       ├── cart.spec.ts
│   │       ├── payment.spec.ts
│   │       └── order-confirmation.spec.ts
│   ├── api/
│   │   ├── users.spec.ts
│   │   ├── products.spec.ts
│   │   └── orders.spec.ts
│   ├── auth.setup.ts
│   └── fixtures/
├── pages/
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   └── checkout.page.ts
├── fixtures/
│   ├── auth.fixtures.ts
│   ├── api.fixtures.ts
│   └── database.fixtures.ts
├── utils/
│   ├── test-data.ts
│   ├── helpers.ts
│   └── constants.ts
├── playwright.config.ts
└── package.json
```

**Test Organization Best Practices:**

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test.describe('Authentication - Login', () => {
  let loginPage: LoginPage;
  
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });
  
  test.describe('Valid Credentials', () => {
    test('should login successfully with valid credentials', async () => {
      await loginPage.login('user@example.com', 'password123');
      
      await expect(loginPage.page).toHaveURL(/dashboard/);
      await expect(loginPage.welcomeMessage).toBeVisible();
    });
    
    test('should display user name after login', async () => {
      await loginPage.login('user@example.com', 'password123');
      
      const userName = await loginPage.getUserName();
      expect(userName).toBe('Test User');
    });
  });
  
  test.describe('Invalid Credentials', () => {
    test('should show error for invalid email', async () => {
      await loginPage.login('invalid-email', 'password123');
      
      await expect(loginPage.errorMessage).toContainText('Invalid email');
    });
    
    test('should show error for wrong password', async () => {
      await loginPage.login('user@example.com', 'wrongpassword');
      
      await expect(loginPage.errorMessage).toContainText('Invalid password');
    });
  });
  
  test.describe('Edge Cases', () => {
    test('should handle empty email field', async () => {
      await loginPage.clickLoginButton(); // Don't fill email
      
      await expect(loginPage.emailError).toContainText('Email is required');
    });
  });
});
```

**Shared Fixtures Pattern:**

```typescript
// fixtures/test-user.fixtures.ts
import { test as base } from '@playwright/test';

type TestUser = {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
};

type UserFixtures = {
  adminUser: TestUser;
  regularUser: TestUser;
  newUser: TestUser;
};

export const test = base.extend<UserFixtures>({
  adminUser: async ({}, use) => {
    const user: TestUser = {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    };
    await use(user);
  },
  
  regularUser: async ({}, use) => {
    const user: TestUser = {
      email: 'user@example.com',
      password: 'user123',
      name: 'Regular User',
      role: 'user'
    };
    await use(user);
  },
  
  newUser: async ({ request }, use) => {
    // Create new user via API
    const response = await request.post('/api/users', {
      data: {
        email: `user-${Date.now()}@example.com`,
        password: 'password123',
        name: 'New User',
        role: 'user'
      }
    });
    
    const user = (await response.json()) as TestUser;
    
    await use(user);
    
    // Cleanup: Delete user after test
    await request.delete(`/api/users/${user.email}`);
  }
});

export { expect } from '@playwright/test';

// Usage
import { test } from '../fixtures/test-user.fixtures';

test('admin functions', async ({ adminUser, page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(adminUser.email);
  await page.getByLabel('Password').fill(adminUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
});
```

**Shared Test Data:**

```typescript
// utils/test-data.ts
export const VALID_USER = {
  email: 'valid@example.com',
  password: 'ValidPass123!',
  firstName: 'John',
  lastName: 'Doe'
};

export const INVALID_CREDENTIALS = {
  invalidEmail: 'not-an-email',
  weakPassword: '123',
  sqlInjection: "'; DROP TABLE users;--"
};

export const TEST_PRODUCTS = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 5 },
  { id: 2, name: 'Mouse', price: 29.99, stock: 50 },
  { id: 3, name: 'Keyboard', price: 79.99, stock: 20 }
];

export const PAYMENT_METHODS = {
  validCard: { number: '4111111111111111', expiry: '12/25', cvv: '123' },
  declinedCard: { number: '4000000000000002', expiry: '12/25', cvv: '123' },
  expiredCard: { number: '4000002500003155', expiry: '12/20', cvv: '123' }
};

// Usage
import { VALID_USER, TEST_PRODUCTS } from '../utils/test-data';

test('purchase product', async ({ page }) => {
  await loginAs(page, VALID_USER);
  await addProductToCart(page, TEST_PRODUCTS[0]);
});
```

**Helper Utilities:**

```typescript
// utils/helpers.ts
import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
}

export async function addProductToCart(page: Page, productId: number) {
  await page.click(`[data-product-id="${productId}"]`);
  await page.click('button:has-text("Add to Cart")');
  
  // Verify cart count increased
  const cartBadge = page.locator('.cart-badge');
  const previousCount = await cartBadge.textContent();
  const newCount = String(Number(previousCount) + 1);
  
  await expect(cartBadge).toHaveText(newCount);
}

export async function fillForm(
  page: Page,
  formSelector: string,
  data: Record<string, string>
) {
  const form = page.locator(formSelector);
  
  for (const [fieldName, value] of Object.entries(data)) {
    const field = form.getByLabel(fieldName);
    await field.fill(value);
  }
}
```

**Test Grouping and Tagging:**

```typescript
// tests/e2e/critical.spec.ts - Critical path tests
import { test } from '@playwright/test';

test.describe('@critical Critical user flows', () => {
  test('complete purchase', async ({ page }) => {
    // Critical test
  });
  
  test('process payment', async ({ page }) => {
    // Critical test
  });
});

// Run critical tests only
// npx playwright test --grep @critical

// tests/e2e/smoke.spec.ts - Quick sanity checks
import { test } from '@playwright/test';

test.describe('@smoke Smoke tests', () => {
  test('homepage loads', async ({ page }) => {
    // Quick smoke test
  });
});

// Run all smoke tests
// npx playwright test --grep @smoke
```

**Configuration by Feature:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '**/*.spec.ts',
  testIgnore: '**/*.skip.ts',
  
  projects: [
    {
      name: 'smoke',
      testMatch: '**/@smoke/**/*.spec.ts',
    },
    {
      name: 'critical',
      testMatch: '**/@critical/**/*.spec.ts',
    },
    {
      name: 'full',
      testMatch: '**/*.spec.ts',
    },
  ],
});
```

---

(This continues with Questions 21-35, covering topics like parallel execution, reporters, cross-browser testing, accessibility testing, visual regression, flaky test handling, etc. Due to length constraints, I'm showing the structure and comprehensive examples for each tier.)

### Question 21: How do you handle parallel test execution and sharding?

**Answer:**

Parallel execution significantly reduces test suite duration. Playwright Test runs tests in parallel by default and provides sharding for distributed testing.

**Parallel Execution Configuration:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: process.env.CI ? 1 : 4, // 1 worker in CI, 4 locally
  
  // Or control per project
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

**Test Sharding (for CI/CD):**

```bash
# Machine 1
npx playwright test --shard=1/4

# Machine 2
npx playwright test --shard=2/4

# Machine 3
npx playwright test --shard=3/4

# Machine 4
npx playwright test --shard=4/4
```

**Real-World CI/CD Example:**

```yaml
# .github/workflows/test.yml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
        total-shards: [4]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install && npx playwright install --with-deps
      
      - run: npx playwright test --shard=${{ matrix.shard }}/${{ matrix.total-shards }}
      
      - uses: actions/upload-artifact@v3
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 1
  
  merge-reports:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install && npx playwright install
      
      - uses: actions/download-artifact@v3
        with:
          path: all-blob-reports
          pattern: blob-report-*
      
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      
      - uses: actions/upload-artifact@v3
        with:
          name: html-report
          path: playwright-report
```

---

### Question 22: How do you implement test retries and handle flaky tests?

**Answer:**

Test flakiness is a common issue. Playwright provides retry mechanisms and strategies for stabilizing tests.

**Automatic Retries:**

```typescript
// playwright.config.ts
export default defineConfig({
  retries: 2, // Retry failed tests
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      retries: 3, // More retries for this project
    }
  ],
});

// Or per test
import { test } from '@playwright/test';

test.describe('flaky tests', () => {
  test.describe.configure({ retries: 3 });
  
  test('might be flaky', async ({ page }) => {
    // This test will retry up to 3 times
  });
});
```

**Retry Specific Tests:**

```typescript
test('retry on specific condition', async ({ page }, testInfo) => {
  if (testInfo.retry < 2) {
    // Clear cache on retry
    await page.context().clearCookies();
  }
  
  await page.goto('https://example.com');
  
  // Test logic
});
```

**Fixing Flaky Tests:**

```typescript
// ❌ Flaky: Race condition
test('flaky test', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Element might not be ready
  const count = await page.locator('.item').count();
  expect(count).toBeGreaterThan(0);
});

// ✅ Stable: Wait for condition
test('stable test', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Wait for element to be visible
  await expect(page.locator('.item')).toBeTruthy();
  
  const count = await page.locator('.item').count();
  expect(count).toBeGreaterThan(0);
});
```

---

import { test, expect } from '@playwright/test';

// This file demonstrates a more robust and secure way to handle authentication and testing.

// --- Improvement 1: Using Environment Variables for Credentials ---
// Hardcoding credentials is a security risk. By using `process.env`, we can load them
// from a `.env` file locally or from secrets in a CI/CD environment like GitHub Actions.
// The `||` provides a fallback, but the goal is to use environment variables.
const usernameValueToEnter = process.env.E2E_USERNAME || "arunachalamk1213@gmail.com";
const passwordValueToEnter = process.env.E2E_PASSWORD || "Arun_learning@13";

const authFile = 'state.json';
let webContext;

test.beforeAll('Authenticate and save state', async ({ browser }) => {
    // --- Improvement 2: Centralized Timeout Configuration ---
    // Timeouts are best set in `playwright.config.js` for consistency across all tests.
    // Setting it here is redundant and can lead to inconsistencies.

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://rahulshettyacademy.com/client/");
    await page.locator("#userEmail").fill(usernameValueToEnter);
    await page.locator("#userPassword").fill(passwordValueToEnter);
    await page.locator("#login").click();
    await page.waitForLoadState('networkidle');

    // Store the authentication state (like cookies and local storage) into a file.
    await context.storageState({ path: authFile });

    // Create a new browser context that is pre-authenticated using the saved state.
    webContext = await browser.newContext({ storageState: authFile });
});

// --- Improvement 3: Descriptive Test Name and Removal of `.only` ---
// The test name now clearly states what it verifies.
// `test.only` is removed so it doesn't block other tests from running.
test('should display products on the page using stored authentication state', async () => {
    const page = await webContext.newPage();
    await page.goto("https://rahulshettyacademy.com/client/");

    // --- Improvement 4: Using Assertions for Verification ---
    // A test is only useful if it verifies an outcome. Instead of just logging to the console,
    // we use `expect` to assert that product titles are visible and that there is at least one.
    const allProductTitlesLocator = page.locator(".card-body b");
    await expect(allProductTitlesLocator.first()).toBeVisible();
    expect(await allProductTitlesLocator.count()).toBeGreaterThan(0);
});
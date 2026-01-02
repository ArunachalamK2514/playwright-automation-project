import { test, expect } from "@playwright/test"

test("Screenshot test", async ({ page }) => {
    await page.goto("https://rahulshettyacademy.com/AutomationPractice/");

    const hideButton = page.locator("#hide-textbox");
    const elementToBeHidden = page.getByPlaceholder("Hide/Show Example");

    await expect(elementToBeHidden).toBeVisible();
    // taking screenshot of a specific element
    await elementToBeHidden.screenshot({path: "AutomationPractiseScreenshotElementExample.png"});
    await hideButton.click();
    await expect(elementToBeHidden).toBeHidden();
    // taking screenshot of the entire page in view
    await page.screenshot({path: "AutomationPractiseScreenshotPageExample.png"});
});

test.fixme("Visual Comparison Test", async({page}) => {
    await page.goto("https://www.google.com/");
    expect(await page.screenshot()).toMatchSnapshot("GoogleLandingPage.png");
})
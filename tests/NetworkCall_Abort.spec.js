import { test, expect, request } from "@playwright/test"

test.only("Network intercept test for Abort", async ({ page }) => {
    test.setTimeout(60000);
    const usernameLocator = page.locator("#username");
    const passwordLocator = page.locator("[type='password']");
    const signInButtonLocator = page.locator("#signInBtn");
    page.on("request", request => console.log(request.url()));
    page.on("response", response => console.log("***Response:*** "+ response.url() + " ***and status is:*** " + response.status() + "\n"));
    // Intercepting the network to abort the API calls that fetches the images of the products.
    await page.route("**/*.{jpg, png, jpeg}", route => route.abort());
    await page.goto("https://rahulshettyacademy.com/loginpagePractise/");
    const title = await page.title();
    console.log(title);
    await expect(page).toHaveTitle(title);
    await usernameLocator.fill('rahulshettyacademy');
    await passwordLocator.fill('learning');
    await signInButtonLocator.click();

    const allItemsLocator = page.locator("h4[class='card-title'] a");
    await allItemsLocator.last().waitFor();
    console.log(await allItemsLocator.allTextContents());
});
import { test, expect } from "@playwright/test"

test("Additional Element Test", async ({ page }) => {
    // await page.goto("https://www.google.com/");
    await page.goto("https://rahulshettyacademy.com/AutomationPractice/");

    // // Navigating to the previous page
    // await page.goBack();

    // // Navigating Forward
    // await page.goForward();

    const hideButton = page.locator("#hide-textbox");
    const elementToBeHidden = page.getByPlaceholder("Hide/Show Example");

    await expect(elementToBeHidden).toBeVisible();
    await hideButton.click();
    await expect(elementToBeHidden).toBeHidden();

    const alertConfirmButton = page.locator("#confirmbtn");
    const alertButton = page.locator("#alertbtn");

    // Handling alert pop up or dialogue using the 'on' listener. When on is used, it will wait for the event to occur. Here the event is the alert or the dialog event. We can accept or dismiss the alert or dialog.
    // Always add the listener before the action that triggers the alert or dialog.
    page.once("dialog", async dialog => await dialog.accept());

    await alertButton.click();

    // Dismissing the alert
    page.once("dialog", async (dialog) => {
        console.log(dialog.message());
        await dialog.dismiss();

    });

    await alertConfirmButton.click();


    // Hovering over an element
    const hoverButton = page.getByRole("button", { name: "Mouse Hover" });
    await hoverButton.hover();

    const hoverOptionTop = page.locator("div.mouse-hover-content a[href*=top]");
    await hoverOptionTop.click();

    // Handling frames in playwright.
    // In Playwright, use the frameLocator() method to set the locator of the frame under test. Then whatever action performed inside the iframe should be using the respective variable page and not the original 'page'.
    const framesPage = page.frameLocator("#courses-iframe");
    const learningPathsTopLink = framesPage.locator(".border-border a[href*='learning-paths']");
    await learningPathsTopLink.click();

    const javaAutomationCourse = framesPage.getByRole("heading", {name : "Java Automation"});
    await expect(javaAutomationCourse).toBeVisible();

    // Trying to click on the button in the main page - we use the original 'page' fixture
    await page.locator("input[value='radio1']").click();


});
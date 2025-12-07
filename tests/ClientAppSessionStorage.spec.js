import {test, expect} from "@playwright/test"

let webContext;
test.beforeAll(async ({browser}) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://rahulshettyacademy.com/client/");
    const usernameLocator = page.locator("#userEmail");
    const passwordLocator = page.locator("#userPassword");
    const loginButtonLocator = page.locator("#login");
    const usernameValueToEnter = "arunachalamk1213@gmail.com";
    await usernameLocator.fill(usernameValueToEnter);
    await passwordLocator.fill("Arun_learning@13");
    await loginButtonLocator.click();
    await page.waitForLoadState('networkidle');

    // This is where we store the state in a JSON file
    await context.storageState({path : "state.json"});
    // This is where we set the state to a new context                                                                                                                                                                          
    webContext = await browser.newContext({storageState : "state.json"});

});

test.only("Session Storage state test", async () =>{
    test.setTimeout(60000);
    // This is where we use the webContext with state to crete new pages
    const page = await webContext.newPage();
    await page.goto("https://rahulshettyacademy.com/client/");
    console.log("This is a test for Session storage state");
    const allCartItemsLocator = page.locator("div[class='card-body'] b");
    await allCartItemsLocator.first().waitFor();
    console.log(await allCartItemsLocator.allTextContents());
});
const { test, expect } = require('@playwright/test');

test('Browser context Playwright Test', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://www.google.com/");

});

test('Page without Context Playwright Test', async ({ page }) => {
    await page.goto("https://www.google.com/");
    console.log(await page.title());
});

test("Page without Context Playwright Test - Run this test Only", async ({ page }) => {
    await page.goto("https://rahulshettyacademy.com/loginpagePractise/");
    const title = await page.title();
    console.log(title);
    await expect(page).toHaveTitle(title);
    const usernameLocator = page.locator("#username");
    const passwordLocator = page.locator("[type='password']");
    const signInButtonLocator = page.locator("#signInBtn");
    await usernameLocator.fill('rahulshetty');
    await passwordLocator.fill('learning');
    await signInButtonLocator.click();
    const errorMessageLocator = page.locator("[style*='block']");
    // Getting the error message
    const errorMessage = await errorMessageLocator.textContent();
    // Printing the error message
    console.log(errorMessage);
    // Validating the error message
    await expect(errorMessageLocator).toContainText("Incorrect username/password.");
    await usernameLocator.fill('rahulshettyacademy');
    await signInButtonLocator.click();
    // // Unlike selenium that returns the 1st element even if the locator is not unique, Playwright throws "Error: strict mode violation" if the locator is not unique
    // console.log(await page.locator("h4[class='card-title'] a").textContent());
    const allItemsLocator = page.locator("h4[class='card-title'] a");
    // Printing the text of the first element
    console.log(await allItemsLocator.first().textContent());
    //Printing the text of the 2nd element
    console.log(await allItemsLocator.nth(1).textContent());
    // Printing the text of the last element
    console.log(await allItemsLocator.last().textContent());
    // Printing text of all the elements
    console.log(await allItemsLocator.allTextContents());

});

test("New Website Automation", async ({ page }) => {
    await page.goto("https://rahulshettyacademy.com/client/");
    const usernameLocator = page.locator("#userEmail");
    const passwordLocator = page.locator("#userPassword");
    const loginButtonLocator = page.locator("#login");
    await usernameLocator.fill("arunachalamk1213@gmail.com");
    await passwordLocator.fill("Arun_learning@13");
    await loginButtonLocator.click();

    // printing the first item
    // console.log(await page.locator("div[class='card-body'] b").first().textContent());

    /* Though the previous test returns the text of all the elements after commenting the individual textContent() lines, this returns the empty array []. 'allTextContents()' can be 0 or 1000 based on the scenario.
    So we have to handle this differently to explictly wait for all the elements to be available before we could print the titles.
    The way we can do that is wait for the network state to be idle - meaning, once the user logins, a lot of network calls are made so that the UI renders the data from the response.
    There is an API call to fetch all the product details in the response which is then rendered by the UI. We will wait for this event to complete and then print all the products*/

    const allCartItemsLocator = page.locator("div[class='card-body'] b");

    // Wait for the network calls to be done
    // await page.waitForLoadState('networkidle');

    // The above method is discouraged per the latest playwright docs, so we will use another method to directly wait for the locator 
    await allCartItemsLocator.first().waitFor();
    console.log(await allCartItemsLocator.allTextContents());

});

test("UI Controls", async ({ page }) => {

    await page.goto("https://rahulshettyacademy.com/loginpagePractise/");
    const username = page.locator("#username");
    const password = page.locator("[type='password']");
    const signInButton = page.locator("#signInBtn");
    const dropdown = page.locator("select.form-control");
    // Selecting an option in the "Select" (static) dropdown
    await dropdown.selectOption("consult");
    // Selecting a radio button
    const userRadioButton = page.locator("span.checkmark").nth(1);
    const userWebPopUpOkay = page.locator("#okayBtn");
    // Before clicking we will use "isChecked()" method to check if it's already checked and if not, we will go ahead and click the radio button
    if (await userRadioButton.isChecked() === false) {
        await userRadioButton.click();
    }
    /*  // Alternate code for the if block
      if (!(await userRadioButton.isChecked())) {
          await userRadioButton.click();
      } */

    await userWebPopUpOkay.click();
    // Assertion to check whether the radio button we checked is actually selected.
    await expect(userRadioButton).toBeChecked();
    const termsAndConditions = page.locator("#terms");
    // Clicking on the checkbox
    await termsAndConditions.click();

    // Assertion to check if the checkbox is checked
    await expect(termsAndConditions).toBeChecked();

    // Another methd for validating positive assertion
    expect(await termsAndConditions.isChecked()).toBeTruthy();

    // For unchecking a checkbox, playwright has a method called "uncheck()"
    await termsAndConditions.uncheck();

    // Assertion using "not" to see if the checkbox is unchecked
    await expect(termsAndConditions).not.toBeChecked(); 

    // There is another way of asserting the negative condition. We use "toBeFalsy()"
    expect(await termsAndConditions.isChecked()).toBeFalsy(); 

    // Validating blinking text in this page. Using a new method called "toHaveAttribute(name, value)" on the locator in the assertion
    const documentLink = page.locator("a[href*='documents-request']");
    await expect(documentLink).toHaveAttribute("class", "blinkingText");

    // When we use pause(), Playwright Inspector will open, we can see the execution step by step (like debug) and we will also be able to do multiple actions. More on that later.
    // await page.pause();
});

test("Child Window handling test", async({browser})=> {

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://rahulshettyacademy.com/loginpagePractise/");
    const username = page.locator("#username");

    const documentLink = page.locator("a[href*='documents-request']");

    // The click event on the documentLink locator will open a new tab. We have to use waitForEvent('page') method to wait for the new page to open.
    // There is a catch. Unlike Selenium where you click on a link and then switch to window after the fact, we can't do that in javascript.
    // We need both the promises to be fulfilled (click action and the new page opening event) before we act on the new page.
    // We will have to use Promise.all for those 2 events to resolve.
    // Note that the waitForEvent can not be called before the click event seperately because, it would have waited for the event but the new page event happens only after click.
    // Also, we can not have the waitForEvent method after the click event because, the click event triggers the newPage event and hence having waitForEvent after click will never be resolved.
    // Hence we will have use the javascript's asynchronous calls to achive this.
    // Following is the implementation where we capture the items returned in an array and then use the returned item to perform actions on the new page.

    const [documentPage] = await Promise.all(
        [
                context.waitForEvent('page'),
                documentLink.click()
        ]
    );

    const emailParaText = await documentPage.locator("p.red").textContent();
    console.log(emailParaText);

    // Printing only the site name using split function.

    const domain = emailParaText.split('@')[1].split(' ')[0];
    console.log(domain);

    // Entering the domain name in the username field in the first page. Note that we use the old page.locator
    await username.fill(domain);
    
    // Verify by printing what is entered in the username field
    console.log(await username.inputValue());

});
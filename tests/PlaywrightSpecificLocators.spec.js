import {test, expect} from '@playwright/test'

test("Playwright special locator Test", async({page}) => {

    await page.goto("https://rahulshettyacademy.com/angularpractice/");
    
    // We will look at getByLabel() method from playwright first.
    // Whenever the DOM tag is a 'label' and we want to click() or check() or selectOption() on the radio button or checkbox or a 'Select' dropdown, we can specifically use this method

    await page.getByLabel("Check me out if you Love IceCreams!").click();
    await page.getByLabel("Employed").check();
    await page.getByLabel("Gender").selectOption("Female");

    // Whenever we have a placeholder in the DOM, we can use getByPlaceholder() to work on that element
    await page.getByPlaceholder("Password").fill("ThisIsAPassword");

    // We can use the getByRole() method to click on a button for example when passing 'button' as the first argument and the name name or text of the button as the second argument without actually having the locator
    // Note that the name should be unique for Playwright to identify the exact item to perform action on. If there are multiple buttons, we provide the second parameter to uniquely identify what we want.

    await page.getByRole("button", {name: "Submit"}).click();

    // We can use getByText() method, pass the exact text we are expecting and then perform an action

    expect(await page.getByText("Success! The Form has been submitted successfully!.").isVisible()).toBeTruthy();

    // We can use getByRole("link", {name : "SOMENAME"}) to handle the links or anchor tags and getByRole("heading", {name : "SOMENAME"}) to handle h1, h2, h3 headings in the page

    await page.getByRole("link", {name : "Shop"}).click();
    await expect(page.getByRole("heading", {name : "Shop Name"})).toBeVisible();

    // Locator chaining the playwright methods - We use  the locator to identify list of items, then use filter to get the item that has a particular text, then from that element, we get the element that is a button and then we click on it.
    // Note that in the getByRole() method, we only use the "button" parameter and not the optional parameter like before since this scope of element has only one button.
    await page.locator("app-card").filter({hasText : "Nokia Edge"}).getByRole("button").click();

    const checkoutButton = page.locator("a.btn-primary");
    const checkoutText = await checkoutButton.textContent();
    expect(!checkoutText.includes("0")).toBeTruthy();





});
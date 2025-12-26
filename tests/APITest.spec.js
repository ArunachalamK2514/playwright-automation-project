import { test, expect, request } from '@playwright/test';
import { APIUtils } from '../utils/APIUtils';

const loginPayload = { userEmail: "arunachalamk1213@gmail.com", userPassword: "Arun_learning@13" };
const ordersPayload = {
    orders: [
        {
            country: "Cuba",
            productOrderedId: "68a961719320a140fe1ca57c"
        }
    ]
};
let APIResponse = {};

test.beforeAll(async () => {

    const APIContext = await request.newContext();
    const apiUtils = new APIUtils(APIContext, loginPayload);
    APIResponse = await apiUtils.createOrder(ordersPayload);



});


test("Client app validate generated OrderID is displayed using API", async ({ page }) => {



    // We need to execute a javascript piece of code to set the token in the local storage of the browser window.
    // This can be done using the addInitScript() method in the page fixture.

    // The second argument (APIResponse.token) is passed as 'tokenValue' to the arrow function
    // Note: To pass multiple arguments, wrap them in an object (e.g. { token: '...', email: '...' })
    await page.addInitScript(tokenValue => {
        window.localStorage.setItem("token", tokenValue);
    }, APIResponse.token);

    await page.goto("https://rahulshettyacademy.com/client/");
    // Since we have set the token in the local storage, the following lines for login can be removed

    /* const usernameLocator = page.locator("#userEmail");
    const passwordLocator = page.locator("#userPassword");
    const loginButtonLocator = page.locator("#login");
    const usernameValueToEnter = "arunachalamk1213@gmail.com";
    await usernameLocator.fill(usernameValueToEnter);
    await passwordLocator.fill("Arun_learning@13");
    await loginButtonLocator.click(); */

    // If verifying the order id in the orders page is the only scenario, we can comment the pre-requisite of crating the order and have the PI call to create and then grab the order id.
    // So the following lines can be commented out

    /*const allCartItemsLocator = page.locator("div[class='card-body'] b");
    await allCartItemsLocator.first().waitFor();
    console.log(await allCartItemsLocator.allTextContents());

    // We are trying to add 'ADIDAS ORIGINAL' into the cart

    // We can get the count of the items matching the locator using 'count()' on the locator
    const productToAdd = "ADIDAS ORIGINAL";
    const allProducts = page.locator("div.card-body");
    const productCount = await allProducts.count();

    for (let i = 0 ; i < productCount ; i++) {
        const product = allProducts.nth(i);
        if (await product.locator("b").textContent() === productToAdd){
            await product.locator("text= Add To Cart").click();
            break;
        }
    }

    const productAddedSuccessMessage = page.locator("div[aria-label='Product Added To Cart']");
    await expect(productAddedSuccessMessage).toBeVisible();
    await expect(productAddedSuccessMessage).toBeHidden();

    const cartButton = page.locator("button[routerlink='/dashboard/cart']");
    await cartButton.click();

    const cartItems = page.locator("div[class='infoWrap']");
    await cartItems.last().waitFor();
    let productItemNumber = "";
    const cartItemsCount = await cartItems.count();
    for(let i = 0; i< cartItemsCount; i++){
        const cartItem = cartItems.nth(i);
        if(await cartItem.locator("h3").textContent() === productToAdd) { // We can also use page.locator("h3:has-text('"+ productToAdd + "')")
            console.log(productToAdd + " added in the cart as expected");
            productItemNumber = await cartItem.locator("p[class='itemNumber']").textContent();
            console.log("Item Number of the product added: " + productItemNumber);
            break;

        }
    }

    // Checkout flow
    const checkoutButton = page.locator("ul button[type='button']");
    await checkoutButton.click();

    const userLabelShippingInfo = page.locator("div[class*='user__name'] label");
    expect(await userLabelShippingInfo.textContent()).toEqual(loginPayload.userEmail);

    const countryShippingInfo = page.locator("input[placeholder='Select Country']");
    await countryShippingInfo.waitFor();
    await countryShippingInfo.pressSequentially("Ind");

    const countryList = page.locator("section.ta-results button");
    await countryList.last().waitFor();

    for(let i=0; i<await countryList.count(); i++) {
        const countryToSelect = countryList.nth(i);
        if((await countryToSelect.textContent()).trim() === "India"){
            await countryToSelect.click();
            console.log(await countryShippingInfo.inputValue() + " is selected as the country");
            break;
        }
        
    }
    const placeOrder = page.locator("a.action__submit");
    await placeOrder.click();

    // Order Confirmation flow
    const orderConfirmationMessage = page.locator("h1.hero-primary");
    expect(await orderConfirmationMessage.textContent()).toContain("Thankyou for the order.");
    // We can also use this method to exactly match the text without using textContent()
    // await expect(orderConfirmationMessage).toHaveText(" Thankyou for the order. "); 

    const orderId = page.locator("label[class='ng-star-inserted']");
    await expect(orderId).toBeVisible();
    const trimmedOrderID = (await orderId.textContent()).replaceAll("|", "").trim();
    console.log("The order ID of the order placed is: '" + trimmedOrderID + "'");*/

    // Orders tab flow
    const ordersButton = page.locator("button[routerlink*='orders']");
    await ordersButton.click();

    const yourOrdersLabel = page.locator("div h1");
    await expect(yourOrdersLabel).toHaveText("Your Orders");

    const orderRows = page.locator("table[class*='ng-star-inserted'] tbody tr");
    await orderRows.last().waitFor();
    const orderRowCount = await orderRows.count();

    for (let i = 0; i < orderRowCount; i++) {
        const uniqueOrderID = orderRows.nth(i).locator("th");
        if (await uniqueOrderID.textContent() === APIResponse.orderID) {
            await orderRows.nth(i).locator("td button[class*='btn-primary']").click();
            break;
        }
    }

    await expect(page.locator("div.email-title")).toHaveText(" order summary ");
    await expect(page.locator("div.col-text")).toHaveText(APIResponse.orderID);


});
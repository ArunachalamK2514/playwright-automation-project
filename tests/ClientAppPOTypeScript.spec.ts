import { test, expect } from '@playwright/test';
import { PageObjectManager } from "../pageobjectsTypeScript/PageObjectManager"
import { customTestTypescript } from '../utils/CustomTestTypescript';

// Convert the json object into String (to avoid any parsing errors) and then parse the json to JS object.
const dataset = JSON.parse(JSON.stringify(require("../testData/ClientAppPOTestData.json")));

test.describe.configure({mode: "default"});
test.describe('E2E Purchase Flow Validations', () => {
for (const data of dataset){
test(`@WebTest Client app positive flow ${data.productToAdd}`, async ({ page }) => {

    const POManager = new PageObjectManager(page);
    // Logging in to the application
    const loginPage = POManager.getLoginPage();
    await loginPage.launchApplication();
    await loginPage.loginToApplication(data.username, data.password);

    // Adding product to cart
    const dashboardPage = POManager.getDashboardPage();
    await dashboardPage.logAllItems();
    await dashboardPage.addProductToCart(data.productToAdd);

    await expect(dashboardPage.productAddedSuccessMessage).toBeVisible();
    await expect(dashboardPage.productAddedSuccessMessage).toBeHidden();

    // Validations in cart page
    const cartPage = POManager.getCartPage();
    await cartPage.navigateToCartPage();
    await cartPage.validateItemAddedToCart(data.productToAdd);
    await cartPage.navigateToCheckoutPage();

    // Checkout flow
    const checkoutPage = POManager.getCheckoutPage();
    expect(await checkoutPage.userLabelShippingInfo.textContent()).toEqual(data.username);
    await checkoutPage.enterShippingCountry("Ind", "India");
    await checkoutPage.placeOrder();

    // Order Confirmation flow
    const orderConfirmationPage = POManager.getOrderConfirmationPage();
    expect(await orderConfirmationPage.orderConfirmationMessage.textContent()).toContain("Thankyou for the order.");

    await expect(orderConfirmationPage.orderId).toBeVisible();
    const trimmedOrderID = (await orderConfirmationPage.orderId.textContent() ?? "").replaceAll("|", "").trim();
    console.log("The order ID of the order placed is: '" + trimmedOrderID + "'");

    // Orders tab flow
    const ordersPage = POManager.getOrdersPage();
    await ordersPage.navigateToOrdersPage();
    await expect(ordersPage.yourOrdersLabel).toHaveText("Your Orders");
    await ordersPage.clickViewOnPlacedOrder(trimmedOrderID);

    //Order Summary Page Validations
    const orderSummaryPage = POManager.getOrderSummaryPage();
    await expect(orderSummaryPage.orderSummaryTitle).toHaveText(" order summary ");
    await expect(orderSummaryPage.orderIdInSummaryPage).toHaveText(trimmedOrderID);


});
}
});

customTestTypescript("Test using custom fixtures - Client App Login", async({page, customDataForOrder}) => {
    const POManager = new PageObjectManager(page);
    // Logging in to the application
    const loginPage = POManager.getLoginPage();
    await loginPage.launchApplication();
    await loginPage.loginToApplication(customDataForOrder.username, customDataForOrder.password);

    // Printing all available items
    const dashboardPage = POManager.getDashboardPage();
    await dashboardPage.logAllItems();
});
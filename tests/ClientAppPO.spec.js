import { test, expect } from '@playwright/test';
import { PageObjectManager} from "../pageobjects/PageObjectManager"

const usernameValueToEnter = "arunachalamk1213@gmail.com";
const passwordValueToEnter = "Arun_learning@13";
const productToAdd = "ADIDAS ORIGINAL";

test("Client app positive flow", async ({ page }) => {

    const POManager = new PageObjectManager(page);
    // Logging in to the application
    const loginPage = POManager.getLoginPage();
    await loginPage.launchApplication();
    await loginPage.loginToApplication(usernameValueToEnter, passwordValueToEnter);

    // Adding product to cart
    const dashboardPage = POManager.getDashboardPage();
    await dashboardPage.logAllItems();
    await dashboardPage.addProductToCart(productToAdd);
    
    await expect(dashboardPage.productAddedSuccessMessage).toBeVisible();
    await expect(dashboardPage.productAddedSuccessMessage).toBeHidden();

    // Validations in cart page
    const cartPage = POManager.getCartPage();
    await cartPage.navigateToCartPage();
    await cartPage.validateItemAddedToCart(productToAdd);
    await cartPage.navigateToCheckoutPage();
    
    // Checkout flow
    const checkoutPage = POManager.getCheckoutPage();
    expect(await checkoutPage.userLabelShippingInfo.textContent()).toEqual(usernameValueToEnter);
    await checkoutPage.enterShippingCountry("Ind", "India");
    await checkoutPage.placeOrder();

    // Order Confirmation flow
    const orderConfirmationPage = POManager.getOrderConfirmationPage();
    expect(await orderConfirmationPage.orderConfirmationMessage.textContent()).toContain("Thankyou for the order.");

    await expect(orderConfirmationPage.orderId).toBeVisible();
    const trimmedOrderID = (await orderConfirmationPage.orderId.textContent()).replaceAll("|", "").trim();
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
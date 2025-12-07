import { test, expect } from '@playwright/test';

test.only("Client app positive flow using playwright locators", async({page}) => {

    await page.goto("https://rahulshettyacademy.com/client/");
    const usernameLocator = page.getByPlaceholder("email@example.com");
    const passwordLocator = page.getByPlaceholder("enter your passsword");
    const loginButtonLocator = page.getByRole("button", {name : "Login"});
    const usernameValueToEnter = "arunachalamk1213@gmail.com";
    await usernameLocator.fill(usernameValueToEnter);
    await passwordLocator.fill("Arun_learning@13");
    await loginButtonLocator.click();

    const allCartItemsLocator = page.getByRole("heading");
    await allCartItemsLocator.first().waitFor();
    console.log(await allCartItemsLocator.allTextContents());

    // We are trying to add 'ADIDAS ORIGINAL' into the cart

    // We can get the count of the items matching the locator using 'count()' on the locator
    const productToAdd = "ADIDAS ORIGINAL";

    await page.locator("div.card-body").filter({hasText : productToAdd}).getByRole("button", {name : " Add To Cart"}).click();

    const productAddedSuccessMessage = page.getByRole("alert");
    await expect(productAddedSuccessMessage).toHaveText(" Product Added To Cart ");
    await expect(productAddedSuccessMessage).toBeHidden();

    const cartButton = page.getByRole("listitem").getByRole("button", {name : "Cart"});
    await cartButton.click();

    const cartItems = page.locator("div[class='infoWrap']");
    await cartItems.last().waitFor();
    let productItemNumber = "";

    // cartItems.getByRole("heading", {name : productToAdd})

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

    // // Checkout flow
    // const checkoutButton = page.locator("ul button[type='button']");
    // await checkoutButton.click();

    // const userLabelShippingInfo = page.locator("div[class*='user__name'] label");
    // expect(await userLabelShippingInfo.textContent()).toEqual(usernameValueToEnter);

    // const countryShippingInfo = page.locator("input[placeholder='Select Country']");
    // await countryShippingInfo.waitFor();
    // await countryShippingInfo.pressSequentially("Ind");

    // const countryList = page.locator("section.ta-results button");
    // await countryList.last().waitFor();

    // for(let i=0; i<await countryList.count(); i++) {
    //     const countryToSelect = countryList.nth(i);
    //     if((await countryToSelect.textContent()).trim() === "India"){
    //         await countryToSelect.click();
    //         console.log(await countryShippingInfo.inputValue() + " is selected as the country");
    //         break;
    //     }
        
    // }
    // const placeOrder = page.locator("a.action__submit");
    // await placeOrder.click();

    // // Order Confirmation flow
    // const orderConfirmationMessage = page.locator("h1.hero-primary");
    // expect(await orderConfirmationMessage.textContent()).toContain("Thankyou for the order.");
    // // We can also use this method to exactly match the text without using textContent()
    // // await expect(orderConfirmationMessage).toHaveText(" Thankyou for the order. ");

    // const orderId = page.locator("label[class='ng-star-inserted']");
    // await expect(orderId).toBeVisible();
    // const trimmedOrderID = (await orderId.textContent()).replaceAll("|", "").trim();
    // console.log("The order ID of the order placed is: '" + trimmedOrderID + "'");

    // // Orders tab flow
    // const ordersButton = page.locator("button[routerlink*='orders']");
    // await ordersButton.click();

    // const yourOrdersLabel = page.locator("div h1");
    // await expect(yourOrdersLabel).toHaveText("Your Orders");

    // const orderRows = page.locator("table[class*='ng-star-inserted'] tbody tr");
    // await orderRows.last().waitFor();
    // const orderRowCount = await orderRows.count();

    // for (let i=0 ; i< orderRowCount; i++){
    //     const uniqueOrderID = orderRows.nth(i).locator("th");
    //     if(await uniqueOrderID.textContent() === trimmedOrderID){
    //         await orderRows.nth(i).locator("td button[class*='btn-primary']").click();
    //         break;
    //     }
    // }

    // await expect(page.locator("div.email-title")).toHaveText(" order summary ");
    // await expect(page.locator("div.col-text")).toHaveText(trimmedOrderID);
    await page.pause();


});
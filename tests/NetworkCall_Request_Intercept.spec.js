import { test, expect, request } from "@playwright/test"
import { APIUtils } from "../utils/APIUtils"

const loginPayload = { userEmail: "arunachalamk1213@gmail.com", userPassword: "Arun_learning@13" };
let token;

test.beforeAll(async () => {
    const APIContext = await request.newContext();
    const apiUtils = new APIUtils(APIContext, loginPayload);
    token = await apiUtils.getToken();
});

test("Response Network intercept test", async ({ page }) => {

    console.log("This is a network intercept test for request");

    await page.addInitScript(value => {
        window.localStorage.setItem("token", value);
    }, token);

    await page.goto("https://rahulshettyacademy.com/client/");
    
    await page.locator("button[routerlink*='myorders']").click();
    //intercepting request -APi request-> { playwright fakerequest}->browser->render data on front end
    await page.route("https://rahulshettyacademy.com/api/ecom/order/get-orders-details?id=*",
        route => route.continue({ url : "https://rahulshettyacademy.com/api/ecom/order/get-orders-details?id=693314cd32ed865871214b711322134"})
    );
    await page.locator("button[class *= 'btn-primary']").first().click();
    await page.waitForResponse("https://rahulshettyacademy.com/api/ecom/order/get-orders-details?id=*");
    console.log(await page.locator("p[class = 'blink_me']").textContent());
    await expect(page.locator("p[class = 'blink_me']")).toHaveText("You are not authorize to view this order");
    
});
import { test, expect, request } from "@playwright/test"
import { APIUtils } from "../utils/APIUtils"

const loginPayload = { userEmail: "arunachalamk1213@gmail.com", userPassword: "Arun_learning@13" };
const fakePayloadOrders = { data: [], message: "No Orders" };
let resp = {};

test.beforeAll(async () => {
    const APIContext = await request.newContext();
    const apiUtils = new APIUtils(APIContext, loginPayload);
    resp = await apiUtils.getTokenAndUserId();
});

test("@APITest Response Network intercept test", async ({ page }) => {

    console.log("This is a network intercept test for response");

    await page.addInitScript(value => {
        window.localStorage.setItem("token", value);
    }, resp.token);

    await page.goto("https://rahulshettyacademy.com/client/");
    //intercepting response -APi response-> { playwright fakeresponse}->browser->render data on front end
    await page.route("https://rahulshettyacademy.com/api/ecom/order/get-orders-for-customer/" + resp.userID,
        async route => {
            const myOrdersResponse = await page.request.fetch(route.request());
            let body = JSON.stringify(fakePayloadOrders);
            route.fulfill(
                {
                    response: myOrdersResponse,
                    body: body
                }
            );
        }
    );
    await page.locator("button[routerlink*='myorders']").click();
    await page.waitForResponse("https://rahulshettyacademy.com/api/ecom/order/get-orders-for-customer/" + resp.userID);
    console.log(await page.locator(".mt-4").textContent());
});
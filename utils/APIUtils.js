import { expect } from "@playwright/test";
class APIUtils {

    constructor(apiContext, loginPayload) {
        this.apiContext = apiContext;
        this.loginPayload = loginPayload;
    }

    async getToken() {

        const loginResponse = await this.apiContext.post("https://rahulshettyacademy.com/api/ecom/auth/login",
            {
                data: this.loginPayload
            }
        );
        expect(loginResponse.ok()).toBeTruthy();
        const loginResponseJson = await loginResponse.json();
        const token = loginResponseJson.token;
        console.log("Token created is: ", token);
        return token;
    }

    async createOrder(ordersPayload) {
        let response = {};
        response.token = await this.getToken();
        const orderResponse = await this.apiContext.post("https://rahulshettyacademy.com/api/ecom/order/create-order",
            {
                headers: {
                    "Authorization": response.token,
                    "content-type": "application/json"
                },
                data: ordersPayload
            }
        )
        expect(orderResponse.ok()).toBeTruthy();
        const orderResponseJson = await orderResponse.json();
        const orderID = await orderResponseJson.orders[0];
        console.log("Order Id crated is: ", orderID)
        response.orderID = orderID;
        return response;
    }
}
module.exports = { APIUtils };
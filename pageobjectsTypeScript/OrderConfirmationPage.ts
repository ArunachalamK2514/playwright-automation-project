import { Locator, Page } from "@playwright/test";

export class OrderConfirmationPage {

    readonly page: Page;
    readonly orderConfirmationMessage: Locator;
    readonly orderId: Locator;
    constructor(page: Page) {
        this.page = page;
        this.orderConfirmationMessage = this.page.locator("h1.hero-primary");
        this.orderId = this.page.locator("label[class='ng-star-inserted']");
    }
}
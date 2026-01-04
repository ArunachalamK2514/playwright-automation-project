import { Locator, Page } from "@playwright/test";

export class OrderSummaryPage {

    readonly page: Page;
    readonly orderSummaryTitle: Locator;
    readonly orderIdInSummaryPage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.orderSummaryTitle = this.page.locator("div.email-title");
        this.orderIdInSummaryPage = this.page.locator("div.col-text");
    }
}

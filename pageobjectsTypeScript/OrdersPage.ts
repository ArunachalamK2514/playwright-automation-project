import { Locator, Page } from "@playwright/test";

export class OrdersPage {

    readonly page: Page;
    readonly ordersButton: Locator;
    readonly yourOrdersLabel: Locator;
    readonly orderRows: Locator;

    constructor(page: Page) {
        this.page = page;
        this.ordersButton = this.page.locator("button[routerlink*='orders']");
        this.yourOrdersLabel = this.page.locator("div h1");
        this.orderRows = this.page.locator("table[class*='ng-star-inserted'] tbody tr");
    }

    async navigateToOrdersPage(): Promise<void> {
        await this.ordersButton.click();
    }

    async clickViewOnPlacedOrder(trimmedOrderID: string): Promise<void> {
        await this.orderRows.last().waitFor();
        const orderRowCount: number = await this.orderRows.count();

        for (let i = 0; i < orderRowCount; i++) {
            const uniqueOrderID: Locator = this.orderRows.nth(i).locator("th");
            if ((await uniqueOrderID.textContent() ?? "") === trimmedOrderID) {
                await this.orderRows.nth(i).locator("td button[class*='btn-primary']").click();
                break;
            }
        }
    }
}
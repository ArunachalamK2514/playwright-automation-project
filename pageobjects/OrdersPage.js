class OrdersPage {
    constructor(page) {
        this.page = page;
        this.ordersButton = this.page.locator("button[routerlink*='orders']");
        this.yourOrdersLabel = this.page.locator("div h1");
        this.orderRows = this.page.locator("table[class*='ng-star-inserted'] tbody tr");
    }

    async navigateToOrdersPage() {
        await this.ordersButton.click();
    }

    async clickViewOnPlacedOrder(trimmedOrderID) {
        await this.orderRows.last().waitFor();
        const orderRowCount = await this.orderRows.count();

        for (let i = 0; i < orderRowCount; i++) {
            const uniqueOrderID = this.orderRows.nth(i).locator("th");
            if (await uniqueOrderID.textContent() === trimmedOrderID) {
                await this.orderRows.nth(i).locator("td button[class*='btn-primary']").click();
                break;
            }
        }
    }
}
module.exports = { OrdersPage };
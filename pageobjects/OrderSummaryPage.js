class OrderSummaryPage {
    constructor(page) {
        this.page = page;
        this.orderSummaryTitle = this.page.locator("div.email-title");
        this.orderIdInSummaryPage = this.page.locator("div.col-text");
    }
}
module.exports = {OrderSummaryPage};
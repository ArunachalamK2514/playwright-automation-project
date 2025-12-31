class OrderConfirmationPage {
    constructor(page) {
        this.page = page;
        this.orderConfirmationMessage = this.page.locator("h1.hero-primary");
        this.orderId = this.page.locator("label[class='ng-star-inserted']");
    }
}
module.exports = {OrderConfirmationPage};
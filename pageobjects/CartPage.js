class CartPage {
    constructor(page) {
        this.page = page;
        this.cartButton = this.page.locator("button[routerlink='/dashboard/cart']");
        this.cartItems = this.page.locator("div[class='infoWrap']");
        this.checkoutButton = this.page.locator("ul button[type='button']");
    }

    async navigateToCartPage() {
        await this.cartButton.click();
    }

    async validateItemAddedToCart(productToAdd) {
        await this.cartItems.last().waitFor();
        let productItemNumber = "";
        const cartItemsCount = await this.cartItems.count();
        for (let i = 0; i < cartItemsCount; i++) {
            const cartItem = this.cartItems.nth(i);
            if (await cartItem.locator("h3").textContent() === productToAdd) { // We can also use page.locator("h3:has-text('"+ productToAdd + "')")
                console.log(productToAdd + " added in the cart as expected");
                productItemNumber = await cartItem.locator("p[class='itemNumber']").textContent();
                console.log("Item Number of the product added: " + productItemNumber);
                break;

            }
        }
    }

    async navigateToCheckoutPage() {
        await this.checkoutButton.click();
    }
}
module.exports = { CartPage };
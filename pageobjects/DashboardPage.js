class DashboardPage {
    constructor(page) {
        this.page = page;
        this.allCartItemsLocator = this.page.locator("div[class='card-body'] b");
        this.allProducts = this.page.locator("div.card-body");
        this.productAddedSuccessMessage = this.page.locator("div[aria-label='Product Added To Cart']");
    }

    async logAllItems() {
        await this.allCartItemsLocator.first().waitFor();
        console.log(await this.allCartItemsLocator.allTextContents());
    }

    async addProductToCart(productToAdd) {
            const productCount = await this.allProducts.count();

    for (let i = 0 ; i < productCount ; i++) {
        const product = this.allProducts.nth(i);
        if (await product.locator("b").textContent() === productToAdd){
            await product.locator("text= Add To Cart").click();
            break;
        }
    }
    }
}

module.exports = { DashboardPage };
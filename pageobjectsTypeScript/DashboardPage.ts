import { Locator, Page } from "@playwright/test";

export class DashboardPage {
    readonly page: Page;
    readonly allCartItemsLocator: Locator;
    readonly allProducts: Locator;
    readonly productAddedSuccessMessage: Locator;
    constructor(page: Page) {
        this.page = page;
        this.allCartItemsLocator = this.page.locator("div[class='card-body'] b");
        this.allProducts = this.page.locator("div.card-body");
        this.productAddedSuccessMessage = this.page.locator("div[aria-label='Product Added To Cart']");
    }

    async logAllItems(): Promise<void> {
        await this.allCartItemsLocator.first().waitFor();
        console.log(await this.allCartItemsLocator.allTextContents());
    }

    async addProductToCart(productToAdd: string): Promise<void> {
            const productCount = await this.allProducts.count();

    for (let i = 0 ; i < productCount ; i++) {
        const product = this.allProducts.nth(i);
        if ((await product.locator("b").textContent() ?? "").trim() === productToAdd){
            await product.locator("text= Add To Cart").click();
            break;
        }
    }
    }
}
import { Locator, Page } from "@playwright/test";

export class CheckoutPage {
    readonly page: Page;
    readonly userLabelShippingInfo: Locator;
    readonly countryShippingInfo: Locator;
    readonly countryList: Locator;
    readonly placeOrderButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.userLabelShippingInfo = this.page.locator("div[class*='user__name'] label");
        this.countryShippingInfo = this.page.locator("input[placeholder='Select Country']");
        this.countryList = this.page.locator("section.ta-results button");
        this.placeOrderButton = this.page.locator("a.action__submit");
    }

    async enterShippingCountry(contryPartialInput: string, contryToSelect: string): Promise<void> {

        await this.countryShippingInfo.waitFor();
        await this.countryShippingInfo.pressSequentially(contryPartialInput);

        await this.countryList.last().waitFor();

        for (let i = 0; i < await this.countryList.count(); i++) {
            const countryToSelect = this.countryList.nth(i);
            // Using Nullish Coalescing Operator (??) to resolve the case if null is returned instead of a string from UI.
            // In that case, an empty string is returned instead of null so we always compare a string to a string.
            if ((await countryToSelect.textContent() ?? "").trim() === contryToSelect) {
                await countryToSelect.click();
                console.log(await this.countryShippingInfo.inputValue() + " is selected as the country");
                break;
            }

        }
    }

    async placeOrder(): Promise<void> {
        await this.placeOrderButton.click();
    }
}
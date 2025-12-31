class CheckoutPage {
    constructor(page) {
        this.page = page;
        this.userLabelShippingInfo = this.page.locator("div[class*='user__name'] label");
        this.countryShippingInfo = this.page.locator("input[placeholder='Select Country']");
        this.countryList = this.page.locator("section.ta-results button");
        this.placeOrderButton = this.page.locator("a.action__submit");
    }

    async enterShippingCountry(contryPartialInput, contryToSelect) {

        await this.countryShippingInfo.waitFor();
        await this.countryShippingInfo.pressSequentially(contryPartialInput);

        await this.countryList.last().waitFor();

        for (let i = 0; i < await this.countryList.count(); i++) {
            const countryToSelect = this.countryList.nth(i);
            if ((await countryToSelect.textContent()).trim() === contryToSelect) {
                await countryToSelect.click();
                console.log(await this.countryShippingInfo.inputValue() + " is selected as the country");
                break;
            }

        }
    }

    async placeOrder() {
        await this.placeOrderButton.click();
    }
}
module.exports = { CheckoutPage };
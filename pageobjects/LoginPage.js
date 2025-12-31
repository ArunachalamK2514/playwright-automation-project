class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameLocator = this.page.locator("#userEmail");
        this.passwordLocator = this.page.locator("#userPassword");
        this.loginButtonLocator = this.page.locator("#login");
    }

    async launchApplication() {
        await this.page.goto("https://rahulshettyacademy.com/client/");
    }

    async loginToApplication(usernameValueToEnter, passwordValueToEnter) {
        await this.usernameLocator.fill(usernameValueToEnter);
        await this.passwordLocator.fill(passwordValueToEnter);
        await this.loginButtonLocator.click();
    }

}
module.exports = { LoginPage };
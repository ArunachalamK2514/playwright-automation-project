import { Locator, Page } from "@playwright/test";

export class LoginPage {

    readonly page: Page;
    readonly usernameLocator: Locator;
    readonly passwordLocator: Locator;
    readonly loginButtonLocator: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameLocator = this.page.locator("#userEmail");
        this.passwordLocator = this.page.locator("#userPassword");
        this.loginButtonLocator = this.page.locator("#login");
    }

    async launchApplication(): Promise<void> {
        await this.page.goto("https://rahulshettyacademy.com/client/", {timeout:30000});
    }

    async loginToApplication(usernameValueToEnter: string, passwordValueToEnter: string): Promise<void> {
        await this.usernameLocator.fill(usernameValueToEnter);
        await this.passwordLocator.fill(passwordValueToEnter);
        await this.loginButtonLocator.click();
    }

}
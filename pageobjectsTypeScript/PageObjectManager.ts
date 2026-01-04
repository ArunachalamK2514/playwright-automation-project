import { LoginPage } from "./LoginPage";
import { DashboardPage } from './DashboardPage';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { OrderConfirmationPage } from "./OrderConfirmationPage";
import { OrdersPage } from "./OrdersPage";
import { OrderSummaryPage } from "./OrderSummaryPage";
import { Page } from "@playwright/test";
export class PageObjectManager {

    readonly page : Page;
    readonly loginPage: LoginPage;
    readonly dashboardPage: DashboardPage;
    readonly cartPage: CartPage;
    readonly checkoutPage: CheckoutPage;
    readonly orderConfirmationPage: OrderConfirmationPage;
    readonly ordersPage: OrdersPage;
    readonly orderSummaryPage: OrderSummaryPage;

    constructor(page: Page) {
        this.page = page;
        this.loginPage = new LoginPage(this.page);
        this.dashboardPage = new DashboardPage(this.page);
        this.cartPage = new CartPage(this.page);
        this.checkoutPage = new CheckoutPage(this.page);
        this.orderConfirmationPage = new OrderConfirmationPage(this.page);
        this.ordersPage = new OrdersPage(this.page);
        this.orderSummaryPage = new OrderSummaryPage(this.page);
    }

    getLoginPage() {
        return this.loginPage;
    }

    getDashboardPage() {
        return this.dashboardPage;
    }

    getCartPage() {
        return this.cartPage;
    }

    getCheckoutPage() {
        return this.checkoutPage;
    }

    getOrderConfirmationPage() {
        return this.orderConfirmationPage;
    }

    getOrdersPage() {
        return this.ordersPage;
    }

    getOrderSummaryPage() {
        return this.orderSummaryPage;
    }

}
module.exports = { PageObjectManager };
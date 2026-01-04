import { test } from "@playwright/test";

type customFixtures = {
    customDataForOrder: {
        username: string;
        password: string;
        productToAdd: string;
    };
}

export const customTestTypescript = test.extend<customFixtures>(
    {
        customDataForOrder: async ({ }, use) => {
            const data = {
                username: "arunachalamk1213@gmail.com",
                password: "Arun_learning@13",
                productToAdd: "ADIDAS ORIGINAL"
            };
            await use(data);
        }

    }
);
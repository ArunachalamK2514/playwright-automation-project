import { test } from "@playwright/test";

export const customTest = test.extend(
    {
        customDataForOrder: {
            username: "arunachalamk1213@gmail.com",
            password: "Arun_learning@13",
            productToAdd: "ADIDAS ORIGINAL"
        },

    }
);
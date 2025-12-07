import { test, expect } from '@playwright/test'

test("Calendar test", async ({ page }) => {
    const year = "2045";
    const monthInNumString = "6";
    const date = "30";
    await page.goto("https://rahulshettyacademy.com/seleniumPractise/#/offers");
    const calendarInputField = page.locator("div.react-date-picker__inputGroup");
    await calendarInputField.click();
    const monthYearSelectionButton = page.locator("button.react-calendar__navigation__label");
    await monthYearSelectionButton.click();
    const currentYearDisplayed = await monthYearSelectionButton.textContent();
    console.log(currentYearDisplayed);
    const allMonths = page.locator("button.react-calendar__year-view__months__month");
    const month = allMonths.nth(Number(monthInNumString) - 1);
    const allDatesOfCurrentMonth = page.locator(".react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)");
    const dateToClick = allDatesOfCurrentMonth.nth(Number(date) - 1);

    if (year === currentYearDisplayed) {
        await month.click();
        await dateToClick.click();
    } else {
        await monthYearSelectionButton.click();
        await monthYearSelectionButton.click();
        const currentCenturyByDecades = page.locator(".react-calendar__century-view__decades__decade");
        const centuryLastYear = (await currentCenturyByDecades.last().textContent()).split(" – ")[1];
        const centuryFirstYear = (await currentCenturyByDecades.first().textContent()).split(" – ")[0];
        console.log(centuryFirstYear);
        console.log(centuryLastYear);
        if (Number(centuryLastYear) > Number(year) && Number(centuryFirstYear) < Number(year)) {
            console.log("Date is in current century");
            for (let i = 0; i < await currentCenturyByDecades.count(); i++) {
                const decade = currentCenturyByDecades.nth(i);
                const decadeLastYear = Number((await decade.textContent()).split(" – ")[1]);
                if (decadeLastYear === Number(year)) {
                    await decade.click();
                    break;
                } else if (decadeLastYear < Number(year)) {
                    continue;
                } else {
                    await decade.click();
                    break;
                }
            }
            const allYearsInDecade = page.locator(".react-calendar__decade-view__years__year");
            for (let i = 0; i < await allYearsInDecade.count(); i++) {
                const currentYear = allYearsInDecade.nth(i);
                if (await currentYear.textContent() === year) {
                    await currentYear.click();
                    break;
                }
            }
            await month.click();
            await dateToClick.click();
        } else {
            console.log("Date is in previous or next century");
        }

    }







});
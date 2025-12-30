import {test, expect} from "@playwright/test";
import ExcelJs from "exceljs";
const excelPath = "C:/Users/Arunachalam/Downloads/download.xlsx";

async function WriteToExcel(searchText, replaceWithText,change) {
    
    const workbook = new ExcelJs.Workbook();
    // since excel js can handle both xlsx and json files, we have to explicitely state the extension of the file
    await workbook.xlsx.readFile(excelPath);
    const worksheet = workbook.getWorksheet("Sheet1");
    const output = await readExcelAndReturnRowAndColumn(worksheet, searchText);

    const cell = worksheet.getCell(output.row + change.rowToChange, output.column + change.colToChange);
    cell.value = replaceWithText;
    await workbook.xlsx.writeFile(excelPath);
};

async function readExcelAndReturnRowAndColumn(worksheet, searchText){
    let output = {row:-1, column:-1};
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            if(cell.value === searchText){
                output.row = rowNumber;
                output.column = colNumber;
            }
        });

    });
    return output;
};

test.only("Upload Download excel validation", async ({page}) => {
    const searchText = "Mango";
    const replaceWithValue = "999";
    await page.goto("https://rahulshettyacademy.com/upload-download-test/index.html");
    //Download of a file may take some time depending on internet or browser. So we will have to wait for the download to actually complete before trying to read the file.
    // We will use waitForEvent('download') method to achieve this.
        const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#downloadButton").click(),
    ]);
    await download.saveAs(excelPath);
    await WriteToExcel(searchText, replaceWithValue, {rowToChange:0, colToChange:2});
    const uploadButton = page.locator("#fileinput");
    // For handling the upload of files, we have an in-built method in playwright called setInputFiles(path).
    // This method only works if the element's 'type' component is 'file'.
    await uploadButton.setInputFiles(excelPath);
    const targetRow = page.getByRole("row").filter({hasText: searchText});
    await expect(targetRow.locator("#cell-4-undefined")).toContainText(replaceWithValue);

});

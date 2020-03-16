import { Page } from "puppeteer";

export const randomInt = (max: number) => {
    return Math.floor(Math.random() * Math.floor(max));
};
export const logToFacebook = async (page: Page, username: string, password: string) => {
    page.setDefaultTimeout(1000 * 60);
    await page.goto('https://www.facebook.com/');
    await page.focus('#login_form #email');
    await page.keyboard.type(username);
    await page.focus("#login_form #pass");
    await page.keyboard.type(password);
    await page.click("#login_form #loginbutton input");
    await page.waitForNavigation();
};

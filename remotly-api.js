const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
var mysql = require('mysql');
var con = mysql.createConnection({
    database: "6A46Hgkjgu",
    port: 3306,
    host: "remotemysql.com",
    user: "6A46Hgkjgu",
    password: "JI4TSwVn7E"
});

(async () => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox",
            "--disable-setuid-sandbox",],
    });
    const page = await browser.newPage();
    await page.goto('https://remotive.io/api/remote-jobs?category=software-dev');
    innerText = await page.evaluate(() => {
        return JSON.parse(document.querySelector("body > pre").textContent);
    });
    console.log(innerText['jobs'][2]);
})
    ();
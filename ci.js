const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
var mysql = require('mysql');
const { exit } = require('process');
var con = mysql.createConnection({
    database: "6A46Hgkjgu",
    port: 3306,
    host: "remotemysql.com",
    user: "6A46Hgkjgu",
    password: "JI4TSwVn7E"
});
const baseUrl = 'https://www.carriere-informatique.com';
const alphabet = ['0-9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox",
            "--disable-setuid-sandbox",],
    });
    for (var i = 0; i < 27; i++) {
        for (var pageNum = 1; i < 10; i++) {
            const page = await browser.newPage();
            await page.goto('https://www.carriere-informatique.com/entreprises?lettre=' + alphabet[i] + '&page=' + pageNum, { timeout: 90000 });
            for (var j = 1; j < 25; j++) {
                try {
                    companyUrl = await page.evaluate("document.querySelector('#entreprises > div > div:nth-child(" + j.toString() + ") > a:nth-child(2)').getAttribute('href')");
                    companyPage = await browser.newPage();
                    await companyPage.goto(baseUrl + companyUrl, { timeout: 90000 });
                    try {
                        if (await companyPage.evaluate(() => document.querySelector('#tableListingOffres > div').className) == 'nothing') {
                            await companyPage.close();
                            continue;
                        }
                        else {
                            offreUrl = await companyPage.evaluate(() => {
                                const ps = Array.from(document.querySelectorAll('#tableListingOffres > tbody > tr > td > div.intitule > a'))
                                return ps.map(td => td.getAttribute('href'))
                            });
                            await companyPage.close();
                            console.log(offreUrl);
                        }
                    } catch (error) {
                        offreUrl = await companyPage.evaluate(() => {
                            const ps = Array.from(document.querySelectorAll('#tableListingOffres > tbody > tr > td > div.intitule > a'))
                            return ps.map(td => td.getAttribute('href'))
                        });
                        await companyPage.close();
                        //console.log(offreUrl);
                        continue;
                    }
                } catch (error) {
                    continue;
                }
            }
            try {
                if (await companyPage.evaluate(() => document.querySelector('body > article > div > div:nth-child(7) > table > tbody > tr > td > div > a').textContent) != 'Suivant') {
                    break;
                }
            } catch (error) {
                console.log(error);
            }


        }
    }
})
    ();
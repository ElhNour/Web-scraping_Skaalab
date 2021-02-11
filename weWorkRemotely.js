const puppeteer = require('puppeteer');
var mysql = require('mysql');
const { link } = require('fs-extra');
const baseUrl = 'https://weworkremotely.com';
var con = mysql.createConnection({
    database: "6A46Hgkjgu",
    port: 3306,
    host: "remotemysql.com",
    user: "6A46Hgkjgu",
    password: "JI4TSwVn7E"
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox",
            "--disable-setuid-sandbox",],
    });
    const page = await browser.newPage();
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
    await page.goto('https://weworkremotely.com/categories/remote-programming-jobs#job-listings' + i, { timeout: 90000 });
    for (var i = 2; i <= 500; i++) {
        try {
            var startupUrl;
            const link = await page.evaluate("document.querySelector('#category-2 > article > ul > li:nth-child(" + i + ") > a').getAttribute('href')");
            const offerPage = await browser.newPage();
            await offerPage.goto(baseUrl + link, { timeout: 90000 });
            const position = await offerPage.evaluate(() => document.querySelector('body > div.content > div > div.listing-header-container > h1').textContent);
            const startupName = await offerPage.evaluate(() => document.querySelector('body > div.content > div > div.company-card > h2 > a').textContent);
            try {
                startupUrl = await offerPage.evaluate(() => document.querySelector('body > div.content > div > div.company-card > h3:nth-child(4) > a').getAttribute('href'));
            } catch (error) {
            }
            const description = await offerPage.evaluate(() => document.querySelector("#job-listing-show-container").textContent);
            console.log('id : ' + (i - 2));
            console.log('position : ' + position.trim());
            console.log('startup : ' + startupName.trim());
            console.log('StartupUrl : ' + startupUrl);
            console.log('description : ' + description);
            console.log('=================================================');
            await offerPage.close();
            await sleep(1000)
            con.query("SELECT idstartup FROM startup where name=" + con.escape(startupName.trim()) + ";", function (err, result) {
                if (err) throw err;
                try {
                    idStartUp = JSON.parse(JSON.stringify(result))[0].idstartup;
                } catch (error) {
                    if (startupUrl != undefined) {
                        con.query("INSERT IGNORE INTO startup (name, website, sourceID) VALUES (" + con.escape(startupName.trim()) + "," + con.escape(startupUrl) + ",6);", function (err, result) {
                            if (err) console.log(err);
                        })
                    }
                    else {
                        con.query("INSERT IGNORE INTO startup (name, sourceID) VALUES (" + con.escape(startupName.trim()) + ",6);", function (err, result) {
                            if (err) console.log(err);
                        })
                    }
                } finally {
                    con.query("SELECT idstartup FROM startup where name=" + con.escape(startupName.trim()) + ";", function (err, result) {
                        if (err) throw err;
                        idStartUp = JSON.parse(JSON.stringify(result))[0].idstartup;
                        con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + ",'Remote'," + con.escape(description.trim()) + "," + idStartUp + ");", function (err, result) {
                            if (err) console.log(err);
                        })
                    })
                }
            })
        } catch (error) {
            console.log(error);
            continue;
        }
    }
    await browser.close()

})();

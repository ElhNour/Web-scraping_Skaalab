const puppeteer = require('puppeteer');
var mysql = require('mysql');
const baseUrl = 'https://uncubed.com/jobs?page=';
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

    await page.goto(baseUrl , { waitUntil: 'networkidle0', timeout: 90000 });
    const maxP = await page.evaluate("document.querySelector('body > div.page-content.uc-padding > div > div.fifty-padding > div > div > div.col-sm-5 > div.pagination-container > nav > span.last > a').getAttribute('href')");
    console.log('got max pages : ',maxP.substr(maxP.length -4));
    for (var i = 1; i <= maxP.substr(maxP.length -4); i++) {
        try {
            await page.goto(baseUrl + i, { timeout: 90000 });
            for (var j = 4; j <= 23; j++) {
                try {
                    await page.click('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(' + j + ')');
                    await sleep(1000);
                    await page.waitForSelector('#jb-header-section > nav > ul > li.active.uc-record-click-section > p');
                    if ((await page.evaluate(() =>
                        document.querySelector('#jb-header-section > nav > ul > li.active.uc-record-click-section > p').textContent
                    )) != 'Description') {
                        continue;
                    }
                    const position = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p.title').textContent");
                    const startupName = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p:nth-child(2)').innerText");
                    const remote = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p:nth-child(2) > span').textContent");
                    const description = await page.evaluate(() => document.querySelector("#jb-job-description-section").textContent);
                    const companyPage = await browser.newPage();
                    try {
                        website = await page.evaluate(() => document.querySelector('#jb-company-section > div.learn-more-btn > a').getAttribute('href'));
                        await companyPage.goto(baseUrl + website, { timeout: 90000 });
                        try {
                            startupUrl = await companyPage.evaluate(() => document.querySelector('#overview > div > div > div.col-sm-8 > p.uc-record-click-section > a').getAttribute('href'));
                        } catch (error) {
                        }
                    } catch (error) {
                    }
                    id = ((i - 1) * 20 + j - 3).toString();
                    await companyPage.close();
                    //console.log('id : ' + id);
                    //console.log('position : ' + position.trim());
                    //console.log('startup : ' + startupName.split('-', 1).toString().trim());
                    //console.log('location : ' + remote.substr(2).trim());
                    //console.log('StartupUrl : ' + startupUrl);
                    //console.log('description : ' + description.substring(20, description.length - 17).trim());
                    //console.log('=================================================');

                    con.query("SELECT idstartup FROM startup where name=" + con.escape(startupName.split('-', 1).toString().trim()) + ";", function (err, result) {
                        try {
                            idStartUp = JSON.parse(JSON.stringify(result))[0].idstartup;
                        } catch (error) {
                            if (startupUrl != null) {
                                con.query("INSERT IGNORE INTO startup (name, website, sourceID) VALUES (" + con.escape(startupName.split('-', 1).toString().trim()) + "," + con.escape(startupUrl) + ",5);", function (err, result) {
                                })
                            }
                            else {
                                con.query("INSERT IGNORE INTO startup (name, sourceID) VALUES (" + con.escape(startupName.split('-', 1).toString().trim()) + ",5);", function (err, result) {
                                })
                            }
                        } finally {
                            con.query("SELECT idstartup FROM startup where name=" + con.escape(startupName.split('-', 1).toString().trim()) + ";", function (err, result) {
                                idStartUp = JSON.parse(JSON.stringify(result))[0].idstartup;
                                con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + "," + con.escape(remote.substr(2).trim()) + "," + con.escape(description.substring(20, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
                                    console.log(id + " offre inserted in database");
                                })
                            })
                        }
                    })
                } catch (error) {
                    console.log(error);
                    continue;
                }
            }

        } catch (error) {
            console.log(error);
            continue;
        }
    }

})
    ();

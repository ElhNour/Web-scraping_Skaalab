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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLinks(browser) {
    const url = 'https://www.dice.com/jobs/q-Computer+science-jobs';
    const page = await browser.newPage();
    var logger = fs.createWriteStream("links-dice.txt", {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });
    await page.goto(url , { waitUntil: 'networkidle0', timeout: 90000 });
    const maxP = await page.evaluate("document.querySelector('#search-results-control > div.col-md-9 > div.pagination.pagination-large > ul > li:nth-child(7) > a').getAttribute('href')");
    console.log('got max pages : ',maxP.substr(maxP.length -4));
    for (var i = 1; i <= parseInt(maxP.substr(maxP.length -4)); i++) {
        try {
            await page.goto(url + '?p=' + i.toString(), { waitUntil: 'networkidle0', timeout: 90000 });
            await page.waitForXPath('//*[@id="position0"]');
            for (var j = 0; j < 20; j++) {
                try {
                    const l = await page.evaluate("document.querySelector('#position" + j.toString() + "').getAttribute('href')");
                    const link = "https://www.dice.com/" + l
                    logger.write(link + '\r\n');
                } catch (error) {
                    continue;
                }
            };
            console.log("link scrapping :" + (((20 * (i - 1)) + j) * 100 / 23050).toFixed(2).toString() + '%');
        } catch (error) {
            continue;
        }
    }
    logger.end();
    await browser.close();
}

async function getOffers(browser) {
    try {
        const page = await browser.newPage();
        const links = readline.createInterface({
            input: fs.createReadStream('links-dice.txt'),
            output: process.stdout,
            console: false
        });
        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");
        });
        var idOffer = 1;
        for await (const link of links) {
            try {
                await page.goto(link, { timeout: 120000 });
                try {
                    await page.waitForSelector('#jt');
                }
                catch{
                    console.log("[-]  offer not found");
                    continue;
                }
                position = await page.evaluate(() => document.querySelector('#jt').textContent);
                startupName = await page.evaluate(() => document.querySelector('#hiringOrganizationName').textContent);
                const page2 = await browser.newPage();
                try {
                    startUpUrl = await page.evaluate(() => document.querySelector('#testing > div > div.col-md-5.col-lg-6 > ul > li.employer.hiringOrganization > a').getAttribute('href'));
                    await page2.goto('https://dice.com' + startUpUrl);
                    try {
                        try {
                            website = await page2.evaluate(() => document.querySelector('#company-jobs > div > div > div.col-md-4 > div:nth-child(1) > a:nth-child(2)').getAttribute('href'));
                        } catch (error) {
                            website = await page2.evaluate(() => document.querySelector('#company-jobs > div > div > div.col-md-4 > div:nth-child(2) > a:nth-child(2)').getAttribute('href'));
                        }
                    } catch (error) {
                        website = 'null';
                    }
                } catch (error) {
                    website = 'null';
                }
                location = await page.evaluate(() => document.querySelector('#testing > div > div.col-md-5.col-lg-6 > ul > li.location > span').textContent);
                await page2.close();
                try {
                    skills = await page.evaluate(() => document.querySelector('#bd > div > div.col-md-8 > div:nth-child(9) > div > div.iconsiblings').textContent);
                    contract = await page.evaluate(() => document.querySelector('#bd > div > div.col-md-8 > div:nth-child(10) > div > div.iconsiblings > span').textContent);
                    salaire = await page.evaluate(() => document.querySelector('#bd > div > div.col-md-8 > div:nth-child(11) > div > div.iconsiblings > span.mL20').textContent);
                    description = await page.evaluate(() => {
                        const ps = Array.from(document.querySelectorAll('#jobdescSec'))
                        return ps.map(td => td.textContent)
                    });
                    try {
                        if ((await page.evaluate(() =>
                            document.querySelector('#bd > div > div.col-md-8 > div:nth-child(12) > div > div.iconsiblings > span.mL20').textContent
                        )) == 'Work from home available' || (await page.evaluate(() =>
                            document.querySelector('#bd > div > div.col-md-8 > div:nth-child(12) > div > div.iconsiblings > span.mL20').textContent
                        )) == 'Travel not required') {
                            var remote = "Remote";
                        }
                        else { var remote = location };
                    } catch (error) {
                        if ((await page.evaluate(() =>
                            document.querySelector('#bd > div > div.col-md-8 > div:nth-child(12) > div > div.iconsiblings > span:nth-child(1)').textContent
                        )) == 'Work from home available' || (await page.evaluate(() =>
                            document.querySelector('#bd > div > div.col-md-8 > div:nth-child(12) > div > div.iconsiblings > span:nth-child(2)').textContent
                        )) == 'Travel not required') {
                            remote = "Remote";
                        }
                        else { remote = location };

                    }
                } catch (error) {
                    skills = await page.evaluate(() => document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(9) > div > div.iconsiblings').textContent);
                    contract = await page.evaluate(() => document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(10) > div > div.iconsiblings > span').textContent);
                    salaire = await page.evaluate(() => document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(11) > div > div.iconsiblings > span.mL20').textContent);
                    description = await page.evaluate(() => {
                        const ps = Array.from(document.querySelectorAll('#jobdescSec p'))
                        return ps.map(td => td.textContent)
                    });
                    try {
                        if ((await page.evaluate(() =>
                            document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(12) > div > div.iconsiblings > span.mL20').textContent
                        )) == 'Work from home available' || (await page.evaluate(() =>
                            document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(12) > div > div.iconsiblings > span.mL20').textContent
                        )) == 'Travel not required') {
                            var remote = "Remote";
                        }
                        else { var remote = location };
                    } catch (error) {
                        if ((await page.evaluate(() =>
                            document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(12) > div > div.iconsiblings > span:nth-child(1)').textContent
                        )) == 'Work from home available' || (await page.evaluate(() =>
                            document.querySelector('#bd > div:nth-child(2) > div.col-md-9 > div:nth-child(12) > div > div.iconsiblings > span:nth-child(2)').textContent
                        )) == 'Travel not required') {
                            var remote = "Remote";
                        }
                        else { var remote = location };
                    }

                }
                //console.log('[+] id : ' + idOffer);
                //console.log('title : ' + position);
                //console.log('startup :' + startupName.trim());
                //console.log('website :' + website);
                //console.log('location : ' + location);
                //console.log('skills : ' + skills.trim());
                //console.log('contract : ' + contract.trim());
                //console.log('salaire : ' + salaire.trim());
                //console.log('remote : ' + remote);
                ////console.log('description : ' + description.toString().trim());
                //console.log('====================================')

                con.query("SELECT idstartup FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
                    try {
                        idStartUp = JSON.parse(JSON.stringify(result))[0].idstartup;
                    } catch (error) {
                        if (website != "null") {
                            con.query("INSERT IGNORE INTO startup (name, website, sourceID) VALUES (" + con.escape(startupName.trim()) + "," + con.escape(website.trim()) + ",4);", function (err, result) {
                            })
                        }
                        else {
                            con.query("INSERT IGNORE INTO startup (name, sourceID) VALUES (" + con.escape(startupName.trim()) + ",4);", function (err, result) {
                            })
                        }
                    } finally {
                        con.query("SELECT idstartup FROM startup where name=" + con.escape(startupName.trim()) + ";", function (err, result) {
                            try { idStartUp = JSON.parse(JSON.stringify(result))[0].idstartup; }
                            catch{ continue; }
                            con.query("INSERT INTO offre (poste, contrat, salaire, travail, description, skills , startupID ) VALUES (" + con.escape(position.replace(/'/g, "\\'")) + "," + con.escape(contract.trim()) + "," + con.escape(salaire.trim()) + "," + con.escape(remote) + "," + con.escape(description.toString().trim().replace(/'/g, "\\'")) + "," + con.escape(skills.trim().replace(/'/g, "\\'")) + "," + idStartUp + ");", function (err, result) {
                                console.log(idOffer + " offre inserted in database");
                            })
                        })
                    }
                })
                idOffer++;
            }
            catch (e) {
                continue;
            }

        }
        await browser.close();
    } catch (error) {
        console.log(error);
    }
}

(async function main() {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox",
            "--disable-setuid-sandbox", "--disable-blink-features"]
    });
    await getLinks(browser)
    //.then(() => getOffers(browser));
    //await getOffers(browser)
})();

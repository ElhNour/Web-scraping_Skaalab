const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
var mysql = require('mysql');
const baseUrl = 'https://uncubed.com';
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
    con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });

    for (var i = 1; i <= 1188; i++) {
        try {
            await page.goto('https://uncubed.com/jobs?page=' + i);
            for (var j = 4; j <= 23; j++) {
                try {
                    await page.click('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(' + j + ')');
                    await page.waitForSelector('#jb-header-section > nav > ul > li.active.uc-record-click-section > p');
                    if ((await page.evaluate(() =>
                        document.querySelector('#jb-header-section > nav > ul > li.active.uc-record-click-section > p').textContent
                    )) != 'Description') {
                        continue;
                    }
                    position = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p.title').textContent");
                    startupName = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p:nth-child(2)').innerText");
                    remote = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p:nth-child(2) > span').textContent");
                    description = await page.evaluate(() => document.querySelector("#jb-job-description-section").textContent);
                    website = await page.evaluate(() => document.querySelector('#jb-company-section > div.learn-more-btn > a').getAttribute('href'));
                    const companyPage = await browser.newPage();
                    await companyPage.goto(baseUrl + website);
                    try {
                        startupUrl = await companyPage.evaluate(() => document.querySelector('#overview > div > div > div.col-sm-8 > p.uc-record-click-section > a').getAttribute('href'));
                    } catch (error) {
                        startupUrl = "null";
                    }
                    companyPage.close();
                    id = ((i - 1) * 20 + j - 3).toString();
                    startupName = startupName.split('-', 1).toString().trim();
                    console.log('id : ' + id);
                    console.log('position : ' + position.trim());
                    console.log('startup : ' + startupName);
                    console.log('StartupUrl : ' + startupUrl);
                    console.log('location : ' + remote.substr(2).trim());
                    console.log('description : ' + description.substring(0, description.length - 17).trim());
                    console.log('=================================================');

                    if (startupUrl != "null") {
                        con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
                            if (err) throw err;
                            try {
                                idStartUp = JSON.parse(JSON.stringify(result))[0].id;
                                con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + "," + con.escape(remote.substr(2).trim()) + "," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
                                    if (err) throw err;
                                    console.log(id + " offre inserted in database");
                                });
                            } catch (error) {
                                con.query("INSERT INTO startup (name, website, sourceID) VALUES (" + con.escape(startupName) + "," + con.escape(startupUrl) + ",2);", function (err, result) {
                                    con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
                                        if (err) throw err;
                                        idStartUp = JSON.parse(JSON.stringify(result))[0].id;
                                        con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + "," + con.escape(remote.substr(2).trim()) + "," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
                                            if (err) throw err;
                                            console.log(id + " offre inserted in database");
                                        });
                                    });
                                });
                            }
                        });
                    }
                    else {
                        con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
                            if (err) throw err;
                            try {
                                idStartUp = JSON.parse(JSON.stringify(result))[0].id;
                                con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + "," + con.escape(remote.substr(2).trim()) + "," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
                                    if (err) throw err;
                                    console.log(id + " offre inserted in database");
                                });
                            } catch (error) {
                                con.query("INSERT INTO startup (name, sourceID) VALUES (" + con.escape(startupName) + ",2);", function (err, result) {
                                    con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
                                        if (err) throw err;
                                        idStartUp = JSON.parse(JSON.stringify(result))[0].id;
                                        con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + "," + con.escape(remote.substr(2).trim()) + "," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
                                            if (err) throw err;
                                            console.log(id + " offre inserted in database");
                                        });
                                    });
                                });
                            }
                        });
                    }

                } catch (error) {
                    continue;
                }
            }

        } catch (error) {
            continue;
        }
    }
    //for (var i = 1; i <= 169; i++) {
    //    try {
    //        await page.goto('https://uncubed.com/jobs/remote?page=' + i);
    //        for (var j = 4; j <= 23; j++) {
    //            try {
    //                await page.click('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(' + j + ')');
    //                await page.waitForSelector('#jb-header-section > nav > ul > li.active.uc-record-click-section > p');
    //                if ((await page.evaluate(() =>
    //                    document.querySelector('#jb-header-section > nav > ul > li.active.uc-record-click-section > p').textContent
    //                )) != 'Description') {
    //                    continue;
    //                }
    //                position = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p.title').textContent");
    //                startupName = await page.evaluate("document.querySelector('body > div.page-content > div > div.fifty-padding > div > div > div.col-sm-5 > div.jobs-listings > div:nth-child(" + j + ") > div > div > div > div.col-xs-9 > div > p:nth-child(2)').innerText");
    //                website = await page.evaluate(() => document.querySelector('#jb-company-section > div.learn-more-btn > a').getAttribute('href'));
    //                description = await page.evaluate(() => document.querySelector("#jb-job-description-section").textContent);
    //                const companyPage = await browser.newPage();
    //                await companyPage.goto(baseUrl + website);
    //                try {
    //                    startupUrl = await companyPage.evaluate(() => document.querySelector('#overview > div > div > div.col-sm-8 > p.uc-record-click-section > a').getAttribute('href'));
    //                } catch (error) {
    //                    startupUrl = "null";
    //                }
    //                companyPage.close();
    //                id = ((i - 1) * 20 + j - 3).toString();
    //                //console.log('id : ' + id);
    //                //console.log('position : ' + position.trim());
    //                //console.log('startup : ' + startupName);
    //                //console.log('StartupUrl : ' + startupUrl);
    //                //console.log('description : ' + description.substring(0, description.length - 17).trim());
    //                //console.log('=================================================');
    //if (startupUrl != "null") {
    //    con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
    //        if (err) throw err;
    //        try {
    //            idStartUp = JSON.parse(JSON.stringify(result))[0].id;
    //            con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + ",'Remote'," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
    //                if (err) throw err;
    //                console.log(id + " offre inserted in database");
    //            });
    //        } catch (error) {
    //            con.query("INSERT INTO startup (name, website, sourceID) VALUES (" + con.escape(startupName) + "," + con.escape(startupUrl) + ",2);", function (err, result) {
    //                con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
    //                    if (err) throw err;
    //                    idStartUp = JSON.parse(JSON.stringify(result))[0].id;
    //                    con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + ",'Remote'," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
    //                        if (err) throw err;
    //                        console.log(id + " offre inserted in database");
    //                    });
    //                });
    //            });
    //        }
    //    });
    //}
    //else {
    //    con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
    //        if (err) throw err;
    //        try {
    //            idStartUp = JSON.parse(JSON.stringify(result))[0].id;
    //            con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + ",'Remote'," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
    //                if (err) throw err;
    //                console.log(id + " offre inserted in database");
    //            });
    //        } catch (error) {
    //            con.query("INSERT INTO startup (name, sourceID) VALUES (" + con.escape(startupName) + ",2);", function (err, result) {
    //                con.query("SELECT id FROM startup where name=" + con.escape(startupName) + ";", function (err, result) {
    //                    if (err) throw err;
    //                    idStartUp = JSON.parse(JSON.stringify(result))[0].id;
    //                    con.query("INSERT INTO offre (poste, travail, description , startupID ) VALUES (" + con.escape(position.trim()) + ",'Remote'," + con.escape(description.substring(0, description.length - 17).trim()) + "," + idStartUp + ");", function (err, result) {
    //                        if (err) throw err;
    //                        console.log(id + " offre inserted in database");
    //                    });
    //                });
    //            });
    //        }
    //    });
    //}
    //
    //            } catch (error) {
    //                console.log(error);
    //                continue;
    //            }
    //        }
    //
    //    } catch (error) {
    //        console.log(error);
    //        continue;
    //    }
    //}

})
    ();
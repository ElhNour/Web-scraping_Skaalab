const puppeteer = require('puppeteer');
const fs = require('fs');
const url = 'https://www.dice.com/jobs/q-Computer+science-jobs';

(async () => {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox",
            "--disable-setuid-sandbox",],
    });
    const page = await browser.newPage();
    var logger = fs.createWriteStream("links-dice.txt", {
        flags: 'a' // 'a' means appending (old data will be preserved)
    });
    for (var i = 1; i < 1189; i++) {
        await page.goto(url + '?p=' + i.toString(), { waitUntil: 'networkidle0', timeout: 90000 });
        await page.waitForXPath('//*[@id="position0"]');
        for (var j = 0; j < 20; j++) {
            const l = await page.evaluate("document.querySelector('#position" + j.toString() + "').getAttribute('href')");
            const link = "https://www.dice.com/" + l
            console.log((((20 * (i - 1)) + j) * 100 / 23300).toFixed(2).toString() + '%');
            logger.write(link + '\r\n');
        };
    }
    logger.end();
    await browser.close();
})();
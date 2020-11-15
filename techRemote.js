const puppeteer = require('puppeteer');
async function setTech(technology, remote) {

    const browser = await puppeteer.launch({headless:false,  defaultViewport: null,});
    const page = await browser.newPage();
   // await page.setDefaultNavigationTimeout(0);

    await page.goto('https://www.welcometothejungle.com/fr/jobs');
    await page.click('[data-testid="jobs-home-search-link-advanced-search"]');

    const testRemote= new RegExp('Remote| REMOTE| remote| Télétravail| teletravail| TELETRAVAIL|','g');
      /* Select the technology */
     await page.type('form.ais-SearchBox-form .ais-SearchBox-input',technology);
     
     await page.waitForSelector('[title = "Effacer"]');
     await  page.click('[title = "Effacer"]'); 
      /* Select only remote jobs */ 
     if(testRemote.test(remote)){ 
        await page.click('[data-testid="jobs-search-search-field-location"]');
        await page.click('[data-testid="jobs-search-results"] div.jzc9rp-6.czDGZw .sc-qQYBZ.kGBVAs');
     };
    
    
    
};
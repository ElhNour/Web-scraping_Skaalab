const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const outputFile = 'offresStartup.csv'
const csvWriter = createCsvWriter({
    path: './welcometothejungle-data/offresStartup.csv',
   header : [
    {id : 'Poste', title : 'POSTE'},
    {id : 'Contrat', title : 'CONTRAT'},
    {id : 'Salaire', title : 'SALAIRE'},
    {id : 'Diplome', title : 'DIPLOME'},
    {id : 'Experience', title : 'EXPERIENCE'},
    {id : 'Travail', title : 'TRAVAIL'},
    {id : 'Description', title : 'DESCRIPTION'}
    ],
    fieldDelimiter: ";"
   
});
function UTF8(file) {
  let fileContents = fs.readFileSync(file);
  fs.writeFileSync(file, "\ufeff" + fileContents);
}

async function writeCSV(scrapedData) {
  await csvWriter.writeRecords(scrapedData);
  UTF8(outputFile);    
};

/* Get all details concerning one job, */
async function getJobDetails (url, page) {

    await page.goto(url);
    const poste = await page.$eval('.sc-12bzhsi-3.cnIGeJ', poste => poste.textContent);

    /* get all details */
    const texts = await page.evaluate(() => {
      return [...document.body.querySelectorAll('ul.sc-1qc42fc-4.hybCFl li.sc-1qc42fc-0.kGqTsU span.sc-1qc42fc-2.cOxsDt')]
               .map(element => element.innerText)
    });

    /* get profile's description */
    const paragraphe = await page.$eval('.fKjhRQ p', parag => parag.textContent);
    const details = await page.evaluate(() => {
      return [...document.body.querySelectorAll('[data-t="tw7vpu" ] div.sc-11obzva-1.fKjhRQ p')]
               .map(element => element.innerText)
               .join('\n'); 
    });
   
    /* store data in adeparated variables */
      const contrat =  texts[0];
      const salaire =texts [1];
      const diplome =texts[3];
      const experience = texts[4];
      const travail = await page.$eval(".sc-1qc42fc-2.dJqCnn", travail => travail.textContent);
      const description = paragraphe+ details;

    /* return values in an object */
        return  {
          Poste : poste,  
          Contrat : contrat,
          Salaire : salaire,
          Diplome : diplome,
          Experience : experience,
          Travail : travail,
          Description : description,
        }
        
  
};

/* Get all jobs' links for one startup */
async function getJobsLinks () {

    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
  // await page.setDefaultNavigationTimeout(0);
   //await page.waitForTimeout(4000);
    await page.goto("https://www.welcometothejungle.com/fr/companies/galadrim/jobs");

   const hrefs = await page.$$eval('.gc3qm0-1.elzqlN div article header a', as => as.map(a => a.href)); 
   await browser.close();
   //console.log(hrefs);
   return hrefs;    
};

async function main(){

    const allinks = await getJobsLinks();
    //console.log(allinks);
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
 //await page.setDefaultNavigationTimeout(0);
 // await page.waitForTimeout(4000);
 
   const scrapedData = [];
   for (let l of allinks){
        const data = await getJobDetails(l,page);
        scrapedData.push(data);
    }
    //console.log(scrapedData); 
    writeCSV(scrapedData);
               
}
main();    

        
   
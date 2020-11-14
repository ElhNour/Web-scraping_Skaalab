const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const outputFile = "./welcometothejungle-data/offresStartups.csv";
const csvWriter = createCsvWriter({
    path: './welcometothejungle-data/offresStartups.csv',
   header : [
    {id:'Id', title:'IDOFFRE'},
    {id : 'Poste', title : 'POSTE'},
    {id : 'Contrat', title : 'CONTRAT'},
    {id : 'Salaire', title : 'SALAIRE'},
    {id : 'Diplome', title : 'DIPLOME'},
    {id : 'Experience', title : 'EXPERIENCE'},
    {id : 'Travail', title : 'TRAVAIL'},
    {id : 'Description', title : 'DESCRIPTION'},
    {id: 'IdStartup', title:'IDSTARTUP'}
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

async function getJobDetails (url, page, idStartup, id) {
  
  await page.goto(url);
//  await page.setDefaultNavigationTimeout(0);
  const poste = await page.$eval('.sc-12bzhsi-3.cnIGeJ', poste => poste.textContent);
  // Recuperer les informations concernant contrat, salaire, diplome, experience
  const texts = await page.evaluate(() => {
    return [...document.body.querySelectorAll('ul.sc-1qc42fc-4.hybCFl li.sc-1qc42fc-0.kGqTsU span.sc-1qc42fc-2.cOxsDt')]
             .map(element => element.innerText)
             

  });

  const paragraphe = await page.$eval('.fKjhRQ p', parag => parag.textContent);
  const details = await page.evaluate(() => {
    return [...document.body.querySelectorAll('[data-t="tw7vpu" ] div.sc-11obzva-1.fKjhRQ p')]
             .map(element => element.innerText)
             .join('\n'); 
             
  
  });
 
    const contrat =  texts[0];
    const salaire =texts [1];
    const diplome =texts[3];
    const experience = texts[4];
    const travail = await page.$eval(".sc-1qc42fc-2.dJqCnn", travail => travail.textContent);
    const description = paragraphe+ details;
 
      return  {
        Id : id,
        Poste : poste,  
        Contrat : contrat,
        Salaire : salaire,
        Diplome : diplome,
        Experience : experience,
        Travail : travail,
        Description : description,
        IdStartup: idStartup,
      }
      

};

async function getJobsLinks (page,url) {

  /*const browser = await puppeteer.launch({headless:false});
  const page = await browser.newPage();*/

// await page.setDefaultNavigationTimeout(0);
 //await page.waitForTimeout(4000);
  await page.goto(url);

 const hrefs = await page.$$eval('.gc3qm0-1.elzqlN div article header a', as => as.map(a => a.href)); 
 //await browser.close();
 //console.log(hrefs);
 return hrefs;

  
};

async function getAlllinks () {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
    path: './welcometothejungle-data/websites.csv',
    header: [
        {id: 'id', title:'ID'},
        {id: 'entreprise', title: 'STARTUP'},
    ],
    fieldDelimiter: ";"
    });

    const browser = await puppeteer.launch({headless:false});
    try{
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    /* navigate to jobs section */
    await page.goto("https://www.welcometothejungle.com/fr/jobs?page=1&aroundQuery=&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Logiciels&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=SaaS%20%2F%20Cloud%20Services&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Application%20mobile&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Big%20Data&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Objets%20connect%C3%A9s&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Intelligence%20artificielle%20%2F%20Machine%20Learning&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Cybers%C3%A9curit%C3%A9&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Robotique&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Blockchain");
    await page.waitForTimeout(2500);
  
    /* get all the listed jobs */
    var hrefs = await page.$$eval('.dEWSJX li .biFsNh .cdtiMi .eqqpZQ a', as => as.map(a => a.href));
    //console.log(hrefs);
    var num=1;// page number

    /* browse all pages */
    while (hrefs.length!=0){
     
    let startupLinksSet = new Set();
    var j=0;
    for (let i=0;i<hrefs.length;i++){
         /*visit the job offers of each startup */
        await page.goto(hrefs[i]);
        await page.click('.sc-AxjAm.sc-11unfkk-2.bcntHX .sc-12bzhsi-7.lnDffK');
      
        await page.waitForTimeout(2000);

        /* Get startup link  */
        const startupLink = await page.$$eval('.jGufXH .kGqTsU .cOxsDt a', as => as.map(a => a.href));
        
        /* Adding links to the Set*/
        if(!!startupLink.toString())startupLinksSet.add(startupLink.toString());

        /* get all job details of each startup */
        const jobslink = page.url() + '/jobs';
        const allinks = await getJobsLinks(page,jobslink);
        console.log('alllinks',allinks)
        const scrapedData = [];
        for (let l of allinks){
          const data = await getJobDetails(l,page,i,j);
        //  console.log(data.Poste); 
          scrapedData.push(data);
          j++;
        }
        console.log('done getJobdetails')
        console.log('scrapeDate',scrapedData); 
        writeCSV(scrapedData);
      }
    /* Set to Array */
    let array=Array.from(startupLinksSet);
       // console.log(array)
      
    /* Array to JSON */
    const jsonData =[];
    var k=0;
    for (let i of array) {
       var object={
           id: k,
           entreprise: i
       }
       k++;
       jsonData.push(object)  
  }

  /* Write startups' links in csv file */
    await csvWriter.writeRecords(jsonData);
    await browser.close();
    //return links; //jobs' link of all startups
     
    num++;
    await page.goto("https://www.welcometothejungle.com/fr/jobs?page="+num+"&aroundQuery=&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Logiciels&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=SaaS%20%2F%20Cloud%20Services&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Application%20mobile&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Big%20Data&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Objets%20connect%C3%A9s&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Intelligence%20artificielle%20%2F%20Machine%20Learning&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Cybers%C3%A9curit%C3%A9&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Robotique&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Blockchain");
    await page.waitForTimeout(2500);
    var hrefs = await page.$$eval('.dEWSJX li .biFsNh .cdtiMi .eqqpZQ a', as => as.map(a => a.href));
    //console.log(hrefs)
    }
    }catch (e){console.log('THIS IS YOUR ERROR $e',e)}
  }

getAlllinks();
  
    
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
    /*Get poste name*/
    const poste = await page.$eval('.sc-12bzhsi-3.cnIGeJ', poste => poste.textContent);
    /*Get all icons classename*/ 
    const texts = await page.evaluate(() => {
      return [...document.body.querySelectorAll('ul.sc-1qc42fc-4.hybCFl li.sc-1qc42fc-0.kGqTsU span.sc-1qc42fc-3.eEtniG i')]
               .map(element => element.className)
    });
    /*Get all information about the post in an arraylist [Contrat, Salaire, Diplome, Experience]*/
    const value = await page.evaluate(() => {
        return [...document.body.querySelectorAll('ul.sc-1qc42fc-4.hybCFl li.sc-1qc42fc-0.kGqTsU span.sc-1qc42fc-2.cOxsDt')]
                 .map(element => element.innerText)
            
    
      });
    
    /*Variables to stock different information*/
    var contrat='' ;
    var salaire='';
    var diplome='';
    var experience='';
    var travail='';
    /*Regular expressions for the content of each class*/
    const contratTest = new RegExp('CDI| CDD| Stage| Alternance|','g');
    const salaireTest = new RegExp('Salaire | €|','g');
    const diplomeTest = new RegExp('Bac | \+','g');
    const experienceTest = new RegExp('>| ans|','g');
   
    /*Regular expressions for class name*/
    const classeContart = new RegExp("sc-qQYBZ djZmiW","g");
    const classeSalaire = new RegExp("sc-qQYBZ ioaGbN","g");
    const classeDiplome_Exp = new RegExp("sc-qQYBZ hOrZFz","g");
    /*Getting information */
    for(let i =0; i<texts.length;i++){
      /*Check if it's the right class for Contrat*/
          if(classeContart.test(texts[i])){
            /*Check if it's the right syntax for Contrat*/
               if (contratTest.test(value[i]))
               /*Affect value if it's true*/
                contrat =  value[i];
          }
          if(classeSalaire.test(texts[i])){
               if (salaireTest.test(value[i]))
                 salaire =  value[i];
          }
          if(classeDiplome_Exp.test(texts[i])){
               if (diplomeTest.test(value[i]))
                 diplome =  value[i];
           
          }

          else{
          if(classeDiplome_Exp.test(texts[i])){
               if (experienceTest.test(value[i]))
                 experience =  value[i];
    
            }
          }
            
      
    }
  /*Get post's description*/
    const details = await page.evaluate(() => {
      return [...document.body.querySelectorAll('[data-t="191qin1" ] div.sc-11obzva-1.fKjhRQ ')]
               .map(element => element.innerText)
               .join('\n'); 
     /*Affcet the arraylist result to description*/          
     const description =details;         
    
    });
  /*Regular expression for remote jobs*/
    const remoteTest = new RegExp('Télétravail','g');
    /*Check the syntax*/
     if(remoteTest.test(await page.$eval(".sc-1qc42fc-2.dJqCnn", travail => travail.textContent)))
     /*Affect value if it's correct*/
       travail = await page.$eval(".sc-1qc42fc-2.dJqCnn", travail => travail.textContent);
    

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

        
   
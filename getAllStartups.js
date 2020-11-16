const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function UTF8(file) {
  let fileContents = fs.readFileSync(file);
  fs.writeFileSync(file, "\ufeff" + fileContents);
}

async function writeCSV(scrapedData,outputFile) {
  
    const csvWriter = createCsvWriter({
     path: outputFile,
    header : [
     {id:'Id', title:'IDOFFRE'},
     {id : 'Poste', title : 'POSTE'},
     {id : 'Contrat', title : 'CONTRAT'},
     {id : 'Salaire', title : 'SALAIRE'},
     {id : 'Diplome', title : 'DIPLOME'},
     {id : 'Experience', title : 'EXPERIENCE'},
     {id : 'Travail', title : 'TRAVAIL'},
     {id : 'Description', title : 'DESCRIPTION'},
     {id: 'StartupLink', title:'STARTUP WEBSITE'}
     ],
     fieldDelimiter: ";"
    
 });
  await csvWriter.writeRecords(scrapedData);
  UTF8(outputFile);    
};

async function getJobDetails (url, page, startuplink, id) {
  
  await page.goto(url);
  //await page.setDefaultNavigationTimeout(0);
  await page.waitForTimeout(2000);
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
  const description = await page.evaluate(() => {
    return [...document.body.querySelectorAll('[data-t="191qin1" ] div.sc-11obzva-1.fKjhRQ ')]
            .map(element => element.innerText)
            .join('\n'); 
           

  });
  /*Regular expression for remote jobs*/
  const remoteTest = new RegExp('Télétravail','g');
  /*Check the syntax*/
  if(remoteTest.test(await page.$eval(".sc-1qc42fc-2.dJqCnn", travail => travail.textContent)))
   /*Affect value if it's correct*/
   travail = await page.$eval(".sc-1qc42fc-2.dJqCnn", travail => travail.textContent);

 
      return  {
        Id : id,
        Poste : poste,  
        Contrat : contrat,
        Salaire : salaire,
        Diplome : diplome,
        Experience : experience,
        Travail : travail,
        Description : description,
        StartupLink : startuplink
      }
      

};

async function getJobsLinks (page,url) {
  await page.goto(url);
  await page.waitForTimeout(2000);
  const hrefs = await page.$$eval('.gc3qm0-1.elzqlN div article header a', as => as.map(a => a.href)); 
 return hrefs; 
};

async function getAlllinks () {
  /* const createCsvWriter = require('csv-writer').createObjectCsvWriter;
   const csvWriter = createCsvWriter({
   path: './welcometothejungle-data/websites.csv',
   header: [
       {id: 'id', title:'ID'},
       {id: 'entreprise', title: 'STARTUP'},
   ],
   fieldDelimiter: ";"
   });*/
   

   const browser = await puppeteer.launch({headless:false});
   try{
    var number=1;
    
   const page = await browser.newPage();
   await page.setDefaultNavigationTimeout(0);

   /* navigate to jobs section */
   await page.goto("https://www.welcometothejungle.com/fr/jobs?page=1&aroundQuery=&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Logiciels&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=SaaS%20%2F%20Cloud%20Services&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Application%20mobile&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Big%20Data&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Objets%20connect%C3%A9s&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Intelligence%20artificielle%20%2F%20Machine%20Learning&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Cybers%C3%A9curit%C3%A9&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Robotique&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Blockchain");
   await page.waitForTimeout(2000);
 
   /* get all the listed jobs */
   var hrefs = await page.$$eval('.dEWSJX li .biFsNh .cdtiMi .eqqpZQ a', as => as.map(a => a.href));
   console.log('hrefs',hrefs);
   var num=1;// page number
   var tmp='';
   let startupLinksSet = new Set();
   var j=0;
   var scrapedData = [];
   /* browse all pages */
   while (hrefs.length!=0){
   
   for (let i=0;i<hrefs.length;i++){
     
        /*visit the job offers of each startup */
       await page.goto(hrefs[i]);
       await page.click('.sc-AxjAm.sc-11unfkk-2.bcntHX .sc-12bzhsi-7.lnDffK');
     
       await page.waitForTimeout(2000);

       /* Get startup link  */
       const startupLink = await page.$$eval('.jGufXH .kGqTsU .cOxsDt a', as => as.map(a => a.href));
       
       /* Adding links to the Set*/
     if(!!startupLink.toString())startupLinksSet.add(startupLink.toString());
       if ((!startupLinksSet.has(tmp))||(!startupLinksSet.has(startupLink.toString()))){
         //console.log('tmp before',tmp)
         tmp=startupLink.toString();
         //console.log('tmp after',tmp)

       /* get all job details of each startup */
       const jobslink = page.url() + '/jobs';
       const allinks = await getJobsLinks(page,jobslink);
       //console.log('alllinks',allinks)
       
       for (let l of allinks){
         const data = await getJobDetails(l,page,startupLink.toString(),j);
         scrapedData.push(data);
         j++;
         if (j%2==0){
           var outputFile= './welcometothejungle-data/batch-'+number+'.csv';
           writeCSV(scrapedData,outputFile);
           number++;
           scrapedData=[];
         }
         //console.log('j',j)
       }
      //console.log('scrapeDate',scrapedData); 
       
     }}
   
   /* Next page */ 
   num++;
   await page.goto("https://www.welcometothejungle.com/fr/jobs?page="+num+"&aroundQuery=&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Logiciels&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=SaaS%20%2F%20Cloud%20Services&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Application%20mobile&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Big%20Data&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Objets%20connect%C3%A9s&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Intelligence%20artificielle%20%2F%20Machine%20Learning&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Cybers%C3%A9curit%C3%A9&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Robotique&refinementList%5Bsectors_name.fr.Tech%5D%5B%5D=Blockchain");
   console.log('next')
   await page.waitForTimeout(2000);
   var hrefs = await page.$$eval('.dEWSJX li .biFsNh .cdtiMi .eqqpZQ a', as => as.map(a => a.href));
   
   }
   browser.close();
   }catch (e){console.log('THIS IS YOUR ERROR $e',e)}
 }
 
getAlllinks();
  
    
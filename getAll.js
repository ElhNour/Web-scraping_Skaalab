const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const readline = require('readline-sync');
function UTF8(file) {
  let fileContents = fs.readFileSync(file);
  fs.writeFileSync(file, "\ufeff" + fileContents);
}

async function writeCSV(scrapedData,outputFile) {
  
    const csvWriter = createCsvWriter({
     path: outputFile,
    header : [
     
     {id:'Startup', title:'STARTUP'},
     {id: 'StartupLink', title:'STARTUP WEBSITE'},
     {id:'Id', title:'IDOFFRE'},
     {id : 'Poste', title : 'POSTE'},
     {id : 'Contrat', title : 'CONTRAT'},
     {id : 'Salaire', title : 'SALAIRE'},
     {id : 'Diplome', title : 'DIPLOME'},
     {id : 'Experience', title : 'EXPERIENCE'},
     {id : 'Travail', title : 'TRAVAIL'},
     {id : 'Description', title : 'DESCRIPTION'},
    
     ],
     fieldDelimiter: ";"
    
 });
  await csvWriter.writeRecords(scrapedData);
  UTF8(outputFile);    
};


async function getJobDetails (url, page, startuplink,sname, id) {
  
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
          Startup: sname,
          StartupLink : startuplink,
          Id : id,
          Poste : poste,  
          Contrat : contrat,
          Salaire : salaire,
          Diplome : diplome,
          Experience : experience,
          Travail : travail,
          Description : description,
          
        }
        
  
  };

  async function setTech(page) {
      /* Uncheck ALGERIA */
      await page.waitForSelector('[title= "Effacer"]');
      await page.click('[title = "Effacer"]');

    /* Check Professions */
    await page.click('.cgXUxx header');
    const domains = await page.evaluate(() => {
        return [...document.body.querySelectorAll('.fdk8rh-3.kgRNJA div .fdk8rh-8.hvqMfO .fdk8rh-5.cVHXTK')]
                  .map(element => element.textContent)
              
        });
        //console.log(domains)
        

            if(domains.includes("Tech")){
                console.log('index',domains.indexOf('Tech'))
                const index = domains.indexOf('Tech');
                const selector1 = '[data-testid="company-jobs-search-widgets-profession-'+index+'"]'; 
                await page.click(selector1);
    
            const subdomains = await page.$$('[data-testid="company-jobs-search-widgets-profession-'+index+'-results"] .ais-RefinementList ul li.ais-RefinementList-item');
            //console.log(subdomains)
            for (let j=0;j<subdomains.length;j++){
              /* await page.evaluate(() => {
                    document.querySelector(subdomains[j]).click();
                  });*/
              await subdomains[j].click();
            }
           

   /* Read technology from the console and job */
    const technology = readline.question('Select technologies ');
    const remote = readline.question('Is it remote? ');
    const testRemote= new RegExp('yes|Yes|YES','g');
    /* Select the technology */
    await page.type('form.ais-SearchBox-form .ais-SearchBox-input',technology); 
    await page.waitForSelector('[title= "Effacer"]');
    await page.click('[title = "Effacer"]');
    /* Select only remote jobs */ 
   if(testRemote.test(remote)){ 
    
      await page.click('[data-testid="company-jobs-search-field-location"]');
      await page.click('[data-testid="company-jobs-results"] div.jzc9rp-6.czDGZw .sc-qQYBZ.kGBVAs');
   };
   //await page.waitForTimeout(5000);
 
  
}};
  async function getJobsLinks (page,url) {
    await page.goto(url);
    await page.waitForTimeout(2000);
    const hrefs = await page.$$eval('.gc3qm0-1.elzqlN div article header a', as => as.map(a => a.href)); 
    
   return hrefs; 
  };

  async function getAll(){
    const browser = await puppeteer.launch({headless:false, defaultViewport: null,executablePath:'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'});
    try{
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto("https://www.welcometothejungle.com/fr/companies?page=1&aroundQuery=");
    await page.waitForTimeout(2000);
    const Slinks = await page.$$eval('.sc-1kkiv1h-3.hrptYB header h3 a', as => as.map(a => a.href));
    console.log('slinks',Slinks)
    var j=0;
    var number=1;
    var num=1; //page number
    var scrapedData =[];
    while (Slinks.length!=0){
    for(let sl of Slinks){
        await page.goto(sl+'/jobs');
        await page.waitForTimeout(2000);
        const value =  await page.$eval('.fpJTTV ul li a .bnTGzJ', value=> value.innerText);
        //console.log('value',value)
        if(value!='0'){
        const Sname = await page.$eval('[data-t="dew4pq"]', Sname => Sname.textContent);
        const startupLink = await page.$$eval('.jGufXH .kGqTsU .cOxsDt a', as => as.map(a => a.href));
        //console.log('sname, link', Sname,startupLink)
        await setTech(page);

        
        var numberPage=   await page.$('li[class="ais-Pagination-item ais-Pagination-item--nextPage"] a');
     while (numberPage!=null){
         // All the code to get startups links
         const list= await getJobsLinks(page,sl+'/jobs');
         for(let l of list){
            const data= await getJobDetails(l,page,startupLink.toString(),Sname,j);
            scrapedData.push(data);
            console.log('scrapeddata',scrapedData)
            j++;
            if (j%2==0){
                var outputFile= './welcometothejungle-data/all-startups/batch-'+number+'.csv';
                writeCSV(scrapedData,outputFile);
                number++;
                scrapedData=[];
            }}
            numberPage=   await page.$('li[class="ais-Pagination-item ais-Pagination-item--nextPage"] a');
            if (numberPage) {await numberPage.click();
                await page.waitForTimeout(100);
        }
        
          }
        }
    
    /* Next page */ 
   num++;
   await page.goto("https://www.welcometothejungle.com/fr/companies?page="+num+"&aroundQuery=");
   console.log('next')
   await page.waitForTimeout(2000);
   Slinks = await page.$$eval('.dEWSJX li .biFsNh .cdtiMi .eqqpZQ a', as => as.map(a => a.href));
    }
 browser.close();
}} catch(e){console.log('THIS IS YOUR ERROR $e',e)}
}
getAll();

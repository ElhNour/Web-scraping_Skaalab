const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const readline = require('readline-sync');
const performance = require('perf_hooks').performance;
function UTF8(file) {
  let fileContents = fs.readFileSync(file);
  fs.writeFileSync(file, "\ufeff" + fileContents);
}

async function writeCSV(scrapedData, outputFile) {

  const csvWriter = createCsvWriter({
    path: outputFile,
    header: [

      { id: 'Startup', title: 'STARTUP' },
      { id: 'StartupLink', title: 'STARTUP WEBSITE' },
      { id: 'Id', title: 'IDOFFRE' },
      { id: 'Poste', title: 'POSTE' },
      { id: 'Contrat', title: 'CONTRAT' },
      { id: 'Salaire', title: 'SALAIRE' },
      { id: 'Diplome', title: 'DIPLOME' },
      { id: 'Experience', title: 'EXPERIENCE' },
      { id: 'Travail', title: 'TRAVAIL' },
      { id: 'Description', title: 'DESCRIPTION' },

    ],
    fieldDelimiter: ";"

  });
  await csvWriter.writeRecords(scrapedData);
  UTF8(outputFile);
};


async function getJobDetails(url, page, startuplink, sname, id) {

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
  var contrat = '';
  var salaire = '';
  var diplome = '';
  var experience = '';
  var travail = '';
  /*Regular expressions for the content of each class*/
  const contratTest = new RegExp('CDI| CDD| Stage| Alternance|', 'g');
  const salaireTest = new RegExp('Salaire | €|', 'g');
  const diplomeTest = new RegExp('Bac | \+', 'g');
  const experienceTest = new RegExp('>| ans|', 'g');

  /*Regular expressions for class name*/
  const classeContart = new RegExp("sc-qQYBZ djZmiW", "g");
  const classeSalaire = new RegExp("sc-qQYBZ ioaGbN", "g");
  const classeDiplome_Exp = new RegExp("sc-qQYBZ hOrZFz", "g");
  /*Getting information */
  for (let i = 0; i < texts.length; i++) {
    /*Check if it's the right class for Contrat*/
    if (classeContart.test(texts[i])) {
      /*Check if it's the right syntax for Contrat*/
      if (contratTest.test(value[i]))
        /*Affect value if it's true*/
        contrat = value[i];
    }
    if (classeSalaire.test(texts[i])) {
      if (salaireTest.test(value[i]))
        salaire = value[i];
    }
    if (classeDiplome_Exp.test(texts[i])) {
      if (diplomeTest.test(value[i]))
        diplome = value[i];

    }

    else {
      if (classeDiplome_Exp.test(texts[i])) {
        if (experienceTest.test(value[i]))
          experience = value[i];

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
  const remoteTest = new RegExp('Télétravail', 'g');
  /*Check the syntax*/
  try{
    if (remoteTest.test(await page.$eval('.sc-1qc42fc-2.dJqCnn', travail => travail.textContent)))
    /*Affect value if it's correct*/
    travail = await page.$eval('.sc-1qc42fc-2.dJqCnn', travail => travail.textContent);
  }catch(e){travail=''}
 


  return {
    Startup: sname,
    StartupLink: startuplink,
    Id: id,
    Poste: poste,
    Contrat: contrat,
    Salaire: salaire,
    Diplome: diplome,
    Experience: experience,
    Travail: travail,
    Description: description,

  }


};

async function setTech(page, technology, remote) {
  /* Uncheck ALGERIA */
  await page.waitForSelector('.sc-qZtCU.hQiWhi.ais-SearchBox-reset');
  await page.click('.sc-qZtCU.hQiWhi.ais-SearchBox-reset');
  await page.waitForTimeout(2000);

  /* Check Professions */
  await page.click('.cgXUxx header');
  const domains = await page.evaluate(() => {
    return [...document.body.querySelectorAll('.fdk8rh-3.kgRNJA div .fdk8rh-8.hvqMfO .fdk8rh-5.cVHXTK')]
      .map(element => element.textContent)

  });
  await page.waitForTimeout(2000);
  //console.log(domains)

  var tech = false;
  if (domains.includes("Tech")) {
    tech = true;
    const index = domains.indexOf('Tech');
    const selector1 = '[data-testid="company-jobs-search-widgets-profession-' + index + '"]';
    await page.waitForTimeout(1000);
    await page.click(selector1);

    const subdomains = await page.$$('[data-testid="company-jobs-search-widgets-profession-' + index + '-results"] .ais-RefinementList ul li.ais-RefinementList-item');

    for (let j = 0; j < subdomains.length; j++) {
      await page.waitForTimeout(2000);
      subdomains[j].click();
      if(j==3){        
        await page.evaluate((index)=>{
            const xp=[...document.body.querySelectorAll('[data-testid="company-jobs-search-widgets-profession-'+index+'-results"] .ais-RefinementList ul li.ais-RefinementList-item')]
        .forEach(element => element.scrollIntoView());
        },index);  
       }
  
    }

    const testRemote = new RegExp('yes|Yes|YES', 'g');
    
    if (technology!='')
    /* Select the technology */
    await page.type('form.ais-SearchBox-form .ais-SearchBox-input', technology);
    if (remote!=''){
      /* Select only remote jobs */
        if (testRemote.test(remote)) {
          await page.click('[data-testid="company-jobs-search-field-location"]');
          await page.click('[data-testid="company-jobs-results"] div.jzc9rp-6.czDGZw .sc-qQYBZ.kGBVAs');
        };
    }
  }
  //await page.waitForTimeout(1000)
  return tech;
};
async function getJobsLinks(page) {
  const hrefs = await page.$$eval('.gc3qm0-1.elzqlN div article header a', as => as.map(a => a.href));
  return hrefs;
};

async function getAll() {
   /* Read technology from the console and job */
  const technology = readline.question('Technologies: (to select all press Enter) ');
  const remote = readline.question('Is it remote?(Yes/Enter) ');
  /**Recuperer le temps de début d'execution  */
  var start=performance.now();
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  try {
    var page = await browser.newPage();
    
    await page.goto('https://www.welcometothejungle.com/fr/companies?page=1&aroundQuery=');
    await page.waitForTimeout(7000);
    var Slinks = await page.$$eval('.sc-1kkiv1h-3.hrptYB header h3 a', as => as.map(a => a.href));
    //console.log('slinks', Slinks);
    var j = 0;
    var number = 1;
    var num = 1; //page number
    var scrapedData = [];
    while (Slinks.length != 0) {
      for (let sl of Slinks) {
        await page.goto(sl + '/jobs');
        await page.waitForTimeout(2000);
        const value = await page.$eval('.fpJTTV ul li a .bnTGzJ', value => value.innerText);
        //console.log('value',value)
        /*Get start-up name */
        if (value != '0') {
          const Sname = await page.$eval('[data-t="dew4pq"]', Sname => Sname.textContent);
          const startupLink = await page.$$eval('.jGufXH .kGqTsU .cOxsDt a', as => as.map(a => a.href));
          //console.log('sname, link', Sname,startupLink)
          const tech = await setTech(page, technology, remote);
          if (tech) {
            do {
              await page.waitForTimeout(1000);
              var numberPage = await page.$('li[class="ais-Pagination-item ais-Pagination-item--nextPage"] a');
              const list = await getJobsLinks(page);
              for (let l of list) {
                const data = await getJobDetails(l, page, startupLink.toString(), Sname, j);
                scrapedData.push(data);
                //console.log('scrapeddata', scrapedData)
                j++;
                var outputFile = './welcometothejungle-data/all-startups/batch-' + number + '.csv';
                writeCSV(scrapedData, outputFile);
                if (j % 5000 == 0) {
                  number++;
                  scrapedData = [];
                }
              }
            
              if (numberPage!=null) {
                numberPage.click();
              }
            } while (numberPage!=null)
          }
        }
      }
      /* Next page */
      num++;
      await page.goto('https://www.welcometothejungle.com/fr/companies?page='+num+'&aroundQuery=');
     // console.log('next',num)
      await page.waitForTimeout(7000);
      Slinks = await page.$$eval('.sc-1kkiv1h-3.hrptYB header h3 a', as => as.map(a => a.href));
    }
    browser.close();
    /** Recuperer le temps de la fin d'execution */
    var end=performance.now(); 
   /** Calculer le temps total d'execution en minutes */
        console.log('execution time: ',(end-start)/60000,'m');
        } catch (e) { console.log('THIS IS YOUR ERROR $e', e) }
}
getAll();

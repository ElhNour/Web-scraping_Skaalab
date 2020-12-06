const puppeteer = require('puppeteer');
/*var mysql = require('mysql');
var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "password",
  database: "scrapeddata"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");});*/

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const readline = require('readline-sync');

const performance = require('perf_hooks').performance;

async function writeCSV1(scrapedData, outputFile1) {
  const csvWriter1 = createCsvWriter({
    path: outputFile1,
    header: [

      { id: 'name', title: 'name' },
      { id: 'website', title: 'website' },
      {id: 'sourceID', title:'sourceID'}
    ],
    fieldDelimiter: ";",

  });
  await csvWriter1.writeRecords(scrapedData);
};

async function writeCSV2(scrapedData, outputFile2) {

  const csvWriter2 = createCsvWriter({
    path: outputFile2,
    header: [
      { id: 'Poste', title: 'poste' },
      { id: 'Contrat', title: 'contrat' },
      { id: 'Salaire', title: 'salaire' },
      { id: 'Diplome', title: 'diplome' },
      { id: 'Experience', title: 'experience' },
      { id: 'Travail', title: 'travail' },
      { id: 'Description', title: 'description' },
      { id: 'Skills',title: 'skills'},
      {id: 'IdStartup', title:'startupID'}
    ],
    fieldDelimiter: ";",

  });

  await csvWriter2.writeRecords(scrapedData);
};


async function getJobDetails(url, page,idstartup) {

  await page.goto(url);
  //await page.setDefaultNavigationTimeout(0);
  await page.waitForTimeout(4000);
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

  var description = await page.evaluate(()=>{
    return [...document.body.querySelectorAll('.sc-11obzva-1.fKjhRQ')].map(element=>element.textContent).join('\n');
  });
 /* description=description.replace(/'/gi,"''")
  description=description.replace(/"/gi,'')
  description=description.replace(/\//gi,'')
  description=description.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\u2708-\uFE0F])/g, '');  
*/

  /*Regular expression for remote jobs*/
  const remoteTest = new RegExp('Télétravail', 'g');
  /*Check the syntax*/
  try {
    if (remoteTest.test(await page.$eval('.sc-1qc42fc-2.dJqCnn', travail => travail.textContent)))
      /*Affect value if it's correct*/
      travail = await page.$eval('.sc-1qc42fc-2.dJqCnn', travail => travail.textContent);
  } catch (e) { travail = '' }



  return {

    Poste: poste,
    Contrat: contrat,
    Salaire: salaire,
    Diplome: diplome,
    Experience: experience,
    Travail: travail,
    Description:description,
    Skills: '',
    IdStartup:idstartup
  }


};

async function setTech(page, technology, remote) {
  /* Uncheck ALGERIA */
  await page.waitForSelector('.sc-qZtCU.hQiWhi.ais-SearchBox-reset');
  await page.click('.sc-qZtCU.hQiWhi.ais-SearchBox-reset');
  await page.waitForTimeout(3000);

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
      await page.waitForTimeout(1000);
      subdomains[j].click();
      if (j == 3) {
        await page.evaluate((index) => {
          const xp = [...document.body.querySelectorAll('[data-testid="company-jobs-search-widgets-profession-' + index + '-results"] .ais-RefinementList ul li.ais-RefinementList-item')]
            .forEach(element => element.scrollIntoView());
        }, index);
      }

    }

    const testRemote = new RegExp('yes|Yes|YES', 'g');

    if (technology != '')
      /* Select the technology */
      await page.type('form.ais-SearchBox-form .ais-SearchBox-input', technology);
    if (remote != '') {
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
  var start = performance.now();

  /* Get Startup ID of the last inserted offer
  let query= "select from startup (name) where idstartup in (select from offre (startupID)....)"
  con.query(query,(error,response) => {
    console.log(error || response);
    //
  })
*/

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null,executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',});
  try {
    var page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.goto('https://www.welcometothejungle.com/fr/companies?page=1&aroundQuery=');
    await page.waitForTimeout(4000);
    var Slinks = await page.$$eval('.sc-1kkiv1h-3.hrptYB header h3 a', as => as.map(a => a.href));
    //console.log('slinks', Slinks);
    var j = 0;
    var s = 0;
    var idstartup=1;
    var number1 = 1;
    var number2 = 1;
    var num = 1; //page number
    var scrapedData = [];
    var startups = []
   // while (Slinks.length != 0) {
     while(num<=17){
      for (let sl of Slinks) {
        await page.goto(sl + '/jobs');
        await page.waitForTimeout(3000);
        const value = await page.$eval('.fpJTTV ul li a .bnTGzJ', value => value.innerText);
        //console.log('value',value)
        /*Get start-up name */
        if (value != '0') {
          const Sname = await page.$eval('.cchmzi-2.llLwPi', Sname => Sname.textContent);
          try{
            var startupLink = await page.$eval('.jGufXH .kGqTsU .cOxsDt a',a => a.href);
          }catch(e){
            startupLink=null
          }
           //var startup = [[Sname,startupLink,1]]
           var startup={
             name:Sname,
             website:startupLink,
             sourceID:1
           }

          /*let query="INSERT IGNORE INTO startup (name,website,sourceID) VALUES ?"
          con.query(query, [startup], (error, response) => {
            console.log(error || response);
            return idstartup=response.insertId
          })*/
                    
          const tech = await setTech(page, technology, remote);
          if (tech) {
            startups.push(startup)
            s++;
          var outputFile1='./startups/batch-'+number1+'.csv'
          writeCSV1(startups,outputFile1)
          startups=[]
          if(s%5000==0){
            number1++;
            startups=[]
          }

            do {
              await page.waitForTimeout(4000);
              const list = await getJobsLinks(page);
              for (let l of list) {
                const data = await getJobDetails(l, page,idstartup);
                scrapedData.push(data);
                
              /* query= "insert into offre (poste,contrat,salaire,diplome,experience,travail,description,startupID) Select '"+ data.Poste+"','"+data.Contrat+"','"+data.Salaire+"','"+data.Diplome+"','"+data.Experience+"','"+data.Travail+"','"+data.Description+"',"+idstartup+" Where not exists(select * from offre where description  ='"+data.Description+"')"
          con.query(query,(error, response) => {
            console.log('OFFRE',error || response);
          })*/
                //console.log('scrapeddata', scrapedData)
                var outputFile2 = './offres/batch-' + number2 + '.csv';
                writeCSV2(scrapedData, outputFile2);
                scrapedData=[]
                //console.log(scrapedData)
                j++;
                if (j % 5000 == 0) {
                  number2++;
                  scrapedData = [];
                }
                var sleep = performance.now()
                if (((sleep - start) / 3600000) == 2) await page.waitForTimeout(15 * 60000);
              }
              var numberPage = await page.$('li[class="ais-Pagination-item ais-Pagination-item--nextPage"] a');
              await page.waitForTimeout(2000)
              if (numberPage != null) {
                numberPage.click();
              }
            } while (numberPage != null)
            idstartup++;
          }
        }
      }
      /* Next page */
      num++;
      await page.goto('https://www.welcometothejungle.com/fr/companies?page=' + num + '&aroundQuery=');
      // console.log('next',num)
      await page.waitForTimeout(5000);
      Slinks = await page.$$eval('.sc-1kkiv1h-3.hrptYB header h3 a', as => as.map(a => a.href));
    }
    browser.close();
    /** Recuperer le temps de la fin d'execution */
    var end = performance.now();
    /** Calculer le temps total d'execution en minutes */
    console.log('execution time: ', (end - start) / 60000, 'm');
  } catch (e) { console.log('THIS IS YOUR ERROR $e', e) }
}
getAll();

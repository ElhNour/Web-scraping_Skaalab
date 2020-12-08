const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const performance = require('perf_hooks').performance;
var userAgent = require('user-agents');
var mysql = require('mysql');
var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "123456789",
  database: "scrapeddata"
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

async function writeCSV1(scrapedData, outputFile1) {
  const csvWriter1 = createCsvWriter({
    path: outputFile1,
    header: [

      { id: 'name', title: 'name' },
      { id: 'website', title: 'website' },
      { id: 'sourceID', title: 'sourceID' }

    ],
    fieldDelimiter: ";",
    append: true

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
      { id: 'Skills', title: 'skills' },
      { id: 'Description', title: 'description' },
      { id: 'IdStartup', title: 'startupID' }

    ],
    fieldDelimiter: ";",
    append: true


  });

  await csvWriter2.writeRecords(scrapedData);
};

async function lastPage() {
  return new Promise((resolve, reject) => {
    con.query('select * from restore', function (err, res, field) {
      resolve(res)
    });

  })
}

async function getIDStartup(name) {
  return new Promise((resolve, reject) => {
    con.query('select idstartup from startup where name=?', name, function (err, res, field) {
      resolve(res)
    });
  })
}
async function insertStartup(startup) {
  return new Promise((resolve, reject) => {
    con.query("INSERT IGNORE INTO startup (name,website,sourceID) VALUES ?", [startup], function (err, res, field) {
      resolve(res)
    });
  })

}
async function main() {

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', });

  var page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0)
  var start = performance.now();

  let response = await lastPage()
  response = JSON.parse(JSON.stringify(response))

  var bigset = new Set()

  if (response.length == 0) {
    await page.goto('https://fr.indeed.com/emplois?q=Jobs&taxo2=eXAh-UqhTh2uUxY71DdIeQ');
  } else {
    await page.goto('https://fr.indeed.com/emplois?q=Jobs&taxo2=eXAh-UqhTh2uUxY71DdIeQ')
    var numpage = 0;
    while (numpage < response[0].num) {
      await page.waitForTimeout(4000)
      /* get startups links*/
      var hrefs = await page.$$eval('.serpContainerMinHeight tbody tr td div .sjcl div .company a', as => as.map(a => a.href));
      /* Array to set */
      var set = new Set(hrefs)
      for (let s of set) {
        bigset.add(s.toString())
      }
      await page.evaluate(_ => {
        window.scrollBy(0, window.innerHeight + 100);
      });
      await page.waitForTimeout(2000);
      var numberPage = await page.$('[aria-label="Suivant"]');
      await page.waitForTimeout(2000);
      if (numberPage != null) {
        numberPage.click()
        numpage++
      }
      //await page.waitForTimeout(3000)
    }
  }

  await page.setUserAgent(userAgent.toString());
  var k = 0;
  var i = 0;
  var z;
  var s = 0;
  var count;
  if (response[0].num != null) count = response[0].num
  else count = 0;
  var scrapedData = []
  var startups = []
  var number1 = 1;
  var number2 = 1;
  var tmp = ''
  var link = ''
  try {
    do {
      z = 0;
      await page.waitForTimeout(5000)
      /* get offers IDs*/
      var offIDs = await page.evaluate(() => {
        return [...document.body.querySelectorAll('.serpContainerMinHeight tbody tr td div h2 a')]
          .map(element => element.id)
      });
      //console.log(offIDs)

      /* get job title*/
      var offNames = await page.evaluate(() => {
        return [...document.body.querySelectorAll('.serpContainerMinHeight tbody tr td div h2 a')]
          .map(element => element.textContent)
      });
      /* remove \n*/
      var repeat = true
      while (repeat) {
        repeat = false
        for (i = 0; i < offNames.length; i++) {
          if (offNames[i].includes('\n')) {
            offNames[i] = offNames[i].replace('\n', '')
            repeat = true
          }
        }
      }
      //console.log(offNames)
      if (response[0].offre != null) {
        while (offIDs[z] != response[0].offre && z < offIDs.length) z++;
      }
      if (z == offIDs.length) z = 0;


      /* get startups links*/
      var hrefs = await page.$$eval('.serpContainerMinHeight tbody tr td div .sjcl div .company a', as => as.map(a => a.href));
      /* Array to set */
      var set = new Set(hrefs)
      for (let s of set) {
        bigset.add(s.toString())
      }
      console.log('page ', count)

      // console.log('set',bigset)

      /*to check if startup link exists*/
      var check_a = await page.evaluate(() => {
        return [...document.body.querySelectorAll('.serpContainerMinHeight tbody tr td div .sjcl div .company')]
          .map(element => element.innerHTML)
      });
      //console.log(check_a)


      for (i = z; i < check_a.length; i++) {
        if (!check_a[i].includes(`<a `)) {
          tmp = offNames[i].toString();
          link = '';
          await page.waitForTimeout(2000)
          await page.click('#' + offIDs[i])
          await page.waitForTimeout(3500)

          /* get job description*/
          await page.waitForSelector('#vjs-tab-job #vjs-desc')
          var description = await page.evaluate(() => {
            return [...document.body.querySelectorAll('#vjs-tab-job #vjs-desc')].map(element => element.textContent).join('\n');
          });
          description = description.replace(/'/gi, "''")
          description = description.replace(/"/gi, '')
          description = description.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\u2708-\uFE0F])/g, '');
          var header = await page.evaluate(() => {
            return [...document.body.querySelectorAll('#vjs-jobinfo div span')].map(element => element.textContent)

          });
          var travail = '';
          var contrat = '';
          var salaire = '';
          var diplome = '';
          var experience = '';
          var j = 0;
          while (j < header.length) {
            switch (j) {
              case 0:
                var name = header[j]
                break;
              case 1:
                description = header[j] + ' ' + description
                break;
              case 2:
                if (header[j].includes('CDI')) contrat = 'CDI'
                else if (header[j].includes('CDD')) contrat = 'CDD'
                else if (header[j].includes('Stage')) contrat = 'Stage'
                else if (header[j].includes('Freelance')) contrat = 'Freelance'

                if (header[j].includes('Télétravail')) travail = 'Télétravail'
                if (header[j].includes('Apprentissage')) travail = 'Apprentissage'
                else if (header[j].includes('Temps plein')) travail = 'Temps plein'
                else if (header[j].includes('Temps partiel')) travail = 'Temps partiel'

                if (header[j].includes('€')) salaire = header[j].substring(0, header[j].lastIndexOf('€') + 1)
                break;
            }
            j++;
          }

          var startup = [[name, '', 2]]

          /*startups.push(startup)
          s++;
          var outputFile1 = './startups/batch-'+number1+'.csv'
          writeCSV1(startups, outputFile1)
          startups=[] 
          if (s % 5000 == 0) { number1++;
            startups=[]
          }*/

          var res = await insertStartup(startup)
          res = JSON.parse(JSON.stringify(res))
          var idstartup = res.insertId
          if (idstartup == 0) {
            var result = await getIDStartup(name.toString());
            await page.waitForTimeout(4000)
            result = JSON.parse(JSON.stringify(result))
            //console.log('idstartup',result)
            idstartup = result[0].idstartup
          }

          var offre = {
            Poste: poste,
            Contrat: contrat,
            Salaire: salaire,
            Diplome: diplome,
            Experience: experience,
            Travail: travail,
            Description: description.toLowerCase(),
            Skills: '',
            IdStartup: idstartup
          }
          /*scrapedData.push(offre)
          var outputFile2 = './offres/batch-'+number2+'.csv'
          writeCSV2(scrapedData, outputFile2);
          scrapedData=[]
          //console.log(scrapedData)
          k++;
          if (k % 5000 == 0)  {number2++;
          scrapedData=[]}*/

        }
      }
      await page.evaluate(_ => {
        window.scrollBy(0, window.innerHeight + 500);
      });
      await page.waitForTimeout(2000);
      var numberPage = await page.$('[aria-label="Suivant"]');
      await page.waitForTimeout(2000);
      if (numberPage != null) numberPage.click()
      await page.waitForTimeout(3000)
      count++
    } while (numberPage != null)


    /* startups having links */
    for (let l of bigset) {
      /* go to startup link*/
      var link = l.toString();
      await page.goto(l + '/jobs')
      console.log('now :' + l + '/jobs')
      await page.waitForTimeout(5000)

      /* get startup name*/
      var startupname = await page.$eval('.cmp-CompactHeaderLayout-nameContainer .cmp-CompactHeaderCompanyName', startupname => startupname.textContent)
      //console.log('startupname', startupname)

      var startup = [[startupname, link, 2]]
      var res = await insertStartup(startup)
      res = JSON.parse(JSON.stringify(res))
      var idstartup = res.insertId
      if (idstartup == 0) {
        var result = await getIDStartup(name.toString());
        await page.waitForTimeout(4000)
        result = JSON.parse(JSON.stringify(result))
        //console.log('idstartup',result)
        idstartup = result[0].idstartup
      }
      /*var startup = {
        name: startupname,
        website: link,
        sourceID: 2
      }
      startups.push(startup)
      s++;
      var outputFile1 = './startups/batch-'+number1+'.csv'
      writeCSV1(startups, outputFile1)
      startups=[]
      if (s % 5000 == 0) { number1++;
        startups=[]
      }*/

      do {

        await page.waitForTimeout(4000)
        const offers = await page.$$('[data-tn-component="JobListItem[]"]')
        console.log(offers.length)
        var travail = '';
        var contrat = '';
        var salaire = '';
        var diplome = '';
        var experience = '';
        for (let j = 0; j < offers.length; j++) {
          await page.waitForTimeout(1000)
          offers[j].click()
          await page.waitForTimeout(3000)
          var poste = await page.$eval('[data-testid="jobDetailTitle"]', poste => poste.textContent)
          //console.log('poste', poste)
          tmp = poste.toString();
          location = await page.$eval('[data-testid="jobDetailSubtitle"]', poste => poste.textContent)
          location = location.replace(startupname + ' - ', '')
          var description = await page.evaluate(() => {
            return [...document.body.querySelectorAll('.cmp-JobDetailDescription-scrollable .cmp-JobDetailDescription-description')].map(element => element.innerText).join('\n')
          });
          description = location + ' ' + description
          //console.log(description + '\n************************\n')

          /* check if 'travail' attribute exists*/
          if (description.includes('Horaire' + '\n') || description.includes('Temps de travail')) {
            if (description.includes('Temps plein')) travail = 'Temps plein'
            else travail = 'Temps partiel'
          }
          // console.log('travail', travail)
          /* check if 'contrat' exists*/
          if (description.includes('Contrat :')) {
            header = await page.evaluate(() => {
              return [...document.body.querySelectorAll('.cmp-JobDetailDescription-description div div div ul li b')].map(element => element.textContent)
            });
            contrat = header[0]
            travail = header[1]
            experience = header[2]
            diplome = header[3]
          }
          if (!(/\d/.test(experience))) {
            /* check if 'experience' exists*/
            if (description.includes('Expérience') || description.includes('expérience'))
              experience = description.substring(description.indexOf(' an') - 2, description.indexOf(' an') + 3)
            if (!(/\d/.test(experience))) experience = ''
            else {
              if (description.includes('max') || description.includes('Max')) experience += ' au max'
              else if (description.includes('min') || description.includes('Min')) experience += ' au min'
            }


            if (description.includes('Experience') || description.includes('experience'))
              experience = description.substring(description.indexOf(' years') - 2, description.indexOf(' years'))
            if (!(/\d/.test(experience))) experience = ''
            else {
              if (description.includes('at most') || description.includes('At most')) experience += ' ans au max'
              else if (description.includes('at least') || description.includes('At least')) experience += ' ans au min'
            }
          }
          if (!(/\d/.test(experience))) experience = ''
          description = description.replace(/'/gi, "''")
          description = description.replace(/"/gi, '')
          description = description.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\u2708-\uFE0F])/g, '');

          /*var offre = {
            Poste: poste,
            Contrat: contrat,
            Salaire: salaire,
            Diplome: diplome,
            Experience: experience,
            Travail: travail,
            Description: description.toLowerCase(),
            Skills: '',
            IdStartup: idstartup
          }
          scrapedData.push(offre)
          var outputFile2 = './offres/batch-'+number2+'.csv'
          writeCSV2(scrapedData, outputFile2);
          scrapedData=[]
          //console.log(scrapedData)
          k++;
          if (k % 5000 == 0)  {number2++;
          scrapedData=[]}*/

          //console.log(experience+`\n`+contrat+'\n'+diplome)*/
          var query = "insert into offre (poste,contrat,salaire,diplome,experience,travail,description,startupID) Select '" + poste + "','" + contrat + "','" + salaire + "','" + diplome + "','" + experience + "','" + travail + "','" + description.toLowerCase() + "'," + idstartup + " Where not exists(select * from offre where description  ='" + description.toLowerCase() + "')"
          con.query(query, (error, response) => {
            console.log('OFFRE', error || response);
          })

        }
        await page.evaluate(_ => {
          window.scrollBy(0, window.innerHeight + 500);
        });
        await page.waitForTimeout(2000)
        var nextPage = await page.$('[data-tn-element="next-page"]');
        await page.waitForTimeout(2000)
        if (nextPage != null) nextPage.click()

        /* next page*/
      } while (nextPage != null)
    }
  } catch (e) {
    var query = "insert into restore (link,offre,num) values ('" + link + "','" + tmp + "'," + count + ")"
    con.query(query, (error, response) => {
      console.log('restore', error || response);
    })
    console.log('THIS IS YOUR ERROR $e', e)
  }
  //browser.close()
  var end = performance.now();
  /** execution time in minutes */
  console.log('execution time: ', (end - start) / 60000, 'minutes');
}
main();
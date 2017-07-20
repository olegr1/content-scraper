const http = require('http');
const fs = require('fs');

const cheerio = require('cheerio'); //Slightly general-purpose but commonly used for scraping, very popular and stable library
const json2csv = require('json2csv'); //Popular library for converting JSON to CSV

const moment = require('moment'); //Date-formatting library

//A few global settings
const siteUrl = 'http://www.shirts4mike.com';
const mainPage = 'shirts.php';
const tshirtsDetails = [];

let tshirtLinksCount = 0;

function getPageHtml(url, callback){

    console.log(`Getting HTML for: ${url}`);

    try{                
        const request = http.get(url, (response) => {

            //If the response is OK...
            if(response.statusCode === 200){

                let html = "";

                response.on('data', chunk => {
                    html += chunk;
                }); 

                //...pass the HTML of the page into the provided callback
                response.on('end', () => {
                    callback(html);                    
                });            

            }else{

                let errorMessage = `Error ${response.statusCode} ${http.STATUS_CODES[response.statusCode]}: ${url}`;
                logError(errorMessage);

                callback(''); //Empty string is passed to the callback in case of error
            }    
        });

        request.on('error', (error) => {
            let errorMessage = `Unable to connect to ${error.host}`;
            logError(errorMessage);

            callback(''); 
        });

    }catch(error){
        logError(error.message);
        callback(''); 
    }
}

function logError(errorMessage){

    console.error(errorMessage);

    const errorLogFile = './scraper-error.log';
    const errorLogEntry = `[${moment().format()}] ${errorMessage} \r\n`;

    //Check if error log exists and create if it doesn't
    if (!fs.existsSync(errorLogFile)) {

        fs.writeFile(errorLogFile, errorLogEntry, (err) => {
            if (err) throw err;
            console.log('Error log updated');
        });
    }else{
        fs.appendFileSync(errorLogFile, errorLogEntry);
    }
}

function processTshirtLinks(html){

    if(html !== ''){

        //Load HTML of into Cheerio for manipulation
        const $ = cheerio.load(html);       

        //Get links to individual t-shirt pages
        let $links = $('.products > li > a'); 
        
        $links.each((i, element)=>{

            //Extract each link's URL
            let shirtPageUrl = $(element).attr('href');

            //Get HTML of the t-shirt page
            getPageHtml(siteUrl + "/" + shirtPageUrl, (html) => {

                //Pass the HTML to the scraper method
                scrapeTshirtDetails(shirtPageUrl, html);
            });
        });

        tshirtLinksCount = $links.length;        
    }
}

function scrapeTshirtDetails(url, html){  
    if(html !== ''){
        //Load HTML of into Cheerio for scraping
        const $ = cheerio.load(html);    
        
        //Separate the title from price
        let fullTitle = $('.shirt-details h1').text();
        let title = fullTitle.substr(fullTitle.indexOf(" ") + 1);

        //Create a t-shirt object containing relevant data and push it to an array
        let tshirt = {};
            tshirt.title =  title;        
            tshirt.price = $('.shirt-details .price').text();
            tshirt.imageUrl = siteUrl + "/" + $('.shirt-picture img').attr('src');
            tshirt.url = siteUrl + "/" + url;
            tshirt.time = moment().format('YYYY-MM-DD, LT Z');

        tshirtsDetails.push(tshirt);        
    }

    //If all t-shirt pages were processed, save the data 
    if(tshirtsDetails.length === tshirtLinksCount) {
        saveTshirtDetails();
    }
}

function saveTshirtDetails(){

    //Set CSV file options
    const csvDirName = "./data";
    const fields = ['title', 'price', 'imageUrl', 'url', 'time'];
    const fieldNames = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];

    //Generate CSV
    const csv = json2csv({ data: tshirtsDetails, fields: fields, fieldNames: fieldNames });

    //Check if Data folder exists and create if it doesn't
    if (!fs.existsSync(csvDirName)) {
        fs.mkdirSync(csvDirName);
    }

    //Write the generated CSV to a file in the data folder
    fs.writeFileSync(`./data/${moment().format('YYYY-MM-DD')}.csv`, csv);
}

//Run the app with http://shirts4mike.com/shirts.php as the entry point
getPageHtml(siteUrl + "/" + mainPage, processTshirtLinks);
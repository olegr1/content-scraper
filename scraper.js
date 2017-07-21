const http = require('http');
const fs = require('fs');
const Xray = require('x-ray'); //Scraper library
const json2csv = require('json2csv'); //CSV library
const moment = require('moment'); //Time formatting library

//X-ray scraper object with filters defined
const xray = new Xray({
    filters: {
        removePriceFromTitle: function (fullTitle) {
            return fullTitle.substr(fullTitle.indexOf(" ") + 1);
        },
        getFormattedTime: function (time) {
            return moment().format('YYYY-MM-DD, LT Z');
        }
    }
});

//Start scraping
xray('http://www.shirts4mike.com/shirts.php', '.products > li',
[{
    title: xray('a@href', '.shirt-details h1 | removePriceFromTitle'),
    price: xray('a@href', '.shirt-details .price'),
    imageUrl: xray('a@href', '.shirt-picture span img@src'),
    url: 'a@href',
    time: "time | getFormattedTime"
}])(function(error, tshirtDetails) {   
    if(error){
        logError("Error: cannot connect to http://www.shirts4mike.com")
    }else{        
        saveTshirtDetails(tshirtDetails);
    }
});

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

function saveTshirtDetails(tshirtsDetails){

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
    try{        
        fs.writeFileSync(`./data/${moment().format('YYYY-MM-DD')}.csv`, csv);
    }catch(error){
        logError("Error: cannot write to CSV, the file may be open or locked");
    }
}
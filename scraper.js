const http = require('http');
const cheerio = require('cheerio');

const siteUrl = 'http://www.shirts4mike.com';
const mainPage = '/shirts.php';


function getPageHtml(url, callback){
    try{                
        const request = http.get(url, (response) => {

            if(response.statusCode === 200){

                let html = "";

                response.on('data', chunk => {
                    html += chunk;
                }); 

                response.on('end', () => {
                    callback(html);                    
                });            

            }else{
                console.error(`Error ${response.statusCode}: ${http.STATUS_CODES[response.statusCode]}.`);
                callback(''); 
            }    
        });

        request.on('error', (error) => {
            console.error(`Unable to connect to ${error.host}`);
        });

    }catch(error){
        console.log(error.message);
    }
}


function getTshirtUrls(html){
    if(html !== ''){
        const $ = cheerio.load(html);

        $('.products > li > a').each((i, element)=>{
            let shirtPageUrl = "/" + $(element).attr('href');
            getPageHtml(siteUrl + shirtPageUrl, collectShirtDetails);
        });
    }
}

function collectShirtDetails(html){
    if(html !== ''){
        const $ = cheerio.load(html);
        console.log($('.shirt-details h1').text());
    }
}

getPageHtml(siteUrl + mainPage, getTshirtUrls);
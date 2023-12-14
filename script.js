const path = require("path");
const express = require("express");   
const app = express();
const fs = require("fs");
const portNumber = 4000;
const bodyParser = require("body-parser");
const { type } = require("os");

app.use(bodyParser.urlencoded({extended:false}));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {db: "CMSC335_DB", collection:"finalProject"};
const { MongoClient, ServerApiVersion } = require('mongodb');

app.get("/", (request, response) => {
    response.render("index");
})


app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);


/*
API STUFF
right now does nothing but logs statistics in a json to the console for one team
the team parameter in the url is relative to the team ID
*/
const url = 'https://api-basketball.p.rapidapi.com/statistics?season=2019-2020&league=12&team=133';
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '742c0ff09cmshf29eff15af59732p1a4a9cjsn64e107c49959',
    'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com'
  }
};

response()

async function response() {
    try {
        const response = await fetch(url, options);
        const result = await response.text();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

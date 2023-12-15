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
const client =  new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const { request } = require("http");

const ids = new Map([
  ["Atlanta Hawks",132],
  ["Boston Celtics",133],
  ["Brooklyn Nets",134],
  ["Charlotte Hornets",135],
  ["Chicago Bulls",136],
  ["Cleveland Cavaliers",137],
  ["Dallas Mavericks",138],
  ["Denver Nuggets",139],
  ["Detroit Pistons",140],
  ["Golden State Warriors",141],
  ["Houston Rockets",142],
  ["Indiana Pacers",143],
  ["Los Angeles Clippers",144],
  ["Los Angeles Lakers",145],
  ["Memphis Grizzlies",146],
  ["Miami Heat",147],
  ["Milwaukee Bucks",148],
  ["Minnesota Timberwolves",149],
  ["New Orleans Pelicans",150],
  ["New York Knicks",151],
  ["Oklahoma City Thunder",152],
  ["Orlando Magic",153],
  ["Philadelphia 76ers",154],
  ["Phoenix Suns",155],
  ["Portland Trail Blazers",156],
  ["Sacramento Kings",157],
  ["San Antonio Spurs",158],
  ["Toronto Raptors",159],
  ["Utah Jazz",160],
  ["Washington Wizards",161]
]);

/*
API STUFF
right now does nothing but logs statistics in a json to the console for one team
the team parameter in the url is relative to the team ID
NBA ids range from 132 to 161
*/
const url = 'https://api-basketball.p.rapidapi.com/statistics?season=2022-2023&league=12&team=133';
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '742c0ff09cmshf29eff15af59732p1a4a9cjsn64e107c49959',
    'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com'
  }
};

async function insertPerson(databaseAndCollection, person) {
  try {
      await client.connect();
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(person);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function getEveryone(databaseAndCollection) {
  try {
      await client.connect()
      const cursor = client.db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .find().sort({ name: 1});
      const result = await cursor.toArray();
      let table = "<table border=\"1\"><tr><th>Name</th><th>Favorite Team</th></tr>"
      result.forEach(element => {
          table += `<tr><td>${element.name}</td><td>${element.favoriteTeam}</td></tr>`
      });
      table += "</table>"
      return table
  } catch (e) {
      console.error(e);
      return null
  } finally {
      await client.close();
  }
}

async function containsPerson(databaseAndCollection, name) {
  try {
    await client.connect()
    let filter = {name : { $eq: name}};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
    const result = await cursor.toArray();
    if(result.length != 0){
      return true
    } else {
      return false
    }
  } catch (e) {
      console.error(e);
      return null
  } finally {
      await client.close();
  }
}

async function updatePerson(databaseAndCollection, name, newTeam) {
  try {
    await client.connect()
    let filter = {name : { $eq: name}};
    let updateDoc = {
      $set : {favoriteTeam : newTeam}
    }
    const cursor = await client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .updateOne(filter, updateDoc);
  } catch (e) {
      console.error(e);
      return null
  } finally {
      await client.close();
  }
}

app.get("/", async (request, response) => {
  let string = await getEveryone(databaseAndCollection)
  let variables = {
    portNumber : portNumber,
    tableString : string
  }
  response.render("index", variables);
});

app.post("/",  async (request, response) => {
  let team = String(request.body.teamOptions)
  let name = String(request.body.name)
  let season = String(request.body.seasonOptions)
  if(season == "Current Season") {
    season = "2023-2024"
  }
  let teamId = ids.get(team)
  let url = `https://api-basketball.p.rapidapi.com/statistics?season=${season}&league=12&team=${teamId}`;
  let variables
  let person = {
    name : name,
    favoriteTeam : team
  }
  if(! (await containsPerson(databaseAndCollection, name))) {
    await insertPerson(databaseAndCollection, person)
  } else {
    let newTeam = team
    await updatePerson(databaseAndCollection, name, newTeam)
  }
  try {
    //API fetching and parsing
    const response = await fetch(url, options);
    const result = await response.json();
    variables = {
      team : team,
      gamesPlayed : result.response.games.played.all,
      wins : result.response.games.wins.all.total,
      loses : result.response.games.loses.all.total,
      totalPointsFor : result.response.points.for.total.all,
      totalPointsAgainst : result.response.points.against.total.all,
      avgPpg : result.response.points.for.average.all,
      avgOPpg : result.response.points.against.average.all
    
    }
    //console.log("gamesPlayed" + result.response.games.played.all)
  } catch (error) {
    console.error(error);
  }
  response.render("stats", variables)
});


app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
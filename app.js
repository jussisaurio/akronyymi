/* Psbl Bugs: 1. sometimes wont accept submissions
2. Game starts over automatically sometimes
4. "too late!" msg
*/

var express = require('express');
var app = express(); // enclose the express function in a variable called app
var http = require('http').Server(app);
var io = require('socket.io')(http);
var peli = require('./peli');


//var bodyParser = require('body-parser');
//var urlEncParser = bodyParser.urlencoded({ extended: false});
var pelivaihe ="ei";
var botName ="AKROBOT";
var alkukirjaimet =[];
var akronyymi="";
var users=[];
var vote=[];
var answer=[];
var kierrospisteet=[];
var tulokset={};
var animals = ["Apina", "Seepra", "Pulu", "Hamsteri", "Kookaburra", "Simpanssi", "Koira", "Norsu", "Bonobo", "Pässi", "Mufloni"];
var vastaukset=[];
var kierros=0;
var aika=0;

app.set('view engine', 'ejs') // set the express view engine to ejs (embedded javascript & html)
app.use('/assets', express.static('assets')); // route requests to styles folder (html file requests css files)



app.get('/', function (req, res) {
	res.render('index');
});




io.on('connection', function(socket) {


	socket.on('join', function(session) {

		
		users[socket.id] = "Nimetön" + animals[Math.floor(Math.random()*animals.length)] + Math.floor(Math.random()*100 +1);
				var data = {username: users[socket.id]};
		var welcomeData = {username: botName, msg: "Moro " + users[socket.id] + ", tässä pikaohjeet: komento '/aloita' alottaa pelin, komento '/nick haluamasiNimi' vaihtaa käyttäjänimeä, '/v vastaus' puolestaan lähettää keksimäsi lauseen tai äänestää haluamaasi lausetta."};
		socket.emit('privaviesti', welcomeData);
		
		var userlist="";
		Object.keys(users).forEach(function (key){

			userlist += users[key] +" ";
		});
		console.log(users);
		io.emit('kayttajat', userlist);

		// socket.emit('akronyymi', "Akronyymi: " + akronyymi);
	});
	


	socket.on('viesti', function(v) {

		v.username = users[socket.id];
		// Käyttäjä antaa komennon viestin sijaan
		if (v.msg[0] === "/") {

			// jaetaan komento komentosanaan ja parametreihin
			msgArray = v.msg.split(' ');

			// jos /nick ja tasan yksi parametri jonka pituus max 20, vaihetaan nicknamea parametrin mukaisesti
			if (msgArray[0] === "/nick" && msgArray.length === 2 && msgArray[1].length < 21) {

				var oldUser = users[socket.id];
				v.username = botName;
				users[socket.id] = msgArray[1];
				v.newName = users[socket.id];
				v.msg = "*** " + oldUser + " vaihtoi nimimerkikseen " + users[socket.id] + " ***";
				v.nickChange = true;
				io.emit('viesti', v);

				var userlist="";
				Object.keys(users).forEach(function (key){

					userlist += users[key] +" ";
				});
				console.log(users);
				io.emit('kayttajat', userlist);
			}

			if (msgArray[0] === "/aloita" && msgArray.length <= 2 && pelivaihe=="ei") {

				pelivaihe ="intro";
				v.msg ="Käyttäjä " + users[socket.id] +" käynnisti pelin. Vastaa esim. AEKO: '/v Avaruusolioiden eritteet kirvelevät omituisesti.'";
				v.username = botName;
				io.emit('viesti', v);

				setTimeout(aloitaPeli, 10000);
			}

			if (msgArray[0] === "/v" && msgArray.length > 1 && pelivaihe === "laadinta") {

				var vastaus = msgArray.slice(1);

				kasitteleVastaus(vastaus, socket.id);
			}

			if (msgArray[0] === "/v" && msgArray.length === 2 && pelivaihe === "aanestys") {

				var vastaus = msgArray.slice(1);

				kasitteleVastaus(vastaus, socket.id);
			}
		}
		else io.emit('viesti', v);
	});

	socket.on('disconnect', function() {

		console.log('käyttäjä katkaisi yhteyden');
		delete users[socket.id];
		var userlist="";
		Object.keys(users).forEach(function (key){

			userlist += users[key] +" ";
		});
		console.log(users);
		io.emit('kayttajat', userlist);

	});




	function aloitaPeli () {

		if (kierros===0) tulokset={};
		if (kierros >=5) {pelivaihe="ei"; return;}

		pelivaihe="laadinta";
		alkukirjaimet =[];
		vastaukset=[];
		vote=[];
		answer=[];
		akronyymi="";
		kierros++;
		kierrospisteet[kierros]=[];
		

		var akrPituus = Math.round(Math.random()*4+3);
		var rand=0; var kirj="";
		for (var k=0; k < akrPituus; k++) {

		rand = Math.random()*986;
		
		if (rand < 116) kirj ="A"; 
		else if (rand < 223) kirj ="I"; 
		else if (rand < 322) kirj ="T"; 
		else if (rand < 409) kirj ="N"; 
		else if (rand < 491) kirj ="E"; 
		else if (rand < 569) kirj ="S"; 
		else if (rand < 626) kirj ="L"; 
		else if (rand < 679) kirj ="O"; 
		else if (rand < 732) kirj ="K"; 
		else if (rand < 782) kirj ="U"; 
		else if (rand < 830) kirj ="Ä"; 
		else if (rand < 865) kirj ="M"; 
		else if (rand < 890) kirj ="V"; 
		else if (rand < 909) kirj ="R"; 
		else if (rand < 917) kirj ="J"; 
		else if (rand < 935) kirj ="H"; 
		else if (rand < 953) kirj ="Y"; 
		else if (rand < 969) kirj ="P"; 
		else if (rand < 977) kirj ="D"; 
		else if (rand < 982) kirj ="Ö"; 
		else if (rand < 983) kirj ="G"; 
		else if (rand < 984) kirj ="B";
		else if (rand < 985) kirj ="F";
		else if (rand < 986) kirj ="C";

		alkukirjaimet.push(kirj);
		}
		akronyymi = alkukirjaimet.join('');

		io.emit('boldviesti', {username: botName, msg: "Kierros " + kierros +": " +akronyymi});
		io.emit('akronyymi', "Akronyymi: " + akronyymi);

		aika=akrPituus*7;

		var sekuntikello = setInterval(function() {

			io.emit('kello', aika);
			aika--;

			if (aika<0) {

				clearInterval(sekuntikello);
				io.emit('kello', '');
				io.emit('akronyymi', '')
				pelivaihe="aanestys";
				listaaVastaukset();
			}
		}, 1000);
	}

function listaaVastaukset() {

	if (vastaukset.length< 2) { 
		
		if (vastaukset.length===0) io.emit('viesti', {username: botName, msg: "Pelakkaa ny saatana"});
		if (vastaukset.length===1) io.emit('viesti', {username: botName, msg: "Ei hirveesti pointtia äänestää kun vaa yks lause. Pelakkaa ny saatana"});
		if (kierros <5) setTimeout(aloitaPeli, 3000);
		else setTimeout(pelaajaPisteet, 3000);

		return;
	}
	for (var a=0; a < vastaukset.length; a++) {

		io.emit('boldviesti', {username: botName, msg: (a+1)+". " + vastaukset[a].vastaus});
	}

	io.emit('viesti', {username: botName, msg: "Äänestä suosikkiasi komennolla /v [nro], esim. /v 666. Jos lähetit lauseen, äänestämättä jättämisestä tulee miinuspiste."});

	pelivaihe ="aanestys";
	io.emit('akronyymi', "Äänestä nyt (/v nro)");

	for (var k=0; k < vastaukset.length; k++) {
		kierrospisteet[kierros][k]=0;
	}
	
	aika=vastaukset.length*8;

		var sekuntikello = setInterval(function() {

			io.emit('kello', aika);
			aika--;

			if (aika<0) {

				clearInterval(sekuntikello);
				io.emit('kello', '');
				pelivaihe="kierrostulokset";
				kierrosTulokset();
			}
		}, 1000);
}

function kierrosTulokset() {


	for (var t=0; t < vastaukset.length; t++) {

		// Vastasi mutta ei äänestänyt -> -1p.
		if (answer[vastaukset[t].pelaajaID] && !vote[vastaukset[t].pelaajaID]) {
			kierrospisteet[kierros][t]--;
			if (!tulokset.hasOwnProperty(vastaukset[t].pelaajaID)) tulokset[vastaukset[t].pelaajaID]=-1;
			else tulokset[vastaukset[t].pelaajaID]--;
		}
		
		// Printtaa pelaajan vastaukselle annetut pisteet
		io.emit('boldviesti', {username: botName, msg: users[vastaukset[t].pelaajaID] +": " + vastaukset[t].vastaus + " - " + kierrospisteet[kierros][t] +"p."});
	}
	setTimeout(pelaajaPisteet, 2000);
	if (kierros <5) setTimeout(aloitaPeli, 5000);
}

function pelaajaPisteet() {

	if (kierros <=4) {
	io.emit('viesti', {username: botName, msg: "Välitulokset:"});

	console.log(Object.keys(tulokset));
	}
	
	if (kierros===5) {
	io.emit('viesti', {username: botName, msg: "Lopputulokset:"});

	console.log(Object.keys(tulokset));

	}
	
	var results=[];
	
	for (pelaajaID in tulokset) {

		console.log (pelaajaID + ": " + tulokset[pelaajaID]);
		results.push([tulokset[pelaajaID], users[pelaajaID]]);
		results = results.sort(function(a,b) {

			return b[0] - a[0];
		});
	}

	results.forEach(function (r){
		io.emit('boldviesti', {username: botName, msg: r[1] +": " + r[0] +"p."});
	});
	


	io.emit('boldviesti', {username: botName, msg: ''});

	if (kierros===5) {pelivaihe="ei"; kierros=0; vastaukset={};}
}

function kasitteleVastaus (vastaus, pelaajaID) {

	var validi = true;

	if (pelivaihe==="laadinta") {
		
		if (answer[socket.id]===true) validi=false;
		if (vastaus.length !== alkukirjaimet.length) validi=false;
		else {
		for (var s=0; s < alkukirjaimet.length; s++) {

			console.log (vastaus[s][0].toUpperCase() + " ja " + alkukirjaimet[s]);
			if (vastaus[s][0].toUpperCase() !== alkukirjaimet[s]) validi = false;
		}
		}

		if (!validi) {
			socket.emit('privaviesti', {username: botName, msg: users[pelaajaID]+": annoit virheellisen vastauksen. Kokeile uudelleen!"});
		}
		else {

			answer[socket.id]=true;
			vastaukset.push({pelaajaID: pelaajaID, vastaus: vastaus.join(' ')});
			socket.emit('privaviesti', {username: botName, msg: users[pelaajaID]+": OK."});
		}
	}
	else if (pelivaihe==="aanestys") {

		if (isNaN(vastaus) || !vastaukset[vastaus-1]) {

			socket.emit('privaviesti', {username: botName, msg: users[pelaajaID]+": äänestit virheellisesti. Kokeile uudelleen!"});
		}
		else if (vote[socket.id] === true) {

			socket.emit('privaviesti', {username: botName, msg: users[pelaajaID]+": et voi äänestää monta kertaa. Homo."});
		}
		else if (vastaukset[vastaus-1].pelaajaID === users[socket.id]) {

			socket.emit('privaviesti', {username: botName, msg: users[pelaajaID]+": et voi äänestää ITTEES vitun pelle."});

		}
		else {

			vote[socket.id] = true;
			kierrospisteet[kierros][vastaus-1]++;
			console.log (tulokset);

			if (!tulokset.hasOwnProperty(vastaukset[vastaus-1].pelaajaID)) tulokset[vastaukset[vastaus-1].pelaajaID]=1;
			else tulokset[vastaukset[vastaus-1].pelaajaID]++;

			socket.emit('privaviesti', {username: botName, msg: users[pelaajaID]+": OK."});
		}
	}
}



	
});

/*app.post('/noni', urlEncParser, function(req, res){

	if (!req.body) return res.sendStatus(400);

	// tässä vois vaikka res.render jonkun toisen viewin ja laittaa ton datan parametriks
	res.send(JSON.stringify(req.body));
});*/

var port=process.env.PORT || 3000;
http.listen(port);
console.log("Listening on port " + port);
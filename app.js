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
var kierrospisteet=[];
var tulokset={};
var animals = ["Monkey", "Zebra", "Pigeon", "Hamster", "Kookaburra", "Chimp", "Dog", "Hippo", "Rhinoceros"];
var vastaukset=[];
var kierros=0;
var aika=0;

app.set('view engine', 'ejs') // set the express view engine to ejs (embedded javascript & html)
app.use('/styles', express.static('styles')); // route requests to styles folder (html file requests css files)



app.get('/', function (req, res) {
	res.render('index');
});




io.on('connection', function(socket) {

	socket.on('join', function(session) {

		
		users[socket.id] = "Anonymous" + animals[Math.floor(Math.random()*animals.length)] + Math.floor(Math.random()*100);
				var data = {username: users[socket.id]};
		var welcomeData = {username: botName, msg: "Vitun " + users[socket.id] + " tervetuloo tsättäILEEEN, tän pitäs näkyy sulle vaa privana ;)"};
		socket.emit('privaviesti', welcomeData);
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
			}

			if (msgArray[0] === "/aloita" && msgArray.length <= 2 && pelivaihe=="ei") {

				pelivaihe ="intro";
				v.msg ="Nöniin, käyttäjä " + users[socket.id] +" haluaa pelata akronyymipeli PASKAa. Luvassa 5 kierrosta. "
				if (msgArray[1] && msgArray[1].toLowerCase() === "säännöt") v.msg += "Pelin tarkoituksena on keksiä mahdollisimman helmi lause, fraasi tahi vastaava annetusta akronyymista. Esim. akronyymista JEES keksi vaikka Jeesus Elää Emmoo Sienipäissäni. =D ";
				v.msg += "Aloitetaan pian...";
				v.username = botName;
				io.emit('viesti', v); //

				setTimeout(aloitaPeli, 2000);
			}

			if (msgArray[0] === "/v" && msgArray.length > 1 && pelivaihe === "laadinta") {

				var vastaus = msgArray.slice(1);

				kasitteleVastaus(vastaus, v.username);
			}

			if (msgArray[0] === "/v" && msgArray.length === 2 && pelivaihe === "aanestys") {

				var vastaus = msgArray.slice(1);

				kasitteleVastaus(vastaus, v.username);
			}
		}
		else io.emit('viesti', v);
	});

	socket.on('disconnect', function() {

		console.log('käyttäjä katkaisi yhteyden');
		delete users[socket.id];

	});




	function aloitaPeli () {

		if (kierros===0) tulokset={};
		if (kierros >=5) {pelivaihe="ei"; return;}

		pelivaihe="laadinta";
		alkukirjaimet =[];
		vastaukset=[];
		vote=[];
		akronyymi="";
		kierros++;
		kierrospisteet[kierros]=[];
		

		var akrPituus = Math.round(Math.random()*4+3);
		
		for (var k=0; k < akrPituus; k++) {

		alkukirjaimet.push(String.fromCharCode(Math.floor(Math.random()*22 + 65)));
		}
		akronyymi = alkukirjaimet.join('');

		io.emit('boldviesti', {username: botName, msg: "Kierros " + kierros +": " +akronyymi});
		io.emit('akronyymi', "Akronyymi: " + akronyymi);

		aika=5;

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

	if (vastaukset.length===0) { 
		io.emit('viesti', {username: botName, msg: "Pelakkaa ny saatana"});
		if (kierros <5) aloitaPeli();
		else pelaajaPisteet();

		return;
	}
	for (var a=0; a < vastaukset.length; a++) {

		io.emit('boldviesti', {username: botName, msg: (a+1)+". " + vastaukset[a].vastaus});
	}

	io.emit('viesti', {username: botName, msg: "Äänestä suosikkiasi komennolla /v [nro], esim. /v 666"});

	pelivaihe ="aanestys";
	io.emit('akronyymi', "Äänestä nyt");

	for (var k=0; k < vastaukset.length; k++) {
		kierrospisteet[kierros][k]=0;
	}
	
	aika=5;

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
		io.emit('boldviesti', {username: botName, msg: vastaukset[t].pelaaja +": " + vastaukset[t].vastaus + " - " + kierrospisteet[kierros][t] +"p."});
	}
	setTimeout(pelaajaPisteet, 2000);
	setTimeout(aloitaPeli, 5000);
}

function pelaajaPisteet() {

	if (kierros <=4) {
	io.emit('boldviesti', {username: botName, msg: "Välitulokset:"});

	console.log(Object.keys(tulokset));
	}
	
	if (kierros===5) {
	io.emit('boldviesti', {username: botName, msg: "Lopputulokset:"});

	console.log(Object.keys(tulokset));

	}
	
	var results=[];
	
	for (pelaaja in tulokset) {

		results.push([tulokset[pelaaja], pelaaja]);
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

function kasitteleVastaus (vastaus, pelaaja) {

	var validi = true;

	if (pelivaihe==="laadinta") {
		
		if (vastaus.length !== alkukirjaimet.length) validi=false;
		else {
		for (var s=0; s < alkukirjaimet.length; s++) {

			console.log (vastaus[s][0].toUpperCase() + " ja " + alkukirjaimet[s]);
			if (vastaus[s][0].toUpperCase() !== alkukirjaimet[s]) validi = false;
		}
		}

		if (!validi) {
			socket.emit('privaviesti', {username: botName, msg: pelaaja+": annoit virheellisen vastauksen. Kokeile uudelleen!"});
		}
		else {

			vastaukset.push({pelaaja: pelaaja, vastaus: vastaus.join(' ')});
			socket.emit('privaviesti', {username: botName, msg: pelaaja+": OK."});
		}
	}
	else if (pelivaihe==="aanestys") {

		if (isNaN(vastaus) || !vastaukset[vastaus-1]) {

			socket.emit('privaviesti', {username: botName, msg: pelaaja+": äänestit virheellisesti. Kokeile uudelleen!"});
		}
		else if (vote[socket.id] === true) {

			socket.emit('privaviesti', {username: botName, msg: pelaaja+": et voi äänestää monta kertaa. Homo."});
		}
		else if (vastaukset[vastaus-1].pelaaja === users[socket.id]) {

			socket.emit('privaviesti', {username: botName, msg: pelaaja+": et voi äänestää ITTEES vitun pelle."});

		}
		else {

			vote[socket.id] = true;
			kierrospisteet[kierros][vastaus-1]++;
			console.log (tulokset);

			if (!tulokset.hasOwnProperty(vastaukset[vastaus-1].pelaaja)) tulokset[vastaukset[vastaus-1].pelaaja]=1;
			else tulokset[vastaukset[vastaus-1].pelaaja]++;

			socket.emit('privaviesti', {username: botName, msg: pelaaja+": OK."});
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
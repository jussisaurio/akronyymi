var express = require('express');
var app = express(); // enclose the express function in a variable called app
var http = require('http').Server(app);
var io = require('socket.io')(http);
var peli = require('./peli');


//var bodyParser = require('body-parser');
//var urlEncParser = bodyParser.urlencoded({ extended: false});
var peliKaynnissa = false;
var botName ="akroBotti";
var alkukirjaimet =[];
var akronyymi="";

app.set('view engine', 'ejs') // set the express view engine to ejs (embedded javascript & html)
app.use('/styles', express.static('styles')); // route requests to styles folder (html file requests css files)



app.get('/', function (req, res) {
	res.render('index');
});


function aloitaPeli () {

		var kierros=1;
		io.emit('viesti', {username: botName, msg: "Kierros " + kierros});

		var akrPituus = Math.round(Math.random()*4+3);
		
		for (var k=0; k < akrPituus; k++) {

		alkukirjaimet.push(String.fromCharCode(Math.floor(Math.random()*22 + 65)));
		}
		akronyymi = alkukirjaimet.join('');

		io.emit('akronyymi', akronyymi);

		var aika=10;

		var sekuntikello = setInterval(function() {

			io.emit('kello', aika);
			aika--;

			if (aika<0) {

				clearInterval(sekuntikello);
				io.emit('kello', '');
			}
		}, 1000);
	}


function kasitteleVastaus (vastaus, pelaaja) {

	var validi = true;

	for (var s=0; s < vastaus.length; s++) {

		if (vastaus[s][0].toUpperCase() !== alkukirjaimet[s]) validi = false;
	}

	if (!validi) {io.emit('viesti', {username: botName, msg: pelaaja+", annoit virheellisen vastauksen. Kokeile uudelleen!"})}
}




io.on('connection', function(socket) {

	var welcomeData = {username: botName, msg: "Tervetuloa pelaamaan!"};
	io.emit('viesti', welcomeData);


	socket.on('viesti', function(v) {

		// Käyttäjä antaa komennon viestin sijaan
		if (v.msg[0] === "/") {

			// jaetaan komento komentosanaan ja parametreihin
			msgArray = v.msg.split(' ');

			// jos /nick ja tasan yksi parametri jonka pituus max 20, vaihetaan nicknamea parametrin mukaisesti
			if (msgArray[0] === "/nick" && msgArray.length === 2 && msgArray[1].length < 21) {

				var oldUser = v.username;
				v.username = botName;
				v.newName = msgArray[1];
				v.msg = "*** " + oldUser + " vaihtoi nimimerkikseen " + msgArray[1] + " ***";
				v.nickChange = true;
				io.emit('viesti', v);
			}

			if (msgArray[0] === "/aloita" && msgArray.length <= 2 && !peliKaynnissa) {

				peliKaynnissa=true;
				v.msg ="Nöniin, käyttäjä " + v.username +" haluaa pelata akronyymipeli PASKAa. Luvassa 5 kierrosta. "
				if (msgArray[1] && msgArray[1].toLowerCase() === "säännöt") v.msg += "Pelin tarkoituksena on keksiä mahdollisimman helmi lause, fraasi tahi vastaava annetusta akronyymista. Esim. akronyymista JEES keksi vaikka Jeesus Elää Emmoo Sienipäissäni. =D ";
				v.msg += "Aloitetaan pian...";
				v.username = peli.botName;
				io.emit('viesti', v); //

				setTimeout(aloitaPeli, 5000);
			}

			if (msgArray[0] === "/paska" && msgArray.length > 1 && peliKaynnissa) {

				var vastaus = msgArray.splice(0,1);

				kasitteleVastaus(vastaus, v.username);
			}
		}
		else io.emit('viesti', v);
	});

	socket.on('disconnect', function() {console.log('käyttäjä katkaisi yhteyden');});


	
});

/*app.post('/noni', urlEncParser, function(req, res){

	if (!req.body) return res.sendStatus(400);

	// tässä vois vaikka res.render jonkun toisen viewin ja laittaa ton datan parametriks
	res.send(JSON.stringify(req.body));
});*/

var port=process.env.PORT || 3000;
http.listen(port);
console.log("Listening on port " + port);
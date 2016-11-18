$( document ).ready(function() {
				
				var socket = io();

				
				socket.emit('join');

				$('form').submit(function() {

					var data = {msg: $('#v').val()};
					socket.emit('viesti', data);

					$('#v').val('');
					return false; // Estää lomakkeen lähtemisen, eli html-sivu ei refreshaudu.
				});

				socket.on('privaviesti', function(v) {

					$('#viestit').append($('<li class="private">').text(v.username + ": " + v.msg));
					$('.msgs')[0].scrollTop = $('.msgs')[0].scrollHeight;

				});

				socket.on('boldviesti', function(v) {

					$('#viestit').append($('<li class="boldattu">').text(v.username + ": " + v.msg));
					$('.msgs')[0].scrollTop = $('.msgs')[0].scrollHeight;


				});

				socket.on('viesti', function(v) {

					$('#viestit').append($('<li>').text(v.username + ": " + v.msg));
					$('.msgs')[0].scrollTop = $('.msgs')[0].scrollHeight;


				});

				socket.on('akronyymi', function(v) {

					$('.puzzlebox').html('<h2>' + v + "</h2>");
				});

				socket.on('kello', function(v) {

					$('.timer').html('<h3><strong>' + v + '</strong></h3>');
				});

				socket.on('kayttajat', function(v) {

					$('.nicks').html('<strong>Käyttäjiä linjoilla:</strong> ');
					$('.nicks').append(v);
				});
});
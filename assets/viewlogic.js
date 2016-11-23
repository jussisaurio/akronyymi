$( document ).ready(function() {
				

				var socket = io();

				socket.emit('join');

				socket.on('votepopup', function(data) {

					var html="";

					if (data.tila === "aanestys") {
						
						data.data.forEach(function(osallistuja){
							html += "<button id='"+osallistuja.nro+"' class='tulos vaihtoehto btn btn-block'>" + (osallistuja.nro+1) +". " + osallistuja.vastaus + "</button><br>";
						})						
					}

					if (data.tila === "loppu") {
						var html="";
						data.data.forEach(function(osallistuja){
							html += "<button class='tulos btn btn-block'>" + osallistuja[1] +": " + osallistuja[0] + " pistettä</button><br>";
						})
					}

					$('#vaihtoehdot').html(html);
					$('#votetitle').text(data.title); 
					$('#votemodal').modal();
				});

				socket.on('votepopupClose', function() {

					$('#vaihtoehdot').html('');
					$('#votemodal').modal('hide');
						
				}); 

				socket.on('illegalVote', function(viesti) {

					$('#votetitle').text(viesti.msg);
						
				});
				
				// jquery click() bindaa vain elementteihin jotka on jo olemassa, joten pitää käyttää tätä
				$('#vaihtoehdot').on('click', 'button.vaihtoehto', function(){

					var id = $(this).attr("id");
					socket.emit('aani', id);
					// $('#votemodal').modal('hide');

				});

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
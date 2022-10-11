const Ws = require('ws');

const PORT = process.env.PORT || 80;

const log = (...messages) => {
	console.log(...messages);
};

const clients = {};
let clientIdCounter = 0;

function sendMessage(message) {
	if (message.to) {
		clients[message.to].webSocket.send(JSON.stringify(message));
	} else {
		for (const key in clients) {
			clients[key].webSocket.send(JSON.stringify(message));
		}
	}
}

const server = new Ws.WebSocketServer({ port: PORT });

server.on('connection', (webSocket) => {
	log && log('SERVER - ON CONNECTION');

	const clientId = String(clientIdCounter++);

	webSocket.on('message', (data) => {
		log && log('WEB SOCKET - ON MESSAGE');

		try {
			const message = JSON.parse(data.toString('utf8'));

			switch (message.type) {
				case 'Ping': {
					message.to = clientId;
					sendMessage(message);
					break;
				}

				default: {
					message.from = clientId;
					sendMessage(message);
				}
			}

			sendMessage({
				type: 'Log',
				log: 'Web Socket - On Message',
				message,
				clientId
			});
		} catch (error) {
			log && log('WEB SOCKET - ON MESSAGE - ERROR');

			sendMessage({
				type: 'Log',
				log: 'Web Socket - On Message - Error',
				error,
				clientId
			});
		}
	});

	webSocket.on('close', (code, reason) => {
		log && log('WEB SOCKET - ON CLOSE');

		delete clients[clientId];
		sendMessage({
			type: 'Remove',
			from: clientId
		});

		sendMessage({
			type: 'Log',
			log: 'Web Socket - On Close',
			code,
			reason,
			clientId
		});
	});

	sendMessage({
		type: 'Add',
		from: clientId
	});

	clients[clientId] = { webSocket };

	sendMessage({
		type: 'Log',
		log: 'Server - On Connection'
	});
});

server.on('close', () => {
	log && log('SERVER - ON CLOSE');

	for (const key in clients) {
		delete clients[key];
	}

	sendMessage({
		type: 'Log',
		log: 'Server - On Close'
	});
});

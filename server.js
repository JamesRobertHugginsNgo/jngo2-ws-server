const Ws = require('ws');

const PORT = process.env.PORT || 80;

const clients = {};
let clientIdCounter = 0;

function sendMessage(message) {
	if (message.to) {
		clients[message.to].send(JSON.stringify(message));
	} else {
		clients.forEach((client) => void client.send(JSON.stringify(message)));
	}
}

const server = new Ws.WebSocketServer({ port: PORT });

server.on('connection', (webSocket) => {
	const clientId = String(clientIdCounter++);

	webSocket.on('message', (data) => {
		try {
			const message = JSON.parse(data.toString('utf8'));
			message.from = clientId;
			sendMessage(message);

			sendMessage({
				type: 'Log',
				log: 'Web Socket - On Message',
				message,
				clientId
			});
		} catch (error) {
			sendMessage({
				type: 'Log',
				log: 'Web Socket - On Message - Error',
				error,
				clientId
			});
		}
	});

	webSocket.on('close', (code, reason) => {
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
	for (const key in clients) {
		delete clients[key];
	}

	sendMessage({
		type: 'Log',
		log: 'Server - On Close'
	});
});

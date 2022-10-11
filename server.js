const Ws = require('ws');

const PORT = process.env.PORT || 80;

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
	const clientId = String(clientIdCounter++);

	webSocket.on('message', (data) => {
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

			console.log('WEB SOCKET ON MESSAGE ERROR', clientId, JSON.stringify(message));
		} catch (error) {
			console.log('WEB SOCKET ON MESSAGE ERROR', clientId, JSON.stringify(error));
		}
	});

	webSocket.on('close', (code, reason) => {
		delete clients[clientId];
		sendMessage({
			type: 'Remove',
			from: clientId
		});

		console.log('WEB SOCKET ON CLOSE', clientId, code, reason);
	});

	sendMessage({
		type: 'Add',
		from: clientId
	});

	clients[clientId] = { webSocket };

	console.log('SERVER ON CONNECTION', clientId);
});

server.on('close', () => {
	for (const key in clients) {
		delete clients[key];
	}

	console.log('SERVER ON CLOSE');
});

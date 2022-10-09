const Ws = require('ws');

const PORT = process.env.PORT || 80;

// const log = console.log.bind(console);
const log = (...args) => {
	broadcast(JSON.stringify({
		type: 'Add Log',
		args
	}), true);
};

const clients = {};

let clientIdCounter = 0;

function broadcast(message, dontLog) {
	!dontLog && log && log('BROADCAST', message);

	for (const key in clients) {
		const client = clients[key];
		client.webSocket.send(message);
	}
}

// ---
// WEB SOCKET SERVER
// ---

const server = new Ws.WebSocketServer({ port: PORT });

server.on('connection', (webSocket) => {
	log && log('SERVER', 'ON CONNECTION');

	const clientId = String(clientIdCounter++);
	const client = { webSocket };

	webSocket.on('message', (data, isBinary) => {
		log && log('WEB SOCKET', clientId, 'ON MESSAGE', data.toString('utf8'), isBinary);

		try {
			const message = JSON.parse(data.toString('utf8'));
			const type = message.type;

			switch (type) {
				case 'Set Offer': {
					const { targetClientId, offer } = message;
					const newMessage = JSON.stringify({
						type: 'Set Offer',
						sourceClientId: clientId, // TODO: Replace with WebRTC peer to peer connection
						offer
					});

					clients[targetClientId] && clients[targetClientId].webSocket
						&& clients[targetClientId].webSocket.send(newMessage);

					break;
				}

				case 'Set Answer': {
					const { targetClientId, answer } = message;
					const newMessage = JSON.stringify({
						type: 'Set Answer',
						sourceClientId: clientId, // TODO: Replace with WebRTC peer to peer connection
						answer
					});

					clients[targetClientId] && clients[targetClientId].webSocket
						&& clients[targetClientId].webSocket.send(newMessage);

					break;
				}
			}
		} catch (error) {
			log && log('WEB SOCKET', clientId, 'ON MESSAGE', error, error);
		}
	});

	webSocket.on('close', (code, reason) => {
		log && log('WEB SOCKET', clientId, 'ON CLOSE', code,  reason.toString('utf8'));

		delete clients[clientId];

		broadcast(JSON.stringify({
			type: 'Remove Client',
			clientId
		}));
	});

	broadcast(JSON.stringify({
		type: 'Add Client',
		clientId
	}));

	clients[clientId] = client;
});

server.on('close', () => {
	log && log('SERVER', 'ON CLOSE');

	for (const key in clients) {
		delete clients[key];
	}
});

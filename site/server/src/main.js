// @flow

import minimist from 'minimist';
import fs from 'fs';
import log from 'winston';
import express from 'express';
import ws from 'ws';

const PORT = 3000;

const app = express();

app.use(express.static('client/html'));
app.use(express.static('client/build'));

app.listen(PORT, () => {
    log.info('Hello from the server');
    log.info(`Visit app at http://localhost:${PORT}`);
});

// page reloader

const wss = new ws.Server({ port: 1234 });

wss.on('connection', () => log.info('client connected'));

const args = minimist(process.argv.slice(2));
fs.watch(args._[0], { recursive: true }, () => {
    log.info(`reloading at ${Date.now()}`);
    wss.clients.forEach(client => client.send('reload'));
});

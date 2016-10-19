import log from 'winston';
import EventEmitter from 'events';

/*
Wires manage communication with devices that delineate commands with carriage return
and acknowledge success by printing "ok\r"
 */

class Wire extends EventEmitter {
    constructor() {
        super();

        this.messageDelay = 1000;

        this.txQueue = [];
        this.rxQueue = [];

        this.on('rx', message => this.handleMessage(message));
    }

    tx() {}

    handleMessage(data) {
        const message = data.toString().trim();

        // questionable: ignore empty messages
        if (message.length === 0) {
            return;
        }

        const handler = this.rxQueue.shift();

        if (!handler) {
            log.warn(`Not handling message: ${data}`);
        } else if (handler.match(message)) {
            log.info(`Handling message: "${message}"`);
            handler.handle(message);
        } else {
            this.emit('error', new Error(`Unexpected message: ${message}`));
        }

        if (this.txQueue.length !== 0) {
            const msg = this.txQueue.shift();
            this.tx(msg);
        }
    }

    onMessage(match, handle) {
        this.rxQueue.push({ match, handle });
    }

    send(command) {
        let terminatedCommand;

        if (typeof command === 'string') {
            terminatedCommand = `${command}\r`;
            log.info(`Sending "${command}"`);
        } else {
            terminatedCommand = Buffer.concat([command, Buffer.from('\r')]);
            log.info(`Sending "${JSON.stringify(terminatedCommand.toJSON())}"`);
        }

        return new Promise(fulfill => {
            if (this.rxQueue.length === 0) {
                // we are not waiting for any messages
                this.tx(terminatedCommand);
            } else {
                this.txQueue.push(terminatedCommand);
            }

            this.rxQueue.push({
                match: msg => msg === 'ok',
                handle: () => fulfill(),
            });
        });
    }
}

class NullWire extends Wire {
    tx(data) {
        console.log(`NullWire: ${data}`);
    }

    open() {
        return Promise.resolve();
    }
}

class SerialWire extends Wire {
    constructor(port, messageDelay = 0) {
        super();

        this.messageDelay = messageDelay;

        port.on('data', data => this.emit('rx', data));
        port.on('open', () => this.emit('open'));
        port.on('close', () => this.emit('close'));

        this.port = port;
    }

    tx(data) {
        this.port.write(data);
    }

    open() {
        return new Promise((fulfill, reject) => {
            this.port.open(err => {
                if (err) {
                    reject(err);
                } else {
                    fulfill();
                }
            });
        });
    }
}

export { SerialWire, NullWire };

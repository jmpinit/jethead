import os from 'os';
import SerialPort from 'serialport';

import { lerp, distance } from './util';
import { SerialWire } from './wire';

function getUSBPorts() {
    if (os.platform() !== 'darwin') {
        throw new Error('Port discovery is only supported on Darwin');
    }

    return new Promise((fulfill, reject) => {
        SerialPort.list((err, ports) => {
            console.log("ports!", ports);

            if (err) {
                reject(err);
                return;
            }

            const rPort = /\/dev\/cu\.usb.*/g;

            const usbPorts = ports.filter(p => (/\/dev\/cu\.usb.*/g).test(p.comName));
            console.log('usb ports', usbPorts);
            fulfill(usbPorts.map(p => p.comName));
        });
    });
}

function identifyPort(portPath, timeout = 10000) {
    return new Promise((fulfill, reject) => {
        const port = new SerialPort(portPath, {
            baudRate: 115200,
            parser: SerialPort.parsers.readline('\n'),
            autoOpen: false,
        });

        port.open(err => {
            if (err) {
                reject(err);
                return;
            }

            const timeoutID = setTimeout(() => {
                console.log('timed out while checking', portPath);
                port.close();
                fulfill(undefined);
            }, timeout);

            port.on('data', data => {
                const text = data.trim();

                if (text.length === 0) {
                    // ignore empty lines
                    return;
                }

                port.close();
                clearTimeout(timeoutID);

                if (text === "Grbl 0.9j ['$' for help]") {
                    fulfill({ path: portPath, type: 'cnc' });
                } else if (text === 'Effector Inkjet 1.0.0') {
                    fulfill({ path: portPath, type: 'inkjet' });
                } else {
                    // it's not hardware we recognize
                    fulfill(undefined);
                }
            });
        });
    });
}

function discoverRobotPorts() {
    return getUSBPorts()
        .then(ports => {
            if (ports.length < 2) {
                return Promise.reject(new Error(`Robot has 2 serial ports but found ${ports.length} connected`));
            }

            console.log('going to check', ports);

            return Promise.all(ports.map(p => identifyPort(p)))
                .then(identities => {
                    console.log('ids', identities);

                    const recognized = identities.filter(info => info !== undefined);

                    if (recognized.length < 2) {
                        return Promise.reject(new Error(`Missing a port. Found ${identities.map(id => id.type)}`));
                    } else if (recognized.length > 2) {
                        return Promise.reject(new Error(`Found too many ports: ${identities.map(id => id.type)}`));
                    }

                    const robotPorts = recognized.reduce((portObj, info) => {
                        if (info.type in portObj) {
                            throw new Error(`Found multiple ${info.type} ports`);
                        }

                        /* eslint-disable no-param-reassign */
                        portObj[info.type] = info.path;
                        /* eslint-enable no-param-reassign */

                        return portObj;
                    }, {});

                    return Promise.resolve(robotPorts);
                });
        });
}

class SimController {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.rotation = 0; // 0 to Math.PI
        this.sprayBitmap = 0;

        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 1024;

        this.rate = 1;
    }

    // move to a position and then fulfill
    moveTo(x, y) {
        const velocity = 8; // TODO more realistic
        const dist = distance(this.position.x, this.position.y, x, y);
        const step = velocity / dist;

        const ctx = this.canvas.getContext('2d');

        for (let i = 0; i < dist; i += step) {
            ctx.save();

            const amt = i / dist;
            const drawX = lerp(this.position.x, x, amt) * 20;
            const drawY = lerp(this.position.y, y, amt) * 20;
            ctx.translate(drawX, drawY);
            ctx.rotate(this.rotation);

            for (let j = 0; j < 12; j++) {
                const inkX = j - 6;
                const inkY = 0;

                if ((this.sprayBitmap & (1 << j)) > 0) {
                    ctx.fillRect(inkX, inkY, 1, 1);
                }
            }

            ctx.restore();
        }

        this.position = { x, y };

        return new Promise(fulfill => setTimeout(fulfill, this.rate));
    }

    // rotate the spray head
    rotate(angle) {
        if (angle > Math.PI) {
            throw new Error('Can only rotate 0-180 degrees');
        }

        this.rotation = angle;

        return Promise.resolve();
    }

    // change the spray pattern
    spray(bitmap) {
        if ((bitmap & (~0xfff)) > 0) {
            throw new Error('Bitmap has extra bits set (there are only 12 nozzles)');
        }

        this.sprayBitmap = bitmap;

        return Promise.resolve();
    }

    // no significance for sim
    stop() {}
    configureCNC() {}
    connect() {
        return Promise.resolve();
    }
}

class Controller {
    stop() {
        this.stopped = true;
        this.cnc.tx('!'); // feed hold
        this.inkjet.tx(Buffer.from([0, 0, 115]));
    }

    moveTo(x, y) {
        if (this.lastMove) {
            this.lastMove = this.lastMove.then(() => (
                new Promise((fulfill, reject) => {
                    this.cnc.send(`X${x} Y${y}`);
                    this.target = { fulfill, reject, x, y };
                })
            ))
            .catch(err => {
                throw err;
            });
        } else {
            this.lastMove = new Promise((fulfill, reject) => {
                this.cnc.send(`X${x} Y${y}`);
                this.target = { fulfill, reject, x, y };
            });
        }

        return this.lastMove;
    }

    // angle in radians
    rotate(angle) {
        if (angle > Math.PI) {
            throw new Error('Can only rotate 0-180 degrees');
        }

        const units = Math.floor(360 * (angle / (2 * Math.PI)));
        const unitsH = units >>> 8;
        const unitsL = units & 0xff;

        return this.inkjet.send(Buffer.from([unitsL, unitsH, 114]));
    }

    spray(bitmap) {
        if ((bitmap & (~0xfff)) > 0) {
            throw new Error('Bitmap has extra bits set (there are only 12 nozzles)');
        }

        const bitmapL = bitmap & 0xff;
        const bitmapH = bitmap >> 8;

        return this.inkjet.send(Buffer.from([bitmapL, bitmapH, 115]));
    }

    configureCNC() {
        this.cnc.send('G90') // absolute mode
            .then(() => this.cnc.send('$101=100')) // x step/mm
            .then(() => this.cnc.send('$102=100')) // y step/mm
            .then(() => this.cnc.send('$120=100')) // x accel
            .then(() => this.cnc.send('$121=100')); // y accel
    }

    connect() {
        return discoverRobotPorts()
            .then(ports => {
                console.log(`found cnc connected at ${ports.cnc}`);
                console.log(`found inkjet connected at ${ports.inkjet}`);

                this.cnc = new SerialWire(new SerialPort(ports.cnc, {
                    baudRate: 115200,
                    parser: SerialPort.parsers.readline('\n'),
                    autoOpen: false,
                }));

                // listen for finished commands
                // TODO generate a patch file for the grbl mods needed
                const rStatus = /~/g;
                this.cnc.isStatus = data => rStatus.test(data);
                this.cnc.on('status', () => {
                    if (this.target) {
                        console.log(`reached (${this.target.x},${this.target.y})`);
                        this.target.fulfill();
                    }
                });

                this.inkjet = new SerialWire(new SerialPort(ports.inkjet, {
                    baudRate: 115200,
                    parser: SerialPort.parsers.readline('\n'),
                    autoOpen: false,
                }));

                let errcnt = 0;
                this.inkjet.on('error', err => console.warn(err, errcnt++));

                // ignore
                const inkjetInitPromise = new Promise((fulfill, reject) => {
                    this.inkjet.open().then(() => {
                        this.inkjet.onMessage(msg => msg === 'Effector Inkjet 1.0.0', () => {
                            console.log('Inkjet online');
                            fulfill();
                        });
                    });
                });

                const cncInitPromise = new Promise((fulfill, reject) => {
                    this.cnc.open().then(() => {
                        this.cnc.onMessage(msg => msg === "Grbl 0.9j ['$' for help]", () => {
                            console.log('CNC online');
                            this.configureCNC();
                            fulfill();
                        });
                    });
                });

                return Promise.all([inkjetInitPromise, cncInitPromise]);
            });
    }
}

export { Controller, SimController };

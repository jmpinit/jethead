// modified from http://html5demos.com/file-api

"use strict";

const util = require('util');
const EventEmitter = require('events');

const parse = require('./art-parse');

function DropZone(holder) {
    if (typeof window.FileReader === 'undefined') {
        console.error('FileReader API is not available');
    }

    holder.ondragover = function() {
        this.className = 'hover';
        return false;
    };

    holder.ondragend = function() {
        this.className = '';
        return false;
    };

    holder.ondrop = (e) => {
        this.className = '';
        e.preventDefault();

        var file = e.dataTransfer.files[0];
        var reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target.result;

            const lines = text.split('\n');

            console.log(`processing ${lines.length} lines of script`);

            const withoutStartup = lines.reduce(({ markers, lines }, line) => {
                if (line.indexOf('</StartupFeatures>') !== -1) {
                    if (markers > 1) {
                        throw new Error('Hit too many markers');
                    } else {
                        return { markers: markers + 1, lines };
                    }
                } else {
                    if (markers === 1 && line.length !== 0) {
                        lines.push(line);
                    }

                    return { markers, lines };
                }
            }, { markers: 0, lines: [] }).lines;

            console.log(withoutStartup.length);

            const withoutComments = withoutStartup.filter(line => !(/\s*\/\/.*/.test(line)));
            const instructions = withoutComments.map(l => l.trim()).reduce((instructions, line) => {
                if (line.startsWith('Loc:')) {
                    instructions.push(parse.loc(line));
                } else if (line.startsWith('Wait:')) {
                    // this is nasty
                    // fix requires figuring out what the delimiting character is
                    if (line.indexOf('Loc') !== -1) {
                        const locPart = line.slice(line.indexOf('Loc'), line.length);
                        instructions.push(parse.loc(locPart));
                    }

                    instructions.push(parse.wait(line));
                } else if (line.startsWith('</StrokeEvent>')) {
                    instructions.push({ type: 'endStroke' });
                }

                return instructions;
            }, []);

            console.log(`parsed file into ${instructions.length} instructions`);

            this.emit('drop', instructions);
        };

        console.log(`parsing ${file.name}`);
        reader.readAsText(file);

        return false;
    };
}

util.inherits(DropZone, EventEmitter);

module.exports = DropZone;

import log from 'winston';

// Wait: 0.018s Loc: (916.83, 406.591) Pr: 1 Ti: 1 Ro: 1.25 Fw: 1 Bt: 0 Rv: NO Iv: NO
function wait(line) {
    const rTime = /: (\d+\.\d+)s/;
    const res = line.match(rTime);

    if (res === null) {
        throw new Error('Not a wait line');
    }

    return {
        type: 'wait',
        time: parseFloat(rTime[1]),
    };
}

// Loc: (1026, 330) Pr: 1 Ti: 1 Ro: 1.25 Fw: 1 Bt: 0
function loc(line) {
    // TODO refactor
    // don't know what Fw and Bt are so they are not parsed
    const rPos = /\((-?\d+(\.\d+)?),\s+(-?\d+(\.\d+)?)\)/;
    const rPressure = /Pr: (\d+(\.\d+)?)/;
    const rTilt = /Ti: (-?\d+(\.\d+)?)/;
    const rRotation = /Ro: (-?\d+(\.\d+)?)/;
    const rScale = /Scale: (-?\d+(\.\d+)?)/;
    const rOff = /Off: (-?\d+(\.\d+)?)/;
    const rSize = /Off: (-?\d+(\.\d+)?)/;

    const posMatches = line.match(rPos);
    const pressureMatches = line.match(rPressure);
    const tiltMatches = line.match(rTilt);
    const rotationMatches = line.match(rRotation);
    const scaleMatches = line.match(rScale);
    const offMatches = line.match(rOff);
    const sizeMatches = line.match(rSize);

    if (posMatches === null) {
        console.log(posMatches, pressureMatches, tiltMatches, rotationMatches);
        throw new Error(`Not a location line: ${line}`);
    }

    return {
        type: 'location',
        position: {
            x: parseFloat(posMatches[1]),
            y: parseFloat(posMatches[3]),
        },
        pressure: pressureMatches ? parseFloat(pressureMatches[1]) : undefined,
        tilt: tiltMatches ? parseFloat(tiltMatches[1]) : undefined,
        rotation: rotationMatches ? parseFloat(rotationMatches[1]) : undefined,
        scale: scaleMatches ? parseFloat(scaleMatches[1]) : undefined,
        offset: offMatches ? parseFloat(offMatches[1]) : undefined,
        size: sizeMatches ? parseFloat(sizeMatches[1]) : undefined,
    };
}

function parse(text) {
    const lines = text.split('\n');

    log.info(`processing ${lines.length} lines of script`);

    const withoutStartup = lines.reduce(({ markers, lines: filteredLines }, line) => {
        if (line.indexOf('</StartupFeatures>') !== -1) {
            if (markers > 1) {
                throw new Error('Hit too many markers');
            } else {
                return { markers: markers + 1, lines: filteredLines };
            }
        } else {
            if (markers === 1 && line.length !== 0) {
                filteredLines.push(line);
            }

            return { markers, lines: filteredLines };
        }
    }, { markers: 0, lines: [] }).lines;

    const withoutComments = withoutStartup.filter(line => !(/\s*\/\/.*/.test(line)));
    return withoutComments.map(l => l.trim()).reduce((instructions, line) => {
        if (line.startsWith('Loc:')) {
            instructions.push(loc(line));
        } else if (line.startsWith('Wait:')) {
            // this is nasty
            // fix requires figuring out what the delimiting character is
            if (line.indexOf('Loc') !== -1) {
                const locPart = line.slice(line.indexOf('Loc'), line.length);
                instructions.push(loc(locPart));
            }

            instructions.push(wait(line));
        } else if (line.startsWith('</StrokeEvent>')) {
            instructions.push({ type: 'endStroke' });
        }

        return instructions;
    }, []);
}

export default parse;

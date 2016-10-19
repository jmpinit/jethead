// Wait: 0.018s    Loc: (916.83, 406.591)  Pr: 1   Ti: 1   Ro: 1.25    Fw: 1   Bt: 0   Rv: NO  Iv: NO
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

// Loc: (1026, 330) Pr: 1   Ti: 1   Ro: 1.25    Fw: 1   Bt: 0
function loc(line) {
    // don't know what Fw and Bt are so they are not parsed
    const rPos = /\((\d+(\.\d+)?),\s+(\d+(\.\d+)?)\)/;
    const rPressure = /Pr: (\d+(\.\d+)?)/;
    const rTilt = /Ti: (\d+(\.\d+)?)/;
    const rRotation = /Ro: (\d+(\.\d+)?)/;

    const posMatches = line.match(rPos);
    const pressureMatches = line.match(rPressure);
    const tiltMatches = line.match(rTilt);
    const rotationMatches = line.match(rRotation);

    if (posMatches === null || pressureMatches === null || tiltMatches === null || rotationMatches === null) {
        console.log(posMatches, pressureMatches, tiltMatches, rotationMatches);
        throw new Error(`Not a location line: ${line}`);
    }

    return {
        type: 'location',
        position: {
            x: parseFloat(posMatches[1]),
            y: parseFloat(posMatches[3]),
        },
        pressure: parseFloat(pressureMatches[1]),
        tilt: parseFloat(tiltMatches[1]),
        rotation: parseFloat(rotationMatches[1]),
    }
}

module.exports = {
    wait,
    loc,
};

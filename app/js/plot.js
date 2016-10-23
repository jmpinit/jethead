import * as util from './util';

function generateDensity(density) {
    const bitmap = [];

    for (let i = 0; i < 12; i++) {
        if (Math.random() < density) {
            bitmap.push(1);
        } else {
            bitmap.push(0);
        }
    }

    return bitmap;
}

function plot(robotWidth, robotHeight, ctrl, instructions) {
    const bounds = util.getBoundingRect(instructions);

    const scale = {
        x: robotWidth / (bounds.right - bounds.left),
        y: robotHeight / (bounds.bottom - bounds.top),
    };

    let drawing = false;
    let intervalID;

    const act = (inst) => {
        if (inst.type === 'location') {
            const x = (inst.position.x - bounds.left) * scale.x;
            const y = (inst.position.y - bounds.top) * scale.y;
            const rot = (inst.rotation % Math.PI) || 0;

            if (!drawing) {
                drawing = true;

                const bitmap = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];//generateDensity(inst.pressure);

                return ctrl.rotate(rot)
                    .then(() => ctrl.moveTo(x, y))
                    .then(() => ctrl.spray(bitmap))
                    .then(() => {
                        // the ink controller has a 5 second timeout
                        // so send another spray message before then
                        intervalID = setInterval(() => ctrl.spray(bitmap), 4000);
                    });
            }

            // we are already spraying, so just move and rotate
            return ctrl.rotate(rot)
                .then(() => ctrl.moveTo(x, y));
        } else if (inst.type === 'endStroke') {
            console.log('ending stroke');
            drawing = false;
            clearInterval(intervalID);
            return ctrl.spray([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }

        return Promise.resolve(); // nothing to do
    };

    const plotPromise = instructions.reduce((prevAction, instruction) => {
        if (prevAction) {
            return prevAction.then(() => act(instruction));
        }

        return act(instruction);
    }, null);

    return plotPromise;
}

export default plot;

import * as util from './util';
import { dieWithError } from './error';

function plot(ctrl, instructions) {
    const robotWidth = 40;
    const robotHeight = 40;

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

                const bitmap = Math.floor(Math.random() * 0xfff);

                return ctrl.rotate(rot)
                    .then(() => ctrl.moveTo(x, y))
                    .then(() => ctrl.spray(bitmap))
                    .then(() => {
                        // the ink controller has a 5 second timeout
                        // so send another spray message before then
                        intervalID = setInterval(() => ctrl.spray(bitmap), 4000);
                    })
                    .catch(err => dieWithError(err));
            }

            // we are already spraying, so just move and rotate
            return ctrl.rotate(rot)
                .then(() => ctrl.moveTo(x, y))
                .catch(err => dieWithError(err));
        } else if (inst.type === 'endStroke') {
            console.log('ending stroke');
            drawing = false;
            clearInterval(intervalID);
            return ctrl.spray(0)
                .catch(err => dieWithError(err));
        }

        return Promise.resolve(); // nothing to do
    };

    const plotPromise = instructions.reduce((prevAction, instruction) => {
        if (prevAction) {
            return prevAction.then(() => act(instruction))
                .catch(err => dieWithError(err));
        }

        return act(instruction);
    }, null);

    return plotPromise;
}

export default plot;

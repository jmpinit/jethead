import * as util from './util';

function plot(ctrl, instructions) {
    const robotWidth = 8;
    const robotHeight = 8;

    const bounds = util.getBoundingRect(instructions);

    const scale = {
        x: robotWidth / (bounds.right - bounds.left),
        y: robotHeight / (bounds.bottom - bounds.top),
    };

    let drawing = false;

    const act = (inst) => {
        if (inst.type === 'location') {
            const x = (inst.position.x - bounds.left) * scale.x;
            const y = (inst.position.y - bounds.top) * scale.y;
            const rot = (inst.rotation % Math.PI) || 0;

            if (!drawing) {
                drawing = true;

                return ctrl.rotate(rot)
                    .then(() => ctrl.moveTo(x, y))
                    .then(() => ctrl.spray([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));
            }

            // we are already spraying, so just move and rotate
            return ctrl.rotate(rot)
                .then(() => ctrl.moveTo(x, y));
        } else if (inst.type === 'endStroke') {
            drawing = false;
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

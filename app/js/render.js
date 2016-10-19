import * as util from './util';

function render(canvas, instructions) {
    // make canvas as big as possible
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');

    const bounds = util.getBoundingRect(instructions);
    const scale = {
        x: canvas.width / (bounds.right - bounds.left),
        y: canvas.height / (bounds.bottom - bounds.top),
    };

    let last;

    instructions.forEach(instruction => {
        if (instruction.type === 'location') {
            const x = (instruction.position.x - bounds.left) * scale.x;
            const y = (instruction.position.y - bounds.top) * scale.y;
            const rot = instruction.rotation || 0;

            if (last) {
                const dist = util.distance(last.x, last.y, x, y);

                for (let i = 0; i < dist; i++) {
                    ctx.save();

                    const lamt = i / dist;
                    const lerpRot = util.lerp(last.rot, rot, lamt);
                    const lerpX = util.lerp(last.x, x, lamt);
                    const lerpY = util.lerp(last.y, y, lamt);

                    ctx.translate(lerpX, lerpY);
                    ctx.rotate(lerpRot);

                    for (let j = 0; j < 8; j++) {
                        const inkX = j - 4;
                        const inkY = 0;

                        if (Math.random() > 0.5) {
                            ctx.fillRect(inkX, inkY, 1, 1);
                        }
                    }

                    ctx.restore();
                }
            }

            last = { x, y, rot };
        } else if (instruction.type === 'endStroke') {
            last = null;
        }
    });
}

module.exports = render;

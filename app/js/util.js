function getBoundingRect(instructions) {
    const bounds = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
    };

    instructions.forEach(instruction => {
        if (instruction.type !== 'location') {
            return;
        }

        const pos = instruction.position;

        if (pos.x < bounds.left) {
            bounds.left = pos.x;
        } else if (pos.x > bounds.right) {
            bounds.right = pos.x;
        }

        if (pos.y < bounds.top) {
            bounds.top = pos.y;
        } else if (pos.y > bounds.bottom) {
            bounds.bottom = pos.y;
        }
    });

    return bounds;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function lerp(start, end, amt) {
    return start + (amt * (end - start));
}

function lerpPts(start, end, amt) {
    return {
        x: lerp(start.x, end.x, amt),
        y: lerp(start.y, end.y, amt),
    };
}

export {
    getBoundingRect,
    distance,
    lerp,
    lerpPts,
};

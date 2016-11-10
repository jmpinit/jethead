import { lerp, distance, getBoundingRect } from './util';

class PaintingRenderer {
    constructor(width, height, instructions) {
        this.instructions = instructions;

        this.position = { x: 0, y: 0 };
        this.rotation = 0; // 0 to Math.PI
        this.sprayBitmap = 0;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;

        const bounds = getBoundingRect(instructions);
        this.bounds = bounds;
        this.paintingWidth = bounds.right - bounds.left;
        this.paintingHeight = bounds.bottom - bounds.top;

        this.rate = 0;
        this.pathScale = 0.5;

        this.lastPosition = { x: 0, y: 0 };
    }

    // move to a position and then fulfill
    moveTo(x, y) {
        const velocity = 8; // TODO more realistic
        const dist = distance(this.position.x, this.position.y, x, y);
        const step = velocity / dist;

        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000';

        for (let i = 0; i < dist; i += step) {
            ctx.save();

            const amt = i / dist;

            const offsetX = (this.canvas.width - this.canvas.height) / 2;
            const drawX = offsetX + lerp(this.position.x, x, amt) * this.canvas.height;
            const drawY = lerp(this.position.y, y, amt) * this.canvas.height;
            ctx.translate(drawX, drawY);
            ctx.rotate(this.rotation);

            for (let j = 0; j < 12; j++) {
                const inkX = (j - 6) * this.pathScale;
                const inkY = 0;

                if ((this.sprayBitmap & (1 << j)) > 0) {
                    ctx.fillRect(inkX, inkY, this.pathScale, this.pathScale);
                }
            }

            ctx.restore();
        }

        this.position = { x, y };
    }

    // rotate the spray head
    rotate(angle) {
        if (angle > Math.PI || angle < 0) {
            throw new Error(`Can only rotate 0-180 degrees: ${angle}`);
        }

        this.rotation = angle;
    }

    // change the spray pattern
    spray(bitmap) {
        if ((bitmap & (~0xfff)) > 0) {
            throw new Error('Bitmap has extra bits set (there are only 12 nozzles)');
        }

        this.sprayBitmap = bitmap;
    }

    tick() {
        let next;
        while (!next || (next.type !== 'location')) {
            next = this.instructions.shift();

            if (!next) {
                return;
            }
        }

        this.spray(0xfff);

        if (next.type === 'location') {
            const { x, y } = next.position;
            const robotX = (x - this.bounds.left) / this.paintingWidth;
            const robotY = (y - this.bounds.top) / this.paintingHeight;

            const dx = this.lastPosition.x - robotX;
            const dy = this.lastPosition.y - robotY;
            const angle = (3 * Math.PI / 2 + Math.atan2(dy, dx)) % Math.PI;

            this.rotate(angle);
            this.moveTo(robotX, robotY);

            if ((this.lastPosition.x !== this.position.x) ||
                (this.lastPosition.y !== this.position.y)) {
                this.lastPosition.x = this.position.x;
                this.lastPosition.y = this.position.y;
            }
        }
    }
}

export default PaintingRenderer;

import { lerp, distance } from './util';

class Renderer {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.rotation = 0; // 0 to Math.PI
        this.sprayBitmap = 0;

        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 1024;

        this.rate = 0;
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
}

export default Renderer;

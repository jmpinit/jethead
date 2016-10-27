import DropZone from './dropzone';
import { Controller, SimController } from './controller';
import plot from './plot';
import parse from './art-parse';

const canvas = document.getElementById('viewport');
const holder = document.getElementById('holder');
const stopButton = document.getElementById('stop');

const drop = new DropZone(holder);
const ctrl = new SimController();

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.onresize = () => resize();

function draw() {
    requestAnimationFrame(draw);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(ctrl.canvas, 0, 0, canvas.width, canvas.height);
}

draw();

drop.on('drop', text => {
    const instructions = parse(text);

    // render(canvas, instructions);
    ctrl.connect()
        .then(() => plot(ctrl, instructions))
        .then(() => ctrl.moveTo(0, 0));
});

stopButton.onclick = function() {
    console.log('commanding to stop');
    ctrl.stop();
};

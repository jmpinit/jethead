import DropZone from './dropzone';
import { Controller, SimController } from './controller';
import plot from './plot';
import parse from './art-parse';

const canvas = document.getElementById('viewport');
const holder = document.getElementById('holder');
const stopButton = document.getElementById('stop');

const drop = new DropZone(holder);
const ctrl = new Controller();
const simctrl = new SimController();

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.onresize = () => resize();

function draw() {
    requestAnimationFrame(draw);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(simctrl.canvas, 0, 0, canvas.width, canvas.height);
}

draw();

drop.on('drop', text => {
    const instructions = parse(text);

    simctrl.connect()
        .then(() => plot(simctrl, instructions))
        .then(() => simctrl.moveTo(0, 0));

    ctrl.connect()
        .then(() => plot(ctrl, instructions))
        .then(() => ctrl.moveTo(0, 0));
});

stopButton.onclick = function() {
    console.log('commanding to stop');
    ctrl.stop();
};

process.on('uncaughtException', (err) => {
    document.body.setAttribute('style', 'background-color: #f00');
    document.body.innerHTML = `Send the following to Owen:<br><br>${err.stack}`;
});

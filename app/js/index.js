import DropZone from './dropzone';
import { Controller, SimController } from './controller';
import plot from './plot';
import parse from './art-parse';
import { hookup } from './error';

// top-level exception handlers
hookup();

const canvas = document.getElementById('viewport');
const holder = document.getElementById('holder');
const stopButton = document.getElementById('stop');

const outlineButton = document.getElementById('outline');
const widthSlider = document.getElementById('robot-width');
const heightSlider = document.getElementById('robot-height');
const widthIndicator = document.getElementById('width');
const heightIndicator = document.getElementById('height');

widthIndicator.innerHTML = widthSlider.value;
heightIndicator.innerHTML = heightSlider.value;

widthSlider.onchange = function(evt) {
    widthIndicator.innerHTML = widthSlider.value;
};

heightSlider.onchange = function(evt) {
    heightIndicator.innerHTML = heightSlider.value;
};

function getOutline() {
    return {
        width: parseInt(widthSlider.value, 10),
        height: parseInt(heightSlider.value, 10),
    };
}

outlineButton.onclick = function() {
    console.log('showing outline');

    const { width, height } = getOutline();

    ctrl.connect()
        .then(() => ctrl.moveTo(0, 0))
        .then(() => ctrl.moveTo(width, 0))
        .then(() => ctrl.moveTo(width, height))
        .then(() => ctrl.moveTo(0, height))
        .then(() => ctrl.moveTo(0, 0));
};

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

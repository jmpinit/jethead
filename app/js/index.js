import DropZone from './dropzone';
import render from './render';
import Controller from './controller';
import plot from './plot';

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

const drop = new DropZone(holder);
const ctrl = new Controller();

function getOutline() {
    return {
        width: parseInt(widthSlider.value, 10),
        height: parseInt(heightSlider.value, 10),
    };
}

drop.on('drop', instructions => {
    const { width, height } = getOutline();

    render(canvas, instructions);
    ctrl.connect()
        .then(() => plot(width, height, ctrl, instructions))
        .then(() => ctrl.moveTo(0, 0));
});

stopButton.onclick = function() {
    console.log('commanding to stop');
    ctrl.stop();
};

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

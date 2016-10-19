import DropZone from './dropzone';
import render from './render';
import Controller from './controller';
import plot from './plot';

const canvas = document.getElementById('viewport');
const holder = document.getElementById('holder');
const stopButton = document.getElementById('stop');

const drop = new DropZone(holder);
const ctrl = new Controller();

drop.on('drop', instructions => {
    render(canvas, instructions);
    ctrl.connect()
        .then(() => plot(ctrl, instructions))
        .then(() => ctrl.moveTo(0, 0));
});

stopButton.onclick = function() {
    console.log('commanding to stop');
    ctrl.stop();
};

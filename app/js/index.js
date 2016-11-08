import { Readable } from 'stream';
import parse from 'ragecode';
import DropZone from './dropzone';
import Renderer from './renderer';
import plot from './plot';

const canvas = document.getElementById('viewport');
const holder = document.getElementById('holder');

const drop = new DropZone(holder);
const renderer = new Renderer();

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.onresize = () => resize();

function draw() {
    requestAnimationFrame(draw);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(renderer.canvas, 0, 0, canvas.width, canvas.height);
}

draw();

drop.on('drop', text => {
    const textStream = new Readable();
    textStream.push(text);
    textStream.push(null);

    parse(textStream).then(instructions => plot(renderer, instructions));
});

// @flow

import ScriptParser from 'ragecode';
import reloader from './reloader';
import DropZone from './dropzone';
import PaintingRenderer from './renderer';

const drop = new DropZone(document.getElementById('holder'));
const canvas = document.getElementById('viewport');
let renderer;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.onresize = () => resize();

function draw() {
    requestAnimationFrame(draw);

    const ctx = canvas.getContext('2d');

    const scale = 0.8;
    const width = window.innerWidth * scale;
    const height = window.innerHeight * scale;
    const offsetX = (window.innerWidth - width) / 2;
    const offsetY = (window.innerHeight - height) / 2;
    ctx.drawImage(renderer.canvas, offsetX, offsetY, width, height);
}

drop.on('drop', text => {
    const parser = new ScriptParser();
    const lines = text.split('\r\n');

    console.log('have script');

    const ctx = canvas.getContext('2d');
    const loaderInterval = setInterval(() => {
        const c = Math.floor(Math.random() * 255);
        ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);

    lines.forEach(line => parser.parseLine(line));
    renderer = new PaintingRenderer(canvas.width, canvas.height, parser.instructions);
    console.log('script parsed');

    clearInterval(loaderInterval);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.body.style.backgroundColor = 'white';

    setInterval(() => {
        for (let i = 0; i < 50; i++) {
            renderer.tick();
        }
    }, 1);
    draw();
});

reloader();

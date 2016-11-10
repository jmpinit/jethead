// modified from http://html5demos.com/file-api

import EventEmitter from 'events';

class DropZone extends EventEmitter {
    constructor(holder) {
        super();

        this.holder = holder;

        if (typeof window.FileReader === 'undefined') {
            throw new Error('FileReader API is not available');
        }

        this.holder.ondragover = () => {
            this.className = 'hover';
            return false;
        };

        this.holder.ondragend = () => {
            this.className = '';
            return false;
        };

        this.holder.ondrop = (e) => {
            this.className = '';
            e.preventDefault();

            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = event => this.emit('drop', event.target.result);
            reader.readAsText(file);

            return false;
        };
    }
}

export default DropZone;

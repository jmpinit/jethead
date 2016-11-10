function reconnect() {
    setTimeout(() => connect(), 1000);
}

function connect() {
    let retrying = false;

    const retry = () => {
        if (retrying) {
            return;
        }

        retrying = true;
        reconnect();
    };

    const reloadSocket = new WebSocket(`ws://${window.location.hostname}:1234`);
    reloadSocket.onclose = () => retry();
    reloadSocket.onerror = () => retry();
    reloadSocket.onmessage = () => {
        document.body.innerHTML = '...';
        setTimeout(() => location.reload(), 100);
    };
}

export default connect;

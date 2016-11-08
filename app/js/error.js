function dieWithError(err) {
    document.body.setAttribute('style', 'background-color: #f00');
    document.body.innerHTML = `Send the following to Owen:<br><br>${err.stack}`;
}

export { dieWithError };

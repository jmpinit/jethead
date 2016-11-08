// const nodeExternals = require('webpack-node-externals');

module.exports = [
    {
        name: 'main',
        entry: './js/index.js',
        target: 'node',
        externals: [],
        devtool: 'source-map',
        output: {
            path: __dirname,
            filename: 'build/app.js',
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['es2015'],
                    },
                },
            ],
        },
    },
];

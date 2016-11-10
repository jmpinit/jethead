const nodeExternals = require('webpack-node-externals');

module.exports = [
    {
        name: 'client-side',
        entry: './client/src/main.js',
        output: {
            path: __dirname,
            filename: 'client/build/app.js',
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    query: {
                        plugins: [
                            'transform-flow-strip-types',
                            ['typecheck', {
                                disable: {
                                    production: true,
                                },
                            }],
                        ],
                        presets: ['es2015'],
                    },
                },
            ],
        },
    },
    {
        name: 'server-side',
        target: 'node',
        externals: [nodeExternals()],
        entry: './server/src/main.js',
        output: {
            path: __dirname,
            filename: './server/build/server.js',
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    loader: 'babel-loader',
                    query: {
                        plugins: [
                            'transform-flow-strip-types',
                            ['typecheck', {
                                disable: {
                                    production: true,
                                },
                            }],
                        ],
                        presets: ['es2015'],
                    },
                },
            ],
        },
    },
];

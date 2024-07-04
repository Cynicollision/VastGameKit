const env = (process.env.NODE_ENV || 'development');
const path = require('path');

module.exports = {
    devServer: {
        static: {
            directory: path.join(__dirname, 'game'),
        },
        compress: false,
        port: 9000,
    },
    devtool: env === 'development' ? 'inline-source-map' : false,
    entry: './game/main.ts',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
        ],
    },
    output: {
        filename: 'game_bundle.js',
        path: path.resolve(__dirname, 'game')
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx'],
    },
};
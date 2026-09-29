const fs = require('fs');
const path = require('path');

const gameDirectory = path.join(__dirname, 'game');
const distDirectory = path.join(__dirname, 'dist');

// Copies the game's page and resources next to the bundle, so the output folder can be deployed as is.
class CopyGameFilesPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap('CopyGameFilesPlugin', () => {
            fs.copyFileSync(path.join(gameDirectory, 'index.html'), path.join(distDirectory, 'index.html'));
            fs.cpSync(path.join(gameDirectory, 'resources'), path.join(distDirectory, 'resources'), { recursive: true });
        });
    }
}

module.exports = (env, argv) => {
    const production = argv.mode === 'production';

    return {
        devServer: {
            static: {
                directory: gameDirectory,
            },
            compress: false,
            port: 9000,
        },
        devtool: production ? false : 'inline-source-map',
        entry: './game/main.ts',
        mode: production ? 'production' : 'development',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'ts-loader',
                    // only type-check files in the bundle, so test files don't report errors in the game build.
                    options: { onlyCompileBundledFiles: true }
                },
            ],
        },
        output: {
            filename: 'game_bundle.js',
            // development builds sit next to the game's page; production builds go to dist/ with a copy of it.
            path: production ? distDirectory : gameDirectory,
            clean: production,
        },
        plugins: production ? [new CopyGameFilesPlugin()] : [],
        resolve: {
            extensions: ['.ts', '.js'],
        },
    };
};

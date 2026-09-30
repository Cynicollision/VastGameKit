// Nine Lives: a cat crosses town to get home. The engine's demo, using most of its features.
import { Game } from './../engine';
import { FontCellSize, FontCharacters } from './generated/art';

const game = Game.init({
    canvasElementId: 'gameCanvas',
    name: 'nineLives',
    canvasOptions: {
        backgroundColor: '#1b1b2f',
        scale: 'integer',
    },
});

game.construction.fonts.add('fntPixel', { source: './resources/font.png', width: FontCellSize, height: FontCellSize, characters: FontCharacters });

game.load().then(() => {
    const font = game.construction.fonts.get('fntPixel');

    game.defaultScene.onDraw((self, canvas) => {
        canvas.drawText('NINE LIVES', 112, 120, { font: font, align: 'center', color: '#f59a3a' });
        canvas.drawText('Coming soon!', 112, 136, { font: font, align: 'center', color: '#f4f4f4' });
    });

    game.start();
})
.catch(error => {
    console.error(`Unexpected error while loading. ${error}`);
});

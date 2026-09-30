import { Controller } from './../engine';
import { Rules } from './constants';

// One play of the game, from the title screen to game over, kept in the Controller's state for every Scene to see.
export type Session = {
    score: number;
    lives: number;
    round: number;
    // steps left to reach a box before a life is lost.
    timeLeft: number;
};

export function newSession(): Session {
    return { score: 0, lives: Rules.lives, round: 1, timeLeft: Rules.timeSteps };
}

export function getSession(controller: Controller): Session {
    if (!controller.state.session) {
        controller.state.session = newSession();
    }
    return controller.state.session;
}

export function getHighScore(controller: Controller): number {
    return controller.storage.get('highScore', 0);
}

export function addScore(controller: Controller, points: number): void {
    const session = getSession(controller);
    session.score += points;

    if (session.score > getHighScore(controller)) {
        controller.storage.set('highScore', session.score);
    }
}

// Lanes move faster each round.
export function getSpeedMultiplier(controller: Controller): number {
    return 1 + (getSession(controller).round - 1) * Rules.roundSpeedup;
}

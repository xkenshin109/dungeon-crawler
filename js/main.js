// Main Module - Entry point and game initialization

import { ui } from './ui.js';
import { Game, GAME_STATES } from './game.js';
import { CommandHandler } from './commands.js';
import { DungeonRenderer } from './map.js';
import { hasSaveGame, getSaveInfo } from './save.js';

class DungeonCrawler {
    constructor() {
        this.game = new Game();
        this.commandHandler = new CommandHandler(this.game);
        this.state = 'init'; // init, save_prompt, naming, playing

        // Initialize dungeon renderer
        const canvas = document.getElementById('map-canvas');
        if (canvas) {
            this.renderer = new DungeonRenderer(canvas);
            this.commandHandler.setRenderer(this.renderer);
        }
    }

    async start() {
        await this.showIntro();
        await this.checkSaveGame();
    }

    async showIntro() {
        const dungeonArt = [
            '    _____',
            '   |     |',
            '   | [+] |',
            '   |_____|',
            '    /   \\',
            '   /     \\',
            ''
        ];

        ui.clear();
        ui.clearMenu();

        // Show ASCII art
        for (const line of dungeonArt) {
            ui.print(line, 'dim');
        }

        await ui.typewrite('D U N G E O N   C R A W L E R', 'highlight', 50);
        await this.delay(300);
        await ui.typewrite('A Terminal Adventure', 'dim', 30);

        ui.newline();
        ui.separator('=', 40);
        ui.newline();

        await ui.typewrite('Deep beneath the city lies a dungeon.', '', 25);
        await ui.typewrite('Ten floors of monsters, traps, and treasure.', '', 25);
        await ui.typewrite('Many have entered. Few have returned.', '', 25);
        ui.newline();
        await ui.typewrite('Will you conquer the darkness?', 'highlight', 25);

        ui.newline();
        ui.separator('=', 40);
        ui.newline();
    }

    async checkSaveGame() {
        if (hasSaveGame()) {
            const info = getSaveInfo();
            ui.print('A saved game was found:', 'system');
            if (info) {
                const date = new Date(info.timestamp).toLocaleDateString();
                ui.print(`  Floor: ${info.turn || '?'} | Saved: ${date}`, 'dim');
            }
            ui.newline();

            this.state = 'save_prompt';
            ui.setMenu([
                { id: 'continue', label: 'Continue Game', hint: 'Load save' },
                { id: 'new', label: 'New Game', hint: 'Start fresh' }
            ], 'WELCOME BACK');

            ui.onMenuSelect(this.handleMenuSelect.bind(this));
        } else {
            await this.startNewGame();
        }
    }

    async startNewGame() {
        ui.print('What is your name, adventurer?', 'system');
        ui.newline();
        this.state = 'naming';
        ui.clearMenu();
        ui.showTextInput('Enter your name...');
        ui.onTextInput(this.handleTextInput.bind(this));
    }

    handleMenuSelect(option) {
        switch (this.state) {
            case 'save_prompt':
                this.handleSavePromptMenu(option);
                break;
            case 'playing':
                this.commandHandler.handleSelection(option);

                // Check for new game request after game over/victory
                if (option.id === 'new_game') {
                    this.restartGame();
                }
                break;
        }
    }

    handleTextInput(input) {
        switch (this.state) {
            case 'naming':
                this.handlePlayerName(input);
                break;
        }
    }

    async handleSavePromptMenu(option) {
        if (option.id === 'continue') {
            const result = this.game.load();
            if (result.success) {
                ui.print('Welcome back!', 'success');
                ui.newline();
                this.state = 'playing';

                // Initialize renderer with loaded game
                if (this.renderer) {
                    this.renderer.setGame(this.game);
                }

                this.commandHandler.displayCurrentState();
                this.commandHandler.showMenu();
                ui.onMenuSelect(this.handleMenuSelect.bind(this));
            } else {
                ui.print('Failed to load save. Starting new game...', 'error');
                await this.startNewGame();
            }
        } else if (option.id === 'new') {
            await this.startNewGame();
        }
    }

    async handlePlayerName(input) {
        const name = input.trim();
        ui.echoCommand(input);
        ui.newline();

        if (!name || name.length < 2) {
            ui.print('Enter a name (at least 2 characters).', 'error');
            return;
        }

        if (name.length > 15) {
            ui.print('Name too long (max 15 characters).', 'error');
            return;
        }

        const playerName = name.charAt(0).toUpperCase() + name.slice(1);

        // Initialize the game
        this.game.newGame(playerName);

        ui.hideTextInput();
        ui.newline();
        ui.print(`${playerName}... a brave soul.`, 'success');
        ui.newline();

        await ui.typewrite('You stand at the entrance to the dungeon.', '', 20);
        await ui.typewrite('The air is cold and damp.', '', 20);
        await ui.typewrite('Strange sounds echo from below...', '', 20);
        ui.newline();

        ui.print('You are equipped with:', 'system');
        ui.print('  - Rusty Sword (+3 ATK)', 'dim');
        ui.print('  - Health Potion (restores 15 HP)', 'dim');
        ui.newline();

        await ui.typewrite('Find the stairs on each floor to descend.', 'highlight', 20);
        await ui.typewrite('Defeat the boss on Floor 10 to win.', 'highlight', 20);
        ui.newline();

        ui.separator('=', 40);
        ui.newline();

        this.state = 'playing';

        // Initialize renderer with game
        if (this.renderer) {
            this.renderer.setGame(this.game);
        }

        this.commandHandler.displayCurrentState();
        this.commandHandler.showMenu();
        ui.onMenuSelect(this.handleMenuSelect.bind(this));
    }

    async restartGame() {
        // Reset game state
        this.game = new Game();
        this.commandHandler = new CommandHandler(this.game);

        if (this.renderer) {
            this.commandHandler.setRenderer(this.renderer);
            this.renderer.setGame(null);
        }

        ui.clear();
        await this.startNewGame();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new DungeonCrawler();
    game.start();
});

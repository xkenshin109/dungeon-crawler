// Commands Module - Context-sensitive menu handler for dungeon crawler

import { ui } from './ui.js';
import { GAME_STATES } from './game.js';
import { ITEMS, ITEM_TYPES } from './items.js';
import { ROOM_TYPES } from './dungeon.js';

export class CommandHandler {
    constructor(game) {
        this.game = game;
        this.renderer = null;
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }

    updateDisplay() {
        if (this.renderer) {
            this.renderer.render();
        }
    }

    // Get context-sensitive menu based on game state
    getContextMenu() {
        switch (this.game.state) {
            case GAME_STATES.EXPLORATION:
                return this.getExplorationMenu();
            case GAME_STATES.COMBAT:
                return this.getCombatMenu();
            case GAME_STATES.SHOP:
                return this.getShopMenu();
            case GAME_STATES.INVENTORY:
                return this.getInventoryMenu();
            case GAME_STATES.GAME_OVER:
                return this.getGameOverMenu();
            case GAME_STATES.VICTORY:
                return this.getVictoryMenu();
            default:
                return [];
        }
    }

    // Exploration menu - movement and actions
    getExplorationMenu() {
        const options = [];
        const room = this.game.getCurrentRoom();
        const availableDirections = this.game.getAvailableDirections();

        // All four directions - show all, disable unavailable
        const allDirections = [
            { name: 'north', label: 'North' },
            { name: 'south', label: 'South' },
            { name: 'east', label: 'East' },
            { name: 'west', label: 'West' }
        ];

        for (const dir of allDirections) {
            const available = availableDirections.find(d => d.name === dir.name);

            if (available) {
                const roomHint = available.room.explored
                    ? (available.room.cleared ? 'Cleared' : this.getRoomHint(available.room.type))
                    : '???';
                options.push({
                    id: `move_${dir.name}`,
                    label: `Go ${dir.label}`,
                    hint: roomHint,
                    action: 'move',
                    direction: dir.name
                });
            } else {
                options.push({
                    id: `move_${dir.name}`,
                    label: `Go ${dir.label}`,
                    hint: 'Wall',
                    disabled: true
                });
            }
        }

        options.push({ separator: true });

        // Descend if on stairs
        if (room && room.type === ROOM_TYPES.STAIRS) {
            options.push({
                id: 'descend',
                label: 'Descend Stairs',
                hint: `To Floor ${this.game.player.floor + 1}`,
                action: 'descend'
            });
        }

        // Other actions
        options.push({ id: 'inventory', label: 'Inventory', hint: `${this.game.player.inventory.length}/10` });
        options.push({ id: 'status', label: 'Status', hint: 'View stats' });
        options.push({ separator: true });
        options.push({ id: 'save', label: 'Save Game' });

        return options;
    }

    // Combat menu
    getCombatMenu() {
        const options = [];
        const player = this.game.player;
        const combat = this.game.combat;

        options.push({
            id: 'attack',
            label: 'Attack',
            hint: `ATK: ${player.atk}`,
            action: 'combat'
        });

        options.push({
            id: 'defend',
            label: 'Defend',
            hint: `DEF x2`,
            action: 'combat'
        });

        // Check for consumables
        const consumables = player.inventory.filter(id =>
            ITEMS[id] && ITEMS[id].type === ITEM_TYPES.CONSUMABLE
        );

        if (consumables.length > 0) {
            options.push({
                id: 'combat_item',
                label: 'Use Item',
                hint: `${consumables.length} available`,
                action: 'combat_item_menu'
            });
        }

        if (!combat.isBoss) {
            options.push({
                id: 'flee',
                label: 'Flee',
                hint: '40% chance',
                action: 'combat'
            });
        }

        return options;
    }

    // Combat item selection menu
    getCombatItemMenu() {
        const options = [
            { id: 'back', label: '< Back', back: true }
        ];

        const player = this.game.player;
        const consumables = player.inventory.filter(id =>
            ITEMS[id] && ITEMS[id].type === ITEM_TYPES.CONSUMABLE
        );

        for (const itemId of consumables) {
            const item = ITEMS[itemId];
            options.push({
                id: `use_${itemId}`,
                label: item.name,
                hint: item.heal ? `+${item.heal} HP` : '',
                action: 'use_combat_item',
                itemId: itemId
            });
        }

        return options;
    }

    // Shop menu
    getShopMenu() {
        const options = [
            { id: 'leave_shop', label: 'Leave Shop', back: true }
        ];

        options.push({ separator: true });

        const player = this.game.player;
        for (const item of this.game.shopItems) {
            const canAfford = player.gold >= item.value;
            const inventoryFull = player.inventory.length >= player.maxInventory;

            let hint = `${item.value}g`;
            if (!canAfford) hint = 'Too expensive';
            else if (inventoryFull) hint = 'Inventory full';

            options.push({
                id: `buy_${item.id}`,
                label: item.name,
                hint: hint,
                disabled: !canAfford || inventoryFull,
                action: 'buy',
                itemId: item.id
            });
        }

        return options;
    }

    // Inventory menu
    getInventoryMenu() {
        const options = [
            { id: 'close_inventory', label: '< Back', back: true }
        ];

        const player = this.game.player;

        // Equipment section
        options.push({ separator: true, label: 'EQUIPMENT' });

        const weapon = player.getEquippedWeapon();
        options.push({
            id: 'unequip_weapon',
            label: `Weapon: ${weapon ? weapon.name : 'None'}`,
            hint: weapon ? `+${weapon.atk} ATK` : '',
            disabled: !weapon,
            action: 'unequip',
            slot: 'weapon'
        });

        const armor = player.getEquippedArmor();
        options.push({
            id: 'unequip_armor',
            label: `Armor: ${armor ? armor.name : 'None'}`,
            hint: armor ? `+${armor.def} DEF` : '',
            disabled: !armor,
            action: 'unequip',
            slot: 'armor'
        });

        // Inventory section
        options.push({ separator: true, label: 'INVENTORY' });

        if (player.inventory.length === 0) {
            options.push({
                id: 'empty',
                label: '(Empty)',
                disabled: true
            });
        } else {
            for (let i = 0; i < player.inventory.length; i++) {
                const itemId = player.inventory[i];
                const item = ITEMS[itemId];
                if (!item) continue;

                let hint = '';
                let action = '';

                if (item.type === ITEM_TYPES.WEAPON) {
                    hint = `+${item.atk} ATK`;
                    action = 'equip';
                } else if (item.type === ITEM_TYPES.ARMOR) {
                    hint = `+${item.def} DEF`;
                    action = 'equip';
                } else if (item.type === ITEM_TYPES.CONSUMABLE) {
                    hint = item.heal ? `+${item.heal} HP` : '';
                    action = 'use';
                }

                options.push({
                    id: `item_${i}_${itemId}`,
                    label: item.name,
                    hint: hint,
                    action: action,
                    itemId: itemId
                });
            }
        }

        return options;
    }

    // Game over menu
    getGameOverMenu() {
        return [
            { id: 'new_game', label: 'New Game', hint: 'Start over' },
            { id: 'load', label: 'Load Game', hint: 'Continue from save' }
        ];
    }

    // Victory menu
    getVictoryMenu() {
        return [
            { id: 'new_game', label: 'Play Again', hint: 'New adventure' }
        ];
    }

    // Get room type hint text
    getRoomHint(roomType) {
        switch (roomType) {
            case ROOM_TYPES.MONSTER: return 'Danger';
            case ROOM_TYPES.TREASURE: return 'Treasure';
            case ROOM_TYPES.TRAP: return 'Trap?';
            case ROOM_TYPES.SHOP: return 'Shop';
            case ROOM_TYPES.STAIRS: return 'Stairs';
            case ROOM_TYPES.START: return 'Start';
            default: return 'Empty';
        }
    }

    // Show current menu
    showMenu() {
        const menuTitle = this.getMenuTitle();
        ui.setMenu(this.getContextMenu(), menuTitle);
    }

    // Get menu title based on state
    getMenuTitle() {
        switch (this.game.state) {
            case GAME_STATES.EXPLORATION: return 'EXPLORE';
            case GAME_STATES.COMBAT: return 'COMBAT';
            case GAME_STATES.SHOP: return 'SHOP';
            case GAME_STATES.INVENTORY: return 'INVENTORY';
            case GAME_STATES.GAME_OVER: return 'GAME OVER';
            case GAME_STATES.VICTORY: return 'VICTORY!';
            default: return 'ACTIONS';
        }
    }

    // Handle menu selection
    async handleSelection(option) {
        // Handle back buttons
        if (option.back) {
            if (this.game.state === GAME_STATES.INVENTORY) {
                this.game.closeInventory();
            } else if (this.game.state === GAME_STATES.SHOP) {
                this.game.shopLeave();
            }
            this.displayCurrentState();
            this.showMenu();
            return;
        }

        // Handle combat item menu
        if (option.id === 'combat_item') {
            ui.setMenu(this.getCombatItemMenu(), 'USE ITEM');
            return;
        }

        // Route to appropriate handler
        switch (option.id) {
            // Exploration actions
            case 'inventory':
                this.game.openInventory();
                this.showInventoryDisplay();
                this.showMenu();
                break;

            case 'status':
                await this.showStatus();
                this.showMenu();
                break;

            case 'save':
                await this.saveGame();
                this.showMenu();
                break;

            case 'descend':
                await this.descend();
                break;

            // Combat actions
            case 'attack':
                await this.combatAction('attack');
                break;

            case 'defend':
                await this.combatAction('defend');
                break;

            case 'flee':
                await this.combatAction('flee');
                break;

            // Game over/victory
            case 'new_game':
                // Signal to main.js to start new game
                ui.print('Starting new game...', 'system');
                break;

            case 'load':
                await this.loadGame();
                break;

            // Inventory actions
            case 'close_inventory':
                this.game.closeInventory();
                this.displayCurrentState();
                this.showMenu();
                break;

            // Shop actions
            case 'leave_shop':
                this.game.shopLeave();
                this.displayCurrentState();
                this.showMenu();
                break;

            default:
                // Handle dynamic actions
                if (option.action === 'move') {
                    await this.move(option.direction);
                } else if (option.action === 'buy') {
                    await this.buyItem(option.itemId);
                } else if (option.action === 'equip') {
                    await this.equipItem(option.itemId);
                } else if (option.action === 'use') {
                    await this.useItem(option.itemId);
                } else if (option.action === 'unequip') {
                    await this.unequipItem(option.slot);
                } else if (option.action === 'use_combat_item') {
                    await this.useCombatItem(option.itemId);
                }
        }

        this.updateDisplay();
    }

    // Movement
    async move(direction) {
        const result = this.game.move(direction);

        this.displayMessages();

        if (result.event === 'combat' || result.event === 'ambush') {
            this.displayCombatState();
        } else if (result.event === 'shop') {
            this.displayShopState();
        }

        this.showMenu();
    }

    // Combat action
    async combatAction(action) {
        let result;

        switch (action) {
            case 'attack':
                result = this.game.combatAttack();
                break;
            case 'defend':
                result = this.game.combatDefend();
                break;
            case 'flee':
                result = this.game.combatFlee();
                break;
        }

        this.displayMessages();

        if (result.victory || result.defeat || result.fled) {
            if (result.victory) {
                ui.print('Victory!', 'success');
            } else if (result.fled) {
                ui.print('You escaped!', 'system');
            }

            if (this.game.state === GAME_STATES.VICTORY) {
                this.displayVictory();
            } else if (this.game.state === GAME_STATES.GAME_OVER) {
                this.displayGameOver();
            }
        } else {
            this.displayCombatState();
        }

        this.showMenu();
    }

    // Use item in combat
    async useCombatItem(itemId) {
        const result = this.game.combatUseItem(itemId);
        this.displayMessages();

        if (result.victory || result.defeat) {
            if (this.game.state === GAME_STATES.VICTORY) {
                this.displayVictory();
            } else if (this.game.state === GAME_STATES.GAME_OVER) {
                this.displayGameOver();
            }
        } else {
            this.displayCombatState();
        }

        this.showMenu();
    }

    // Descend stairs
    async descend() {
        const result = this.game.descend();

        this.displayMessages();

        if (result.event === 'boss') {
            this.displayCombatState();
        } else if (result.event === 'victory') {
            this.displayVictory();
        } else {
            this.displayExplorationState();
        }

        this.showMenu();
    }

    // Buy item from shop
    async buyItem(itemId) {
        const result = this.game.shopBuy(itemId);

        if (result.success) {
            this.displayMessages();
        } else {
            ui.print(result.message, 'error');
        }

        this.displayShopState();
        this.showMenu();
    }

    // Equip item
    async equipItem(itemId) {
        const result = this.game.equipItem(itemId);

        if (result.success) {
            this.displayMessages();
        } else {
            ui.print(result.message, 'error');
        }

        this.showInventoryDisplay();
        this.showMenu();
    }

    // Use item
    async useItem(itemId) {
        const result = this.game.useItem(itemId);

        if (result.success) {
            this.displayMessages();
        } else {
            ui.print(result.message, 'error');
        }

        this.showInventoryDisplay();
        this.showMenu();
    }

    // Unequip item
    async unequipItem(slot) {
        const result = this.game.unequipItem(slot);

        if (result.success) {
            this.displayMessages();
        } else {
            ui.print(result.message, 'error');
        }

        this.showInventoryDisplay();
        this.showMenu();
    }

    // Save game
    async saveGame() {
        const result = this.game.save();
        if (result.success) {
            ui.print('Game saved!', 'success');
        } else {
            ui.print(`Failed to save: ${result.error}`, 'error');
        }
        ui.newline();
    }

    // Load game
    async loadGame() {
        const result = this.game.load();
        if (result.success) {
            ui.print('Game loaded!', 'success');
            this.displayCurrentState();
            this.showMenu();
        } else {
            ui.print(`Failed to load: ${result.error}`, 'error');
        }
    }

    // Show player status
    async showStatus() {
        const player = this.game.player;

        ui.clear();
        ui.print('=== CHARACTER STATUS ===', 'highlight');
        ui.newline();

        ui.print(`Name: ${player.name}`);
        ui.print(`Level: ${player.level}`);
        ui.print(`EXP: ${player.exp}/${player.expToLevel}`);
        ui.newline();

        const hpBar = ui.progressBar(player.hp, player.maxHp, 15);
        ui.print(`HP: ${hpBar} ${player.hp}/${player.maxHp}`);
        ui.newline();

        ui.print(`Attack:  ${player.atk} (Base: ${player.baseAtk})`);
        ui.print(`Defense: ${player.def} (Base: ${player.baseDef})`);
        ui.newline();

        ui.print(`Gold: ${player.gold}`);
        ui.print(`Floor: ${player.floor}`);
        ui.newline();

        const weapon = player.getEquippedWeapon();
        const armor = player.getEquippedArmor();
        ui.print('--- EQUIPMENT ---', 'dim');
        ui.print(`Weapon: ${weapon ? `${weapon.name} (+${weapon.atk} ATK)` : 'None'}`);
        ui.print(`Armor:  ${armor ? `${armor.name} (+${armor.def} DEF)` : 'None'}`);
        ui.newline();
    }

    // Display recent messages
    displayMessages() {
        const messages = this.game.getRecentMessages(5);
        for (const msg of messages) {
            const className = msg.type === 'danger' ? 'error' :
                             msg.type === 'success' ? 'success' :
                             msg.type === 'combat' ? 'system' : '';
            ui.print(msg.text, className);
        }
    }

    // Display based on current state
    displayCurrentState() {
        switch (this.game.state) {
            case GAME_STATES.EXPLORATION:
                this.displayExplorationState();
                break;
            case GAME_STATES.COMBAT:
                this.displayCombatState();
                break;
            case GAME_STATES.SHOP:
                this.displayShopState();
                break;
            case GAME_STATES.INVENTORY:
                this.showInventoryDisplay();
                break;
            case GAME_STATES.GAME_OVER:
                this.displayGameOver();
                break;
            case GAME_STATES.VICTORY:
                this.displayVictory();
                break;
        }
    }

    // Display exploration state
    displayExplorationState() {
        ui.clear();

        const status = this.game.getStatus();
        const player = this.game.player;

        ui.print(`Floor ${status.floor} | Turn ${this.game.turn}`, 'dim');
        ui.separator('-', 30);

        ui.print(status.roomDescription);
        ui.newline();

        this.displayMessages();
        ui.newline();
    }

    // Display combat state
    displayCombatState() {
        ui.clear();

        const combat = this.game.combat;
        if (!combat) return;

        const summary = combat.getSummary();

        // Boss battle header
        if (summary.isBoss) {
            ui.print('=== BOSS BATTLE ===', 'error');
        } else {
            ui.print('=== COMBAT ===', 'error');
        }
        ui.newline();

        // Monster info
        ui.print(`${summary.monsterName}${summary.isBoss ? ' [BOSS]' : ''}`, 'error');
        const monsterHpBar = ui.progressBar(summary.monsterHp, summary.monsterMaxHp, 15);
        ui.print(`HP: ${monsterHpBar} ${summary.monsterHp}/${summary.monsterMaxHp}`);

        // Boss shield bar
        if (summary.isBoss && summary.shieldMax > 0) {
            const shieldBar = ui.progressBar(summary.shield, summary.shieldMax, 15);
            ui.print(`Shield: ${shieldBar} ${summary.shield}/${summary.shieldMax}`, 'highlight');
        }

        ui.print(`ATK: ${summary.monsterAtk} | DEF: ${summary.monsterDef}`, 'dim');

        // Boss phase and enrage info
        if (summary.isBoss) {
            let bossStatus = [];
            if (summary.phase) {
                bossStatus.push(`Phase: ${summary.phase.name}`);
            }
            if (summary.enrageStacks > 0) {
                bossStatus.push(`Enrage: +${summary.enrageStacks * 2} ATK`);
            }
            if (bossStatus.length > 0) {
                ui.print(bossStatus.join(' | '), 'system');
            }
        }
        ui.newline();

        // Player info
        ui.print(`${this.game.player.name}`, 'success');
        const playerHpBar = ui.progressBar(summary.playerHp, summary.playerMaxHp, 15);
        ui.print(`HP: ${playerHpBar} ${summary.playerHp}/${summary.playerMaxHp}`);
        ui.print(`ATK: ${summary.playerAtk} | DEF: ${summary.playerDef}`, 'dim');

        // Player status effects
        if (summary.playerStunned) {
            ui.print('STATUS: STUNNED!', 'error');
        } else if (summary.playerDefending) {
            ui.print('STATUS: Defending (DEF x2)', 'highlight');
        }
        ui.newline();

        ui.print(`Turn ${summary.turn}`, 'dim');
        ui.newline();

        // Recent combat log
        const recentLog = combat.log.slice(-3);
        for (const msg of recentLog) {
            ui.print(msg, 'system');
        }
        ui.newline();
    }

    // Display shop state
    displayShopState() {
        ui.clear();

        ui.print('=== SHOP ===', 'highlight');
        ui.print(`Gold: ${this.game.player.gold}`, 'success');
        ui.newline();

        ui.print('The merchant displays their wares:', 'dim');
        ui.newline();

        for (const item of this.game.shopItems) {
            let desc = '';
            if (item.type === ITEM_TYPES.WEAPON) desc = `+${item.atk} ATK`;
            else if (item.type === ITEM_TYPES.ARMOR) desc = `+${item.def} DEF`;
            else if (item.heal) desc = `+${item.heal} HP`;

            ui.print(`  ${item.name} - ${item.value}g (${desc})`, 'dim');
        }
        ui.newline();
    }

    // Display inventory
    showInventoryDisplay() {
        ui.clear();

        const player = this.game.player;

        ui.print('=== INVENTORY ===', 'highlight');
        ui.print(`Items: ${player.inventory.length}/${player.maxInventory}`, 'dim');
        ui.newline();

        const weapon = player.getEquippedWeapon();
        const armor = player.getEquippedArmor();

        ui.print('EQUIPPED:', 'system');
        ui.print(`  Weapon: ${weapon ? weapon.name : 'None'}`);
        ui.print(`  Armor:  ${armor ? armor.name : 'None'}`);
        ui.newline();

        ui.print('ITEMS:', 'system');
        if (player.inventory.length === 0) {
            ui.print('  (Empty)', 'dim');
        } else {
            for (const itemId of player.inventory) {
                const item = ITEMS[itemId];
                if (item) {
                    ui.print(`  ${item.name}`, 'dim');
                }
            }
        }
        ui.newline();
    }

    // Display game over
    displayGameOver() {
        ui.clear();

        ui.print('================================', 'error');
        ui.print('        G A M E   O V E R       ', 'error');
        ui.print('================================', 'error');
        ui.newline();

        const player = this.game.player;
        ui.print(`${player.name} has fallen...`, 'dim');
        ui.print(`Reached Floor ${player.floor}`, 'dim');
        ui.print(`Final Level: ${player.level}`, 'dim');
        ui.newline();
    }

    // Display victory
    displayVictory() {
        ui.clear();

        ui.print('================================', 'success');
        ui.print('       V I C T O R Y !          ', 'success');
        ui.print('================================', 'success');
        ui.newline();

        const player = this.game.player;
        ui.print(`${player.name} has conquered the dungeon!`, 'highlight');
        ui.print(`Final Level: ${player.level}`, 'dim');
        ui.print(`Gold Collected: ${player.gold}`, 'dim');
        ui.newline();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

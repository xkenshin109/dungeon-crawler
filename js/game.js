// Game Module - Core game state machine for dungeon crawler

import { Player } from './player.js';
import { DungeonFloor, ROOM_TYPES } from './dungeon.js';
import { Monster } from './monsters.js';
import { CombatSystem, COMBAT_STATES } from './combat.js';
import { generateRoomEvent, rollRandomEncounter, EVENT_TYPES, getRoomDescription } from './events.js';
import { ITEMS, ITEM_TYPES } from './items.js';
import { saveGame, loadGame } from './save.js';

export const GAME_STATES = {
    TITLE: 'title',
    NEW_GAME: 'new_game',
    EXPLORATION: 'exploration',
    COMBAT: 'combat',
    SHOP: 'shop',
    INVENTORY: 'inventory',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

export const MAX_FLOORS = 10;

export class Game {
    constructor() {
        this.state = GAME_STATES.TITLE;
        this.player = null;
        this.currentFloor = null;
        this.currentEvent = null;
        this.combat = null;
        this.shopItems = [];
        this.turn = 0;
        this.messages = []; // Message log
    }

    // Start a new game
    newGame(playerName) {
        this.player = new Player(playerName);
        this.turn = 1;
        this.messages = [];

        // Generate first floor
        this.currentFloor = new DungeonFloor(1);
        this.currentFloor.generate();

        // Place player at start
        this.player.position = { ...this.currentFloor.startPos };
        this.player.floor = 1;

        // Give player starting equipment
        this.player.addItem('rusty_sword');
        this.player.addItem('health_potion');
        this.player.equip('rusty_sword');

        this.state = GAME_STATES.EXPLORATION;
        this.addMessage('You descend into the dungeon...');

        return { success: true };
    }

    // Add a message to the log
    addMessage(message, type = 'info') {
        this.messages.push({ text: message, type, turn: this.turn });
        // Keep last 50 messages
        if (this.messages.length > 50) {
            this.messages.shift();
        }
    }

    // Clear messages
    clearMessages() {
        this.messages = [];
    }

    // Get recent messages
    getRecentMessages(count = 10) {
        return this.messages.slice(-count);
    }

    // Move player in a direction
    move(direction) {
        if (this.state !== GAME_STATES.EXPLORATION) {
            return { success: false, message: 'Cannot move right now.' };
        }

        const dirMap = {
            north: { dx: 0, dy: -1 },
            south: { dx: 0, dy: 1 },
            west: { dx: -1, dy: 0 },
            east: { dx: 1, dy: 0 }
        };

        const dir = dirMap[direction];
        if (!dir) {
            return { success: false, message: 'Invalid direction.' };
        }

        const newX = this.player.position.x + dir.dx;
        const newY = this.player.position.y + dir.dy;

        if (!this.currentFloor.isValidPosition(newX, newY)) {
            return { success: false, message: 'You cannot go that way.' };
        }

        // Move player
        this.player.position = { x: newX, y: newY };
        const room = this.currentFloor.getRoom(newX, newY);
        room.explored = true;

        this.addMessage(`You move ${direction}.`);

        // Check for random encounter while moving
        const ambush = rollRandomEncounter(this.player.floor);
        if (ambush && !room.cleared) {
            this.currentEvent = ambush;
            this.startCombat(ambush.data.monster);
            this.addMessage(ambush.data.message, 'danger');
            return { success: true, event: 'ambush' };
        }

        // Process room event if not cleared
        if (!room.cleared) {
            return this.processRoomEvent(room);
        }

        return { success: true, event: 'moved' };
    }

    // Process event for current room
    processRoomEvent(room) {
        const event = generateRoomEvent(room.type, this.player.floor);
        this.currentEvent = event;

        switch (event.type) {
            case EVENT_TYPES.COMBAT:
                this.startCombat(event.data.monster);
                if (event.data.message) {
                    this.addMessage(event.data.message, 'danger');
                } else {
                    this.addMessage(`A ${event.data.monster.name} appears!`, 'danger');
                }
                return { success: true, event: 'combat' };

            case EVENT_TYPES.TREASURE:
                return this.collectTreasure(room, event.data);

            case EVENT_TYPES.TRAP:
                return this.triggerTrap(room, event.data);

            case EVENT_TYPES.SHOP:
                this.shopItems = event.data.items;
                this.state = GAME_STATES.SHOP;
                this.addMessage('A merchant greets you warmly.');
                return { success: true, event: 'shop' };

            case EVENT_TYPES.STAIRS:
                // Stairs don't auto-trigger, player chooses to descend
                this.addMessage('You see stairs leading deeper into the dungeon.');
                room.cleared = true;
                return { success: true, event: 'stairs' };

            default:
                room.cleared = true;
                return { success: true, event: 'empty' };
        }
    }

    // Collect treasure
    collectTreasure(room, data) {
        room.cleared = true;
        this.currentEvent.resolved = true;

        this.addMessage(data.message);

        if (data.gold > 0) {
            this.player.addGold(data.gold);
            this.addMessage(`Found ${data.gold} gold!`, 'success');
        }

        if (data.item) {
            const result = this.player.addItem(data.item);
            if (result.success) {
                this.addMessage(`Found ${ITEMS[data.item].name}!`, 'success');
            } else {
                this.addMessage(`Found ${ITEMS[data.item].name}, but inventory is full!`, 'warning');
            }
        }

        return { success: true, event: 'treasure', gold: data.gold, item: data.item };
    }

    // Trigger trap
    triggerTrap(room, data) {
        room.cleared = true;
        this.currentEvent.resolved = true;

        this.addMessage(data.message, 'danger');

        const damage = Math.max(1, data.damage - Math.floor(this.player.def / 2));
        this.player.hp = Math.max(0, this.player.hp - damage);
        this.addMessage(`You take ${damage} damage!`, 'danger');

        // Check for death
        if (this.player.isDead()) {
            this.state = GAME_STATES.GAME_OVER;
            this.addMessage('You have perished in the dungeon...', 'danger');
            return { success: true, event: 'death' };
        }

        return { success: true, event: 'trap', damage };
    }

    // Start combat
    startCombat(monster) {
        this.combat = new CombatSystem(this.player, monster);
        this.state = GAME_STATES.COMBAT;
    }

    // Combat action: attack
    combatAttack() {
        if (this.state !== GAME_STATES.COMBAT || !this.combat) {
            return { success: false, message: 'Not in combat!' };
        }

        const result = this.combat.attack();
        this.processCombatResult(result);
        return result;
    }

    // Combat action: defend
    combatDefend() {
        if (this.state !== GAME_STATES.COMBAT || !this.combat) {
            return { success: false, message: 'Not in combat!' };
        }

        const result = this.combat.defend();
        this.processCombatResult(result);
        return result;
    }

    // Combat action: use item
    combatUseItem(itemId) {
        if (this.state !== GAME_STATES.COMBAT || !this.combat) {
            return { success: false, message: 'Not in combat!' };
        }

        const result = this.combat.useItem(itemId);
        this.processCombatResult(result);
        return result;
    }

    // Combat action: flee
    combatFlee() {
        if (this.state !== GAME_STATES.COMBAT || !this.combat) {
            return { success: false, message: 'Not in combat!' };
        }

        const result = this.combat.flee();
        this.processCombatResult(result);
        return result;
    }

    // Process combat result
    processCombatResult(result) {
        // Add combat log messages
        if (result.log) {
            for (const msg of result.log.slice(-3)) { // Last 3 messages
                this.addMessage(msg, 'combat');
            }
        }

        if (result.victory) {
            // Clear the room
            const room = this.currentFloor.getRoom(this.player.position.x, this.player.position.y);
            if (room) room.cleared = true;

            // Check for boss victory (win condition)
            if (this.combat.isBoss && this.player.floor === MAX_FLOORS) {
                this.state = GAME_STATES.VICTORY;
                this.addMessage('You have conquered the dungeon!', 'success');
            } else {
                this.state = GAME_STATES.EXPLORATION;
                this.combat = null;
                this.currentEvent = null;
            }
        } else if (result.defeat) {
            this.state = GAME_STATES.GAME_OVER;
        } else if (result.fled) {
            // Move back to previous room (or stay if no previous)
            this.state = GAME_STATES.EXPLORATION;
            this.combat = null;
            this.currentEvent = null;
        }
    }

    // Descend to next floor
    descend() {
        if (this.state !== GAME_STATES.EXPLORATION) {
            return { success: false, message: 'Cannot descend right now.' };
        }

        const room = this.currentFloor.getRoom(this.player.position.x, this.player.position.y);
        if (room.type !== ROOM_TYPES.STAIRS) {
            return { success: false, message: 'No stairs here.' };
        }

        // Check for boss on floor 10
        if (this.player.floor === MAX_FLOORS && !room.cleared) {
            // Boss fight
            const event = generateRoomEvent(ROOM_TYPES.STAIRS, this.player.floor);
            this.currentEvent = event;
            this.startCombat(event.data.monster);
            this.addMessage(event.data.message, 'danger');
            return { success: true, event: 'boss' };
        }

        if (this.player.floor >= MAX_FLOORS) {
            // Victory!
            this.state = GAME_STATES.VICTORY;
            this.addMessage('You have escaped the dungeon!', 'success');
            return { success: true, event: 'victory' };
        }

        // Go to next floor
        this.player.floor++;
        this.turn++;

        this.currentFloor = new DungeonFloor(this.player.floor);
        this.currentFloor.generate();
        this.player.position = { ...this.currentFloor.startPos };

        this.addMessage(`You descend to floor ${this.player.floor}...`);

        return { success: true, event: 'descended' };
    }

    // Shop: buy item
    shopBuy(itemId) {
        if (this.state !== GAME_STATES.SHOP) {
            return { success: false, message: 'Not in shop!' };
        }

        const item = ITEMS[itemId];
        if (!item) {
            return { success: false, message: 'Invalid item!' };
        }

        if (this.player.gold < item.value) {
            return { success: false, message: 'Not enough gold!' };
        }

        const addResult = this.player.addItem(itemId);
        if (!addResult.success) {
            return addResult;
        }

        this.player.spendGold(item.value);
        this.addMessage(`Bought ${item.name} for ${item.value} gold.`, 'success');

        return { success: true };
    }

    // Shop: leave
    shopLeave() {
        if (this.state !== GAME_STATES.SHOP) {
            return { success: false, message: 'Not in shop!' };
        }

        const room = this.currentFloor.getRoom(this.player.position.x, this.player.position.y);
        if (room) room.cleared = true;

        this.state = GAME_STATES.EXPLORATION;
        this.currentEvent = null;
        this.shopItems = [];
        this.addMessage('You leave the shop.');

        return { success: true };
    }

    // Open inventory
    openInventory() {
        if (this.state === GAME_STATES.COMBAT) {
            return { success: false, message: 'Cannot open inventory in combat!' };
        }
        this.state = GAME_STATES.INVENTORY;
        return { success: true };
    }

    // Close inventory
    closeInventory() {
        this.state = GAME_STATES.EXPLORATION;
        return { success: true };
    }

    // Use item from inventory (outside combat)
    useItem(itemId) {
        const item = ITEMS[itemId];
        if (!item || item.type !== ITEM_TYPES.CONSUMABLE) {
            return { success: false, message: 'Cannot use this item!' };
        }

        const result = this.player.useItem(itemId);
        if (result.success) {
            this.addMessage(result.message, 'success');
        }
        return result;
    }

    // Equip item from inventory
    equipItem(itemId) {
        const result = this.player.equip(itemId);
        if (result.success) {
            this.addMessage(result.message, 'success');
        }
        return result;
    }

    // Unequip item
    unequipItem(slot) {
        const result = this.player.unequip(slot);
        if (result.success) {
            this.addMessage(result.message);
        }
        return result;
    }

    // Get current room info
    getCurrentRoom() {
        if (!this.currentFloor || !this.player) return null;
        return this.currentFloor.getRoom(this.player.position.x, this.player.position.y);
    }

    // Get available movement directions
    getAvailableDirections() {
        if (!this.currentFloor || !this.player) return [];
        return this.currentFloor.getAdjacentRooms(this.player.position.x, this.player.position.y);
    }

    // Get game status for display
    getStatus() {
        if (!this.player) return null;

        const room = this.getCurrentRoom();
        return {
            state: this.state,
            turn: this.turn,
            floor: this.player.floor,
            maxFloors: MAX_FLOORS,
            position: { ...this.player.position },
            roomType: room ? room.type : null,
            roomCleared: room ? room.cleared : false,
            roomDescription: room ? getRoomDescription(room.type, room.cleared) : ''
        };
    }

    // Save game
    save() {
        if (!this.player) {
            return { success: false, message: 'No game to save!' };
        }

        const state = {
            state: this.state,
            turn: this.turn,
            player: this.player.toJSON(),
            currentFloor: this.currentFloor.toJSON(),
            messages: this.messages.slice(-20) // Save last 20 messages
        };

        // Save combat state if in combat
        if (this.combat) {
            state.combat = this.combat.toJSON();
        }

        return saveGame(state);
    }

    // Load game
    load() {
        const result = loadGame();
        if (!result.success) {
            return result;
        }

        const data = result.data;

        this.state = data.state;
        this.turn = data.turn;
        this.player = Player.fromJSON(data.player);
        this.currentFloor = DungeonFloor.fromJSON(data.currentFloor);
        this.messages = data.messages || [];

        // Restore combat if was in combat
        if (data.combat) {
            this.combat = CombatSystem.fromJSON(data.combat, this.player, Monster);
        }

        return { success: true };
    }
}

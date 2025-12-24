// Events Module - Room events and random encounters

import { ROOM_TYPES } from './dungeon.js';
import { spawnMonster, spawnBoss } from './monsters.js';
import { getRandomLoot, getRandomGold, getShopItems } from './items.js';

export const EVENT_TYPES = {
    NONE: 'none',
    COMBAT: 'combat',
    TREASURE: 'treasure',
    TRAP: 'trap',
    SHOP: 'shop',
    STAIRS: 'stairs',
    AMBUSH: 'ambush'  // Random encounter while moving
};

export class GameEvent {
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
        this.resolved = false;
    }

    resolve() {
        this.resolved = true;
    }
}

// Generate event for a room based on its type
export function generateRoomEvent(roomType, floorNumber) {
    switch (roomType) {
        case ROOM_TYPES.MONSTER:
            return new GameEvent(EVENT_TYPES.COMBAT, {
                monster: spawnMonster(floorNumber),
                isBoss: false
            });

        case ROOM_TYPES.TREASURE:
            return generateTreasureEvent(floorNumber);

        case ROOM_TYPES.TRAP:
            return generateTrapEvent(floorNumber);

        case ROOM_TYPES.SHOP:
            return new GameEvent(EVENT_TYPES.SHOP, {
                items: getShopItems(floorNumber)
            });

        case ROOM_TYPES.STAIRS:
            // Boss fight on floor 10's stairs
            if (floorNumber === 10) {
                return new GameEvent(EVENT_TYPES.COMBAT, {
                    monster: spawnBoss(10),
                    isBoss: true,
                    message: 'The Ancient Dragon guards the exit!'
                });
            }
            return new GameEvent(EVENT_TYPES.STAIRS, {
                nextFloor: floorNumber + 1
            });

        case ROOM_TYPES.START:
        case ROOM_TYPES.EMPTY:
        default:
            return new GameEvent(EVENT_TYPES.NONE, {});
    }
}

// Generate treasure event
function generateTreasureEvent(floorNumber) {
    const hasItem = Math.random() < 0.6; // 60% chance for item
    const gold = getRandomGold(floorNumber);

    const data = {
        gold,
        item: hasItem ? getRandomLoot(floorNumber) : null,
        message: 'You found a treasure chest!'
    };

    return new GameEvent(EVENT_TYPES.TREASURE, data);
}

// Generate trap event
function generateTrapEvent(floorNumber) {
    const trapTypes = [
        {
            name: 'Spike Trap',
            damage: 5 + Math.floor(floorNumber * 1.5),
            message: 'Sharp spikes shoot up from the floor!'
        },
        {
            name: 'Poison Gas',
            damage: 4 + floorNumber,
            message: 'A cloud of poison gas fills the room!'
        },
        {
            name: 'Arrow Trap',
            damage: 6 + floorNumber,
            message: 'Arrows fly from hidden holes in the walls!'
        },
        {
            name: 'Pit Trap',
            damage: 8 + Math.floor(floorNumber * 0.5),
            message: 'The floor gives way beneath you!'
        }
    ];

    const trap = trapTypes[Math.floor(Math.random() * trapTypes.length)];

    return new GameEvent(EVENT_TYPES.TRAP, {
        trapName: trap.name,
        damage: trap.damage,
        message: trap.message
    });
}

// Check for random encounter while moving
export function rollRandomEncounter(floorNumber) {
    // Base 15% chance, increases with floor
    const encounterChance = Math.min(0.3, 0.15 + floorNumber * 0.015);

    if (Math.random() < encounterChance) {
        return new GameEvent(EVENT_TYPES.AMBUSH, {
            monster: spawnMonster(floorNumber),
            message: 'A monster ambushes you!'
        });
    }

    return null;
}

// Get description for room type
export function getRoomDescription(roomType, cleared) {
    if (cleared) {
        return 'An empty room. Nothing of interest remains.';
    }

    switch (roomType) {
        case ROOM_TYPES.START:
            return 'The entrance to this floor. A safe place to rest.';
        case ROOM_TYPES.MONSTER:
            return 'You sense danger lurking in the shadows...';
        case ROOM_TYPES.TREASURE:
            return 'Something glints in the darkness ahead.';
        case ROOM_TYPES.TRAP:
            return 'The air feels tense. Watch your step.';
        case ROOM_TYPES.SHOP:
            return 'A traveling merchant has set up shop here.';
        case ROOM_TYPES.STAIRS:
            return 'Stone stairs lead deeper into the dungeon.';
        case ROOM_TYPES.EMPTY:
        default:
            return 'An empty chamber. The walls are cold and damp.';
    }
}

// Get room type display name
export function getRoomTypeName(roomType) {
    switch (roomType) {
        case ROOM_TYPES.START: return 'Entrance';
        case ROOM_TYPES.MONSTER: return 'Monster Den';
        case ROOM_TYPES.TREASURE: return 'Treasure Room';
        case ROOM_TYPES.TRAP: return 'Trapped Room';
        case ROOM_TYPES.SHOP: return 'Shop';
        case ROOM_TYPES.STAIRS: return 'Stairs';
        case ROOM_TYPES.EMPTY: return 'Empty Room';
        default: return 'Unknown';
    }
}

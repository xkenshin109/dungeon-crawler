// Dungeon Module - Floor generation and room management

export const ROOM_TYPES = {
    EMPTY: 'empty',
    MONSTER: 'monster',
    TREASURE: 'treasure',
    TRAP: 'trap',
    SHOP: 'shop',
    STAIRS: 'stairs',
    START: 'start'
};

export class Room {
    constructor(x, y, type = ROOM_TYPES.EMPTY) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.explored = false;
        this.cleared = false;
        this.event = null; // Will hold event data when entered
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            explored: this.explored,
            cleared: this.cleared
        };
    }

    static fromJSON(data) {
        const room = new Room(data.x, data.y, data.type);
        room.explored = data.explored;
        room.cleared = data.cleared;
        return room;
    }
}

export class DungeonFloor {
    constructor(floorNumber) {
        this.floorNumber = floorNumber;
        this.width = 5;
        this.height = 5;
        this.rooms = [];
        this.startPos = { x: 0, y: 0 };
        this.stairsPos = { x: 0, y: 0 };
    }

    generate() {
        // Initialize empty grid
        this.rooms = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(new Room(x, y, ROOM_TYPES.EMPTY));
            }
            this.rooms.push(row);
        }

        // Place start position (random edge)
        this.startPos = this.getRandomEdgePosition();
        this.rooms[this.startPos.y][this.startPos.x].type = ROOM_TYPES.START;
        this.rooms[this.startPos.y][this.startPos.x].explored = true;
        this.rooms[this.startPos.y][this.startPos.x].cleared = true;

        // Place stairs (opposite side from start, roughly)
        this.stairsPos = this.getOppositePosition(this.startPos);
        this.rooms[this.stairsPos.y][this.stairsPos.x].type = ROOM_TYPES.STAIRS;

        // Place shop (one per floor, not on start/stairs)
        const shopPos = this.getRandomEmptyPosition();
        if (shopPos) {
            this.rooms[shopPos.y][shopPos.x].type = ROOM_TYPES.SHOP;
        }

        // Fill remaining rooms based on floor difficulty
        this.populateRooms();
    }

    populateRooms() {
        const monsterChance = Math.min(0.5, 0.25 + this.floorNumber * 0.03);
        const treasureChance = 0.15;
        const trapChance = Math.min(0.15, 0.05 + this.floorNumber * 0.02);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const room = this.rooms[y][x];
                if (room.type !== ROOM_TYPES.EMPTY) continue;

                const roll = Math.random();
                if (roll < monsterChance) {
                    room.type = ROOM_TYPES.MONSTER;
                } else if (roll < monsterChance + treasureChance) {
                    room.type = ROOM_TYPES.TREASURE;
                } else if (roll < monsterChance + treasureChance + trapChance) {
                    room.type = ROOM_TYPES.TRAP;
                }
                // Otherwise stays EMPTY
            }
        }
    }

    getRandomEdgePosition() {
        const edges = [];

        // Top and bottom edges
        for (let x = 0; x < this.width; x++) {
            edges.push({ x, y: 0 });
            edges.push({ x, y: this.height - 1 });
        }
        // Left and right edges (excluding corners already added)
        for (let y = 1; y < this.height - 1; y++) {
            edges.push({ x: 0, y });
            edges.push({ x: this.width - 1, y });
        }

        return edges[Math.floor(Math.random() * edges.length)];
    }

    getOppositePosition(pos) {
        // Try to place stairs on opposite side
        let targetX = this.width - 1 - pos.x;
        let targetY = this.height - 1 - pos.y;

        // Add some randomness
        targetX = Math.max(0, Math.min(this.width - 1, targetX + Math.floor(Math.random() * 3) - 1));
        targetY = Math.max(0, Math.min(this.height - 1, targetY + Math.floor(Math.random() * 3) - 1));

        // Make sure it's not the same as start
        if (targetX === pos.x && targetY === pos.y) {
            targetX = (targetX + 1) % this.width;
        }

        return { x: targetX, y: targetY };
    }

    getRandomEmptyPosition() {
        const emptyRooms = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.rooms[y][x].type === ROOM_TYPES.EMPTY) {
                    emptyRooms.push({ x, y });
                }
            }
        }

        if (emptyRooms.length === 0) return null;
        return emptyRooms[Math.floor(Math.random() * emptyRooms.length)];
    }

    getRoom(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.rooms[y][x];
    }

    explore(x, y) {
        const room = this.getRoom(x, y);
        if (room) {
            room.explored = true;
        }
    }

    clearRoom(x, y) {
        const room = this.getRoom(x, y);
        if (room) {
            room.cleared = true;
        }
    }

    // Get adjacent rooms that can be moved to
    getAdjacentRooms(x, y) {
        const directions = [
            { dx: 0, dy: -1, name: 'north', label: 'North' },
            { dx: 0, dy: 1, name: 'south', label: 'South' },
            { dx: -1, dy: 0, name: 'west', label: 'West' },
            { dx: 1, dy: 0, name: 'east', label: 'East' }
        ];

        const adjacent = [];
        for (const dir of directions) {
            const room = this.getRoom(x + dir.dx, y + dir.dy);
            if (room) {
                adjacent.push({
                    ...dir,
                    room,
                    x: x + dir.dx,
                    y: y + dir.dy
                });
            }
        }

        return adjacent;
    }

    // Check if position is valid
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Get room type symbol for map display
    getRoomSymbol(x, y, playerX, playerY) {
        const room = this.getRoom(x, y);
        if (!room) return ' ';

        // Player position
        if (x === playerX && y === playerY) return '@';

        // Unexplored
        if (!room.explored) return '?';

        // Room types
        switch (room.type) {
            case ROOM_TYPES.START: return 'S';
            case ROOM_TYPES.STAIRS: return '>';
            case ROOM_TYPES.SHOP: return '$';
            case ROOM_TYPES.MONSTER: return room.cleared ? '.' : 'M';
            case ROOM_TYPES.TREASURE: return room.cleared ? '.' : 'T';
            case ROOM_TYPES.TRAP: return room.cleared ? '.' : '!';
            case ROOM_TYPES.EMPTY: return '.';
            default: return '.';
        }
    }

    toJSON() {
        return {
            floorNumber: this.floorNumber,
            width: this.width,
            height: this.height,
            rooms: this.rooms.map(row => row.map(room => room.toJSON())),
            startPos: { ...this.startPos },
            stairsPos: { ...this.stairsPos }
        };
    }

    static fromJSON(data) {
        const floor = new DungeonFloor(data.floorNumber);
        floor.width = data.width;
        floor.height = data.height;
        floor.rooms = data.rooms.map(row => row.map(roomData => Room.fromJSON(roomData)));
        floor.startPos = { ...data.startPos };
        floor.stairsPos = { ...data.stairsPos };
        return floor;
    }
}

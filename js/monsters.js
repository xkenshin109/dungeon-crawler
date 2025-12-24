// Monsters Module - Monster types and combat AI

export const MONSTER_TYPES = {
    // Floor 1-3 monsters
    rat: {
        id: 'rat',
        name: 'Giant Rat',
        description: 'A diseased rodent the size of a dog.',
        hp: 8,
        atk: 3,
        def: 0,
        exp: 5,
        goldMin: 2,
        goldMax: 5,
        floors: [1, 2, 3],
        behavior: 'aggressive',
        ascii: [
            '  ___  ',
            ' /o o\\ ',
            '( =Y= )',
            ' )   ( ',
            '(_)-(_)'
        ]
    },
    goblin: {
        id: 'goblin',
        name: 'Goblin',
        description: 'A small, sneaky creature with a rusty knife.',
        hp: 12,
        atk: 5,
        def: 1,
        exp: 8,
        goldMin: 5,
        goldMax: 12,
        floors: [1, 2, 3, 4],
        behavior: 'aggressive',
        ascii: [
            '  /\\  ',
            ' /oo\\ ',
            '( -- )',
            ' /||\\ ',
            '  ||  '
        ]
    },

    // Floor 2-5 monsters
    skeleton: {
        id: 'skeleton',
        name: 'Skeleton',
        description: 'Animated bones that rattle menacingly.',
        hp: 15,
        atk: 6,
        def: 2,
        exp: 12,
        goldMin: 8,
        goldMax: 18,
        floors: [2, 3, 4, 5],
        behavior: 'aggressive',
        ascii: [
            '  ___  ',
            ' /x x\\ ',
            ' \\___/ ',
            '  /|\\  ',
            '  / \\  '
        ]
    },
    spider: {
        id: 'spider',
        name: 'Giant Spider',
        description: 'A venomous arachnid with eight hairy legs.',
        hp: 14,
        atk: 7,
        def: 1,
        exp: 10,
        goldMin: 4,
        goldMax: 10,
        floors: [2, 3, 4, 5],
        behavior: 'defensive',
        ascii: [
            ' /\\_/\\ ',
            '/o   o\\',
            '\\  ^  /',
            '/|||||\\',
            '       '
        ]
    },

    // Floor 4-7 monsters
    orc: {
        id: 'orc',
        name: 'Orc Warrior',
        description: 'A brutish green-skinned warrior.',
        hp: 25,
        atk: 9,
        def: 4,
        exp: 20,
        goldMin: 15,
        goldMax: 30,
        floors: [4, 5, 6, 7],
        behavior: 'aggressive',
        ascii: [
            ' _/\"\"\\_',
            '| o  o |',
            '|  \\/  |',
            '| /||\\ |',
            '  ||||  '
        ]
    },
    wraith: {
        id: 'wraith',
        name: 'Wraith',
        description: 'A ghostly spirit that drains life force.',
        hp: 20,
        atk: 10,
        def: 2,
        exp: 25,
        goldMin: 12,
        goldMax: 25,
        floors: [4, 5, 6, 7],
        behavior: 'aggressive',
        ascii: [
            '  ___  ',
            ' (o o) ',
            '  \\ /  ',
            ' ~/|\\~ ',
            ' ~   ~ '
        ]
    },

    // Floor 6-9 monsters
    troll: {
        id: 'troll',
        name: 'Cave Troll',
        description: 'A massive regenerating brute.',
        hp: 40,
        atk: 12,
        def: 5,
        exp: 35,
        goldMin: 25,
        goldMax: 50,
        floors: [6, 7, 8, 9],
        behavior: 'aggressive',
        ascii: [
            ' __O__ ',
            '|o   o|',
            '|  V  |',
            '| /|\\ |',
            ' / | \\ '
        ]
    },
    demon: {
        id: 'demon',
        name: 'Lesser Demon',
        description: 'A creature from the abyss.',
        hp: 35,
        atk: 14,
        def: 4,
        exp: 40,
        goldMin: 30,
        goldMax: 55,
        floors: [7, 8, 9, 10],
        behavior: 'aggressive',
        ascii: [
            ' /\\ /\\ ',
            '( o o )',
            '|  ^  |',
            ' \\/|\\/  ',
            '  |||  '
        ]
    },

    // Floor 10 boss
    dragon: {
        id: 'dragon',
        name: 'Ancient Dragon',
        description: 'The guardian of the deepest floor.',
        hp: 120,
        atk: 15,
        def: 6,
        exp: 200,
        goldMin: 200,
        goldMax: 500,
        floors: [10],
        behavior: 'boss',
        isBoss: true,
        // Boss-specific properties
        shieldMax: 30,
        phases: [
            { threshold: 1.0, name: 'Awakened', atkBonus: 0, defBonus: 0 },
            { threshold: 0.75, name: 'Enraged', atkBonus: 3, defBonus: 0 },
            { threshold: 0.50, name: 'Furious', atkBonus: 6, defBonus: 2 },
            { threshold: 0.25, name: 'Desperate', atkBonus: 10, defBonus: 4 }
        ],
        specialAttacks: [
            { name: 'Fire Breath', damage: 25, message: 'The dragon breathes scorching flames!' },
            { name: 'Tail Swipe', damage: 18, message: 'The dragon sweeps its massive tail!' },
            { name: 'Wing Gust', damage: 12, effect: 'stun', message: 'Powerful winds knock you off balance!' }
        ],
        ascii: [
            '    __/\\__    ',
            '   /  oo  \\   ',
            '  < |\\VV/| >  ',
            '   \\|_/\\_|/   ',
            '    / || \\    ',
            '   /  ||  \\   '
        ],
        asciiShield: [
            '   [======]   ',
            '   |  oo  |   ',
            '   | \\VV/ |   ',
            '   |_/\\_\\_|   ',
            '   [======]   ',
            '              '
        ],
        asciiEnraged: [
            '    __/\\__    ',
            '   / *oo* \\   ',
            ' ~< |\\VV/| >~ ',
            '  ~\\|_/\\_|/~  ',
            '   ~/ || \\~   ',
            '   /  ||  \\   '
        ]
    }
};

export class Monster {
    constructor(type) {
        const template = MONSTER_TYPES[type];
        if (!template) {
            throw new Error(`Unknown monster type: ${type}`);
        }

        this.type = type;
        this.name = template.name;
        this.description = template.description;
        this.maxHp = template.hp;
        this.hp = template.hp;
        this.baseAtk = template.atk;
        this.baseDef = template.def;
        this.atk = template.atk;
        this.def = template.def;
        this.exp = template.exp;
        this.goldMin = template.goldMin;
        this.goldMax = template.goldMax;
        this.behavior = template.behavior;
        this.isBoss = template.isBoss || false;
        this.ascii = template.ascii;

        // Combat state
        this.defending = false;

        // Boss-specific state
        if (this.isBoss && template.shieldMax) {
            this.shieldMax = template.shieldMax;
            this.shield = template.shieldMax;
            this.phases = template.phases;
            this.specialAttacks = template.specialAttacks;
            this.currentPhase = 0;
            this.enrageTurns = 0;
            this.enrageBonus = 0;
            this.asciiShield = template.asciiShield;
            this.asciiEnraged = template.asciiEnraged;
            this.lastAction = null;
            this.isStunned = false;
        }
    }

    // Get current phase based on HP
    getCurrentPhase() {
        if (!this.phases) return null;

        const hpPercent = this.hp / this.maxHp;
        for (let i = this.phases.length - 1; i >= 0; i--) {
            if (hpPercent <= this.phases[i].threshold) {
                return { index: i, ...this.phases[i] };
            }
        }
        return { index: 0, ...this.phases[0] };
    }

    // Update phase and apply bonuses
    updatePhase() {
        if (!this.phases) return null;

        const phase = this.getCurrentPhase();
        if (phase.index !== this.currentPhase) {
            this.currentPhase = phase.index;
            // Apply phase bonuses
            this.atk = this.baseAtk + phase.atkBonus + this.enrageBonus;
            this.def = this.baseDef + phase.defBonus;
            return phase; // Return new phase for messaging
        }
        return null;
    }

    // Increase enrage (called each turn)
    increaseEnrage() {
        if (!this.isBoss) return;

        this.enrageTurns++;
        // Every 3 turns, enrage increases
        if (this.enrageTurns % 3 === 0) {
            this.enrageBonus += 2;
            const phase = this.getCurrentPhase();
            this.atk = this.baseAtk + (phase ? phase.atkBonus : 0) + this.enrageBonus;
            return true; // Enrage increased
        }
        return false;
    }

    // Take damage - handles shield for boss
    takeDamage(amount) {
        const defense = this.defending ? this.def * 2 : this.def;
        let actualDamage = Math.max(1, amount - defense);

        // Boss shield absorbs damage first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, actualDamage);
            this.shield -= shieldDamage;
            actualDamage -= shieldDamage;

            if (actualDamage <= 0) {
                this.defending = false;
                return { shieldDamage, hpDamage: 0, shieldBroken: this.shield <= 0 };
            }
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        this.defending = false;

        // Check for phase change
        const newPhase = this.updatePhase();

        return {
            shieldDamage: this.shieldMax ? (this.shieldMax - this.shield) : 0,
            hpDamage: actualDamage,
            shieldBroken: this.shield <= 0 && this.shieldMax > 0,
            newPhase
        };
    }

    // Regenerate shield (boss can do this)
    regenerateShield(amount) {
        if (this.shieldMax) {
            this.shield = Math.min(this.shieldMax, this.shield + amount);
            return this.shield;
        }
        return 0;
    }

    // Check if dead
    isDead() {
        return this.hp <= 0;
    }

    // Choose combat action based on behavior
    chooseAction(playerHp, playerMaxHp) {
        // Boss behavior - more complex
        if (this.behavior === 'boss') {
            return this.chooseBossAction(playerHp, playerMaxHp);
        }

        // Defensive monsters defend more when low HP
        if (this.behavior === 'defensive' && this.hp < this.maxHp * 0.3) {
            return Math.random() < 0.5 ? 'defend' : 'attack';
        }

        // Aggressive monsters mostly attack
        if (this.behavior === 'aggressive') {
            return Math.random() < 0.15 ? 'defend' : 'attack';
        }

        // Default: mostly attack
        return Math.random() < 0.2 ? 'defend' : 'attack';
    }

    // Boss-specific action selection
    chooseBossAction(playerHp, playerMaxHp) {
        const hpPercent = this.hp / this.maxHp;
        const playerHpPercent = playerHp / playerMaxHp;

        // If shield is down, chance to regenerate it
        if (this.shield <= 0 && this.shieldMax && Math.random() < 0.25) {
            return 'regenerate_shield';
        }

        // Use special attack based on phase
        const specialChance = 0.3 + (1 - hpPercent) * 0.3; // More likely when low HP
        if (Math.random() < specialChance && this.specialAttacks) {
            // Pick a special attack based on phase
            const attackIndex = Math.min(this.currentPhase, this.specialAttacks.length - 1);
            return { type: 'special', attack: this.specialAttacks[attackIndex] };
        }

        // Defend if recently took heavy damage
        if (hpPercent < 0.3 && Math.random() < 0.3) {
            return 'defend';
        }

        return 'attack';
    }

    // Get gold drop
    getGoldDrop() {
        return this.goldMin + Math.floor(Math.random() * (this.goldMax - this.goldMin + 1));
    }

    // Calculate damage output
    getDamage() {
        // 90-110% variance
        const variance = 0.9 + Math.random() * 0.2;
        return Math.floor(this.atk * variance);
    }

    // Get current ASCII art based on state
    getCurrentAscii() {
        if (!this.isBoss) return this.ascii;

        if (this.shield > 0 && this.asciiShield) {
            return this.asciiShield;
        }
        if (this.currentPhase >= 2 && this.asciiEnraged) {
            return this.asciiEnraged;
        }
        return this.ascii;
    }

    toJSON() {
        const data = {
            type: this.type,
            hp: this.hp,
            defending: this.defending
        };

        // Save boss state
        if (this.isBoss) {
            data.shield = this.shield;
            data.currentPhase = this.currentPhase;
            data.enrageTurns = this.enrageTurns;
            data.enrageBonus = this.enrageBonus;
        }

        return data;
    }

    static fromJSON(data) {
        const monster = new Monster(data.type);
        monster.hp = data.hp;
        monster.defending = data.defending || false;

        // Restore boss state
        if (monster.isBoss && data.shield !== undefined) {
            monster.shield = data.shield;
            monster.currentPhase = data.currentPhase || 0;
            monster.enrageTurns = data.enrageTurns || 0;
            monster.enrageBonus = data.enrageBonus || 0;
            monster.updatePhase();
        }

        return monster;
    }
}

// Spawn a random monster appropriate for the floor
export function spawnMonster(floorNumber) {
    const availableMonsters = Object.keys(MONSTER_TYPES).filter(type => {
        const monster = MONSTER_TYPES[type];
        return monster.floors.includes(floorNumber);
    });

    if (availableMonsters.length === 0) {
        // Fallback to goblin if no monsters defined for floor
        return new Monster('goblin');
    }

    const type = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
    return new Monster(type);
}

// Spawn the floor boss (for floor 10)
export function spawnBoss(floorNumber) {
    if (floorNumber === 10) {
        return new Monster('dragon');
    }
    // For other floors, spawn a tough monster
    return spawnMonster(floorNumber);
}

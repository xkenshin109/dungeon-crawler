// Player Module - Player entity with stats, inventory, and equipment

import { ITEMS, ITEM_TYPES } from './items.js';

export class Player {
    constructor(name) {
        this.name = name;

        // Base stats
        this.maxHp = 30;
        this.hp = this.maxHp;
        this.baseAtk = 5;
        this.baseDef = 2;

        // Equipment slots
        this.equipment = {
            weapon: null,  // Item id or null
            armor: null    // Item id or null
        };

        // Inventory (max 10 items)
        this.inventory = [];
        this.maxInventory = 10;

        // Progression
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 20;
        this.gold = 0;

        // Position in dungeon
        this.floor = 1;
        this.position = { x: 0, y: 0 };
    }

    // Computed attack (base + weapon bonus)
    get atk() {
        let total = this.baseAtk;
        if (this.equipment.weapon && ITEMS[this.equipment.weapon]) {
            total += ITEMS[this.equipment.weapon].atk || 0;
        }
        return total;
    }

    // Computed defense (base + armor bonus)
    get def() {
        let total = this.baseDef;
        if (this.equipment.armor && ITEMS[this.equipment.armor]) {
            total += ITEMS[this.equipment.armor].def || 0;
        }
        return total;
    }

    // Add item to inventory
    addItem(itemId) {
        if (this.inventory.length >= this.maxInventory) {
            return { success: false, message: 'Inventory full!' };
        }
        if (!ITEMS[itemId]) {
            return { success: false, message: 'Invalid item!' };
        }
        this.inventory.push(itemId);
        return { success: true, message: `Added ${ITEMS[itemId].name} to inventory.` };
    }

    // Remove item from inventory
    removeItem(itemId) {
        const index = this.inventory.indexOf(itemId);
        if (index === -1) {
            return { success: false, message: 'Item not in inventory!' };
        }
        this.inventory.splice(index, 1);
        return { success: true };
    }

    // Equip an item from inventory
    equip(itemId) {
        const item = ITEMS[itemId];
        if (!item) {
            return { success: false, message: 'Invalid item!' };
        }

        if (!this.inventory.includes(itemId)) {
            return { success: false, message: 'Item not in inventory!' };
        }

        let slot = null;
        if (item.type === ITEM_TYPES.WEAPON) {
            slot = 'weapon';
        } else if (item.type === ITEM_TYPES.ARMOR) {
            slot = 'armor';
        } else {
            return { success: false, message: 'Cannot equip this item!' };
        }

        // Unequip current item if any
        if (this.equipment[slot]) {
            this.inventory.push(this.equipment[slot]);
        }

        // Remove from inventory and equip
        this.removeItem(itemId);
        this.equipment[slot] = itemId;

        return { success: true, message: `Equipped ${item.name}.` };
    }

    // Unequip an item
    unequip(slot) {
        if (!this.equipment[slot]) {
            return { success: false, message: 'Nothing equipped in that slot!' };
        }

        if (this.inventory.length >= this.maxInventory) {
            return { success: false, message: 'Inventory full!' };
        }

        const itemId = this.equipment[slot];
        this.inventory.push(itemId);
        this.equipment[slot] = null;

        return { success: true, message: `Unequipped ${ITEMS[itemId].name}.` };
    }

    // Use a consumable item
    useItem(itemId) {
        const item = ITEMS[itemId];
        if (!item) {
            return { success: false, message: 'Invalid item!' };
        }

        if (!this.inventory.includes(itemId)) {
            return { success: false, message: 'Item not in inventory!' };
        }

        if (item.type !== ITEM_TYPES.CONSUMABLE) {
            return { success: false, message: 'Cannot use this item!' };
        }

        // Apply item effect
        let effectMessage = '';
        if (item.heal) {
            const oldHp = this.hp;
            this.hp = Math.min(this.maxHp, this.hp + item.heal);
            const healed = this.hp - oldHp;
            effectMessage = `Restored ${healed} HP.`;
        }

        this.removeItem(itemId);
        return { success: true, message: `Used ${item.name}. ${effectMessage}` };
    }

    // Take damage
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.def);
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    // Heal (respects max HP)
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    // Check if dead
    isDead() {
        return this.hp <= 0;
    }

    // Add experience and check for level up
    addExp(amount) {
        this.exp += amount;
        const leveledUp = [];

        while (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.level++;
            this.expToLevel = Math.floor(this.expToLevel * 1.5);

            // Stat increases on level up
            this.maxHp += 5;
            this.hp = this.maxHp; // Full heal on level up
            this.baseAtk += 2;
            this.baseDef += 1;

            leveledUp.push(this.level);
        }

        return leveledUp;
    }

    // Add gold
    addGold(amount) {
        this.gold += amount;
    }

    // Spend gold
    spendGold(amount) {
        if (this.gold < amount) {
            return { success: false, message: 'Not enough gold!' };
        }
        this.gold -= amount;
        return { success: true };
    }

    // Get equipped item details
    getEquippedWeapon() {
        return this.equipment.weapon ? ITEMS[this.equipment.weapon] : null;
    }

    getEquippedArmor() {
        return this.equipment.armor ? ITEMS[this.equipment.armor] : null;
    }

    // Get inventory item details
    getInventoryItems() {
        return this.inventory.map(id => ({ id, ...ITEMS[id] }));
    }

    // Serialize for save
    toJSON() {
        return {
            name: this.name,
            maxHp: this.maxHp,
            hp: this.hp,
            baseAtk: this.baseAtk,
            baseDef: this.baseDef,
            equipment: { ...this.equipment },
            inventory: [...this.inventory],
            level: this.level,
            exp: this.exp,
            expToLevel: this.expToLevel,
            gold: this.gold,
            floor: this.floor,
            position: { ...this.position }
        };
    }

    // Load from save
    static fromJSON(data) {
        const player = new Player(data.name);
        player.maxHp = data.maxHp;
        player.hp = data.hp;
        player.baseAtk = data.baseAtk;
        player.baseDef = data.baseDef;
        player.equipment = { ...data.equipment };
        player.inventory = [...data.inventory];
        player.level = data.level;
        player.exp = data.exp;
        player.expToLevel = data.expToLevel;
        player.gold = data.gold;
        player.floor = data.floor;
        player.position = { ...data.position };
        return player;
    }
}

// Items Module - Weapons, armor, and consumables definitions

export const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    CONSUMABLE: 'consumable'
};

export const ITEMS = {
    // ==================
    // WEAPONS (atk bonus)
    // ==================
    rusty_sword: {
        id: 'rusty_sword',
        name: 'Rusty Sword',
        description: 'A worn blade, still sharp enough to cut.',
        type: ITEM_TYPES.WEAPON,
        atk: 3,
        value: 15
    },
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy iron blade.',
        type: ITEM_TYPES.WEAPON,
        atk: 6,
        value: 40
    },
    steel_blade: {
        id: 'steel_blade',
        name: 'Steel Blade',
        description: 'A finely crafted steel sword.',
        type: ITEM_TYPES.WEAPON,
        atk: 10,
        value: 80
    },
    battle_axe: {
        id: 'battle_axe',
        name: 'Battle Axe',
        description: 'A heavy axe that hits hard.',
        type: ITEM_TYPES.WEAPON,
        atk: 12,
        value: 100
    },
    enchanted_blade: {
        id: 'enchanted_blade',
        name: 'Enchanted Blade',
        description: 'A magical sword that glows faintly.',
        type: ITEM_TYPES.WEAPON,
        atk: 15,
        value: 150
    },

    // ==================
    // ARMOR (def bonus)
    // ==================
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        description: 'Basic protection made of hardened leather.',
        type: ITEM_TYPES.ARMOR,
        def: 2,
        value: 20
    },
    chainmail: {
        id: 'chainmail',
        name: 'Chainmail',
        description: 'Interlocking metal rings provide good defense.',
        type: ITEM_TYPES.ARMOR,
        def: 5,
        value: 60
    },
    plate_armor: {
        id: 'plate_armor',
        name: 'Plate Armor',
        description: 'Heavy plate armor offers excellent protection.',
        type: ITEM_TYPES.ARMOR,
        def: 8,
        value: 120
    },
    enchanted_robe: {
        id: 'enchanted_robe',
        name: 'Enchanted Robe',
        description: 'Magical robes that deflect attacks.',
        type: ITEM_TYPES.ARMOR,
        def: 10,
        value: 160
    },

    // ==================
    // CONSUMABLES
    // ==================
    health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'Restores 15 HP.',
        type: ITEM_TYPES.CONSUMABLE,
        heal: 15,
        value: 25
    },
    large_health_potion: {
        id: 'large_health_potion',
        name: 'Large Health Potion',
        description: 'Restores 30 HP.',
        type: ITEM_TYPES.CONSUMABLE,
        heal: 30,
        value: 50
    },
    elixir: {
        id: 'elixir',
        name: 'Elixir',
        description: 'Fully restores HP.',
        type: ITEM_TYPES.CONSUMABLE,
        heal: 999, // Will be capped at maxHp
        value: 100
    }
};

// Get items by type
export function getItemsByType(type) {
    return Object.values(ITEMS).filter(item => item.type === type);
}

// Get items available for a shop at a given floor
export function getShopItems(floorNumber) {
    const allItems = Object.values(ITEMS);

    // Filter items based on floor (better items available deeper)
    return allItems.filter(item => {
        if (item.type === ITEM_TYPES.CONSUMABLE) {
            // Consumables always available
            return true;
        }

        // Equipment availability based on value vs floor
        const threshold = floorNumber * 30;
        return item.value <= threshold + 50;
    });
}

// Get a random loot item for a floor
export function getRandomLoot(floorNumber) {
    const lootPool = [];

    // Always can find health potions
    lootPool.push('health_potion');
    if (floorNumber >= 3) lootPool.push('large_health_potion');
    if (floorNumber >= 7) lootPool.push('elixir');

    // Equipment based on floor
    if (floorNumber >= 1) lootPool.push('rusty_sword', 'leather_armor');
    if (floorNumber >= 3) lootPool.push('iron_sword', 'chainmail');
    if (floorNumber >= 5) lootPool.push('steel_blade', 'plate_armor');
    if (floorNumber >= 7) lootPool.push('battle_axe');
    if (floorNumber >= 9) lootPool.push('enchanted_blade', 'enchanted_robe');

    // Random selection
    const itemId = lootPool[Math.floor(Math.random() * lootPool.length)];
    return itemId;
}

// Get random gold amount for a floor
export function getRandomGold(floorNumber) {
    const base = 5 + floorNumber * 3;
    const variance = Math.floor(base * 0.5);
    return base + Math.floor(Math.random() * variance);
}

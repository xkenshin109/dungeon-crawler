// Combat Module - Turn-based player vs monster combat system

export const COMBAT_ACTIONS = {
    ATTACK: 'attack',
    DEFEND: 'defend',
    ITEM: 'item',
    FLEE: 'flee'
};

export const COMBAT_STATES = {
    PLAYER_TURN: 'player_turn',
    MONSTER_TURN: 'monster_turn',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    FLED: 'fled'
};

export class CombatSystem {
    constructor(player, monster) {
        this.player = player;
        this.monster = monster;
        this.state = COMBAT_STATES.PLAYER_TURN;
        this.playerDefending = false;
        this.playerStunned = false;
        this.turn = 1;
        this.log = [];
        this.isBoss = monster.isBoss || false;

        // Boss intro message
        if (this.isBoss) {
            this.log.push('=== BOSS BATTLE ===');
            this.log.push(`${monster.name} awakens!`);
            if (monster.shield > 0) {
                this.log.push('A magical barrier surrounds the beast!');
            }
        }
    }

    // Get current combat state
    getState() {
        return this.state;
    }

    // Check if combat is over
    isOver() {
        return [COMBAT_STATES.VICTORY, COMBAT_STATES.DEFEAT, COMBAT_STATES.FLED].includes(this.state);
    }

    // Player attacks
    attack() {
        if (this.state !== COMBAT_STATES.PLAYER_TURN) {
            return { success: false, message: 'Not your turn!' };
        }

        // Check if player is stunned
        if (this.playerStunned) {
            this.log.push('You are stunned and cannot act!');
            this.playerStunned = false;
            return this.monsterTurn();
        }

        // Calculate damage with variance (90-110%)
        const variance = 0.9 + Math.random() * 0.2;
        const rawDamage = Math.floor(this.player.atk * variance);
        const damageResult = this.monster.takeDamage(rawDamage);

        // Handle boss damage feedback
        if (this.isBoss && typeof damageResult === 'object') {
            if (damageResult.shieldDamage > 0 && damageResult.hpDamage === 0) {
                this.log.push(`You strike the barrier for ${damageResult.shieldDamage} damage!`);
            } else if (damageResult.shieldDamage > 0) {
                this.log.push(`You break through! ${damageResult.hpDamage} damage to ${this.monster.name}!`);
            } else {
                this.log.push(`You attack ${this.monster.name} for ${damageResult.hpDamage} damage!`);
            }

            if (damageResult.shieldBroken) {
                this.log.push('The barrier shatters!');
            }

            if (damageResult.newPhase) {
                this.log.push(`${this.monster.name} enters ${damageResult.newPhase.name} phase!`);
                if (damageResult.newPhase.index >= 2) {
                    this.log.push('The dragon\'s power surges!');
                }
            }
        } else {
            // Regular monster
            const actualDamage = typeof damageResult === 'object' ? damageResult.hpDamage : damageResult;
            this.log.push(`You attack ${this.monster.name} for ${actualDamage} damage!`);
        }

        this.playerDefending = false;

        // Check for victory
        if (this.monster.isDead()) {
            return this.handleVictory();
        }

        // Monster's turn
        return this.monsterTurn();
    }

    // Player defends
    defend() {
        if (this.state !== COMBAT_STATES.PLAYER_TURN) {
            return { success: false, message: 'Not your turn!' };
        }

        if (this.playerStunned) {
            this.log.push('You are stunned and cannot act!');
            this.playerStunned = false;
            return this.monsterTurn();
        }

        this.playerDefending = true;
        this.log.push('You take a defensive stance. (DEF x2 this turn)');

        // Monster's turn
        return this.monsterTurn();
    }

    // Player uses item
    useItem(itemId) {
        if (this.state !== COMBAT_STATES.PLAYER_TURN) {
            return { success: false, message: 'Not your turn!' };
        }

        if (this.playerStunned) {
            this.log.push('You are stunned and cannot act!');
            this.playerStunned = false;
            return this.monsterTurn();
        }

        const result = this.player.useItem(itemId);
        if (!result.success) {
            return result;
        }

        this.log.push(result.message);
        this.playerDefending = false;

        // Monster's turn
        return this.monsterTurn();
    }

    // Player attempts to flee
    flee() {
        if (this.state !== COMBAT_STATES.PLAYER_TURN) {
            return { success: false, message: 'Not your turn!' };
        }

        // Can't flee from boss
        if (this.isBoss) {
            this.log.push('You cannot flee from the boss!');
            return { success: false, message: 'Cannot flee from boss!' };
        }

        if (this.playerStunned) {
            this.log.push('You are stunned and cannot flee!');
            this.playerStunned = false;
            return this.monsterTurn();
        }

        // 40% base flee chance
        const fleeChance = 0.4;
        if (Math.random() < fleeChance) {
            this.state = COMBAT_STATES.FLED;
            this.log.push('You successfully fled from battle!');
            return {
                success: true,
                fled: true,
                log: [...this.log]
            };
        }

        this.log.push('Failed to flee!');
        this.playerDefending = false;

        // Monster gets a free attack
        return this.monsterTurn();
    }

    // Monster takes its turn
    monsterTurn() {
        this.state = COMBAT_STATES.MONSTER_TURN;

        // Boss enrage mechanic
        if (this.isBoss && this.monster.increaseEnrage && this.monster.increaseEnrage()) {
            this.log.push(`${this.monster.name}'s fury intensifies! (ATK +2)`);
        }

        const action = this.monster.chooseAction(this.player.hp, this.player.maxHp);

        if (action === 'defend') {
            this.monster.defending = true;
            this.log.push(`${this.monster.name} takes a defensive stance!`);
        } else if (action === 'regenerate_shield') {
            // Boss regenerates shield
            const shieldAmount = Math.floor(this.monster.shieldMax * 0.5);
            this.monster.regenerateShield(shieldAmount);
            this.log.push(`${this.monster.name} regenerates its barrier! (+${shieldAmount} shield)`);
        } else if (typeof action === 'object' && action.type === 'special') {
            // Boss special attack
            this.executeSpecialAttack(action.attack);
        } else {
            // Regular attack
            this.executeMonsterAttack();
        }

        // Reset player defense after monster's turn
        this.playerDefending = false;

        // Check for defeat
        if (this.player.isDead()) {
            return this.handleDefeat();
        }

        // Next turn
        this.turn++;
        this.state = COMBAT_STATES.PLAYER_TURN;

        return {
            success: true,
            state: this.state,
            playerHp: this.player.hp,
            monsterHp: this.monster.hp,
            turn: this.turn,
            log: [...this.log]
        };
    }

    // Execute regular monster attack
    executeMonsterAttack() {
        const rawDamage = this.monster.getDamage();

        // Player defense calculation
        let playerDef = this.player.def;
        if (this.playerDefending) {
            playerDef *= 2;
        }

        const actualDamage = Math.max(1, rawDamage - playerDef);
        this.player.hp = Math.max(0, this.player.hp - actualDamage);

        this.log.push(`${this.monster.name} attacks you for ${actualDamage} damage!`);
    }

    // Execute boss special attack
    executeSpecialAttack(attack) {
        this.log.push(attack.message);

        // Calculate damage (special attacks ignore some defense)
        let playerDef = Math.floor(this.player.def * 0.5); // Only 50% defense applies
        if (this.playerDefending) {
            playerDef = this.player.def; // Full defense if defending
        }

        const actualDamage = Math.max(1, attack.damage - playerDef);
        this.player.hp = Math.max(0, this.player.hp - actualDamage);

        this.log.push(`You take ${actualDamage} damage!`);

        // Handle special effects
        if (attack.effect === 'stun') {
            this.playerStunned = true;
            this.log.push('You are stunned!');
        }
    }

    // Handle victory
    handleVictory() {
        this.state = COMBAT_STATES.VICTORY;

        const expGained = this.monster.exp;
        const goldGained = this.monster.getGoldDrop();

        // Award rewards
        const levelsGained = this.player.addExp(expGained);
        this.player.addGold(goldGained);

        if (this.isBoss) {
            this.log.push('=== VICTORY ===');
            this.log.push(`The ${this.monster.name} has been slain!`);
        } else {
            this.log.push(`${this.monster.name} has been defeated!`);
        }
        this.log.push(`Gained ${expGained} EXP and ${goldGained} gold!`);

        if (levelsGained.length > 0) {
            for (const level of levelsGained) {
                this.log.push(`Level up! You are now level ${level}!`);
            }
        }

        return {
            success: true,
            victory: true,
            state: this.state,
            expGained,
            goldGained,
            levelsGained,
            log: [...this.log]
        };
    }

    // Handle defeat
    handleDefeat() {
        this.state = COMBAT_STATES.DEFEAT;

        if (this.isBoss) {
            this.log.push(`The ${this.monster.name} has consumed your soul...`);
        } else {
            this.log.push('You have been defeated...');
        }

        return {
            success: true,
            defeat: true,
            state: this.state,
            log: [...this.log]
        };
    }

    // Get combat summary for display
    getSummary() {
        const summary = {
            playerHp: this.player.hp,
            playerMaxHp: this.player.maxHp,
            playerAtk: this.player.atk,
            playerDef: this.player.def,
            playerDefending: this.playerDefending,
            playerStunned: this.playerStunned,
            monsterName: this.monster.name,
            monsterHp: this.monster.hp,
            monsterMaxHp: this.monster.maxHp,
            monsterAtk: this.monster.atk,
            monsterDef: this.monster.def,
            monsterAscii: this.monster.getCurrentAscii ? this.monster.getCurrentAscii() : this.monster.ascii,
            turn: this.turn,
            state: this.state,
            isBoss: this.isBoss
        };

        // Add boss-specific info
        if (this.isBoss) {
            summary.shield = this.monster.shield || 0;
            summary.shieldMax = this.monster.shieldMax || 0;
            summary.phase = this.monster.getCurrentPhase ? this.monster.getCurrentPhase() : null;
            summary.enrageStacks = this.monster.enrageBonus ? Math.floor(this.monster.enrageBonus / 2) : 0;
        }

        return summary;
    }

    // Serialize for save
    toJSON() {
        return {
            monsterData: this.monster.toJSON(),
            state: this.state,
            playerDefending: this.playerDefending,
            playerStunned: this.playerStunned,
            turn: this.turn,
            log: this.log,
            isBoss: this.isBoss
        };
    }

    // Load from save (requires player reference)
    static fromJSON(data, player, Monster) {
        const monster = Monster.fromJSON(data.monsterData);
        const combat = new CombatSystem(player, monster);
        combat.state = data.state;
        combat.playerDefending = data.playerDefending;
        combat.playerStunned = data.playerStunned || false;
        combat.turn = data.turn;
        combat.log = data.log || [];
        combat.isBoss = data.isBoss || false;
        return combat;
    }
}

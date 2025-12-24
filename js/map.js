// Map Module - Dungeon mini-map and combat scene rendering

import { ROOM_TYPES } from './dungeon.js';
import { GAME_STATES } from './game.js';

export class DungeonRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = null;
        this.mode = 'minimap'; // 'minimap' or 'combat'
        this.animationFrame = 0;

        this.setupCanvas();
        this.startAnimation();
    }

    setupCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        if (this.game) {
            this.render();
        }
    }

    startAnimation() {
        const animate = () => {
            this.animationFrame++;
            if (this.game) {
                this.render();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    setGame(game) {
        this.game = game;
    }

    render() {
        if (!this.game) {
            this.renderSplash();
            return;
        }

        // Determine mode based on game state
        if (this.game.state === GAME_STATES.COMBAT) {
            this.mode = 'combat';
            this.renderCombat();
        } else if (this.game.state === GAME_STATES.GAME_OVER) {
            this.renderGameOver();
        } else if (this.game.state === GAME_STATES.VICTORY) {
            this.renderVictory();
        } else {
            this.mode = 'minimap';
            this.renderMinimap();
        }
    }

    // Splash screen for title
    renderSplash() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        // Grid effect
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        // Title
        ctx.font = 'bold 32px VT323, monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText('DUNGEON', w / 2, h / 2 - 20);
        ctx.fillText('CRAWLER', w / 2, h / 2 + 20);

        // Subtitle
        ctx.font = '16px VT323, monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('A Terminal Adventure', w / 2, h / 2 + 60);
    }

    // Mini-map rendering
    renderMinimap() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        if (!this.game.currentFloor) return;

        const floor = this.game.currentFloor;
        const player = this.game.player;

        // Calculate cell size
        const padding = 20;
        const mapSize = Math.min(w, h) - padding * 2;
        const cellSize = mapSize / Math.max(floor.width, floor.height);

        // Center the map
        const offsetX = (w - floor.width * cellSize) / 2;
        const offsetY = (h - floor.height * cellSize) / 2;

        // Draw grid
        for (let y = 0; y < floor.height; y++) {
            for (let x = 0; x < floor.width; x++) {
                const room = floor.getRoom(x, y);
                const px = offsetX + x * cellSize;
                const py = offsetY + y * cellSize;

                this.drawRoom(ctx, room, px, py, cellSize, player.position);
            }
        }

        // Draw player marker (pulsing)
        const playerX = offsetX + player.position.x * cellSize + cellSize / 2;
        const playerY = offsetY + player.position.y * cellSize + cellSize / 2;
        const pulseSize = 6 + Math.sin(this.animationFrame * 0.1) * 2;

        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(playerX, playerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw floor indicator
        ctx.font = '14px VT323, monospace';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText(`Floor ${player.floor}`, 10, 20);

        // Draw legend
        this.drawMapLegend(ctx, w, h);
    }

    drawRoom(ctx, room, x, y, size, playerPos) {
        const padding = 2;
        const innerSize = size - padding * 2;

        // Room background
        if (!room.explored) {
            // Unexplored - dark with faint border
            ctx.fillStyle = '#111';
            ctx.fillRect(x + padding, y + padding, innerSize, innerSize);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + padding, y + padding, innerSize, innerSize);
            return;
        }

        // Explored rooms - color based on type
        let color = '#333'; // Default empty
        let borderColor = '#444';

        if (room.x === playerPos.x && room.y === playerPos.y) {
            // Current room
            color = '#1a3a1a';
            borderColor = '#00ff00';
        } else if (room.cleared) {
            color = '#222';
            borderColor = '#333';
        } else {
            // Uncleared - color by type
            switch (room.type) {
                case ROOM_TYPES.START:
                    color = '#1a3a1a';
                    borderColor = '#2a5a2a';
                    break;
                case ROOM_TYPES.STAIRS:
                    color = '#2a2a4a';
                    borderColor = '#4a4a8a';
                    break;
                case ROOM_TYPES.MONSTER:
                    color = '#3a1a1a';
                    borderColor = '#6a2a2a';
                    break;
                case ROOM_TYPES.TREASURE:
                    color = '#3a3a1a';
                    borderColor = '#6a6a2a';
                    break;
                case ROOM_TYPES.TRAP:
                    color = '#3a2a1a';
                    borderColor = '#6a4a2a';
                    break;
                case ROOM_TYPES.SHOP:
                    color = '#1a3a3a';
                    borderColor = '#2a6a6a';
                    break;
            }
        }

        ctx.fillStyle = color;
        ctx.fillRect(x + padding, y + padding, innerSize, innerSize);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + padding, y + padding, innerSize, innerSize);

        // Draw room type symbol
        if (room.explored && !room.cleared && room.x !== playerPos.x || room.y !== playerPos.y) {
            ctx.font = `${size * 0.5}px VT323, monospace`;
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let symbol = '';
            switch (room.type) {
                case ROOM_TYPES.STAIRS: symbol = '>'; break;
                case ROOM_TYPES.MONSTER: symbol = 'M'; break;
                case ROOM_TYPES.TREASURE: symbol = 'T'; break;
                case ROOM_TYPES.TRAP: symbol = '!'; break;
                case ROOM_TYPES.SHOP: symbol = '$'; break;
                case ROOM_TYPES.START: symbol = 'S'; break;
            }

            if (symbol && !(room.x === playerPos.x && room.y === playerPos.y)) {
                ctx.fillText(symbol, x + size / 2, y + size / 2);
            }
        }
    }

    drawMapLegend(ctx, w, h) {
        const legendY = h - 60;
        ctx.font = '12px VT323, monospace';
        ctx.textAlign = 'left';

        const items = [
            { symbol: '@', color: '#00ff00', label: 'You' },
            { symbol: '>', color: '#4a4a8a', label: 'Stairs' },
            { symbol: 'M', color: '#6a2a2a', label: 'Monster' },
            { symbol: 'T', color: '#6a6a2a', label: 'Treasure' },
            { symbol: '$', color: '#2a6a6a', label: 'Shop' }
        ];

        let xPos = 10;
        for (const item of items) {
            ctx.fillStyle = item.color;
            ctx.fillText(item.symbol, xPos, legendY);
            ctx.fillStyle = '#666';
            ctx.fillText(item.label, xPos + 15, legendY);
            xPos += 70;
        }
    }

    // Combat scene rendering
    renderCombat() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        if (!this.game.combat) return;

        const combat = this.game.combat;
        const monster = combat.monster;
        const summary = combat.getSummary();

        // Dark background - more intense for boss
        ctx.fillStyle = summary.isBoss ? '#0a0000' : '#0a0505';
        ctx.fillRect(0, 0, w, h);

        // Combat grid effect - pulsing for boss
        const gridIntensity = summary.isBoss
            ? 0.03 + Math.sin(this.animationFrame * 0.05) * 0.02
            : 0.03;
        ctx.strokeStyle = `rgba(255, 0, 0, ${gridIntensity})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        // Draw boss phase/enrage indicators
        if (summary.isBoss) {
            this.drawBossIndicators(ctx, w, h, summary);
        }

        // Draw monster ASCII art
        this.drawMonsterArt(ctx, monster, w, h, summary);

        // Draw HP bars
        this.drawCombatBars(ctx, w, h);

        // Combat flash effect on hit
        if (this.animationFrame % 60 < 5 && combat.log.length > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawBossIndicators(ctx, w, h, summary) {
        // Phase indicator at top
        if (summary.phase) {
            ctx.font = 'bold 14px VT323, monospace';
            ctx.textAlign = 'center';

            const phaseColors = ['#88ff88', '#ffff00', '#ff8800', '#ff0000'];
            ctx.fillStyle = phaseColors[summary.phase.index] || '#ffffff';
            ctx.fillText(`Phase: ${summary.phase.name}`, w / 2, 25);
        }

        // Enrage stacks
        if (summary.enrageStacks > 0) {
            ctx.font = '12px VT323, monospace';
            ctx.fillStyle = '#ff4444';
            ctx.textAlign = 'right';
            const enrageText = '!' .repeat(Math.min(summary.enrageStacks, 10));
            ctx.fillText(`Enrage: ${enrageText}`, w - 10, 25);
        }

        // Turn counter
        ctx.font = '12px VT323, monospace';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText(`Turn ${summary.turn}`, 10, 25);
    }

    drawMonsterArt(ctx, monster, w, h, summary) {
        // Use dynamic ASCII art for boss based on state
        const ascii = monster.getCurrentAscii ? monster.getCurrentAscii() : (monster.ascii || [
            '  ???  ',
            ' ?   ? ',
            '  ???  '
        ]);

        // Boss color changes based on phase
        let monsterColor = '#ff8888';
        if (monster.isBoss && summary && summary.phase) {
            const phaseColors = ['#ff8888', '#ffaa44', '#ff6600', '#ff0000'];
            monsterColor = phaseColors[summary.phase.index] || '#ff8888';
        } else if (monster.isBoss) {
            monsterColor = '#ff4444';
        }

        ctx.font = '20px VT323, monospace';
        ctx.fillStyle = monsterColor;
        ctx.textAlign = 'center';

        const startY = h * 0.25;
        const lineHeight = 24;

        // Draw shield glow effect for boss with shield
        if (monster.isBoss && monster.shield > 0) {
            ctx.save();
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 15 + Math.sin(this.animationFrame * 0.1) * 5;
            for (let i = 0; i < ascii.length; i++) {
                ctx.fillText(ascii[i], w / 2, startY + i * lineHeight);
            }
            ctx.restore();
        } else {
            for (let i = 0; i < ascii.length; i++) {
                ctx.fillText(ascii[i], w / 2, startY + i * lineHeight);
            }
        }

        // Monster name with phase
        ctx.font = 'bold 18px VT323, monospace';
        ctx.fillStyle = monster.isBoss ? '#ff0000' : '#ffffff';
        let nameText = monster.name;
        if (monster.isBoss) {
            nameText += ' [BOSS]';
        }
        ctx.fillText(nameText, w / 2, startY + ascii.length * lineHeight + 20);
    }

    drawCombatBars(ctx, w, h) {
        if (!this.game.combat) return;

        const combat = this.game.combat;
        const summary = combat.getSummary();
        const barWidth = w * 0.6;
        const barHeight = 14;
        const barX = (w - barWidth) / 2;

        let currentY = h * 0.55;

        // Boss shield bar (if applicable)
        if (summary.isBoss && summary.shieldMax > 0) {
            const shieldY = currentY;
            const shieldRatio = summary.shield / summary.shieldMax;

            ctx.fillStyle = '#222';
            ctx.fillRect(barX, shieldY, barWidth, barHeight);

            // Shield bar with glow effect
            if (summary.shield > 0) {
                ctx.fillStyle = '#4488ff';
                ctx.fillRect(barX, shieldY, barWidth * shieldRatio, barHeight);

                // Shimmer effect
                const shimmerPos = (this.animationFrame % 100) / 100;
                const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
                gradient.addColorStop(Math.max(0, shimmerPos - 0.1), 'rgba(255,255,255,0)');
                gradient.addColorStop(shimmerPos, 'rgba(255,255,255,0.3)');
                gradient.addColorStop(Math.min(1, shimmerPos + 0.1), 'rgba(255,255,255,0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(barX, shieldY, barWidth * shieldRatio, barHeight);
            }

            ctx.strokeStyle = '#4488ff';
            ctx.strokeRect(barX, shieldY, barWidth, barHeight);

            ctx.font = '11px VT323, monospace';
            ctx.fillStyle = '#88bbff';
            ctx.textAlign = 'center';
            ctx.fillText(`SHIELD: ${summary.shield}/${summary.shieldMax}`, w / 2, shieldY + 11);

            currentY += barHeight + 8;
        }

        // Monster HP bar
        const monsterY = currentY;
        const monsterHpRatio = summary.monsterHp / summary.monsterMaxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, monsterY, barWidth, barHeight);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(barX, monsterY, barWidth * monsterHpRatio, barHeight);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(barX, monsterY, barWidth, barHeight);

        ctx.font = '11px VT323, monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${summary.monsterHp}/${summary.monsterMaxHp}`, w / 2, monsterY + 11);

        // Player HP bar
        const playerY = h * 0.78;
        const playerHpRatio = summary.playerHp / summary.playerMaxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, playerY, barWidth, barHeight);
        ctx.fillStyle = summary.playerStunned ? '#888800' : '#00ff00';
        ctx.fillRect(barX, playerY, barWidth * playerHpRatio, barHeight);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(barX, playerY, barWidth, barHeight);

        ctx.fillStyle = '#fff';
        ctx.fillText(`${summary.playerHp}/${summary.playerMaxHp}`, w / 2, playerY + 11);

        // Labels
        ctx.font = '13px VT323, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ff8888';
        ctx.fillText(summary.isBoss ? 'BOSS' : 'Enemy', barX, monsterY - 4);

        // Show ATK stat for boss
        if (summary.isBoss) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ff6666';
            ctx.fillText(`ATK: ${summary.monsterAtk}`, barX + barWidth, monsterY - 4);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = summary.playerStunned ? '#888800' : '#88ff88';
        ctx.fillText(summary.playerStunned ? 'STUNNED' : 'You', barX, playerY - 4);
    }

    // Game over screen
    renderGameOver() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark red background
        ctx.fillStyle = '#1a0505';
        ctx.fillRect(0, 0, w, h);

        // Scan lines effect
        for (let i = 0; i < h; i += 4) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, i, w, 2);
        }

        // Game over text
        ctx.font = 'bold 36px VT323, monospace';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';

        // Flicker effect
        if (Math.floor(this.animationFrame / 30) % 2 === 0) {
            ctx.fillText('GAME OVER', w / 2, h / 2);
        }

        // Stats
        if (this.game.player) {
            ctx.font = '16px VT323, monospace';
            ctx.fillStyle = '#888';
            ctx.fillText(`Floor ${this.game.player.floor}`, w / 2, h / 2 + 40);
            ctx.fillText(`Level ${this.game.player.level}`, w / 2, h / 2 + 60);
        }
    }

    // Victory screen
    renderVictory() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark green background
        ctx.fillStyle = '#051a05';
        ctx.fillRect(0, 0, w, h);

        // Celebration particles
        for (let i = 0; i < 20; i++) {
            const px = Math.random() * w;
            const py = (this.animationFrame * 2 + i * 50) % h;
            const size = 2 + Math.random() * 3;

            ctx.fillStyle = `hsl(${(i * 30 + this.animationFrame) % 360}, 70%, 50%)`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Victory text
        ctx.font = 'bold 36px VT323, monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', w / 2, h / 2);

        // Stats
        if (this.game.player) {
            ctx.font = '16px VT323, monospace';
            ctx.fillStyle = '#88ff88';
            ctx.fillText(`Level ${this.game.player.level}`, w / 2, h / 2 + 40);
            ctx.fillText(`Gold: ${this.game.player.gold}`, w / 2, h / 2 + 60);
        }
    }
}

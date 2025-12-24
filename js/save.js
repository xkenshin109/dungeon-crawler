// Save Module - LocalStorage persistence

const SAVE_KEY = 'dungeon_crawler_save';
const SAVE_VERSION = 1;

export function saveGame(gameState) {
    try {
        const saveData = {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            ...gameState
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return { success: true };
    } catch (error) {
        console.error('Failed to save game:', error);
        return { success: false, error: error.message };
    }
}

export function loadGame() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) {
            return { success: false, error: 'No save file found' };
        }

        const saveData = JSON.parse(data);

        // Version check for future compatibility
        if (saveData.version !== SAVE_VERSION) {
            console.warn('Save version mismatch, may have compatibility issues');
        }

        return { success: true, data: saveData };
    } catch (error) {
        console.error('Failed to load game:', error);
        return { success: false, error: error.message };
    }
}

export function hasSaveGame() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

export function getSaveInfo() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) return null;

        const saveData = JSON.parse(data);
        return {
            timestamp: saveData.timestamp,
            turn: saveData.turn,
            floor: saveData.player?.floor,
            playerName: saveData.player?.name,
            level: saveData.player?.level
        };
    } catch {
        return null;
    }
}

// UI Module - Terminal rendering, menu system, and typewriter effect

class TerminalUI {
    constructor() {
        this.output = document.getElementById('output');
        this.input = document.getElementById('input');
        this.inputContainer = document.getElementById('terminal-input');
        this.outputPanel = document.getElementById('output-panel');
        this.menuOptions = document.getElementById('menu-options');
        this.menuHeader = document.getElementById('menu-header');

        this.typewriterSpeed = 15;
        this.selectedIndex = 0;
        this.currentMenu = [];
        this.onMenuSelectCallback = null;
        this.onTextInputCallback = null;
        this.inputMode = 'menu'; // 'menu' or 'text'

        this.setupInput();
        this.setupKeyboardNav();
    }

    setupInput() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.inputMode === 'text') {
                const value = this.input.value.trim();
                if (value && this.onTextInputCallback) {
                    this.input.value = '';
                    this.onTextInputCallback(value);
                }
            }
        });
    }

    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (this.inputMode !== 'menu' || this.currentMenu.length === 0) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrev();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.confirmSelection();
                    break;
                default:
                    // Number keys 1-9
                    if (e.key >= '1' && e.key <= '9') {
                        const index = parseInt(e.key) - 1;
                        if (index < this.currentMenu.length && !this.currentMenu[index].disabled) {
                            this.selectedIndex = index;
                            this.renderMenu();
                            this.confirmSelection();
                        }
                    }
            }
        });
    }

    // Menu Navigation
    selectNext() {
        let next = this.selectedIndex + 1;
        while (next < this.currentMenu.length && this.currentMenu[next].disabled) {
            next++;
        }
        if (next < this.currentMenu.length) {
            this.selectedIndex = next;
            this.renderMenu();
        }
    }

    selectPrev() {
        let prev = this.selectedIndex - 1;
        while (prev >= 0 && this.currentMenu[prev].disabled) {
            prev--;
        }
        if (prev >= 0) {
            this.selectedIndex = prev;
            this.renderMenu();
        }
    }

    confirmSelection() {
        const selected = this.currentMenu[this.selectedIndex];
        if (selected && !selected.disabled && this.onMenuSelectCallback) {
            this.onMenuSelectCallback(selected);
        }
    }

    // Set menu options
    // options: [{ id, label, hint?, disabled?, action? }]
    setMenu(options, header = 'ACTIONS') {
        this.currentMenu = options;
        this.selectedIndex = 0;
        this.menuHeader.textContent = header;

        // Find first non-disabled option
        while (this.selectedIndex < options.length && options[this.selectedIndex].disabled) {
            this.selectedIndex++;
        }

        this.renderMenu();
        this.setInputMode('menu');
    }

    renderMenu() {
        this.menuOptions.innerHTML = '';

        this.currentMenu.forEach((option, index) => {
            if (option.separator) {
                const sep = document.createElement('div');
                sep.className = 'menu-separator';
                this.menuOptions.appendChild(sep);
                return;
            }

            if (option.category) {
                const cat = document.createElement('div');
                cat.className = 'menu-category';
                cat.textContent = option.category;
                this.menuOptions.appendChild(cat);
                return;
            }

            const el = document.createElement('div');
            el.className = 'menu-option';
            if (index === this.selectedIndex) el.classList.add('selected');
            if (option.disabled) el.classList.add('disabled');
            if (option.submenu) el.classList.add('submenu');
            if (option.back) el.classList.add('back');

            el.innerHTML = `
                <span class="option-number">${index + 1}.</span>
                <span class="option-text">${option.label}</span>
                ${option.hint ? `<span class="option-hint">${option.hint}</span>` : ''}
            `;

            // Mouse events
            el.addEventListener('mouseenter', () => {
                if (!option.disabled) {
                    this.selectedIndex = index;
                    this.renderMenu();
                }
            });

            el.addEventListener('click', () => {
                if (!option.disabled) {
                    this.selectedIndex = index;
                    this.confirmSelection();
                }
            });

            this.menuOptions.appendChild(el);
        });
    }

    clearMenu() {
        this.currentMenu = [];
        this.menuOptions.innerHTML = '';
        this.menuHeader.textContent = 'ACTIONS';
    }

    // Callbacks
    onMenuSelect(callback) {
        this.onMenuSelectCallback = callback;
    }

    onTextInput(callback) {
        this.onTextInputCallback = callback;
    }

    // Input mode switching
    setInputMode(mode) {
        this.inputMode = mode;
        if (mode === 'text') {
            this.inputContainer.classList.remove('hidden');
            this.input.disabled = false;
            this.input.focus();
        } else {
            this.inputContainer.classList.add('hidden');
            this.input.disabled = true;
        }
    }

    showTextInput(placeholder = 'Type here...') {
        this.input.placeholder = placeholder;
        this.setInputMode('text');
    }

    hideTextInput() {
        this.setInputMode('menu');
    }

    // Print text instantly
    print(text, className = '') {
        const line = document.createElement('div');
        line.className = 'line' + (className ? ' ' + className : '');
        line.textContent = text;
        this.output.appendChild(line);
        this.scrollToBottom();
    }

    // Print with HTML content
    printHTML(html, className = '') {
        const line = document.createElement('div');
        line.className = 'line' + (className ? ' ' + className : '');
        line.innerHTML = html;
        this.output.appendChild(line);
        this.scrollToBottom();
    }

    // Print text with typewriter effect
    async typewrite(text, className = '', speed = this.typewriterSpeed) {
        return new Promise((resolve) => {
            const line = document.createElement('div');
            line.className = 'line' + (className ? ' ' + className : '');
            this.output.appendChild(line);

            let i = 0;
            const type = () => {
                if (i < text.length) {
                    line.textContent += text.charAt(i);
                    i++;
                    this.scrollToBottom();
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };
            type();
        });
    }

    // Print multiple lines with typewriter effect
    async typewriteLines(lines, className = '', speed = this.typewriterSpeed) {
        for (const line of lines) {
            await this.typewrite(line, className, speed);
        }
    }

    // Print a blank line
    newline() {
        this.print('');
    }

    // Print separator
    separator(char = '=', length = 50) {
        this.print(char.repeat(length), 'separator');
    }

    // Clear the output
    clear() {
        this.output.innerHTML = '';
    }

    // Clear only the output panel (for action transitions)
    clearOutput() {
        this.output.innerHTML = '';
    }

    // Scroll to bottom of terminal
    scrollToBottom() {
        this.outputPanel.scrollTop = this.outputPanel.scrollHeight;
    }

    // Echo a command (show what the user typed)
    echoCommand(command) {
        this.print(`> ${command}`, 'command-echo');
    }

    // Create a progress bar string
    progressBar(current, max, length = 20) {
        const filled = Math.round((current / max) * length);
        const empty = length - filled;
        return `[${'#'.repeat(filled)}${'-'.repeat(empty)}]`;
    }

    // Format a stat line with label and progress bar
    statLine(label, current, max, width = 15) {
        const paddedLabel = label.padEnd(width);
        const bar = this.progressBar(current, max);
        return `${paddedLabel} ${bar} ${current}/${max}`;
    }
}

// Export singleton instance
export const ui = new TerminalUI();

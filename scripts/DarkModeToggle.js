/*!DarkModeToggle.js
 * Class file for the dark mode toggle.
 */

const DMT = Object.freeze({
    mode: Object.freeze({
        auto: "auto",
        light: "light",
        dark: "dark",
    }),
    storageKey: "themeMode",
});

class DarkModeToggle {
    "use strict";

    /**
     * Contructs a new instance of DarkModeToggle.
     * @param {Object} options Initial options.
     */
    constructor (options) {
        this._consoleLog("Setting up DarkModeToggle");
        this.options = Object.assign({
            darkModeStylesheet: null,
            darkModeStylesheetURL: "",
            mode: DMT.mode.auto,
            /** @type {HTMLElement} */
            toggle: null,
        }, options);
        let that = this;
        [DMT.mode.light, DMT.mode.auto, DMT.mode.dark].forEach(function(v, i) {
            if (localStorage.getItem(DMT.storageKey) === v) {
                that.options.mode = v;
            }
        });
        this._initToggleElement();
        this.set(this.options.mode);
    }

    _autoDetectMode() {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return DMT.mode.dark;
        } else {
            return DMT.mode.light;
        }
    }

    _initToggleElement() {
        if (this.options.toggle instanceof HTMLElement) {
            let track = document.createElement("span");
            track.classList.add("track");
            this.options.toggle.appendChild(track);

            let thumb = document.createElement("span");
            thumb.classList.add("thumb");
            track.appendChild(thumb);
            
            let that = this;
            [DMT.mode.light, DMT.mode.auto, DMT.mode.dark].forEach(function(v, i) {
                let input = document.createElement("input");
                input.type = "radio";
                input.name = "dark-mode-toggle-m";
                input.id = "dark-mode-toggle-m" + i;
                input.value = v;
                input.style.display = "none";
                if (v == that.options.mode) {
                    input.checked = "checked";
                }
                that.options.toggle.insertBefore(input, track);

                let label = document.createElement("label");
                label.htmlFor = input.id;
                label.id = "dark-mode-toggle-l" + i;
                label.title = "Set theme to " + v + ".";
                label.addEventListener("click", function (e) {
                    input.checked = true; // [label for] does some weird things.
                    that.set(v);
                }, false);
                track.appendChild(label);
            });
        }
    }

    _setTheme(mode) {
        let link = this.options.darkModeStylesheet;
        if (mode == DMT.mode.light) {
            if (link != null) {
                link.parentElement.removeChild(link);
                this.options.darkModeStylesheet = null;
            }
        } else if (mode == DMT.mode.dark) {
            if (link == null) {
                link = document.createElement("link");
                link.href = this.options.darkModeStylesheetURL;
                link.rel = "stylesheet";
                link.type = "text/css";
                this.options.darkModeStylesheet = link;
                document.head.appendChild(link);
            }
        }
        this.options.toggle.dataset.mode = mode;
    }

    /**
     * Sets the current theme.
     * @param {string} mode The name of the theme mode to be applied.
     */
    set(mode) {
        this.options.mode = mode;
        localStorage.setItem(DMT.storageKey, mode);
        if (this.options.mode == DMT.mode.auto) {
            this._setTheme(this._autoDetectMode());
        } else if (this.options.mode == DMT.mode.light) {
            this._setTheme(DMT.mode.light);
        } else if (this.options.mode == DMT.mode.dark) {
            this._setTheme(DMT.mode.dark);
        }
        this._consoleLog("Theme mode set: " + mode);
    }

    /**
     * Formats a string before outputting it.
     * @param {string} str The string to be formatted and outputted.
     */
    _consoleLog(str) {
        let prefix = ">> DarkModeToggle : ";
        console.log(prefix + str.replace(/\n/g, "\n" + " ".repeat(prefix.length) + "> "));
    }
}

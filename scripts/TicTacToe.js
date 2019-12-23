/*!TicTacToe.js
 * Core class file for the game TicTacToe.
 */

const TTT = Object.freeze({
    advisor: Object.freeze({
        xWon: "x_won",
        xWonComp: "x_won_comp",
        xTurn: "x_turn",
        xTurnSwitch: "x_turn_switch",
        xTurnComp: "x_turn_comp",
        oWon: "o_won",
        oWonComp: "o_won_comp",
        oTurn: "o_turn",
        oTurnComp: "o_turn_comp",
        draw: "draw",
    }),
    mode: Object.freeze({
        pvcEasy: "pvc_easy",
        pvcMedium: "pvc_medium",
        pvcImpossible: "pvc_impossible",
        pvp: "pvp",
    }),
    player: Object.freeze({
        empty: "empty",
        cross: "cross",
        circle: "circle",
        random: "random",
        any: "any",
        notempty: "notempty",
    }),
    playerShort: Object.freeze({
        empty: ".",
        cross: "x",
        circle: "o",
        random: "r",
        any: "*",
        notempty: "?",
    }),
    possibleWinConstellations: Object.freeze([
        Object.freeze([1,2,3]),
        Object.freeze([4,5,6]),
        Object.freeze([7,8,9]),
        Object.freeze([1,4,7]),
        Object.freeze([2,5,8]),
        Object.freeze([3,6,9]),
        Object.freeze([1,5,9]),
        Object.freeze([3,5,7]),
    ]),
    stage: Object.freeze({
        win: "win",
        block: "block",
        fork: "fork",
        forkBlock: "fork_block",
        center: "center",
        oppositeCorner: "opposite_corner",
        emptyCorner: "empty_corner",
        emptySide: "empty_side",
    }),
    /**
     * Returns a number between min (including) and max (including).
     * @param {number} min The minimum.
     * @param {number} max The maximum.
     */
    rand: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
});

class TicTacToe {
    "use strict";

    /**
     * Contructs a new instance of TicTacToe.
     */
    constructor() {
        this.game = {
            activePlayer: TTT.player.empty,
            advisorElement: document.getElementById("tictactoe-advisor"),
            compMoveTimeoutID: 0,
            ctrl: {
                modeSelect: document.getElementById("tttctrl__mode"),
                resetStatsButton:
                    document.getElementById("tttctrl__reset-stats"),
                restartButton: document.getElementById("tttctrl__restart"),
                switchButton: document.getElementById("tttctrl__switch"),
            },
            /** @type {HTMLElement[]} */
            field: [],
            /** @type {HTMLElement[]} */
            fieldElements: [],
            isCompTurn: false,
            isRunning: false,
            mode: TTT.mode.pvcMedium,
            stats: {
                cross: 0,
                crossElement: document.getElementById("ttts__x"),
                circle: 0,
                circleElement: document.getElementById("ttts__o"),
                draw: 0,
                drawElement: document.getElementById("ttts__draw")
            },
            tttElement: document.getElementById("tictactoe"),
            turnCount: 0,
        };
        this.game.tttElement.addEventListener("click", (e) => {
            this.handleClick(e);
        }, false);
        this.game.ctrl.resetStatsButton.addEventListener("click", (e) => {
            this.resetWinStats();
        }, false);
        this.game.ctrl.restartButton.addEventListener("click", (e) => {
            this.restart();
        }, false);
        this.game.ctrl.switchButton.addEventListener("click", (e) => {
            this.startGame(this.game.mode, true, true);
        }, false);
        this.game.ctrl.modeSelect.addEventListener("change", (e) => {
            this.startGame(e.target.value, true);
        }, false);
        document.body.addEventListener("keypress", (e) => {
            let dialogElement = document.getElementById("show-help-dialog");
            if (e.key == "?") {
                dialogElement.checked = !dialogElement.checked;
            } else if (!dialogElement.checked) {
                if (["1","2","3","4","5","6","7","8","9"].includes(e.key)) {
                    this.handleKeyPress(parseInt(e.key, 10));
                    e.preventDefault();
                } else if (e.key == "r") {
                    this.restart();
                } else if (e.key == "R") {
                    this.resetWinStats();
                } else if (e.key == "0" || e.key == "o") {
                    if (this.game.turnCount == 0 && 
                        this.game.mode != TTT.mode.pvp
                    ) {
                        this.startGame(this.game.mode, true, true);
                    }
                }
            }
        }, false);
    }

    /**
     * Starts a new game.
     * @param {string} mode The mode of the game.
     * @param {boolean} [ignoreRunningGame] If starting game should ignore a
     *  running game.
     * @param {boolean} [compShouldBegin] If first placement of mark should be
     *  made by the computer.
     */
    startGame(mode, ignoreRunningGame = false, compShouldBegin = false) {
        if (this.game.isRunning && !ignoreRunningGame) {
            console.error("Game is already running!!");
            return;
        }
        let tmpFields = this.game.tttElement.getElementsByTagName("button"), i;
        for (i = 0; i < tmpFields.length; i++) {
            let fieldNum = parseInt(tmpFields[i].id.split("tttf__")[1], 10);
            this.game.field[fieldNum - 1] = TTT.player.empty;
            this.game.fieldElements[fieldNum - 1] = tmpFields[i];
            tmpFields[i].dataset.state = TTT.player.empty;
            tmpFields[i].className = "";
        }
        this.game.mode = mode;
        this.game.isCompTurn = this.game.mode.startsWith("pvc")
            && compShouldBegin;
        clearTimeout(this.game.compMoveTimeoutID);
        this.game.turnCount = 0;
        this.game.activePlayer = TTT.player.cross;
        this.game.tttElement.dataset.activePlayer = this.game.activePlayer;
        this.game.advisorElement.dataset.advisor = 
            this.game.mode.startsWith("pvc") ?
            TTT.advisor.xTurnSwitch : TTT.advisor.xTurn;
        this.game.isRunning = true;
        this._consoleLog("Starting a new game.\nmode: " + this.game.mode);

        if (this.game.isCompTurn) {
            let tmp = this.computeNextMark();
            this.placeMark(tmp);
        }
    }

    /**
     * Restarts the game.
     */
    restart() {
        if (this.game.isRunning || this.game.turnCount >= 9) {
            this._consoleLog("Restarting the game.");
            this.startGame(this.game.mode, true);
        }
    }

    /**
     * Handles a click on the main game field.
     * @param {Event} e The event data of the click on the main game field.
     */
    handleClick(e) {
        if (!this.game.isRunning || this.game.isCompTurn) {
            return;
        }
        if (e.target.id.startsWith("tttf__")) {
            let fieldState = e.target.dataset.state;
            let fieldNum = parseInt(e.target.id.split("tttf__")[1], 10);
            if (fieldState == TTT.player.empty) {
                this.placeMark(fieldNum);
            }
        }
    }

    /**
     * Handles a keypress on the main game field.
     * @param {number} fieldNum The field number to place the next mark.
     */
    handleKeyPress(fieldNum) {
        if (!this.game.isRunning || this.game.isCompTurn) {
            return;
        }
        this.placeMark(fieldNum);
    }

    /**
     * Places a mark on the given field number (as the current active player).
     * 
     * @param {number} fieldNum The field number to place the mark on.
     * 
     * @returns {number} The field number of the placed mark or a negative
     * error code:
     * * -1 -> The game is currently not running or it is a computer turn.
     * * -2 -> The given `fieldNum` is out of range.
     * * -3 -> The given `fieldNum` points to a non-empty field.
     */
    placeMark(fieldNum) {
        if (!this.game.isRunning) {
            console.error(
                "Error at TicTacToe.placeMark():\n" +
                "The game is currently not running."
            );
            return -1;
        } else if (fieldNum < 1 || fieldNum > 9) {
            console.error(
                "Error at TicTacToe.placeMark():\n" +
                "The given parameter fieldNum is out of range."
            );
            return -2;
        } else if (this.game.field[fieldNum - 1] != TTT.player.empty) {
            console.error(
                "Error at TicTacToe.placeMark():\n" +
                "The given fieldNum points to a non-empty field."
            );
            return -3;
        }
        this._consoleLog(
            this.game.activePlayer + " placed on field #" + fieldNum
        );
        this.game.fieldElements[fieldNum - 1].dataset.state =
            this.game.activePlayer;
        this.game.field[fieldNum - 1] = this.game.activePlayer;
        ++this.game.turnCount;
        if (this.checkIfWonOrEnd()) {
            this.game.isRunning = false;
            this.game.tttElement.dataset.activePlayer = "empty";
            this.game.turnCount = 9;
            return fieldNum;
        }
        this.game.activePlayer = this.getOtherPlayer(this.game.activePlayer);
        if (this.game.mode.startsWith("pvc") && !this.game.isCompTurn) {
            this.game.isCompTurn = true;
            this.game.tttElement.dataset.activePlayer = TTT.player.empty;
            this.game.advisorElement.dataset.advisor =
                this.game.activePlayer == TTT.player.cross
                ? TTT.advisor.xTurnComp : TTT.advisor.oTurnComp;
            this.game.compMoveTimeoutID = setTimeout(() => {
                let tmp = this.computeNextMark();
                if (tmp > 0) {
                    this.placeMark(tmp);
                } else {
                    console.error(
                        "The computer was unable to compute the next move. " +
                        "The game ends at this point."
                    );
                }
            }, 750);
        } else {
            this.game.isCompTurn = false;
            this.game.tttElement.dataset.activePlayer = this.game.activePlayer;
            this.game.advisorElement.dataset.advisor =
                this.game.activePlayer == TTT.player.cross
                ? TTT.advisor.xTurn : TTT.advisor.oTurn;
        }
        return fieldNum
    }

    /**
     * Logic for deciding where to put the next mark.
     * 
     * This computation is only allowed for computer turns, else this
     * function returns an error code.
     * 
     * If mode is set to `pvc_impossible`, the algorithm tries to compute
     * the position of the next mark based on the ruleset created of Newell
     * and Simon's in their tic-tac-toe program from 1972.
     * https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
     * 
     * @returns {number} The field number the computer wants to place the
     * mark on a negative error code:
     * * -1 -> No move could be computed
     * * -2 -> Active turn is human player, not computer.
     */
    computeNextMark() {
        if (!this.game.isCompTurn) {
            return -2;
        }
        let fieldNum = -1;
        if (this.game.mode == TTT.mode.pvcEasy) {
            // just select a random empty field.
            fieldNum = this.searchForEmptyField();
        } else if (this.game.mode == TTT.mode.pvcMedium) {
            // search for friendly 2 out of 3 rows.
            let tmp = this.searchFor(TTT.stage.win, this.game.activePlayer);
            if (tmp > 0) {
                fieldNum = tmp;
            } else {
                // search for enemy 2 out of 3 rows.
                tmp = this.searchFor(TTT.stage.block, this.game.activePlayer);
                if (tmp > 0) {
                    fieldNum = tmp;
                } else {
                    // if no row, search for random empty field.
                    fieldNum = this.searchForEmptyField();
                }
            }
        } else if (this.game.mode == TTT.mode.pvcImpossible) {
            // Loop through all stages
            for (let stage of Object.keys(TTT.stage)) {
                stage = TTT.stage[stage];
                fieldNum = this.searchFor(stage, this.game.activePlayer);
                if (fieldNum > 0) {
                    return fieldNum;
                }
            }
            return -1;
        }
        return fieldNum;
    }

    /**
     * Checks if a party has won or if the game ends with a draw.
     * @returns {boolean} True if the game has ended, else false.
     */
    checkIfWonOrEnd() {
        let f = this.game.field, i, j, c;
        for (i = 0; i < TTT.possibleWinConstellations.length; i++) {
            c = TTT.possibleWinConstellations[i];
            if (f[c[0] - 1] != TTT.player.empty &&
                f[c[0] - 1] == f[c[1] - 1] &&
                f[c[1] - 1] == f[c[2] - 1]
            ) {
                // win for either party
                //alert(f[c[0] - 1] + " has won!");
                if (this.game.isCompTurn) {
                    this._consoleLog(
                        "Game has ended. " + f[c[0] - 1] + " (comp) has won!"
                    );
                    this.game.advisorElement.dataset.advisor =
                        f[c[0] - 1] == TTT.player.cross
                        ? TTT.advisor.xWonComp : TTT.advisor.oWonComp;
                } else {
                    this._consoleLog(
                        "Game has ended. " + f[c[0] - 1] + " has won!"
                    );
                    this.game.advisorElement.dataset.advisor =
                        f[c[0] - 1] == TTT.player.cross
                        ? TTT.advisor.xWon : TTT.advisor.oWon;
                }
                for (j = 0; j < c.length; j++) {
                    this.game.fieldElements[c[j] - 1].classList.add("won");
                }
                // write stats
                if (f[c[0] - 1] == TTT.player.cross) {
                    this.game.stats.crossElement.dataset.value =
                        ++this.game.stats.cross;
                } else if (f[c[0] - 1] == TTT.player.circle) {
                    this.game.stats.circleElement.dataset.value =
                        ++this.game.stats.circle;
                }
                return true;
            }
        }
        if (this.game.turnCount >= 9) {
            // draw
            //alert("draw!");
            this._consoleLog("Game has ended. It is a draw!");
            this.game.advisorElement.dataset.advisor = TTT.advisor.draw;
            this.game.stats.drawElement.dataset.value = ++this.game.stats.draw;
            return true;
        }
        return false;
    }

    /**
     * Matches a given pattern with the game and returns a boolean.
     * @param {string[]} pattern Array consisting of three strings
     *  describing the game filed to match.
     *  -> [row3(7,8,9), row2(4,5,6), row1(1,2,3)]
     * @param {string[]} [field] Match on the given field (uses the game's
     *  field if not provided).
     * @returns {boolean} True if passed pattern matches actual field.
     */
    matchField(pattern, field = this.game.field) {
        if (pattern.length != 3) {
            return false;
        }
        let i, j, cell, cellPattern, row;
        for (i = 0; i <= 2; i++) {
            row = pattern[i];
            if (row.length != 3) {
                return false;
            }
            for (j = 0; j <= 2; j++) {
                cell = field[(2 - i) * pattern.length + j];
                cellPattern = row[j];
                if (cellPattern != TTT.playerShort.any) {
                    if (cellPattern == TTT.playerShort.notempty) {
                        if (cell == TTT.player.empty) {
                            return false;
                        }
                    } else if (cellPattern != TTT.playerShort[cell]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Searches for a given `stage` (based on the Newell and Simon model).
     * 
     * @param {string} stage The name of the stage to be searched.
     * @param {string} player Search from given player's view.
     * @param {string[]} [field] Search on the given field (uses the game's
     * field if not provided).
     * 
     * @returns {number} The field number or -1 if no equitable field number
     * has been found.
     */
    searchFor(stage, player, field = this.game.field) {
        let i, c;
        switch (stage) {
            case TTT.stage.win:
                for (i = 0; i < TTT.possibleWinConstellations.length; i++) {
                    c = TTT.possibleWinConstellations[i];
                    if (field[c[0] - 1] == player &&
                        field[c[0] - 1] == field[c[1] - 1] &&
                        field[c[2] - 1] == TTT.player.empty
                    ) {
                        return c[2];
                    } else if (
                        field[c[0] - 1] == player &&
                        field[c[0] - 1] == field[c[2] - 1] &&
                        field[c[1] - 1] == TTT.player.empty
                    ) {
                        return c[1];
                    } else if (
                        field[c[1] - 1] == player &&
                        field[c[1] - 1] == field[c[2] - 1] &&
                        field[c[0] - 1] == TTT.player.empty
                    ) {
                        return c[0];
                    }
                }
                break;
            
            case TTT.stage.block:
                player = this.getOtherPlayer(player);
                return this.searchFor(TTT.stage.win, player, field);
            
            case TTT.stage.fork:
                let fieldTmp, tmp;
                for (i = 1; i <= field.length; i++) {
                    if (field[i - 1] == TTT.player.empty) {
                        fieldTmp = JSON.parse(JSON.stringify(field));
                        fieldTmp[i - 1] = player;
                        tmp = this.searchFor(TTT.stage.win, player, fieldTmp);
                        if (tmp > 0) {
                            fieldTmp[tmp - 1] = this.getOtherPlayer(player);
                            tmp = this.searchFor(
                                TTT.stage.win, player, fieldTmp
                            );
                            if (tmp > 0) {
                                return i;
                            }
                        }
                    }
                }
                break;
            
            case TTT.stage.forkBlock:
                if (this.matchField(["x..", ".o.", "..x"], field) ||
                    this.matchField(["..x", ".o.", "x.."], field)
                ) {
                    return [2, 4, 6, 8][TTT.rand(0, 3)];
                } else if (
                    this.matchField(["x..", ".x.", "..o"], field) ||
                    this.matchField(["o..", ".x.", "..x"], field) ||
                    this.matchField(["..x", ".x.", "o.."], field) ||
                    this.matchField(["..o", ".x.", "x.."], field)
                ) {
                    return this.searchFor(TTT.stage.emptyCorner, player, field);
                } else {
                    player = this.getOtherPlayer(player);
                    return this.searchFor(TTT.stage.fork, player, field);
                }
                // break;
            
            case TTT.stage.center:
                if (this.matchField(["***", "*.*", "***"], field)) {
                    return 5;
                }
                break;
            
            case TTT.stage.oppositeCorner:
                if (this.matchField(["...", ".x.", "o.."], field)) {
                    return 9;
                } else if (this.matchField(["...", ".x.", "..o"], field)) {
                    return 7;
                } else if (this.matchField(["..o", ".x.", "..."], field)) {
                    return 1;
                } else if (this.matchField(["o..", ".x.", "..."], field)) {
                    return 3;
                }
                break;
            
            case TTT.stage.emptyCorner:
                let emptyCorners = [];
                [1, 3, 7, 9].forEach((v, i) => {
                    if (field[v - 1] == TTT.player.empty) {
                        emptyCorners.push(v);
                    }
                });
                if (emptyCorners.length > 0) {
                    return emptyCorners[TTT.rand(0, emptyCorners.length - 1)];
                }
                break;
            
            case TTT.stage.emptySide:
                let emptySides = [];
                [2, 4, 6, 8].forEach((v, i) => {
                    if (field[v - 1] == TTT.player.empty) {
                        emptySides.push(v);
                    }
                });
                if (emptySides.length > 0) {
                    return emptySides[TTT.rand(0, emptySides.length - 1)];
                }
                break;
        }
        return -1;
    }

    /**
     * Searches for a random empty field.
     * @returns {number} The field number or -1 if no empty field exists.
     */
    searchForEmptyField() {
        let tmp;
        // check if field has at least 1 empty field to prevent endless loop.
        if (!this.game.field.includes(TTT.player.empty)) {
            return -1;
        }
        // search for random field.
        while (1) {
            tmp = TTT.rand(1, 9);
            if (this.game.field[tmp - 1] == TTT.player.empty) {
                return tmp;
            }
        }
    }

    /**
     * Gets the other player from the given one.
     * @param {string} player The given player.
     * @returns {string}
     */
    getOtherPlayer(player) {
        return player == TTT.player.cross ?
            TTT.player.circle : TTT.player.cross;
    }

    /**
     * Resets the winning stats internal counter and updates the UI.
     */
    resetWinStats() {
        this.game.stats.cross = 0;
        this.game.stats.circle = 0;
        this.game.stats.draw = 0;
        this.game.stats.crossElement.dataset.value = 0;
        this.game.stats.circleElement.dataset.value = 0;
        this.game.stats.drawElement.dataset.value = 0;
        this._consoleLog("Resetting winning statistics.");
    }

    /**
     * Formats a string before outputting it.
     * @param {string} str The string to be formatted and outputted.
     */
    _consoleLog(str) {
        let prefix = ">> TicTacToe : ";
        console.log(
            prefix + str.replace(/\n/g, "\n" +
            " ".repeat(prefix.length) + "> ")
        );
    }
}

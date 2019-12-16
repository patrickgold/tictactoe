/*!TicTacToe.js
 * Core class file for the game TicTacToe.
 */

const TTT = Object.freeze({
    advisor: Object.freeze({
        xWon: "xWon",
        xWonAI: "xWonAI",
        xTurn: "xTurn",
        xTurnSwitch: "xTurnSwitch",
        xTurnAI: "xTurnAI",
        oWon: "oWon",
        oWonAI: "oWonAI",
        oTurn: "oTurn",
        oTurnAI: "oTurnAI",
        draw: "draw",
    }),
    mode: Object.freeze({
        playerVsAIEasy: "playerVsAIEasy",
        playerVsAIMedium: "playerVsAIMedium",
        playerVsAIImpossible: "playerVsAIImpossible",
        playerVsPlayer: "playerVsPlayer",
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
    possibleWinConstellations: [
        [1,2,3],
        [4,5,6],
        [7,8,9],
        [1,4,7],
        [2,5,8],
        [3,6,9],
        [1,5,9],
        [3,5,7],
    ],
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
     * @param {HTMLElement} tttElement The main game field html element.
     * @param {HTMLElement} advisorElement The advisor html element.
     */
    constructor(tttElement, advisorElement) {
        this.game = {
            __aiImpossible: {
                isLShapeCircle: false,
                isTriangleCircle: false,
                isStepShapeCross: false,
            },
            activePlayer: TTT.player.empty,
            advisorElement: advisorElement,
            aiMoveTimeoutID: 0,
            /** @type {HTMLElement[]} */
            field: [],
            /** @type {HTMLElement[]} */
            fieldElements: [],
            isAITurn: false,
            isRunning: false,
            mode: TTT.mode.playerVsAIMedium,
            stats: {
                cross: 0,
                crossElement: document.getElementById("ttts__x"),
                circle: 0,
                circleElement: document.getElementById("ttts__o"),
                draw: 0,
                drawElement: document.getElementById("ttts__draw")
            },
            tttElement: tttElement,
            turnCount: 0,
        };
        let that = this;
        tttElement.addEventListener("click", function (e) {
            that.handleClick(e);
        }, false);
    }

    /**
     * Starts a new game.
     * @param {string} mode The mode of the game.
     * @param {boolean} [ignoreRunningGame] If starting game should ignore a running game.
     * @param {boolean} [aiShouldBegin] If first placement of mark should be AI.
     */
    startGame(mode, ignoreRunningGame = false, aiShouldBegin = false) {
        if (this.game.isRunning && !ignoreRunningGame) {
            alert("Game is already running!!");
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
        this.game.isAITurn = this.game.mode.startsWith("playerVsAI") ? aiShouldBegin : false;
        this.game.__aiImpossible.isLShapeCircle = false;
        this.game.__aiImpossible.isTriangleCircle = false;
        this.game.__aiImpossible.isStepShapeCross = false;
        clearTimeout(this.game.aiMoveTimeoutID);
        this.game.turnCount = 0;
        this.game.activePlayer = TTT.player.cross;
        this.game.tttElement.dataset.activePlayer = this.game.activePlayer;
        this.game.advisorElement.dataset.advisor = 
            this.game.mode.startsWith("playerVsAI") ?
            TTT.advisor.xTurnSwitch : TTT.advisor.xTurn;
        this.game.isRunning = true;
        this._consoleLog("Starting a new game.\nmode: " + this.game.mode);

        if (!aiShouldBegin) {
            return;
        }
        // start random ai move.
        let tmp = this.aiCalcNextMove();
        this.placeMark(tmp);
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
        if (!this.game.isRunning || this.game.isAITurn) {
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
     * Places a mark on the given field number (as the current active player).
     * @param {number} fieldNum The field number to place the mark on.
     */
    placeMark(fieldNum) {
        if (fieldNum < 1 || fieldNum > 9) {
            return;
        }
        this._consoleLog(this.game.activePlayer + " placed on field #" + fieldNum);
        this.game.fieldElements[fieldNum - 1].dataset.state = this.game.activePlayer;
        this.game.field[fieldNum - 1] = this.game.activePlayer;
        ++this.game.turnCount;
        if (this.checkIfWonOrEnd()) {
            this.game.isRunning = false;
            this.game.tttElement.dataset.activePlayer = "empty";
            this.game.turnCount = 9;
            return;
        }
        this.game.activePlayer = this.getOtherPlayer(this.game.activePlayer);
        if (this.game.mode.startsWith("playerVsAI") && !this.game.isAITurn) {
            this.game.isAITurn = true;
            this.game.tttElement.dataset.activePlayer = TTT.player.empty;
            this.game.advisorElement.dataset.advisor =
                this.game.activePlayer == TTT.player.cross
                ? TTT.advisor.xTurnAI : TTT.advisor.oTurnAI;
            let that = this;
            this.game.aiMoveTimeoutID = setTimeout(function () {
                let tmp = that.aiCalcNextMove();
                that.placeMark(tmp);
            }, 750);
        } else {
            this.game.isAITurn = false;
            this.game.tttElement.dataset.activePlayer = this.game.activePlayer;
            this.game.advisorElement.dataset.advisor =
                this.game.activePlayer == TTT.player.cross
                ? TTT.advisor.xTurn : TTT.advisor.oTurn;
        }
    }

    /**
     * AI logic for deciding where to put next mark.
     * @returns {number} The field number the AI wants to place the mark on.
     */
    aiCalcNextMove() {
        if (!this.game.isAITurn) {
            return -1;
        }
        let fieldNum = -1;
        if (this.game.mode == TTT.mode.playerVsAIEasy) {
            // just select a random empty field.
            fieldNum = this.searchForEmptyField();
        } else if (this.game.mode == TTT.mode.playerVsAIMedium) {
            // search for friendly 2 out of 3 rows.
            let tmp = this.searchForWinConstellation(this.game.activePlayer);
            if (tmp > 0) {
                fieldNum = tmp;
            } else {
                // search for enemy 2 out of 3 rows.
                tmp = this.searchForWinConstellation(this.getOtherPlayer(this.game.activePlayer));
                if (tmp > 0) {
                    fieldNum = tmp;
                } else {
                    // if no row, search for random empty field.
                    fieldNum = this.searchForEmptyField();
                }
            }
        } else if (this.game.mode == TTT.mode.playerVsAIImpossible) {
            let tmp = -1, g = this.game;
            // search for friendly 2 out of 3 rows.
            tmp = this.searchForWinConstellation(g.activePlayer);
            if (tmp > 0) {
                fieldNum = tmp;
            } else {
                // search for enemy 2 out of 3 rows.
                tmp = this.searchForWinConstellation(this.getOtherPlayer(g.activePlayer));
                if (tmp > 0) {
                    fieldNum = tmp;
                } else {
                    // ---
                    // AI is circle
                    // ---
                    if (g.activePlayer == TTT.player.circle && g.turnCount == 1) {
                        if (this.matchField(["...", ".x.", "..."])) {
                            tmp = [1, 3, 7, 9][TTT.rand(0, 3)];
                        } else if (
                            this.matchField(["x..", "...", "..."]) ||
                            this.matchField(["..x", "...", "..."]) ||
                            this.matchField(["...", "...", "x.."]) ||
                            this.matchField(["...", "...", "..x"])
                        ) {
                            tmp = 5;
                        } else if (this.matchField(["...", "...", ".x."])) {
                            tmp = 8;
                        } else if (this.matchField([".x.", "...", "..."])) {
                            tmp = 2;
                        } else if (this.matchField(["...", "x..", "..."])) {
                            tmp = 6;
                        } else if (this.matchField(["...", "..x", "..."])) {
                            tmp = 4;
                        }
                    } else if (g.activePlayer == TTT.player.circle && g.turnCount == 3) {
                        // ..x
                        // .o.
                        // x..
                        // path ends
                        if (
                            this.matchField(["x..", ".o.", "..x"]) ||
                            this.matchField(["..x", ".o.", "x.."])
                        ) {
                            tmp = 2 * TTT.rand(1, 4);
                        }

                        // ..x
                        // .x.
                        // o..
                        // path ends
                        else if (this.matchField(["..x", ".x.", "o.."])) {
                            tmp = [3, 7][TTT.rand(0, 1)];
                        } else if (this.matchField(["x..", ".x.", "..o"])) {
                            tmp = [1, 9][TTT.rand(0, 1)];
                        } else if (this.matchField(["..o", ".x.", "x.."])) {
                            tmp = [3, 7][TTT.rand(0, 1)];
                        } else if (this.matchField(["o..", ".x.", "..x"])) {
                            tmp = [1, 9][TTT.rand(0, 1)];
                        }

                        // .x.
                        // .x.
                        // .o.
                        // path ends
                        else if (this.matchField([".x.", ".x.", ".o."])) {
                            tmp = [7, 9][TTT.rand(0, 1)];
                        } else if (this.matchField(["...", "xxo", "..."])) {
                            tmp = [1, 7][TTT.rand(0, 1)];
                        } else if (this.matchField([".o.", ".x.", ".o."])) {
                            tmp = [1, 3][TTT.rand(0, 1)];
                        } else if (this.matchField(["...", "oxx", "..."])) {
                            tmp = [3, 9][TTT.rand(0, 1)];
                        }

                        // .x.
                        // .o.
                        // x..
                        // path ends
                        else if (this.matchField([".x.", ".o.", "x.."])) {
                            tmp = 9;
                        } else if (this.matchField([".x.", ".o.", "..x"])) {
                            tmp = 7;
                        } else if (this.matchField(["...", "xo.", "..x"])) {
                            tmp = 7;
                        } else if (this.matchField(["..x", "xo.", "..."])) {
                            tmp = 1;
                        } else if (this.matchField(["..x", ".o.", ".x."])) {
                            tmp = 1;
                        } else if (this.matchField(["x..", ".o.", ".x."])) {
                            tmp = 3;
                        } else if (this.matchField(["x..", ".ox", "..."])) {
                            tmp = 3;
                        } else if (this.matchField(["...", ".ox", "x.."])) {
                            tmp = 9;
                        }

                        // xo.
                        // ...
                        // .x.
                        // path ends
                        else if (this.matchField(["xo.", "...", ".x."])) {
                            tmp = 3;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField([".ox", "...", ".x."])) {
                            tmp = 1;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField(["...", "o.x", "x.."])) {
                            tmp = 9;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField(["x..", "o.x", "..."])) {
                            tmp = 3;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField([".x.", "...", ".ox"])) {
                            tmp = 7;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField([".x.", "...", "xo."])) {
                            tmp = 9;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField(["..x", "x.o", "..."])) {
                            tmp = 1;
                            g.__aiImpossible.isStepShapeCross = true;
                        } else if (this.matchField(["...", "x.o", "..x"])) {
                            tmp = 7;
                            g.__aiImpossible.isStepShapeCross = true;
                        }

                        // .x.
                        // x.o
                        // ...
                        // path ends
                        else if (this.matchField([".x.", "x.o", "..."])) {
                            tmp = 7;
                        } else if (this.matchField(["...", "x.o", ".x."])) {
                            tmp = 1;
                        } else if (this.matchField([".o.", "x..", ".x."])) {
                            tmp = 1;
                        } else if (this.matchField([".o.", "..x", ".x."])) {
                            tmp = 3;
                        } else if (this.matchField(["...", "o.x", ".x."])) {
                            tmp = 3;
                        } else if (this.matchField([".x.", "o.x", "..."])) {
                            tmp = 9;
                        } else if (this.matchField([".x.", "..x", ".o."])) {
                            tmp = 9;
                        } else if (this.matchField([".x.", "x..", ".o."])) {
                            tmp = 7;
                        }
                    } else if (g.activePlayer == TTT.player.circle && g.turnCount == 5) {
                        // xox
                        // ...
                        // .xo
                        // ---or
                        // xo.
                        // ..x
                        // .xo
                        if (g.__aiImpossible.isStepShapeCross && this.matchField(["***", "*.*", "***"])) {
                            tmp = 5;
                        }
                    }
                    
                    // ---
                    // AI is cross
                    // ---
                    else if (g.activePlayer == TTT.player.cross && g.turnCount == 2) {
                        // ..o
                        // ...
                        // x..
                        if (this.matchField(["**?", "***", "?**"])) {
                            tmp = [3, 7][TTT.rand(0, 1)];
                            g.__aiImpossible.isTriangleCircle = true;
                        } else if (this.matchField(["?**", "***", "**?"])) {
                            tmp = [1, 9][TTT.rand(0, 1)];
                            g.__aiImpossible.isTriangleCircle = true;
                        }
                        
                        // ...
                        // .o.
                        // x..
                        else if (this.matchField(["***", "*?*", "?**"])) {
                            tmp = [6, 8][TTT.rand(0, 1)];
                        } else if (this.matchField(["***", "*?*", "**?"])) {
                            tmp = [4, 8][TTT.rand(0, 1)];
                        } else if (this.matchField(["?**", "*?*", "***"])) {
                            tmp = [2, 6][TTT.rand(0, 1)];
                        } else if (this.matchField(["**?", "*?*", "***"])) {
                            tmp = [2, 4][TTT.rand(0, 1)];
                        }
                        
                        // ...
                        // o..
                        // x..
                        else if (this.matchField(["***", "***", "??*"])) {
                            tmp = 4;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["***", "***", "*??"])) {
                            tmp = 6;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["***", "**?", "**?"])) {
                            tmp = 2;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["**?", "**?", "***"])) {
                            tmp = 8;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["*??", "***", "***"])) {
                            tmp = 6;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["??*", "***", "***"])) {
                            tmp = 4;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["?**", "?**", "***"])) {
                            tmp = 8;
                            g.__aiImpossible.isLShapeCircle = true;
                        } else if (this.matchField(["***", "?**", "?**"])) {
                            tmp = 2;
                            g.__aiImpossible.isLShapeCircle = true;
                        }
                        
                        // .o.
                        // ...
                        // x..
                        else if (this.matchField(["*?*", "***", "?**"])) {
                            tmp = 3;
                        } else if (this.matchField(["*?*", "***", "**?"])) {
                            tmp = 1;
                        } else if (this.matchField(["***", "?**", "**?"])) {
                            tmp = 9;
                        } else if (this.matchField(["**?", "?**", "***"])) {
                            tmp = 3;
                        } else if (this.matchField(["**?", "***", "*?*"])) {
                            tmp = 7;
                        } else if (this.matchField(["?**", "***", "*?*"])) {
                            tmp = 9;
                        } else if (this.matchField(["?**", "**?", "***"])) {
                            tmp = 1;
                        } else if (this.matchField(["***", "**?", "?**"])) {
                            tmp = 7;
                        }
                        
                        // o..
                        // ...
                        // x..
                        else if (this.matchField(["x**", "***", "o**"])) {
                            tmp = 3;
                        } else if (this.matchField(["***", "***", "o*x"])) {
                            tmp = 7;
                        } else if (this.matchField(["***", "***", "x*o"])) {
                            tmp = 9;
                        } else if (this.matchField(["**x", "***", "**o"])) {
                            tmp = 1;
                        } else if (this.matchField(["**o", "***", "**x"])) {
                            tmp = 7;
                        } else if (this.matchField(["x*o", "***", "***"])) {
                            tmp = 3;
                        } else if (this.matchField(["o*x", "***", "***"])) {
                            tmp = 1;
                        } else if (this.matchField(["o**", "***", "x**"])) {
                            tmp = 9;
                        } 
                    } else if (g.activePlayer == TTT.player.cross && g.turnCount == 4) {
                        if (this.matchField(["***", "*.*", "***"]) && g.__aiImpossible.isLShapeCircle) {
                            tmp = 5;
                        } else if (g.__aiImpossible.isTriangleCircle) {
                            if (this.matchField(["***", "***", ".**"])) {
                                tmp = 1;
                            } else if (this.matchField(["***", "***", "**."])) {
                                tmp = 3;
                            } else if (this.matchField([".**", "***", "***"])) {
                                tmp = 7;
                            } else if (this.matchField(["**.", "***", "***"])) {
                                tmp = 9;
                            }
                        }
                    }

                    if (tmp > 0) {
                        fieldNum = tmp;
                    } else if (g.turnCount == 0) {
                        fieldNum = [1, 3, 7, 9][TTT.rand(0, 3)];
                    } else {
                        // if no row, search for random empty field.
                        fieldNum = this.searchForEmptyField();
                    }
                }
            }
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
            if (f[c[0] - 1] != TTT.player.empty && f[c[0] - 1] == f[c[1] - 1] && f[c[1] - 1] == f[c[2] - 1]) {
                // win for either party
                //alert(f[c[0] - 1] + " has won!");
                if (this.game.isAITurn) {
                    this._consoleLog("Game has ended. " + f[c[0] - 1] + " (ai) has won!");
                    this.game.advisorElement.dataset.advisor =
                        f[c[0] - 1] == TTT.player.cross
                        ? TTT.advisor.xWonAI : TTT.advisor.oWonAI;
                } else {
                    this._consoleLog("Game has ended. " + f[c[0] - 1] + " has won!");
                    this.game.advisorElement.dataset.advisor =
                        f[c[0] - 1] == TTT.player.cross
                        ? TTT.advisor.xWon : TTT.advisor.oWon;
                }
                for (j = 0; j < c.length; j++) {
                    this.game.fieldElements[c[j] - 1].classList.add("won");
                }
                // write stats
                if (f[c[0] - 1] == TTT.player.cross) {
                    this.game.stats.crossElement.dataset.value = ++this.game.stats.cross;
                } else if (f[c[0] - 1] == TTT.player.circle) {
                    this.game.stats.circleElement.dataset.value = ++this.game.stats.circle;
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
     * @returns {boolean} True if passed pattern matches actual field.
     */
    matchField(pattern) {
        if (pattern.length != 3) {
            return false;
        }
        let field = this.game.field, i, j, cell, cellPattern, row;
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
     * Same as matchField(), but allows for rotating and mirroring of pattern
     * for easier checking.
     * @param {string[]} pattern Array consisting of three strings
     *  describing the game filed to match.
     *  -> [row3(7,8,9), row2(4,5,6), row1(1,2,3)]
     * @param {boolean} rotate Specify if pattern should be rotated.
     * @param {boolean} mirror Specify if pattern should be mirrored.
     * @returns {boolean} True if passed field matches actual field.
     */
    matchFieldExt(pattern, rotate, mirror) {
        if (pattern.length != 3) {
            return false;
        }
        let i, j,
            currentPattern = Array.from(pattern);
            rotatedPattern,
            mirroredPattern;
        for (i = 0; i < 8; i++) {
            if (rotate && i % 2 == 0 && i > 0) {
                // rotate
            }
            if (mirror && i % 2 == 1) {
                // mirror
            }
        }
        return false;
    }

    /**
     * 
     * @param {string} player The type of player whose win con. should be searched.
     * @returns {number} The field number or -1 if no win constellation found.
     */
    searchForWinConstellation(player) {
        let f = this.game.field, i, c;
        for (i = 0; i < TTT.possibleWinConstellations.length; i++) {
            c = TTT.possibleWinConstellations[i];
            if (f[c[0] - 1] == player && f[c[0] - 1] == f[c[1] - 1] && f[c[2] - 1] == TTT.player.empty) {
                return c[2];
            } else if (f[c[0] - 1] == player && f[c[0] - 1] == f[c[2] - 1] && f[c[1] - 1] == TTT.player.empty) {
                return c[1];
            } else if (f[c[1] - 1] == player && f[c[1] - 1] == f[c[2] - 1] && f[c[0] - 1] == TTT.player.empty) {
                return c[0];
            }
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
        return player == TTT.player.cross ? TTT.player.circle : TTT.player.cross;
    }

    /**
     * Resets the Win Stats internal counter and updates the UI.
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
        console.log(prefix + str.replace(/\n/g, "\n" + " ".repeat(prefix.length) + "> "));
    }
}

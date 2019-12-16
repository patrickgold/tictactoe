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
        this._game = {
            __aiImpossible: {
                isLShapeCircle: false,
                isTriangleCircle: false,
                isStepShapeCross: false,
            },
            activePlayerTurn: TTT.player.empty,
            advisorElement: null,
            aiMoveTimeoutID: 0,
            field: [],
            isAITurn: false,
            isRunning: false,
            mode: TTT.mode.playerVsAIMedium,
            stats: {
                cross: 0,
                crossElement: null,
                circle: null,
                circleElement: null,
                draw: 0,
                drawElement: null
            },
            tttElement: null,
            turnCount: 0,
        };
        this._game.tttElement = tttElement;
        this._game.advisorElement = advisorElement;
        this._game.stats.crossElement = document.getElementById("ttts__x");
        this._game.stats.circleElement = document.getElementById("ttts__o");
        this._game.stats.drawElement = document.getElementById("ttts__draw");
        let that = this;
        tttElement.addEventListener("click", function (e) {
            that.handleClick(e);
        }, false);
    }

    /**
     * Starts a new game.
     * @param {String} mode The mode of the game.
     * @param {boolean} [ignoreRunningGame] If starting game should ignore a running game.
     */
    startGame(mode, ignoreRunningGame = false, aiShouldBegin = false) {
        if (this._game.isRunning && !ignoreRunningGame) {
            alert("Game is already running!!");
            return;
        }
        this._game.field = [
            TTT.player.empty,TTT.player.empty,TTT.player.empty,
            TTT.player.empty,TTT.player.empty,TTT.player.empty,
            TTT.player.empty,TTT.player.empty,TTT.player.empty,
        ];
        let fields = this._game.tttElement.getElementsByTagName("button"), i;
        for (i = 0; i < fields.length; i++) {
            fields[i].setAttribute("data-state", "empty");
            fields[i].className = "";
        }
        this._game.mode = mode;
        this._game.isAITurn = this._game.mode.startsWith("playerVsAI") ? aiShouldBegin : false;
        this._game.__aiImpossible.isLShapeCircle = false;
        this._game.__aiImpossible.isTriangleCircle = false;
        this._game.__aiImpossible.isStepShapeCross = false;
        clearTimeout(this._game.aiMoveTimeoutID);
        this._game.turnCount = 0;
        this._game.activePlayerTurn = TTT.player.cross;
        this._game.tttElement.setAttribute("data-player-turn", this._game.activePlayerTurn);
        this._game.advisorElement.setAttribute("data-advisor",
            this._game.activePlayerTurn == TTT.player.cross
            ? (this._game.mode.startsWith("playerVsAI") ? TTT.advisor.xTurnSwitch : TTT.advisor.xTurn) : TTT.advisor.oTurn
        );
        this._game.isRunning = true;
        this._consoleLog("Starting a new game.\nmode: " + this._game.mode);

        if (!aiShouldBegin) {
            return;
        }
        // start random ai move.
        let fieldNum = 0;
        if (this._game.mode == TTT.mode.playerVsAIImpossible) {
            fieldNum = [1, 3, 7, 9][TTT.rand(0, 3)];
        } else {
            // just select a random empty field.
            fieldNum = this.searchForEmptyField();
        }
        this.handleClick({
            target: document.getElementById("tttf__" + fieldNum),
        }, true);
    }

    /**
     * Restarts the game.
     */
    restart() {
        if (this._game.isRunning || this._game.turnCount >= 9) {
            this._consoleLog("Restarting the game.");
            this.startGame(this._game.mode, true);
        }
    }

    /**
     * Handles a click on the main game field.
     * @param {Event} e The event data of the click on the main game field.
     * @param {boolean} isFakeEvent Tells whether the given e object is a real event or not. Defaults to false.
     */
    handleClick(e, isFakeEvent = false) {
        if (!this._game.isRunning || (!isFakeEvent && this._game.isAITurn)) {
            return;
        }
        if (e.target.id.startsWith("tttf__")) {
            let fieldState = e.target.getAttribute("data-state");
            let fieldNum = parseInt(e.target.id.split("tttf__")[1], 10);
            if (fieldState == TTT.player.empty) {
                this._consoleLog(this._game.activePlayerTurn + " placed on field #" + fieldNum);
                e.target.setAttribute("data-state", this._game.activePlayerTurn);
                this._game.field[fieldNum - 1] = this._game.activePlayerTurn;
                //console.log(this._game.field);
                ++this._game.turnCount;
                if (this.checkIfWonOrEnd()) {
                    this._game.isRunning = false;
                    this._game.tttElement.setAttribute("data-player-turn", "empty");
                    this._game.turnCount = 9;
                    return;
                }
                if (this._game.activePlayerTurn == TTT.player.cross) {
                    this._game.activePlayerTurn = TTT.player.circle;
                } else {
                    this._game.activePlayerTurn = TTT.player.cross;
                }
                if (this._game.mode.startsWith("playerVsAI") && !this._game.isAITurn) {
                    this._game.isAITurn = true;
                    this._game.tttElement.setAttribute("data-player-turn", TTT.player.empty);
                    this._game.advisorElement.setAttribute("data-advisor",
                        this._game.activePlayerTurn == TTT.player.cross
                        ? TTT.advisor.xTurnAI : TTT.advisor.oTurnAI
                    );
                    let that = this;
                    this._game.aiMoveTimeoutID = setTimeout(function () {
                        let fieldNum = 0;
                        if (that._game.mode == TTT.mode.playerVsAIEasy) {
                            // just select a random empty field.
                            fieldNum = that.searchForEmptyField();
                        } else if (that._game.mode == TTT.mode.playerVsAIMedium) {
                            // search for friendly 2 out of 3 rows.
                            let tmp = that.searchForWinConstellation(that._game.activePlayerTurn);
                            if (tmp > 0) {
                                fieldNum = tmp;
                            } else {
                                // search for enemy 2 out of 3 rows.
                                tmp = that.searchForWinConstellation(
                                    that._game.activePlayerTurn == TTT.player.cross
                                    ? TTT.player.circle : TTT.player.cross
                                );
                                if (tmp > 0) {
                                    fieldNum = tmp;
                                } else {
                                    // if no row, search for random empty field.
                                    fieldNum = that.searchForEmptyField();
                                }
                            }
                        } else if (that._game.mode == TTT.mode.playerVsAIImpossible) {
                            let tmp = -1, g = that._game, f = g.field,
                                empty = TTT.player.empty,
                                circle = TTT.player.circle,
                                cross = TTT.player.cross;
                            // search for friendly 2 out of 3 rows.
                            tmp = that.searchForWinConstellation(g.activePlayerTurn);
                            if (tmp > 0) {
                                fieldNum = tmp;
                            } else {
                                // search for enemy 2 out of 3 rows.
                                tmp = that.searchForWinConstellation(that.getOtherPlayer(g.activePlayerTurn));
                                if (tmp > 0) {
                                    fieldNum = tmp;
                                } else {
                                    // ---
                                    // AI is circle
                                    // ---
                                    if (g.activePlayerTurn == TTT.player.circle && g.turnCount == 1) {
                                        if (that.matchField(["...", ".x.", "..."])) {
                                            tmp = [1, 3, 7, 9][TTT.rand(0, 3)];
                                        } else if (
                                            that.matchField(["x..", "...", "..."]) ||
                                            that.matchField(["..x", "...", "..."]) ||
                                            that.matchField(["...", "...", "x.."]) ||
                                            that.matchField(["...", "...", "..x"])
                                        ) {
                                            tmp = 5;
                                        } else if (that.matchField(["...", "...", ".x."])) {
                                            tmp = 8;
                                        } else if (that.matchField([".x.", "...", "..."])) {
                                            tmp = 2;
                                        } else if (that.matchField(["...", "x..", "..."])) {
                                            tmp = 6;
                                        } else if (that.matchField(["...", "..x", "..."])) {
                                            tmp = 4;
                                        }
                                    } else if (g.activePlayerTurn == TTT.player.circle && g.turnCount == 3) {
                                        // ..x
                                        // .o.
                                        // x..
                                        // path ends
                                        if (
                                            that.matchField(["x..", ".o.", "..x"]) ||
                                            that.matchField(["..x", ".o.", "x.."])
                                        ) {
                                            tmp = 2 * TTT.rand(1, 4);
                                        }

                                        // ..x
                                        // .x.
                                        // o..
                                        // path ends
                                        else if (that.matchField(["..x", ".x.", "o.."])) {
                                            tmp = [3, 7][TTT.rand(0, 1)];
                                        } else if (that.matchField(["x..", ".x.", "..o"])) {
                                            tmp = [1, 9][TTT.rand(0, 1)];
                                        } else if (that.matchField(["..o", ".x.", "x.."])) {
                                            tmp = [3, 7][TTT.rand(0, 1)];
                                        } else if (that.matchField(["o..", ".x.", "..x"])) {
                                            tmp = [1, 9][TTT.rand(0, 1)];
                                        }

                                        // .x.
                                        // .x.
                                        // .o.
                                        // path ends
                                        else if (that.matchField([".x.", ".x.", ".o."])) {
                                            tmp = [7, 9][TTT.rand(0, 1)];
                                        } else if (that.matchField(["...", "xxo", "..."])) {
                                            tmp = [1, 7][TTT.rand(0, 1)];
                                        } else if (that.matchField([".o.", ".x.", ".o."])) {
                                            tmp = [1, 3][TTT.rand(0, 1)];
                                        } else if (that.matchField(["...", "oxx", "..."])) {
                                            tmp = [3, 9][TTT.rand(0, 1)];
                                        }

                                        // .x.
                                        // .o.
                                        // x..
                                        // path ends
                                        else if (that.matchField([".x.", ".o.", "x.."])) {
                                            tmp = 9;
                                        } else if (that.matchField([".x.", ".o.", "..x"])) {
                                            tmp = 7;
                                        } else if (that.matchField(["...", "xo.", "..x"])) {
                                            tmp = 7;
                                        } else if (that.matchField(["..x", "xo.", "..."])) {
                                            tmp = 1;
                                        } else if (that.matchField(["..x", ".o.", ".x."])) {
                                            tmp = 1;
                                        } else if (that.matchField(["x..", ".o.", ".x."])) {
                                            tmp = 3;
                                        } else if (that.matchField(["x..", ".ox", "..."])) {
                                            tmp = 3;
                                        } else if (that.matchField(["...", ".ox", "x.."])) {
                                            tmp = 9;
                                        }

                                        // xo.
                                        // ...
                                        // .x.
                                        // path ends
                                        else if (that.matchField(["xo.", "...", ".x."])) {
                                            tmp = 3;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField([".ox", "...", ".x."])) {
                                            tmp = 1;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField(["...", "o.x", "x.."])) {
                                            tmp = 9;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField(["x..", "o.x", "..."])) {
                                            tmp = 3;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField([".x.", "...", ".ox"])) {
                                            tmp = 7;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField([".x.", "...", "xo."])) {
                                            tmp = 9;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField(["..x", "x.o", "..."])) {
                                            tmp = 1;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        } else if (that.matchField(["...", "x.o", "..x"])) {
                                            tmp = 7;
                                            g.__aiImpossible.isStepShapeCross = true;
                                        }

                                        // .x.
                                        // x.o
                                        // ...
                                        // path ends
                                        else if (that.matchField([".x.", "x.o", "..."])) {
                                            tmp = 7;
                                        } else if (that.matchField(["...", "x.o", ".x."])) {
                                            tmp = 1;
                                        } else if (that.matchField([".o.", "x..", ".x."])) {
                                            tmp = 1;
                                        } else if (that.matchField([".o.", "..x", ".x."])) {
                                            tmp = 3;
                                        } else if (that.matchField(["...", "o.x", ".x."])) {
                                            tmp = 3;
                                        } else if (that.matchField([".x.", "o.x", "..."])) {
                                            tmp = 9;
                                        } else if (that.matchField([".x.", "..x", ".o."])) {
                                            tmp = 9;
                                        } else if (that.matchField([".x.", "x..", ".o."])) {
                                            tmp = 7;
                                        }
                                    } else if (g.activePlayerTurn == TTT.player.circle && g.turnCount == 5) {
                                        // xox
                                        // ...
                                        // .xo
                                        // ---or
                                        // xo.
                                        // ..x
                                        // .xo
                                        if (g.__aiImpossible.isStepShapeCross && that.matchField(["***", "*.*", "***"])) {
                                            tmp = 5;
                                        }
                                    }
                                    
                                    // ---
                                    // AI is cross
                                    // ---
                                    else if (g.activePlayerTurn == TTT.player.cross && g.turnCount == 2) {
                                        // ..o
                                        // ...
                                        // x..
                                        if (that.matchField(["**?", "***", "?**"])) {
                                            tmp = [3, 7][TTT.rand(0, 1)];
                                            g.__aiImpossible.isTriangleCircle = true;
                                        } else if (that.matchField(["?**", "***", "**?"])) {
                                            tmp = [1, 9][TTT.rand(0, 1)];
                                            g.__aiImpossible.isTriangleCircle = true;
                                        }
                                        
                                        // ...
                                        // .o.
                                        // x..
                                        else if (that.matchField(["***", "*?*", "?**"])) {
                                            tmp = [6, 8][TTT.rand(0, 1)];
                                        } else if (that.matchField(["***", "*?*", "**?"])) {
                                            tmp = [4, 8][TTT.rand(0, 1)];
                                        } else if (that.matchField(["?**", "*?*", "***"])) {
                                            tmp = [2, 6][TTT.rand(0, 1)];
                                        } else if (that.matchField(["**?", "*?*", "***"])) {
                                            tmp = [2, 4][TTT.rand(0, 1)];
                                        }
                                        
                                        // ...
                                        // o..
                                        // x..
                                        else if (that.matchField(["***", "***", "??*"])) {
                                            tmp = 4;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["***", "***", "*??"])) {
                                            tmp = 6;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["***", "**?", "**?"])) {
                                            tmp = 2;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["**?", "**?", "***"])) {
                                            tmp = 8;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["*??", "***", "***"])) {
                                            tmp = 6;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["??*", "***", "***"])) {
                                            tmp = 4;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["?**", "?**", "***"])) {
                                            tmp = 8;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        } else if (that.matchField(["***", "?**", "?**"])) {
                                            tmp = 2;
                                            g.__aiImpossible.isLShapeCircle = true;
                                        }
                                        
                                        // .o.
                                        // ...
                                        // x..
                                        else if (that.matchField(["*?*", "***", "?**"])) {
                                            tmp = 3;
                                        } else if (that.matchField(["*?*", "***", "**?"])) {
                                            tmp = 1;
                                        } else if (that.matchField(["***", "?**", "**?"])) {
                                            tmp = 9;
                                        } else if (that.matchField(["**?", "?**", "***"])) {
                                            tmp = 3;
                                        } else if (that.matchField(["**?", "***", "*?*"])) {
                                            tmp = 7;
                                        } else if (that.matchField(["?**", "***", "*?*"])) {
                                            tmp = 9;
                                        } else if (that.matchField(["?**", "**?", "***"])) {
                                            tmp = 1;
                                        } else if (that.matchField(["***", "**?", "?**"])) {
                                            tmp = 7;
                                        }
                                        
                                        // o..
                                        // ...
                                        // x..
                                        else if (f[1 - 1] == circle && f[7 - 1] == cross) {
                                            tmp = 3;
                                        } else if (f[1 - 1] == circle && f[3 - 1] == cross) {
                                            tmp = 7;
                                        } else if (f[3 - 1] == circle && f[1 - 1] == cross) {
                                            tmp = 9;
                                        } else if (f[3 - 1] == circle && f[9 - 1] == cross) {
                                            tmp = 1;
                                        } else if (f[9 - 1] == circle && f[3 - 1] == cross) {
                                            tmp = 7;
                                        } else if (f[9 - 1] == circle && f[7 - 1] == cross) {
                                            tmp = 3;
                                        } else if (f[7 - 1] == circle && f[9 - 1] == cross) {
                                            tmp = 1;
                                        } else if (f[7 - 1] == circle && f[1 - 1] == cross) {
                                            tmp = 9;
                                        } 
                                    } else if (g.activePlayerTurn == TTT.player.cross && g.turnCount == 4) {
                                        if (that.matchField(["***", "*.*", "***"]) && g.__aiImpossible.isLShapeCircle) {
                                            tmp = 5;
                                        } else if (g.__aiImpossible.isTriangleCircle) {
                                            if (that.matchField(["***", "***", ".**"])) {
                                                tmp = 1;
                                            } else if (that.matchField(["***", "***", "**."])) {
                                                tmp = 3;
                                            } else if (that.matchField([".**", "***", "***"])) {
                                                tmp = 7;
                                            } else if (that.matchField(["**.", "***", "***"])) {
                                                tmp = 9;
                                            }
                                        }
                                    }

                                    if (tmp > 0) {
                                        fieldNum = tmp;
                                    } else {
                                        // if no row, search for random empty field.
                                        fieldNum = that.searchForEmptyField();
                                    }
                                }
                            }
                        }
                        that.handleClick({
                            target: document.getElementById("tttf__" + fieldNum),
                        }, true);
                    }, 750);
                } else {
                    this._game.isAITurn = false;
                    this._game.tttElement.setAttribute("data-player-turn", this._game.activePlayerTurn);
                    this._game.advisorElement.setAttribute("data-advisor",
                        this._game.activePlayerTurn == TTT.player.cross
                        ? TTT.advisor.xTurn : TTT.advisor.oTurn
                    );
                }
            }
        }
    }

    /**
     * Checks if a party has won or if the game ends with a draw.
     * @returns {boolean} True if the game has ended, else false.
     */
    checkIfWonOrEnd() {
        let f = this._game.field, i, j, c;
        for (i = 0; i < TTT.possibleWinConstellations.length; i++) {
            c = TTT.possibleWinConstellations[i];
            if (f[c[0] - 1] != TTT.player.empty && f[c[0] - 1] == f[c[1] - 1] && f[c[1] - 1] == f[c[2] - 1]) {
                // win for either party
                //alert(f[c[0] - 1] + " has won!");
                if (this._game.isAITurn) {
                    this._consoleLog("Game has ended. " + f[c[0] - 1] + " (ai) has won!");
                    this._game.advisorElement.setAttribute("data-advisor",
                        f[c[0] - 1] == TTT.player.cross
                        ? TTT.advisor.xWonAI : TTT.advisor.oWonAI
                    );
                } else {
                    this._consoleLog("Game has ended. " + f[c[0] - 1] + " has won!");
                    this._game.advisorElement.setAttribute("data-advisor",
                        f[c[0] - 1] == TTT.player.cross
                        ? TTT.advisor.xWon : TTT.advisor.oWon
                    );
                }
                for (j = 0; j < c.length; j++) {
                    document.getElementById("tttf__" + c[j]).classList.add("won");
                }
                // write stats
                if (f[c[0] - 1] == TTT.player.cross) {
                    this._game.stats.crossElement.dataset.value = ++this._game.stats.cross;
                } else if (f[c[0] - 1] == TTT.player.circle) {
                    this._game.stats.circleElement.dataset.value = ++this._game.stats.circle;
                }
                return true;
            }
        }
        if (this._game.turnCount >= 9) {
            // draw
            //alert("draw!");
            this._consoleLog("Game has ended. It is a draw!");
            this._game.advisorElement.setAttribute("data-advisor", TTT.advisor.draw);
            this._game.stats.drawElement.dataset.value = ++this._game.stats.draw;
            return true;
        }
        return false;
    }

    /**
     * Matches a given pattern with the game and returns a boolean.
     * @param {Array<String>} pattern Array consisting of three strings
     *  describing the game filed to match.
     *  -> [row3(7,8,9), row2(4,5,6), row1(1,2,3)]
     * @returns {boolean} True if passed pattern matches actual field.
     */
    matchField(pattern) {
        if (pattern.length != 3) {
            return false;
        }
        let field = this._game.field, i, j, cell, cellPattern, row;
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
     * @param {Array<String>} pattern Array consisting of three strings
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
     * @param {String} player The type of player whose win con. should be searched.
     * @returns {Number} The field number or -1 if no win constellation found.
     */
    searchForWinConstellation(player) {
        let f = this._game.field, i, c;
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
     * @returns {Number} The field number or -1 if no empty field exists.
     */
    searchForEmptyField() {
        let tmp;
        // check if field has at least 1 empty field to prevent endless loop.
        if (!this._game.field.includes(TTT.player.empty)) {
            return -1;
        }
        // search for random field.
        while (1) {
            tmp = TTT.rand(1, 9);
            if (this._game.field[tmp - 1] == TTT.player.empty) {
                return tmp;
            }
        }
    }

    /**
     * Gets the other player from the given one.
     * @param {String} player The given player.
     * @returns {String}
     */
    getOtherPlayer(player) {
        return player == TTT.player.cross ? TTT.player.circle : TTT.player.cross;
    }

    /**
     * Resets the Win Stats internal counter and updates the UI.
     */
    resetWinStats() {
        this._game.stats.cross = 0;
        this._game.stats.circle = 0;
        this._game.stats.draw = 0;
        this._game.stats.crossElement.dataset.value = 0;
        this._game.stats.circleElement.dataset.value = 0;
        this._game.stats.drawElement.dataset.value = 0;
        this._consoleLog("Resetting winning statistics.");
    }

    /**
     * Formats a string before outputting it.
     * @param {String} str The string to be formatted and outputted.
     */
    _consoleLog(str) {
        let prefix = ">> TicTacToe : ";
        console.log(prefix + str.replace(/\n/g, "\n" + " ".repeat(prefix.length) + "> "));
    }
}

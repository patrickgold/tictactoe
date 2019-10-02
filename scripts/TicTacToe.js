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
});

class TicTacToe {
    "use strict";

    _game = {
        activePlayerTurn: 0,
        advisorElement: null,
        field: [],
        isAITurn: false,
        isRunning: false,
        mode: 0,
        tttElement: null,
        turnCount: 0,
    };

    /**
     * Contructs a new instance of TicTacToe.
     * @param {HTMLElement} tttElement The main game field html element.
     * @param {HTMLElement} advisorElement The advisor html element.
     */
    constructor(tttElement, advisorElement) {
        this._game.tttElement = tttElement;
        this._game.advisorElement = advisorElement;
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
        // just select a random empty field.
        while (fieldNum == 0) {
            let tmp = Math.floor(Math.random() * (9 - 1 + 1)) + 1;
            if (this._game.field[tmp - 1] == TTT.player.empty) {
                fieldNum = tmp;
            }
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
                    setTimeout(function () {
                        let fieldNum = 0;
                        if (that._game.mode == TTT.mode.playerVsAIEasy) {
                            // just select a random empty field.
                            while (fieldNum == 0) {
                                let tmp = Math.floor(Math.random() * (9 - 1 + 1)) + 1;
                                if (that._game.field[tmp - 1] == TTT.player.empty) {
                                    fieldNum = tmp;
                                }
                            }
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
                                    while (fieldNum == 0) {
                                        let tmp = Math.floor(Math.random() * (9 - 1 + 1)) + 1;
                                        if (that._game.field[tmp - 1] == TTT.player.empty) {
                                            fieldNum = tmp;
                                        }
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
                return true;
            }
        }
        if (this._game.turnCount >= 9) {
            // draw
            //alert("draw!");
            this._consoleLog("Game has ended. It is a draw!");
            this._game.advisorElement.setAttribute("data-advisor", TTT.advisor.draw);
            return true;
        }
        return false;
    }

    /**
     * 
     * @param {String} player The type of player whose win con. should be searched.
     * @returns {Number} The field number.
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
     * Formats a string before outputting it.
     * @param {String} str The string to be formatted and outputted.
     */
    _consoleLog(str) {
        let prefix = ">> TicTacToe : ";
        console.log(prefix + str.replace(/\n/g, "\n" + " ".repeat(prefix.length) + "> "));
    }
}

const TTT = Object.freeze({
    advise: Object.freeze({
        xWon: "xWon",
        xTurn: "xTurn",
        oWon: "oWon",
        oTurn: "oTurn",
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
});

class TicTacToe {
    "use strict";

    _game = {
        activePlayerTurn: 0,
        adviseElement: null,
        field: [],
        isRunning: false,
        mode: 0,
        tttElement: null,
        turnCount: 0,
    };

    /**
     * Contructs a new instance of TicTacToe.
     * @param {HTMLElement} tttElement The main game field html element.
     * @param {HTMLElement} adviseElement The advise html element.
     */
    constructor(tttElement, adviseElement) {
        this._game.tttElement = tttElement;
        this._game.adviseElement = adviseElement;
        let that = this;
        tttElement.addEventListener("click", function (e) {
            that.handleClick(e);
        }, false);
    }

    /**
     * Starts a new game.
     * @param {String} mode The mode of the game.
     * @param {String} beginner The beginning player, can be random, cross or circle.
     */
    startGame(mode, beginner) {
        if (this._game.isRunning) {
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
        this._game.turnCount = 0;
        if (beginner == TTT.player.random) {
            this._game.activePlayerTurn = Math.random() > 0.5 ? TTT.player.cross : TTT.player.circle;
        } else if (beginner == TTT.player.empty) {
            alert("Beginner can't be empty!");
            return;
        } else {
            this._game.activePlayerTurn = beginner;
        }
        this._game.tttElement.setAttribute("data-player-turn", this._game.activePlayerTurn);
        this._game.adviseElement.setAttribute("data-advise",
            this._game.activePlayerTurn == TTT.player.cross
            ? TTT.advise.xTurn : TTT.advise.oTurn
        );
        this._game.isRunning = true;
        this._consoleLog("Starting a new game.");
    }

    /**
     * Restarts the game.
     */
    restart() {
        if (this._game.isRunning || this._game.turnCount >= 9) {
            this._consoleLog("Restarting the game.");
            this._game.isRunning = false;
            this.startGame(this._game.mode, TTT.player.random);
        }
    }

    /**
     * Handles a click on the main game field.
     * @param {Event} e The event data of the click on the main game field.
     */
    handleClick(e) {
        if (!this._game.isRunning) {
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
                this._game.tttElement.setAttribute("data-player-turn", this._game.activePlayerTurn);
                this._game.adviseElement.setAttribute("data-advise",
                    this._game.activePlayerTurn == TTT.player.cross
                    ? TTT.advise.xTurn : TTT.advise.oTurn
                );
            }
        }
    }

    /**
     * Checks if a party has won or if the game ends with a draw.
     * @returns {boolean} True if the game has ended, else false.
     */
    checkIfWonOrEnd() {
        let f = this._game.field, i, j, c;
        let possibleWinConstellations = [
            [1,2,3],
            [4,5,6],
            [7,8,9],
            [1,4,7],
            [2,5,8],
            [3,6,9],
            [1,5,9],
            [3,5,7],
        ];
        for (i = 0; i < possibleWinConstellations.length; i++) {
            c = possibleWinConstellations[i];
            if (f[c[0] - 1] != TTT.player.empty && f[c[0] - 1] == f[c[1] - 1] && f[c[1] - 1] == f[c[2] - 1]) {
                // win for either party
                //alert(f[c[0] - 1] + " has won!");
                this._consoleLog("Game has ended. " + f[c[0] - 1] + " has won!");
                this._game.adviseElement.setAttribute("data-advise",
                    f[c[0] - 1] == TTT.player.cross
                    ? TTT.advise.xWon : TTT.advise.oWon
                );
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
            this._game.adviseElement.setAttribute("data-advise", TTT.advise.draw);
            return true;
        }
        return false;
    }

    _consoleLog(str) {
        console.log(">> TicTacToe : " + str);
    }
}

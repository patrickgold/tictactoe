window.onload = function () {
    // Main entry point

    var ttt = new TicTacToe(document.getElementById("tictactoe"), document.getElementById("tictactoe-advisor"));
    document.getElementById("tttctrl__mode").value = TTT.mode.playerVsAIMedium;
    ttt.startGame(TTT.mode.playerVsAIMedium, TTT.player.random);

    document.getElementById("tttctrl__restart").addEventListener("click", function () {
        ttt.restart();
    }, false);

    document.getElementById("tttctrl__mode").addEventListener("change", function (e) {
        ttt.startGame(e.target.value, true);
    }, false);

    document.getElementById("tttctrl__switch").addEventListener("click", function (e) {
        ttt.startGame(ttt._game.mode, true, true);
    }, false);
};

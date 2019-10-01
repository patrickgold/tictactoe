window.onload = function () {
    // Main entry point

    var ttt = new TicTacToe(document.getElementById("tictactoe"), document.getElementById("tictactoe-advise"));
    ttt.startGame(TTT.mode.playerVsPlayer, TTT.player.random);

    // document.getElementById("tttctrl__play--human").addEventListener("click", function () {
    // });
    document.getElementById("tttctrl__restart").addEventListener("click", function () {
        ttt.restart();
    });
};

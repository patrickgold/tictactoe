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
    
    document.body.addEventListener("keypress", function (e) {
        let showHelpDialogEle = document.getElementById("show-help-dialog");
        if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key) && !showHelpDialogEle.checked) {
            ttt.handleClick({
                target: document.getElementById("tttf__" + e.key),
            }, true);
            e.preventDefault();
        } else if (e.key == "?") {
            showHelpDialogEle.checked = !showHelpDialogEle.checked;
        } else if (e.key == "r" && !showHelpDialogEle.checked) {
            ttt.restart();
        } else if ((e.key == "0" || e.key == "o") && !showHelpDialogEle.checked) {
            if (ttt._game.turnCount == 0 && ttt._game.mode != TTT.mode.playerVsPlayer) {
                ttt.startGame(ttt._game.mode, true, true);
            }
        }
    }, false);
};

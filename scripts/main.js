window.onload = function () {
    // Main entry point

    var dmt = new DarkModeToggle({
        darkModeStylesheetURL: "styles/tictactoe-dark.css",
        mode: DMT.mode.auto,
        toggle: document.getElementById("dark-mode-toggle"),
    });

    var ttt = new TicTacToe();
    ttt.startGame(ttt.game.ctrl.modeSelect.value, TTT.player.random);
};

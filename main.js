import { Game } from "./src/Game.js";

document.addEventListener("DOMContentLoaded", () => {
    const homeScreen = document.querySelector(".home-screen");
    const loadingScreen = document.querySelector(".loading-screen");
    const gameScreen = document.querySelector(".game-screen");
    const startScreen = document.querySelector(".start");
    const gameOverScreen = document.querySelector(".game-over");

    const buttons = document.querySelector(".buttons");
    const optionsList = document.querySelector(".options-list");
    const inputElements = optionsList.getElementsByTagName("input");

    const currentScoreText = document.querySelector("#current-score");
    const bestScoreText = document.querySelector("#best-score");

    let isVolumeOn = true;
    let GAME = null;

    const changeElementVisibility = (element, isVisible) => {
        if (isVisible) {
            element.classList.remove("hidden");
        }
        else {
            element.classList.add("hidden");
        }
    }

    const changeElementText = (element, text) => {
        element.innerText = text;
    }

    const startGame = () => {
        if (GAME == null) {
            GAME = new Game(() => {
                changeElementVisibility(loadingScreen, false);
                changeElementVisibility(gameScreen, true);
            });
            GAME.SetLoseResponse((currentScore, bestScore) => {
                changeElementText(currentScoreText, `Score: ${currentScore}`);
                changeElementText(bestScoreText, `Best: ${bestScore}`);
                changeElementVisibility(gameOverScreen, true);
            });
            
            startScreen.addEventListener("click", () => {
                changeElementVisibility(startScreen, false);
                GAME.StartGame();
            });

            window.GAME = GAME;
        } else {
            GAME.RestartGame(() => {
                changeElementVisibility(loadingScreen, false);
                changeElementVisibility(gameScreen, true);
                changeElementVisibility(startScreen, true);
            });
        }
    }

    homeScreen.addEventListener("click", event => {
        const isButton = event.target.nodeName == "BUTTON" || event.target.parentNode.nodeName == "BUTTON";
        if (!isButton) return;
        const button = event.target.nodeName == "BUTTON" ? event.target : event.target.parentNode;

        if (button.id == "play-button") {
            changeElementVisibility(homeScreen, false);
            changeElementVisibility(loadingScreen, true);

            startGame();
            return;
        }
        if (button.id == "options-button") {
            changeElementVisibility(buttons, false);
            changeElementVisibility(optionsList, true);
            return;
        }
        if (button.id == "back-button") {
            changeElementVisibility(buttons, true);
            changeElementVisibility(optionsList, false);
        }
        if (button.parentNode.className == "volume") {
            if (isVolumeOn) {
                changeElementVisibility(button.parentNode.querySelector("#volume-on"), false);
                changeElementVisibility(button.parentNode.querySelector("#volume-off"), true);
            } else if (!isVolumeOn) {
                changeElementVisibility(button.parentNode.querySelector("#volume-on"), true);
                changeElementVisibility(button.parentNode.querySelector("#volume-off"), false);
            }
            isVolumeOn = !isVolumeOn;
            return;
        }
    });

    for (let i = 0; i < inputElements.length; i++) {
        const type = inputElements[i].type;
        const evt = type == "range" ? "input" :
                    type == "checkbox" ? "change" : "change";

        const prevSetValue = window.localStorage.getItem(inputElements[i].id);

        if (prevSetValue != null) {
            inputElements[i].parentNode.querySelector(".option-value").innerText = prevSetValue;
            if (type == "range") inputElements[i].value = prevSetValue;
            else if (type == "checkbox" && prevSetValue == "Off") inputElements[i].click();
        } else window.localStorage.setItem(inputElements[i].id, type == "range" ? inputElements[i].value : inputElements[i].checked);

        inputElements[i].addEventListener(evt, event => {
            const value = type == "range" ? event.target.value :
                          type == "checkbox" ? event.target.checked ? "On" : "Off" :
                          "checkbox" ? "On" : "Off";
                          
            inputElements[i].parentNode.querySelector(".option-value").innerText = value;
            if (window.localStorage.getItem(event.target.id) == null) {
                window.localStorage.setItem(event.target.id, value);
            } else {
                window.localStorage.setItem(event.target.id, value);
            }
        });
    };

    gameOverScreen.addEventListener("click", event => {
        const isButton = event.target.nodeName == "BUTTON" || event.target.parentNode.nodeName == "BUTTON";
        if (!isButton) return;
        const button = event.target.nodeName == "BUTTON" ? event.target : event.target.parentNode;

        if (button.id == "retry-button") {
            changeElementVisibility(gameOverScreen, false);
            changeElementVisibility(gameScreen, false);
            changeElementVisibility(loadingScreen, true);
            GAME.RestartGame(() => {
                changeElementVisibility(gameScreen, true);
                changeElementVisibility(loadingScreen, false);
                changeElementVisibility(startScreen, true);
            });
            return;
        }

        if (button.id == "exit-button") {
            changeElementVisibility(gameOverScreen, false);
            changeElementVisibility(gameScreen, false);
            changeElementVisibility(homeScreen, true);
        }
    });
});

document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("gesturechange", e => e.preventDefault());
document.addEventListener("gestureend", e => e.preventDefault());
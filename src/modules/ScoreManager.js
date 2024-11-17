class ScoreManager {
    constructor() {
        this._score_text = document.querySelector(".score").children[0];
        this._score = 0;
    }

    get score() {
        return this._score;
    }

    GetHighestScore() {
        const bestScore = window.localStorage.getItem("bestScore");
        return bestScore != null ? bestScore : this._score;
    }

    SetManualScore(score) {
        this._score = score;
        this._score_text.innerText = this._score.toString();
    }

    SetLocalStorageScore() {
        const hasSetScore = window.localStorage.getItem("bestScore") == null ? false : true;
        
        if (!hasSetScore) {
            window.localStorage.setItem("bestScore", this._score);
            return;
        }

        if (window.localStorage.getItem("bestScore") > this._score) return;

        window.localStorage.setItem("bestScore", this._score);
    }

    ResetScore() {
        this._score = 0;
        this._score_text.innerText = this._score;
    }

    IncrementScore() {
        this._score++;
        this._score_text.innerText = this._score.toString();
    }
}

export { ScoreManager }
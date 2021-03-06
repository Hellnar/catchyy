import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
const DateTime = luxon.DateTime
import { dict as tech } from "./dictionary.js" 

let PAUSE_TIME = 3000
let SPEED_RATIO = 25
let LIVES = 3
let createBlocks
const audio = new Audio('./sounds/tap.wav')
const audioWrong = new Audio('./sounds/wrong.wav')
const mainTheme = new Audio('./sounds/main_theme.mp3')
const audioError = new Audio('./sounds/wrong.wav')
const audioFail = new Audio('./sounds/fail.mp3')
const audioLose = new Audio('./sounds/lose.wav')

const firebaseConfig = {
    apiKey: "AIzaSyBEjyeuOo9OgxG-veawtq4l7TKidzvOS0k",
    authDomain: "catchyy-ecc85.firebaseapp.com",
    projectId: "catchyy-ecc85",
    storageBucket: "catchyy-ecc85.appspot.com",
    messagingSenderId: "334084561026",
    appId: "1:334084561026:web:0356c6a59cc8593dddfc9b"
};

initializeApp(firebaseConfig);
const db = getFirestore()
const scoresRef = collection(db, "scores")
const topScoresQuery = query(collection(db, "scores"), orderBy("score", "desc"), orderBy("solved", "desc"), limit(100))

document.getElementById("start").addEventListener("click", () => {
    startClick()
})

function startClick() {
    restart()
    init()
    checkInput()
    detectEnter()
    initCollisionCheck()
    cleanInput(document.querySelector(".user-input"))
    document.querySelector(".user-input").focus()
}

function startAgain() {
    restart()
    init()
    initCollisionCheck()
    document.querySelector(".user-input").focus()
}

function restart() {
    if(document.querySelector(".game-over")) {
        document.querySelector(".game-over").remove()
    }
    PAUSE_TIME = 3000
    LIVES = 3
    document.getElementById("score").innerText = 0
    document.getElementById("solved").innerText = 0
}

function init() {
    createBlock()
    createBlocks = setInterval(createBlock, PAUSE_TIME)
    mainTheme.volume = 0.2
    mainTheme.loop = true
    mainTheme.play()
    renderLives()
    setSpeed()
}

function createBlock() {
    const block = document.createElement("div")
    block.className = "block"
    block.innerText = tech[Math.floor(Math.random()*tech.length)]
    block.style.left = Math.random() * (window.innerWidth - 110) + "px"
    document.querySelector(".sky").appendChild(block)
}

function checkInput() {
    document.getElementById("send").addEventListener("click", () => {
        checkAnswer()
    })
}

function detectEnter() {
    document.addEventListener('keypress', (event) => {     
        if(event.charCode === 13) {
            checkAnswer()
        }
    })
}

function checkAnswer() {
    const userInput = document.querySelector(".user-input").value
    const blocks = document.querySelectorAll(".block")
    let result = []
    for(let block of blocks) {
        if(userInput === block.innerText) {
            result.push(true)
            audio.play()
            document.getElementById("score").innerText = Number(document.getElementById("score").innerText) + block.innerText.length
            document.getElementById("solved").innerText = Number(document.getElementById("solved").innerText) + 1
            PAUSE_TIME -= SPEED_RATIO
            setSpeed()
            clearInterval(createBlocks)
            createBlocks = setInterval(createBlock, PAUSE_TIME)
            createBlock()
            block.remove()
        }
    }

    if(!result.includes(true)) {
        shakeInput()
        audioWrong.play()
    }
    document.querySelector(".user-input").value = ""
}

function shakeInput() {
    audioError.play()
    const input = document.querySelector(".user-input")
    input.style.cssText = `
        animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        perspective: 1000px;
        border: 2px solid red;
    `

    setTimeout(() => {
        input.style.cssText = `
        animation: none;
        transform: none;
        backface-visibility: visible;
        perspective: 1000px;
        border: 2px solid #422800;
    `
    }, 1050)
}

function decreaseLives() {
    LIVES -= 1
    renderLives()
}

function setSpeed() {
    document.querySelector(".speed").textContent = `${(PAUSE_TIME / 1000).toFixed(2)}s`
}

function renderLives() {
    document.getElementById("lives").textContent = ("??????".repeat(LIVES))
}

function initCollisionCheck() {
    setInterval(checkCollision, 1000)
}

function checkCollision() {
    const blocks = document.querySelectorAll(".block")
    const footer = document.querySelector("footer").getBoundingClientRect()
    blocks.forEach(block => {
        const rect = block.getBoundingClientRect()
        if (rect.x < footer.x + footer.width &&
            rect.x + rect.width > footer.x &&
            rect.y < footer.y + footer.height &&
            rect.height + rect.y > footer.y) {
                block.remove()
                audioFail.play()
                decreaseLives()
                PAUSE_TIME -= SPEED_RATIO
                setSpeed()
                clearInterval(createBlocks)
                createBlocks = setInterval(createBlock, PAUSE_TIME)
                createBlock()
                if(LIVES == 0) {
                    document.querySelectorAll(".block").forEach(block => block.remove())
                    clearInterval(createBlocks)
                    mainTheme.pause()
                    audioLose.play()
                    createGameOver()
                }
            }
    })
}

function createGameOver() {
    const score = document.getElementById("score").innerText
    const solved = document.getElementById("solved").innerText
    const gm = document.createElement("div")
    gm.className = "game-over"
    gm.innerHTML = `
    <img src="./img/gameover.gif" alt="Geme over">
    <h2>Game Over</h2>
    <p>You have solved <b>${solved}</b> words and got <b>${score}</b> points!</p>
    <div class="set-player">
        <label>Player name</label>
        <input id="player-name" type="text">
        <button id="submit-player">Submit</button>
    </div>
    `
    document.querySelector("main").appendChild(gm)
    document.getElementById("submit-player").addEventListener("click", () => {
        submitResult()
    })
    cleanInput(document.querySelector("#player-name"))
}

function submitResult() {
    addDoc(scoresRef, {
        name: document.getElementById("player-name").value,
        score: parseInt(document.getElementById("score").innerText),
        solved: parseInt(document.getElementById("solved").innerText),
        date: DateTime.now().ts
    })
    document.querySelector(".game-over").remove()
    createScoresTable()
}

async function createScoresTable() {
    const highScores = document.createElement("div")
    highScores.className = "high-scores"
    highScores.innerHTML = `
    <h2>High scores</h2>
        <div class="scores-list">
            ${await createRows()}
        </div>
    <button id="again">Play again</button>
    `
    document.querySelector("main").appendChild(highScores)

    document.getElementById("again").addEventListener("click", () => {
        startAgain()
        document.querySelector(".high-scores").remove()
    })
}

async function createRows() {
    const scores = await getScores()
    let tableRows = `
    <div class="score-row table-head">
        <p class="table-number">#</p>
        <p class="table-player">Player</p>
        <p class="table-score">Score</p>
        <p class="table-solved">Solved</p>
    </div>
    `
    scores.forEach((score, index) => {
        tableRows += `
        <div class="score-row">
            <p class="table-number">${index + 1}.</p>
            <p class="table-player">${score.name}</p>
            <p class="table-score">${score.score}</p>
            <p class="table-solved">${score.solved}</p>
        </div>
        `
    })
    return tableRows
}

async function getScores() {
    const snap = await getDocs(topScoresQuery)
    let scores = []
    snap.docs.forEach(doc => {
        scores.push({...doc.data()})
    })
    return sortScores(scores)
}

function sortScores(scores) {
    return scores.sort((a, b) => (a.score === b.score) ? b.solved - a.solved : b.score - a.score)
}

function cleanInput(input) {
    input.addEventListener("input", () => input.value = input.value.replace(/[^A-Za-z0-9\s]/g,''))
}
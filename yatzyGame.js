import { calculateScore, getMaxScore } from "./scoreCalculator.js";
import WebRTCConnection from "./webrtc.js";

export class YatzyGame {
  constructor() {
    // Initialize WebRTC connection and bind the message handler.
    this.webrtc = new WebRTCConnection();
    this.webrtc.handleMessage = this.handleMessage.bind(this);

    // Standard game categories.
    this.baseCategories = [
      "1's",
      "2's",
      "3's",
      "4's",
      "5's",
      "6's",
      "Total of numbers",
      "Bonus",
      "1 pair",
      "2 pairs",
      "3 pairs",
      "3 same",
      "4 same",
      "2 x 3 same",
      "Small straight",
      "Large straight",
      "Royal",
      "Full house",
      "Chance",
      "Yatzy"
    ];

    // Extended (12‑dice) game categories.
    this.extendedCategories = [
      "1's",
      "2's",
      "3's",
      "4's",
      "5's",
      "6's",
      "Total of numbers",
      "Bonus",
      "1 pair",
      "2 pairs",
      "3 pairs",
      "4 pairs",
      "5 pairs",
      "6 pairs",
      "3 same",
      "4 same",
      "5 same",
      "6 same",
      "7 same",
      "8 same",
      "9 same",
      "10 same",
      "11 same",
      "2x3 same",
      "2 x 4 same",
      "2 x 5 same",
      "2 x 6 same",
      "3 x 3 same",
      "3 x 4 same",
      "little straight (1-5)",
      "large straight (2-6)",
      "little clauss (1-6 + 2x6)",
      "large clauss (1-6 + 3x6)",
      "tuber (1-6 + 4x6)",
      "all (1-6 + 5x6)",
      "captain Vom (1-6 + 6x6)",
      "Little mom (2+3 of the same)",
      "the poet (2+4 of the same)",
      "the mom (2+5 of the same)",
      "skipper horror (2+6 of the same)",
      "the radisses (3+4 of the same)",
      "the pools (3+5 of the same)",
      "goldfinch (3+6 of the same)",
      "Karl with the cap (4+5 of the same)",
      "Klaus rags (4+6 of the same)",
      "lightning Jens (5+6 of the same)",
      "Chance",
      "Yatzy"
    ];

    // Use standard mode by default.
    this.categoriesInUse = this.baseCategories.slice();

    // Game settings.
    this.maxRolls = 3;
    this.diceCount = 5;
    this.players = [];
    this.currentPlayerIndex = 0;
    this.totalRounds = 0;
    this.currentRound = 1;
    this.dice = [];
    this.rollsLeft = this.maxRolls;
    this.hasRolled = false;
    this.aiThreshold = 0.8;

    // DOM elements.
    this.gameArea = document.getElementById("game-area");
    this.scoreboardArea = document.getElementById("scoreboard-area");
    this.rollButton = document.getElementById("roll-button");
    this.startButton = document.getElementById("start-game");

    // Initialize buttons.
    this.startButton.textContent = "Start Game";
    this.startButton.addEventListener("click", () => this.setupGame());
    this.rollButton.addEventListener("click", () => this.rollDice());
  }

  handleMessage(message) {
    if (message.type === "gameState") {
      this.updateGameState(message.state);
    }
  }

  sendMessage(message) {
    this.webrtc.sendMessage(message);
  }

  updateGameState(state) {
    Object.assign(this, state);
    this.updateDiceDisplay();
    this.updateScoreboardDisplay();
  }

  getGameState() {
    return {
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      currentRound: this.currentRound,
      dice: this.dice,
      hasRolled: this.hasRolled,
      rollsLeft: this.rollsLeft,
      categoriesInUse: this.categoriesInUse
    };
  }

  getValidCategories() {
    if (this.diceCount === 5) {
      return this.baseCategories.filter(
        cat => cat !== "3 pairs" && cat !== "2 x 3 same" && cat !== "Royal"
      );
    }
    return this.diceCount === 12 ? this.extendedCategories : this.baseCategories;
  }

  setupGame() {
    this.gameArea.innerHTML = `
      <div id="setup-modal" class="modal">
        <h2>Game Setup</h2>
        <form id="setup-form">
          <label for="diceCount">Dice Count (5, 6, or 12):</label>
          <select id="diceCount" name="diceCount">
            <option value="5">5</option>
            <option value="6" selected>6</option>
            <option value="12">12</option>
          </select>
          <br/><br/>
          <label for="numPlayers">Number of Players:</label>
          <input type="number" id="numPlayers" name="numPlayers" value="1" min="1" />
          <br/><br/>
          <label for="playerName1">Player 1 Name:</label>
          <input type="text" id="playerName1" name="playerName1" value="Player 1" />
          <br/><br/>
          <div id="additional-players"></div>
          <button type="submit">Start Game</button>
        </form>
      </div>
    `;
    this.startButton.style.display = "none";

    const numPlayersInput = document.getElementById("numPlayers");
    const additionalPlayersDiv = document.getElementById("additional-players");

    numPlayersInput.addEventListener("change", () => {
      const count = parseInt(numPlayersInput.value);
      additionalPlayersDiv.innerHTML = "";
      if (count > 1) {
        for (let i = 2; i <= count; i++) {
          additionalPlayersDiv.innerHTML += `
            <label for="playerName${i}">Player ${i} Name:</label>
            <input type="text" id="playerName${i}" name="playerName${i}" value="Player ${i}" /><br/><br/>
          `;
        }
      }
    });

    document.getElementById("setup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const diceCount = document.getElementById("diceCount").value;
      const numPlayers = parseInt(document.getElementById("numPlayers").value);

      this.diceCount = parseInt(diceCount);
      this.categoriesInUse = this.getValidCategories();

      if (this.diceCount === 5) {
        this.totalRounds = 15;
      } else if (this.diceCount === 6) {
        this.totalRounds = 18;
      } else if (this.diceCount === 12) {
        this.totalRounds = 45;
      }

      this.players = [];
      const initialCats = {};
      this.categoriesInUse.forEach(cat => {
        initialCats[cat] = null;
      });

      const playerName1 = document.getElementById("playerName1").value;
      this.players.push({
        name: playerName1 || "Player 1",
        categories: JSON.parse(JSON.stringify(initialCats)),
        isAI: false
      });

      if (numPlayers === 1) {
        this.players.push({
          name: "AI Opponent",
          categories: JSON.parse(JSON.stringify(initialCats)),
          isAI: true
        });
      } else {
        for (let i = 2; i <= numPlayers; i++) {
          const pname = document.getElementById(`playerName${i}`).value;
          this.players.push({
            name: pname || `Player ${i}`,
            categories: JSON.parse(JSON.stringify(initialCats)),
            isAI: false
          });
        }
      }

      this.currentPlayerIndex = 0;
      this.currentRound = 1;
      this.hasRolled = false;

      document.getElementById("setup-modal").remove();

      this.rollButton.style.display = "inline-block";
      this.updateScoreboardDisplay();
      this.startTurn();

      this.sendMessage({ type: "gameState", state: this.getGameState() });
    });
  }

  startTurn() {
    this.rollsLeft = this.maxRolls;
    this.hasRolled = false;
    const curr = this.players[this.currentPlayerIndex];
    this.gameArea.innerHTML = `<div class="player-turn">
      <h2>${curr.name} – Round ${this.currentRound} of ${this.totalRounds} (Playing with ${this.diceCount} dice)</h2>
      <p>Please roll the dice at the start of every turn.</p>
      <p>Click on the dice you want to keep then press "Roll Dice".</p>
    </div>`;

    const oldSelector = document.getElementById("category-selector");
    if (oldSelector) oldSelector.remove();

    this.dice = [];
    for (let i = 0; i < this.diceCount; i++) {
      this.dice.push({ value: this.getRandomDie(), selected: false });
    }
    this.updateDiceDisplay();
    this.updateButtons();
    this.updateScoreboardDisplay();

    if (curr.isAI) {
      this.simulateAITurn();
    } else {
      if (this.rollsLeft < this.maxRolls) {
        this.attachScoreboardClickHandlers();
      }
    }
  }

  getRandomDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  updateDiceDisplay() {
    const diceContainer = document.createElement("div");
    diceContainer.className = "dice-container";
    this.dice.forEach((die, idx) => {
      const dieDiv = document.createElement("div");
      dieDiv.className = "die" + (die.selected ? " selected" : "");
      dieDiv.textContent = die.value;
      dieDiv.addEventListener("click", () => {
        if (!this.players[this.currentPlayerIndex].isAI && this.rollsLeft < this.maxRolls) {
          this.toggleDieSelection(idx);
        }
      });
      diceContainer.appendChild(dieDiv);
    });
    const prev = document.querySelector(".dice-container");
    if (prev) prev.remove();
    this.gameArea.appendChild(diceContainer);
  }

  toggleDieSelection(index) {
    this.dice[index].selected = !this.dice[index].selected;
    this.updateDiceDisplay();
  }

  updateButtons() {
    this.rollButton.disabled = this.rollsLeft === 0;
    let info = document.getElementById("rolls-info");
    if (!info) {
      info = document.createElement("p");
      info.id = "rolls-info";
      this.gameArea.appendChild(info);
    }
    info.textContent = `Rolls left: ${Math.max(0, this.rollsLeft)}`;
  }

  updateScoreboardDisplay() {
    let html = `<table class="excel-table">
      <thead>
        <tr>
          <th>Category</th>`;
    this.players.forEach(player => {
      html += `<th>${player.name}</th>`;
    });
    html += `</tr></thead><tbody>`;
    this.categoriesInUse.forEach(cat => {
      const isReadOnly = cat === "Total of numbers" || cat === "Bonus";
      html += `<tr data-cat="${cat}">
                <td>${cat}</td>`;
      this.players.forEach((player, pIndex) => {
        let cellContent = "";
        if (cat === "Total of numbers") {
          let total = 0;
          ["1's", "2's", "3's", "4's", "5's", "6's"].forEach(upperCat => {
            if (player.categories[upperCat] !== null) {
              total += player.categories[upperCat];
            } else if (this.currentPlayerIndex === pIndex && this.hasRolled) {
              total += calculateScore(this.dice.map(d => d.value), upperCat, this.diceCount);
            }
          });
          cellContent = `<strong>${total}</strong>`;
        } else if (cat === "Bonus") {
          let total = 0;
          ["1's", "2's", "3's", "4's", "5's", "6's"].forEach(upperCat => {
            if (player.categories[upperCat] !== null) {
              total += player.categories[upperCat];
            } else if (this.currentPlayerIndex === pIndex && this.hasRolled) {
              total += calculateScore(this.dice.map(d => d.value), upperCat, this.diceCount);
            }
          });
          let bonus = 0;
          if (this.diceCount === 12 && total >= 189) bonus = 200;
          if ((this.diceCount === 5 && total >= 63) || (this.diceCount === 6 && total >= 84))
            bonus = 50;
          cellContent = `<strong>${bonus}</strong>`;
        } else {
          if (
            player.categories[cat] === null &&
            pIndex === this.currentPlayerIndex &&
            this.dice.length > 0 &&
            this.hasRolled
          ) {
            const potential = calculateScore(this.dice.map(d => d.value), cat, this.diceCount);
            cellContent = `<span class="ark">${potential}</span>`;
          } else if (player.categories[cat] !== null) {
            cellContent = `<span>${player.categories[cat]}</span>`;
          }
        }
        html += `<td class="${isReadOnly ? 'read-only' : ''}">${cellContent}</td>`;
      });
      html += `</tr>`;
    });
    html += `<tr class="total-points-row">
              <td><strong>Total points</strong></td>`;
    this.players.forEach(player => {
      let sum = 0;
      Object.keys(player.categories).forEach(key => {
        if (player.categories[key] !== null) {
          sum += player.categories[key];
        }
      });
      let upperTotal = 0;
      ["1's", "2's", "3's", "4's", "5's", "6's"].forEach(cat => {
        upperTotal += (player.categories[cat] !== null ? player.categories[cat] : 0);
      });
      if (this.diceCount === 5 && upperTotal >= 63) sum += 50;
      if (this.diceCount === 6 && upperTotal >= 84) sum += 50;
      if (this.diceCount === 12 && upperTotal >= 189) sum += 200;
      html += `<td><strong>${sum}</strong></td>`;
    });
    html += `</tr>`;
    html += `</tbody></table>`;
    this.scoreboardArea.innerHTML = html;
    this.attachScoreboardClickHandlers();
  }

  attachScoreboardClickHandlers() {
    const curr = this.players[this.currentPlayerIndex];
    if (curr.isAI) return;
    const rows = this.scoreboardArea.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const cat = row.getAttribute("data-cat");
      if (
        cat &&
        cat.toLowerCase() !== "total of numbers" && 
        cat.toLowerCase() !== "bonus" && 
        cat.toLowerCase() !== "total points"
      ) {
        const cell = row.querySelectorAll("td")[1 + this.currentPlayerIndex];
        if (curr.categories[cat] === null) {
          cell.style.cursor = "pointer";
          cell.onclick = () => {
            this.scoreTurn(cat);
          };
        }
      }
    });
  }

  rollDice() {
    for (let i = 0; i < this.diceCount; i++) {
      if (!this.dice[i].selected) {
        this.dice[i].value = this.getRandomDie();
      }
    }
    this.hasRolled = true;
    this.rollsLeft--;
    this.updateDiceDisplay();
    this.updateButtons();
    this.updateScoreboardDisplay();
    if (!this.players[this.currentPlayerIndex].isAI) {
      this.attachScoreboardClickHandlers();
    }
    this.sendMessage({ type: "gameState", state: this.getGameState() });
  }

  simulateAITurn() {
    this.rollButton.disabled = true;
    setTimeout(() => {
      this.rollDice();
      this.autoRollDice(1);
    }, 1000);
  }

  autoRollDice(rollCount) {
    const curr = this.players[this.currentPlayerIndex];
    const available = Object.keys(curr.categories)
      .filter(cat => curr.categories[cat] === null)
      .filter(cat => {
        const lower = cat.toLowerCase();
        return lower !== "total of numbers" && lower !== "bonus" && lower !== "total points";
      });

    let bestCat = available[0];
    let bestRatio = 0;
    available.forEach(cat => {
      const potential = calculateScore(this.dice.map(d => d.value), cat, this.diceCount);
      const maxScore = getMaxScore(cat, this.diceCount);
      const ratio = maxScore ? potential / maxScore : 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestCat = cat;
      }
    });
    if (rollCount < this.maxRolls && bestRatio < this.aiThreshold) {
      setTimeout(() => {
        this.rollDice();
        this.autoRollDice(rollCount + 1);
      }, 1000);
    } else {
      setTimeout(() => {
        this.aiChooseCategoryBy(bestCat);
      }, 1000);
    }
  }

  aiChooseCategoryBy(category) {
    const curr = this.players[this.currentPlayerIndex];
    const score = calculateScore(this.dice.map(d => d.value), category, this.diceCount);
    alert(`${curr.name} (AI) scores ${score} for "${category}"`);
    curr.categories[category] = score;
    this.updateScoreboardDisplay();
    setTimeout(() => {
      this.advanceTurn();
    }, 500);
    this.sendMessage({ type: "gameState", state: this.getGameState() });
  }

  scoreTurn(selectedCategory) {
    const diceValues = this.dice.map(d => d.value);
    const roundScore = calculateScore(diceValues, selectedCategory, this.diceCount);
    alert(`Scored ${roundScore} points for category "${selectedCategory}"`);
    this.players[this.currentPlayerIndex].categories[selectedCategory] = roundScore;
    this.updateScoreboardDisplay();
    this.advanceTurn();
    this.sendMessage({ type: "gameState", state: this.getGameState() });
  }

  advanceTurn() {
    if (this.currentPlayerIndex < this.players.length - 1) {
      this.currentPlayerIndex++;
    } else {
      this.currentPlayerIndex = 0;
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        return this.endGame();
      }
    }
    this.rollButton.disabled = false;
    this.startTurn();
  }

  endGame() {
    const totals = this.players.map(player => {
      let sum = 0;
      Object.keys(player.categories).forEach(key => {
        if (player.categories[key] !== null) {
          sum += player.categories[key];
        }
      });
      let upperTotal = 0;
      ["1's", "2's", "3's", "4's", "5's", "6's"].forEach(cat => {
        upperTotal += (player.categories[cat] !== null ? player.categories[cat] : 0);
      });
      if (this.diceCount === 5 && upperTotal >= 63) sum += 50;
      if (this.diceCount === 6 && upperTotal >= 84) sum += 50;
      if (this.diceCount === 12 && upperTotal >= 189) sum += 200;
      return { name: player.name, total: sum };
    });
    totals.sort((a, b) => b.total - a.total);
    let resultText = "Game Over!\n\n";
    totals.forEach(player => {
      resultText += `${player.name}: ${player.total} points\n`;
    });
    resultText += `\nWinner: ${totals[0].name} wins!`;

    this.gameArea.innerHTML = `<h2>Game Over!</h2>
      <p>${resultText.replace(/\n/g, "<br>")}</p>
      <button id="new-game-button">Start New Game</button>`;
    this.rollButton.style.display = "none";

    document.getElementById("new-game-button").addEventListener("click", () => {
      this.currentPlayerIndex = 0;
      this.currentRound = 1;
      this.startButton.style.display = "inline-block";
      this.gameArea.innerHTML = "";
    });
    this.sendMessage({ type: "gameState", state: this.getGameState() });
  }
}

export default YatzyGame;
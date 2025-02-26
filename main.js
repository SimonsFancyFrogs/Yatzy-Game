import { YatzyGame } from "./yatzyGame.js";
import { AI } from "./AI.js";
import WebRTCConnection from "./webrtc.js";

const game = new YatzyGame();

// Override simulateAITurn with our AI integration.
game.simulateAITurn = function () {
  this.rollButton.disabled = true;
  const aiInstance = new AI(this.diceCount);
  setTimeout(() => {
    aiInstance.simulateAITurn(this.dice, this.maxRolls, 0, this.getAvailableCategories(), category => {
      this.aiChooseCategoryBy(category);
    });
  }, 1000);
};

// Ensure getAvailableCategories exists as a prototype function.
YatzyGame.prototype.getAvailableCategories = function () {
  const curr = this.players[this.currentPlayerIndex];
  return Object.keys(curr.categories).filter(cat => curr.categories[cat] === null);
};

document.getElementById("start-game").addEventListener("click", () => {
  // Initialize the WebRTC connection for signaling.
  const webrtc = new WebRTCConnection();
  webrtc.handleMessage = game.webrtc.handleMessage;
  webrtc.createOffer();
  // Start the game.
  game.setupGame();
});
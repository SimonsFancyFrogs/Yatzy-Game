import { calculateScore, getMaxScore } from "./scoreCalculator.js";

export class AI {
  constructor(diceCount) {
    this.diceCount = diceCount;
    this.aiThreshold = 0.8;
  }

  simulateAITurn(dice, maxRolls, rollCount, availableCategories, callback) {
    if (rollCount < maxRolls) {
      dice.forEach(die => {
        if (!die.selected) die.value = this.getRandomDie();
      });
      const bestCategory = this.chooseBestCategory(dice, availableCategories);
      if (bestCategory.ratio >= this.aiThreshold || rollCount === maxRolls - 1) {
        callback(bestCategory.category);
      } else {
        setTimeout(() => {
          this.simulateAITurn(dice, maxRolls, rollCount + 1, availableCategories, callback);
        }, 1000);
      }
    } else {
      const bestCategory = this.chooseBestCategory(dice, availableCategories);
      callback(bestCategory.category);
    }
  }

  getRandomDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  chooseBestCategory(dice, availableCategories) {
    // Filter out categories that the AI should not choose.
    const banned = ["total of numbers", "bonus", "total points"];
    const filteredCategories = availableCategories.filter(cat => {
      return !banned.includes(cat.trim().toLowerCase());
    });

    // If filtering results in an empty array, fallback to using the original list.
    const categoriesToConsider = filteredCategories.length > 0 ? filteredCategories : availableCategories;

    let bestCategory = categoriesToConsider[0];
    let bestRatio = 0;
    categoriesToConsider.forEach(cat => {
      const potential = calculateScore(dice.map(d => d.value), cat, this.diceCount);
      const maxScore = getMaxScore(cat, this.diceCount);
      const ratio = maxScore ? potential / maxScore : 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestCategory = cat;
      }
    });
    return { category: bestCategory, ratio: bestRatio };
  }
}
/*
  scoreCalculator.js

  This module calculates both the theoretical maximum score (via getMaxScore)
  and the actual score (via calculateScore) for each scoring category.

  There are two modes:
    • Standard mode: 5 or 6 dice.
    • Extended mode: 12 dice.

  Categories include number categories (1's, 2's, ... 6's), pairs,
  "X same" (e.g. "3 same", "4 same"), straights, full house, chance, 
  and various combination categories (e.g. "little mom", "the poet").

  Pairs are handled as:
    • "1 pair": The highest pair (i.e. two of the same high face).
    • "2 pairs": Sum of the two highest distinct pairs.
    • "3 pairs", "4 pairs", "5 pairs", "6 pairs": For Extended mode only,
       return the sum of that many pairs (each pair is the face × 2).

  The "Yatzy" category (when all dice are identical) has been added.
*/

//
// Helper functions for "X same" categories
//
function getSameMax(requiredCount, diceCount) {
  // Best-case scenario: highest face 6 for any "X same".
  return 6 * requiredCount;
}

function calcSame(counts, requiredCount) {
  // Loop from 6 to 1 and return face * requiredCount for the first found face with at least requiredCount occurrences.
  for (let face = 6; face >= 1; face--) {
    if (counts[face] >= requiredCount) {
      return face * requiredCount;
    }
  }
  return 0;
}

//
// Helper function for pairs in the actual score calculation in Standard mode.
//
function calcPairs(counts, requiredPairs) {
  // Collect all pairs from highest to lowest.
  let pairs = [];
  for (let face = 6; face >= 1; face--) {
    if (counts[face] >= 2) {
      // Each pair is worth face * 2.
      pairs.push(face * 2);
    }
  }
  if (pairs.length >= requiredPairs) {
    // Sum the highest 'requiredPairs' pairs.
    return pairs.slice(0, requiredPairs).reduce((sum, val) => sum + val, 0);
  }
  return 0;
}

//
// getMaxScore function returns the theoretical maximum for a category.
// In Extended mode, every defined category is explicitly listed.
//
export function getMaxScore(category, diceCount) {
  const catKey = category.trim().toLowerCase();
  
  if (diceCount === 12) {
    // Extended mode (12 dice)
    switch(catKey) {
      case "1's":                   return 12;
      case "2's":                   return 24;
      case "3's":                   return 36;
      case "4's":                   return 48;
      case "5's":                   return 60;
      case "6's":                   return 72;
      case "total of numbers":      return 12 + 24 + 36 + 48 + 60 + 72; // 252
      case "bonus":                 return 200;
      
      // Pairs in extended mode (all pair types available).
      case "1 pair":                return 2 * 6; // best: 6+6 = 12.
      case "2 pairs":               return (2 * 6) + (2 * 5); // 12 + 10 = 22.
      case "3 pairs":               return (2 * 6) + (2 * 5) + (2 * 4); // 12+10+8 = 30.
      case "4 pairs":               return (2 * 6) + (2 * 5) + (2 * 4) + (2 * 3); // 36.
      case "5 pairs":               return (2 * 6) + (2 * 5) + (2 * 4) + (2 * 3) + (2 * 2); // 40.
      case "6 pairs":               return (2 * 6) + (2 * 5) + (2 * 4) + (2 * 3) + (2 * 2) + (2 * 1); // 42.
      
      // "X same" categories.
      case "3 same":                return getSameMax(3, diceCount);  // 6*3 = 18.
      case "4 same":                return getSameMax(4, diceCount);  // 6*4 = 24.
      case "5 same":                return getSameMax(5, diceCount);
      case "6 same":                return getSameMax(6, diceCount);
      case "7 same":                return getSameMax(7, diceCount);
      case "8 same":                return getSameMax(8, diceCount);
      case "9 same":                return getSameMax(9, diceCount);
      case "10 same":               return getSameMax(10, diceCount);
      case "11 same":               return getSameMax(11, diceCount);
      
      // Extended groupings for "X same".
      case "2x3 same":              return (getSameMax(3, diceCount)) * 2;
      case "2 x 4 same":            return (getSameMax(4, diceCount)) * 2;
      case "2 x 5 same":            return (getSameMax(5, diceCount)) * 2;
      case "2 x 6 same":            return (getSameMax(6, diceCount)) * 2;
      case "3 x 3 same":            return (getSameMax(3, diceCount)) * 3;
      case "3 x 4 same":            return (getSameMax(4, diceCount)) * 3;
      
      case "little straight (1-5)":
                                  return 15;
      case "large straight (2-6)":
                                  return 20;
      // Adding theoretical maximum for yatzy.
      case "yatzy":                 return 50;
      
      // Categories applicable only in Standard mode.
      case "royal":
      case "full house":
      case "little mom":
      case "the poet":
                                  return 0;
      case "chance":                return diceCount * 6;
      
      // Extended-specific combination categories.
      case "little clauss (1-6 + 2x6)":
                                  return 100;
      case "large clauss (1-6 + 3x6)":
                                  return 120;
      case "tuber (1-6 + 4x6)":
                                  return 140;
      case "all (1-6 + 5x6)":
                                  return 160;
      case "captain vom (1-6 + 6x6)":
                                  return 180;
      default:                      return 0;
    }
  } else {
    // Standard mode (5 or 6 dice)
    switch(catKey) {
      case "1's":                   return diceCount * 1;
      case "2's":                   return diceCount * 2;
      case "3's":                   return diceCount * 3;
      case "4's":                   return diceCount * 4;
      case "5's":                   return diceCount * 5;
      case "6's":                   return diceCount * 6;
      case "total of numbers": {
        if (diceCount === 5) return 5 + 10 + 15 + 20 + 25 + 30; // 105.
        if (diceCount === 6) return 6 + 12 + 18 + 24 + 30 + 36; // 126.
        return 0;
      }
      case "bonus":                 return (diceCount === 5 || diceCount === 6) ? 50 : 0;
      
      // Pairs in standard mode:
      case "1 pair":                // best available pair.
                                    return 0; // Calculated dynamically in calculateScore.
      case "2 pairs":               return 0; // Calculated in calculateScore.
      case "3 pairs":               return 0; // Calculated in calculateScore.
      
      case "3 same":                return (diceCount >= 3 ? getSameMax(3, diceCount) : 0);
      case "4 same":                return (diceCount >= 4 ? getSameMax(4, diceCount) : 0);
      case "5 same":                return (diceCount >= 5 ? getSameMax(5, diceCount) : 0);
      case "6 same":                return (diceCount === 6 ? getSameMax(6, diceCount) : 0);
      
      // Not possible in standard mode:
      case "7 same":
      case "8 same":
      case "9 same":
      case "10 same":
      case "11 same":               return 0;
      
      case "2x3 same":              return (diceCount >= 6 ? getSameMax(3, diceCount) * 2 : 0);
      // Extended groupings are not applicable:
      case "2 x 4 same":
      case "2 x 5 same":
      case "2 x 6 same":
      case "3 x 3 same":
      case "3 x 4 same":            return 0;
      
      case "small straight":        return 15;
      case "large straight":        return 20;
      case "royal":                 return (diceCount === 6 ? 21 : 0);
      case "full house":            return 25;
      
      // Standard combination categories.
      case "little mom":            return 30; // (Pair + Triplet)
      case "the poet":              return 36; // (Pair + 4 same)
      case "the mom":               return 42; // (Pair + 5 same)
      case "skipper horror":        return 48; // (Pair + 6 same)
      case "the radisses":          return 42; // (3 same + 4 same)
      case "the pools":             return 48; // (3 same + 5 same)
      case "goldfinch":             return 54; // (3 same + 6 same)
      case "karl with the cap":     return 54; // (4 same + 5 same)
      case "klaus rags":            return 60; // (4 same + 6 same)
      case "lightning jens":        return 66; // (5 same + 6 same)
      
      case "chance":                return diceCount * 6;
      // Adding standard yatzy:
      case "yatzy":
        return (new Set([...arguments[2] ? arguments[2] : []]).size === 1 ? 50 : 0);
      default:                      return 0;
    }
  }
}

//
// calculateScore returns the actual score from a given dice array, category, and diceCount.
//
export function calculateScore(dice, category, diceCount) {
  const catKey = category.trim().toLowerCase();
  // Build counts for dice faces (1 through 6).
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dice.forEach(val => { counts[val] = (counts[val] || 0) + 1; });
  
  // Number categories.
  if (["1's", "2's", "3's", "4's", "5's", "6's"].includes(catKey)) {
    const face = parseInt(catKey);
    return dice.filter(val => val === face).reduce((sum, val) => sum + val, 0);
  }
  
  if (catKey === "total of numbers") {
    let total = 0;
    for (let i = 1; i <= 6; i++) {
      total += i * counts[i];
    }
    return total;
  }
  
  if (catKey === "bonus") {
    let total = 0;
    for (let i = 1; i <= 6; i++) {
      total += i * counts[i];
    }
    if (diceCount === 12 && total >= 189) return 200;
    if ((diceCount === 5 && total >= 63) || (diceCount === 6 && total >= 84))
      return 50;
    return 0;
  }
  
  if (catKey === "chance") {
    return dice.reduce((sum, val) => sum + val, 0);
  }
  
  // Straights and Royal.
  if (catKey === "small straight" || catKey === "little straight (1-5)") {
    const needed = [1, 2, 3, 4, 5];
    return needed.every(n => dice.includes(n)) ? 15 : 0;
  }
  if (catKey === "large straight" || catKey === "large straight (2-6)") {
    const needed = [2, 3, 4, 5, 6];
    return needed.every(n => dice.includes(n)) ? 20 : 0;
  }
  if (catKey === "royal") {
    if (diceCount !== 6) return 0;
    const needed = [1, 2, 3, 4, 5, 6];
    return needed.every(n => dice.includes(n)) ? 21 : 0;
  }
  
  // Full house.
  if (catKey === "full house") {
    if (diceCount === 5) {
      const vals = Object.values(counts).filter(c => c > 0).sort((a, b) => a - b);
      return (vals.length === 2 && vals[0] === 2 && vals[1] === 3) ? 25 : 0;
    }
    if (diceCount === 6) {
      const vals = Object.values(counts).filter(c => c > 0).sort((a, b) => a - b);
      return (vals.length === 3 && vals[0] === 1 && vals[1] === 2 && vals[2] === 3) ? 25 : 0;
    }
    return 0;
  }
  
  // "X same" categories.
  if (catKey === "3 same") {
    return calcSame(counts, 3);
  }
  if (catKey === "4 same") {
    return calcSame(counts, 4);
  }
  if (catKey === "5 same") {
    return calcSame(counts, 5);
  }
  if (catKey === "6 same") {
    return (diceCount === 6 ? calcSame(counts, 6) : 0);
  }
  if (["7 same", "8 same", "9 same", "10 same", "11 same"].includes(catKey)) {
    return 0;
  }
  
  // Pairs (Standard mode).
  if (["1 pair", "2 pairs", "3 pairs"].includes(catKey) && diceCount !== 12) {
    if (catKey === "1 pair") {
      // Return the highest available pair.
      for (let face = 6; face >= 1; face--) {
        if (counts[face] >= 2) return face * 2;
      }
      return 0;
    }
    if (catKey === "2 pairs") {
      return calcPairs(counts, 2);
    }
    if (catKey === "3 pairs") {
      return calcPairs(counts, 3);
    }
  }
  
  // For Extended mode, pairs categories were fully defined in getMaxScore.
  if (diceCount === 12 && ["1 pair", "2 pairs", "3 pairs", "4 pairs", "5 pairs", "6 pairs"].includes(catKey)) {
    let pairs = [];
    for (let face = 6; face >= 1; face--) {
      let pairCount = Math.floor(counts[face] / 2);
      for (let i = 0; i < pairCount; i++) {
        pairs.push(face * 2);
      }
    }
    if (catKey === "1 pair") {
      return pairs.length >= 1 ? pairs[0] : 0;
    } else if (catKey === "2 pairs") {
      return pairs.length >= 2 ? pairs[0] + pairs[1] : 0;
    } else if (catKey === "3 pairs") {
      return pairs.length >= 3 ? pairs[0] + pairs[1] + pairs[2] : 0;
    } else if (catKey === "4 pairs") {
      return pairs.length >= 4 ? pairs[0] + pairs[1] + pairs[2] + pairs[3] : 0;
    } else if (catKey === "5 pairs") {
      return pairs.length >= 5 ? pairs[0] + pairs[1] + pairs[2] + pairs[3] + pairs[4] : 0;
    } else if (catKey === "6 pairs") {
      return pairs.length >= 6 ? pairs[0] + pairs[1] + pairs[2] + pairs[3] + pairs[4] + pairs[5] : 0;
    }
  }
  
  // Extended groupings for "X same" in Standard mode.
  if (catKey === "2x3 same" || catKey === "2 x 3 same") {
    if (diceCount < 6) return 0;
    let triplets = [];
    for (let face = 6; face >= 1; face--) {
      if (counts[face] >= 3) triplets.push(face * 3);
    }
    return (triplets.length >= 2 ? triplets[0] + triplets[1] : 0);
  }
  if (catKey === "2 x 4 same") {
    if (diceCount < 6) return 0;
    let quadruplets = [];
    for (let face = 6; face >= 1; face--) {
      if (counts[face] >= 4) quadruplets.push(face * 4);
    }
    return (quadruplets.length >= 2 ? quadruplets[0] + quadruplets[1] : 0);
  }
  if (catKey === "2 x 5 same") {
    if (diceCount < 6) return 0;
    let quintuplets = [];
    for (let face = 6; face >= 1; face--) {
      if (counts[face] >= 5) quintuplets.push(face * 5);
    }
    return (quintuplets.length >= 2 ? quintuplets[0] + quintuplets[1] : 0);
  }
  if (catKey === "2 x 6 same") {
    if (diceCount < 6) return 0;
    let sixOfAKind = [];
    for (let face = 6; face >= 1; face--) {
      if (counts[face] >= 6) sixOfAKind.push(face * 6);
    }
    return (sixOfAKind.length >= 2 ? sixOfAKind[0] + sixOfAKind[1] : 0);
  }
  if (catKey === "3 x 3 same" || catKey === "3x3 same") {
    if (diceCount < 6) return 0;
    let triplets = [];
    for (let face = 6; face >= 1; face--) {
      if (counts[face] >= 3) triplets.push(face * 3);
    }
    return (triplets.length >= 3 ? triplets[0] + triplets[1] + triplets[2] : 0);
  }
  if (catKey === "3 x 4 same" || catKey === "3x4 same") {
    if (diceCount < 6) return 0;
    let quadruplets = [];
    for (let face = 6; face >= 1; face--) {
      if (counts[face] >= 4) quadruplets.push(face * 4);
    }
    return (quadruplets.length >= 3 ? quadruplets[0] + quadruplets[1] + quadruplets[2] : 0);
  }
  
  // Combination categories (standard only).
  function maxTwoCombo(req1, req2) {
    let maxSum = 0;
    for (let face1 = 6; face1 >= 1; face1--) {
      if (counts[face1] >= req1) {
        for (let face2 = 6; face2 >= 1; face2--) {
          if (face2 !== face1 && counts[face2] >= req2) {
            const sum = face1 * req1 + face2 * req2;
            if (sum > maxSum) maxSum = sum;
          }
        }
      }
    }
    return maxSum;
  }
  
  if (diceCount !== 12) {
    if (catKey === "little mom")          return maxTwoCombo(2, 3);
    if (catKey === "the poet")            return maxTwoCombo(2, 4);
    if (catKey === "the mom")             return maxTwoCombo(2, 5);
    if (catKey === "skipper horror")      return maxTwoCombo(2, 6);
    if (catKey === "the radisses")        return maxTwoCombo(3, 4);
    if (catKey === "the pools")           return maxTwoCombo(3, 5);
    if (catKey === "goldfinch")           return maxTwoCombo(3, 6);
    if (catKey === "karl with the cap")   return maxTwoCombo(4, 5);
    if (catKey === "klaus rags")          return maxTwoCombo(4, 6);
    if (catKey === "lightning jens")      return maxTwoCombo(5, 6);
  }
  
  // New handling for Yatzy: if all dice are identical, score 50, otherwise 0.
  if (catKey === "yatzy") {
    return (new Set(dice).size === 1 ? 50 : 0);
  }
  
  return 0;
}
document.addEventListener("DOMContentLoaded", () => {
  
  // --- Game State & Difficulty Setup ---
  let currentFunds = 0.00;
  let incomePerSecond = 0.00;
  let hasWon = false;
  
  // Default (Normal) Settings
  let targetWinGoal = 5000.00;
  let clickPower = 1.00;
  let leakPenalty = 2.00;
  let leakChance = 0.10;

  // Obstacle Variables
  let isLeaking = false;
  
  // Upgrade Costs
  let filterCost = 50.00;
  let pumpCost = 200.00;
  let wellCost = 1000.00;

  // --- Rubric: Milestones Array ---
  const milestones = [
    { threshold: 100, msg: "Great start! You've raised your first $100!", triggered: false },
    { threshold: 1000, msg: "Amazing! $1,000 raised. Clean water is flowing!", triggered: false },
    { threshold: 2500, msg: "Halfway to the normal goal! Keep it up!", triggered: false }
  ];

  // --- DOM Elements ---
  const fundsDisplay = document.getElementById("current-funds");
  const passiveDisplay = document.getElementById("passive-rate");
  const tickerDisplay = document.getElementById("game-ticker");
  const tickerText = document.getElementById("goal-ticker-text");
  const leakAlertBtn = document.getElementById("leak-alert");
  const milestoneAlert = document.getElementById("milestone-alert");
  const milestoneText = document.getElementById("milestone-text");
  
  const difficultySelect = document.getElementById("difficulty-select");
  const jarClicker = document.getElementById("jar-clicker");

  // --- Audio Setup (Helper function to replay sounds quickly) ---
  function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
      sound.currentTime = 0; // Rewind to start
      sound.play().catch(e => console.log("Sound play prevented by browser policy until user interacts."));
    }
  }

  // --- Rubric: Difficulty Logic ---
  difficultySelect.addEventListener("change", (e) => {
    const mode = e.target.value;
    if (mode === "easy") {
      targetWinGoal = 2500;
      clickPower = 2.00;
      leakPenalty = 1.00;
      leakChance = 0.05;
    } else if (mode === "normal") {
      targetWinGoal = 5000;
      clickPower = 1.00;
      leakPenalty = 2.00;
      leakChance = 0.10;
    } else if (mode === "hard") {
      targetWinGoal = 10000;
      clickPower = 1.00;
      leakPenalty = 5.00;
      leakChance = 0.20;
    }
    tickerText.innerText = `Goal: Reach $${targetWinGoal.toLocaleString()} to fully secure clean water for the entire village!`;
    updateScreenDisplays();
  });

  // --- Display & Win/Milestone Logic ---
  function updateScreenDisplays() {
    fundsDisplay.innerText = currentFunds.toFixed(2);
    passiveDisplay.innerText = incomePerSecond.toFixed(2);
    
    document.getElementById("cost-filter").innerText = filterCost.toFixed(2);
    document.getElementById("cost-pump").innerText = pumpCost.toFixed(2);
    document.getElementById("cost-well").innerText = wellCost.toFixed(2);

    // Check Milestones
    milestones.forEach(m => {
      if (currentFunds >= m.threshold && !m.triggered && !hasWon) {
        m.triggered = true;
        milestoneText.innerText = m.msg;
        milestoneAlert.classList.remove("d-none");
        playSound("sfx-milestone");
        
        // Hide milestone after 4 seconds
        setTimeout(() => { milestoneAlert.classList.add("d-none"); }, 4000);
      }
    });

    // Check Win
    if (currentFunds >= targetWinGoal && !hasWon) {
      hasWon = true;
      tickerDisplay.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-trophy me-2 text-warning"></i> Victory! Village funded!</span>`;
      playSound("sfx-win");
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }

  // --- Rubric: Add/Remove elements from the DOM on Interaction ---
  jarClicker.addEventListener("click", () => {
    currentFunds += clickPower; 
    playSound("sfx-click");
    
    // 1. Create a new DOM element
    const floatingText = document.createElement("span");
    floatingText.classList.add("floating-text");
    floatingText.innerText = `+$${clickPower}`;
    
    // 2. Add it to the DOM
    jarClicker.appendChild(floatingText);
    
    // 3. Remove it from the DOM after animation completes (1 second)
    setTimeout(() => {
      floatingText.remove();
    }, 1000);

    updateScreenDisplays();
  });

  // --- Upgrade Shop Logic ---
  function buyUpgrade(cost, incomeIncrease, buttonId) {
    if (currentFunds >= cost) {
      currentFunds -= cost;
      incomePerSecond += incomeIncrease;
      playSound("sfx-buy");
      return cost * 1.15; // Return new scaled price
    }
    return cost; // Return old price if failed
  }

  document.getElementById("buy-filter").addEventListener("click", () => {
    filterCost = buyUpgrade(filterCost, 1.00, "buy-filter");
    updateScreenDisplays();
  });

  document.getElementById("buy-pump").addEventListener("click", () => {
    pumpCost = buyUpgrade(pumpCost, 5.00, "buy-pump");
    updateScreenDisplays();
  });

  document.getElementById("buy-well").addEventListener("click", () => {
    wellCost = buyUpgrade(wellCost, 25.00, "buy-well");
    updateScreenDisplays();
  });

  // --- The Challenge (Fix the Leak) ---
  leakAlertBtn.addEventListener("click", () => {
    isLeaking = false;
    leakAlertBtn.classList.add("d-none"); // Fix the leak visually
    playSound("sfx-click");
  });

  // --- Reset Logic ---
  document.getElementById("reset-game").addEventListener("click", () => {
    currentFunds = 0;
    incomePerSecond = 0;
    filterCost = 50;
    pumpCost = 200;
    wellCost = 1000;
    hasWon = false;
    isLeaking = false;
    
    // Reset milestones
    milestones.forEach(m => m.triggered = false);
    
    leakAlertBtn.classList.add("d-none");
    milestoneAlert.classList.add("d-none");
    tickerDisplay.innerHTML = `<i class="fa-solid fa-circle-info me-2 text-warning"></i><span id="goal-ticker-text">Goal: Reach $${targetWinGoal.toLocaleString()} to fully secure clean water for the entire village!</span>`;
    
    playSound("sfx-click");
    updateScreenDisplays();
  });

  // --- Automation Game Loop (Runs Every Second) ---
  setInterval(() => {
    currentFunds += incomePerSecond;

    if (isLeaking) {
      currentFunds -= leakPenalty;
      if (currentFunds < 0) currentFunds = 0; 
    } else if (!hasWon && currentFunds > 20) {
      // Chance to leak based on difficulty setting
      if (Math.random() < leakChance) {
        isLeaking = true;
        leakAlertBtn.classList.remove("d-none");
        playSound("sfx-leak");
      }
    }
    updateScreenDisplays();
  }, 1000);

  updateScreenDisplays();
});
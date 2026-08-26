// ChronoSchedule Core Application Logic

// DOM Elements & Selectors will be initialized on DOMContentLoaded
let state = {
  scenarios: [],
  currentScenarioId: 'default-routine',
  hourlyData: [], // 24 hours of calculated categories & details
  hoveredHour: null
};

// System Default Presets
const DEFAULT_PRESETS = [
  {
    id: 'default-routine',
    name: 'Routine Day (On Time)',
    sleepHours: 8.0,
    wakeTime: '07:00',
    peakTime: '10:00',
    dipTime: '14:30',
    midTime: '18:00',
    isSystem: true
  },
  {
    id: 'default-late-home',
    name: 'Late Back Home (Short Sleep)',
    sleepHours: 5.5,
    wakeTime: '06:30',
    peakTime: '11:00',
    dipTime: '14:00',
    midTime: '19:00',
    isSystem: true
  },
  {
    id: 'default-night-owl',
    name: 'Night Owl Shift',
    sleepHours: 8.0,
    wakeTime: '09:30',
    peakTime: '14:00',
    dipTime: '17:30',
    midTime: '21:00',
    isSystem: true
  }
];

// Witty loading messages for the simulator animation
const LOADING_MESSAGES = [
  "Caffeinating synapses...",
  "Siphoning sleep debt...",
  "Consulting the Circadian Council...",
  "Calibrating melatonin inhibitors...",
  "Spinning up the pineal gland...",
  "Bribing neurons with hypothetical espresso...",
  "Measuring cognitive coefficient...",
  "Aligning sun and moon orbits...",
  "Analyzing energy-to-coffee ratio...",
  "Calculating willpower reserves..."
];

// Hour category information (metadata for descriptions and styling)
const CATEGORY_META = {
  sleep: {
    label: 'Deep Sleep',
    icon: 'fa-moon',
    colorClass: 'bg-indigo-950 text-indigo-200 border-indigo-900',
    colorHex: '#1e1b4b',
    desc: 'Deep sleep and physical recovery. Essential for brain waste clearance (glymphatic system).',
    advice: 'Ensure your room is cool, pitch black, and quiet. Avoid checking screens if you wake up.'
  },
  transition: {
    label: 'Wake Transition',
    icon: 'fa-sun',
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    colorHex: '#6366f1',
    desc: 'Cortisol rising, waking up. Brain is clearing out adenosine (sleep pressure).',
    advice: 'Get 10-15 mins of bright light. Delay heavy caffeine for 90 mins to prevent an afternoon crash. Hydrate first.'
  },
  peak: {
    label: 'Peak Focus (Deep Work)',
    icon: 'fa-brain',
    colorClass: 'bg-amber-100 text-amber-900 border-amber-200',
    colorHex: '#f59e0b',
    desc: 'Maximum cognitive efficiency, focus, and analytical capability.',
    advice: 'Do your hardest tasks here: writing, coding, complex calculations, or deep strategy. Block all chats!'
  },
  dip: {
    label: 'Trough Zone (Low Energy)',
    icon: 'fa-battery-quarter',
    colorClass: 'bg-blue-100 text-blue-900 border-blue-200',
    colorHex: '#3b82f6',
    desc: 'Circadian dip. Lower vigilance, higher sleepiness, and slower response times.',
    advice: 'Do light admin, emails, files, or routine meetings. Avoid high-risk tasks. A 20-min nap or brisk walk does wonders.'
  },
  middle: {
    label: 'Secondary Peak',
    icon: 'fa-users',
    colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    colorHex: '#10b981',
    desc: 'Moderate-high efficiency. Excellent for collaboration and creative tasks.',
    advice: 'Great for group work, brainstorming, reviews, lighter design, or learning a new skill.'
  },
  winddown: {
    label: 'Wind Down',
    icon: 'fa-mug-hot',
    colorClass: 'bg-violet-100 text-violet-900 border-violet-200',
    colorHex: '#8b5cf6',
    desc: 'Preparing body for sleep. Melatonin release starting.',
    advice: 'Dim overhead lights. Turn off work devices. Read, stretch, or chat with family. Skip heavy meals.'
  },
  open: {
    label: 'Routine / Open Time',
    icon: 'fa-clock',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
    colorHex: '#64748b',
    desc: 'Standard daily baseline. Decent energy, suitable for physical or routine tasks.',
    advice: 'Good for workouts, chores, commutes, running errands, or social calls.'
  }
};

// --- Time Parsing Helpers ---
function parseTimeToFloat(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

function formatFloatToTime(val) {
  let h = Math.floor(val) % 24;
  let m = Math.round((val % 1) * 60);
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Checks if target is between start and end (supporting 24h wraps)
function isHourInRange(h, start, end) {
  if (start <= end) {
    return h >= start && h < end;
  } else {
    return h >= start || h < end;
  }
}

// Polar coordinate math for dynamic SVG Arc Drawing
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeDonutSegment(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 0, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

// --- Data Core Analysis Algorithm ---
function calculateCircadianSchedule(scenario) {
  const sleepHours = scenario.sleepHours;
  const wakeVal = parseTimeToFloat(scenario.wakeTime);
  const peakVal = parseTimeToFloat(scenario.peakTime);
  const dipVal = parseTimeToFloat(scenario.dipTime);
  const midVal = parseTimeToFloat(scenario.midTime);
  
  // Bed time is wake minus sleep hours (wrapped to 24h)
  const bedVal = (wakeVal - sleepHours + 24) % 24;
  
  const isSleepDeprived = sleepHours < 6.5;
  const hourlyData = [];
  
  // Map all 24 hours starting from wakeVal to present chronological order
  for (let i = 0; i < 24; i++) {
    const currentHour = (Math.floor(wakeVal) + i) % 24;
    let category = 'open';
    let energyScore = 60; // baseline
    let warnings = [];
    
    // Define Ranges
    // Sleep range: [bedVal, wakeVal]
    const inSleep = isHourInRange(currentHour, bedVal, wakeVal);
    
    // Wake transition: wakeVal to wakeVal + 1.5 hours
    const inTransition = isHourInRange(currentHour, wakeVal, (wakeVal + 1.5) % 24);
    
    // Wind Down: bedVal - 1.5 hours to bedVal
    const inWinddown = isHourInRange(currentHour, (bedVal - 1.5 + 24) % 24, bedVal);
    
    // Peak: centered around peakVal (e.g. 1.5 hours before and after)
    const inPeak = isHourInRange(currentHour, (peakVal - 1.5 + 24) % 24, (peakVal + 1.5) % 24);
    
    // Dip: centered around dipVal
    const inDip = isHourInRange(currentHour, (dipVal - 1.5 + 24) % 24, (dipVal + 1.5) % 24);
    
    // Middle: centered around midVal
    const inMiddle = isHourInRange(currentHour, (midVal - 1 + 24) % 24, (midVal + 1) % 24);
    
    // Calculate priorities: Sleep > Peak > Dip > Middle > Winddown > Transition > Open
    if (inSleep) {
      category = 'sleep';
      energyScore = 10;
    } else if (inPeak) {
      category = 'peak';
      energyScore = isSleepDeprived ? 75 : 95;
    } else if (inDip) {
      category = 'dip';
      energyScore = isSleepDeprived ? 25 : 45;
    } else if (inMiddle) {
      category = 'middle';
      energyScore = isSleepDeprived ? 60 : 78;
    } else if (inWinddown) {
      category = 'winddown';
      energyScore = 35;
    } else if (inTransition) {
      category = 'transition';
      energyScore = 55;
    } else {
      category = 'open';
      energyScore = isSleepDeprived ? 50 : 65;
    }
    
    // Custom logic overrides for short sleep days (Sleep Deprived)
    let dynamicAdvice = CATEGORY_META[category].advice;
    let dynamicDesc = CATEGORY_META[category].desc;
    
    if (isSleepDeprived) {
      if (category === 'peak') {
        dynamicDesc = "Fragile Focus Block. Your sleep duration is low (" + sleepHours + " hrs). High risk of mind-wandering.";
        dynamicAdvice = "Reduce focus intervals to 20-min chunks (Pomodoro). Avoid committing to major strategic decisions today.";
        warnings.push("Sleep-deprived focus crash risk");
      } else if (category === 'dip') {
        dynamicDesc = "Critical Fatigue Zone. Your sleep deficit will magnify this natural dip.";
        dynamicAdvice = "MANDATORY REST: Take a 15-20 min power nap, or stay fully offline. Drink ice-cold water. Avoid driving or high-stakes meetings.";
        warnings.push("High fatigue warning");
      } else if (category === 'open' && isHourInRange(currentHour, (dipVal + 1.5) % 24, (dipVal + 4) % 24)) {
        // Post-dip hours are extra heavy on short sleep
        energyScore -= 15;
        dynamicDesc = "Lethargy Phase. High sleep debt is causing persistent low motivation.";
        dynamicAdvice = "Focus only on automated tasks or physical chores. Get fresh air.";
      }
    }
    
    hourlyData.push({
      hour: currentHour,
      timeString: `${currentHour.toString().padStart(2, '0')}:00`,
      category: category,
      energy: energyScore,
      description: dynamicDesc,
      advice: dynamicAdvice,
      warnings: warnings
    });
  }
  
  return hourlyData;
}

// --- LocalStorage Scenario Manager ---
function loadScenarios() {
  const raw = localStorage.getItem('chrono_scenarios');
  if (raw) {
    state.scenarios = JSON.parse(raw);
  } else {
    state.scenarios = [...DEFAULT_PRESETS];
    saveScenariosToStorage();
  }
}

function saveScenariosToStorage() {
  localStorage.setItem('chrono_scenarios', JSON.stringify(state.scenarios));
}

function getActiveScenario() {
  return state.scenarios.find(s => s.id === state.currentScenarioId) || state.scenarios[0];
}

// --- DOM Rendering / Dashboard Controllers ---

// Render the Sidebar Scenario items
function renderScenarioList() {
  const listEl = document.getElementById('scenario-list');
  if (!listEl) return;
  
  listEl.innerHTML = '';
  
  state.scenarios.forEach(scenario => {
    const isActive = scenario.id === state.currentScenarioId;
    
    const li = document.createElement('li');
    li.className = `group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
      isActive 
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
    }`;
    
    li.addEventListener('click', () => {
      selectScenario(scenario.id);
    });
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex flex-col overflow-hidden mr-2';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'font-semibold text-sm truncate';
    nameSpan.innerText = scenario.name;
    
    const subSpan = document.createElement('span');
    subSpan.className = `text-xs ${isActive ? 'text-indigo-200' : 'text-slate-400'} mt-0.5`;
    subSpan.innerText = `${scenario.sleepHours}h sleep • Wake at ${scenario.wakeTime}`;
    
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(subSpan);
    li.appendChild(infoDiv);
    
    // Delete action (if not system preset)
    if (!scenario.isSystem) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = `p-1.5 rounded-lg transition-all ${
        isActive 
          ? 'hover:bg-indigo-700 text-indigo-200 hover:text-white' 
          : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'
      }`;
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i>';
      deleteBtn.title = "Delete custom scenario";
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent selecting
        deleteScenario(scenario.id);
      });
      li.appendChild(deleteBtn);
    } else {
      // Add a system label icon
      const lockIcon = document.createElement('span');
      lockIcon.className = `text-xs opacity-50 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`;
      lockIcon.innerHTML = '<i class="fas fa-sliders-h"></i>';
      li.appendChild(lockIcon);
    }
    
    listEl.appendChild(li);
  });
}

function selectScenario(id) {
  state.currentScenarioId = id;
  const scenario = getActiveScenario();
  
  // Fill inputs
  document.getElementById('input-name').value = scenario.name;
  document.getElementById('input-sleep').value = scenario.sleepHours;
  document.getElementById('input-wake').value = scenario.wakeTime;
  document.getElementById('input-peak').value = scenario.peakTime;
  document.getElementById('input-dip').value = scenario.dipTime;
  document.getElementById('input-mid').value = scenario.midTime;
  
  // Show system warning badge (but keep name input enabled for editing)
  const nameInput = document.getElementById('input-name');
  nameInput.disabled = false;
  nameInput.className = "w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  if (scenario.isSystem) {
    document.getElementById('system-badge').classList.remove('hidden');
  } else {
    document.getElementById('system-badge').classList.add('hidden');
  }
  
  renderScenarioList();
  triggerAnalysis();
}

function deleteScenario(id) {
  if (confirm("Are you sure you want to delete this scenario?")) {
    state.scenarios = state.scenarios.filter(s => s.id !== id);
    if (state.currentScenarioId === id) {
      state.currentScenarioId = 'default-routine';
    }
    saveScenariosToStorage();
    selectScenario(state.currentScenarioId);
  }
}

// --- Fun Animated Loader Simulation ---
function triggerAnalysis() {
  const loaderEl = document.getElementById('circadian-loader');
  const dashboardEl = document.getElementById('dashboard-content');
  const loadingTextEl = document.getElementById('loader-text');
  
  if (!loaderEl || !dashboardEl) return;
  
  // Calculate schedule instantly in state, but hold visualization until loader finishes
  const activeScen = getActiveScenario();
  state.hourlyData = calculateCircadianSchedule(activeScen);
  
  // Show loader, hide content
  loaderEl.classList.remove('hidden');
  loaderEl.classList.add('flex');
  dashboardEl.classList.add('opacity-10'); // dim it
  
  // Animate loading texts
  let msgIdx = 0;
  loadingTextEl.innerText = LOADING_MESSAGES[0];
  
  const textInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
    loadingTextEl.innerText = LOADING_MESSAGES[msgIdx];
  }, 900);
  
  // Hold loading screen for 3 seconds of fun animations
  setTimeout(() => {
    clearInterval(textInterval);
    loaderEl.classList.add('hidden');
    loaderEl.classList.remove('flex');
    dashboardEl.classList.remove('opacity-10');
    
    // Draw visualizers
    renderDashboard();
  }, 2800);
}

// --- Render Visualizers ---

// 1. Interactive Circadian Donut Clock
function drawCircadianWheel() {
  const container = document.getElementById('circadian-wheel-container');
  if (!container) return;
  
  container.innerHTML = ''; // Clear previous
  
  const width = 340;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = 150;
  const innerRadius = 100;
  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "mx-auto");
  
  // Draw 24 hours segments
  state.hourlyData.forEach((hourObj, idx) => {
    // Each segment is 15 degrees
    const startAngle = hourObj.hour * 15 - 90;
    const endAngle = (hourObj.hour + 1) * 15 - 90;
    
    const d = describeDonutSegment(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", `sector-${hourObj.category} cursor-pointer transition-all duration-200 stroke-white stroke-2`);
    path.setAttribute("data-hour", hourObj.hour);
    
    // Interactive mouse hovers
    path.addEventListener('mouseenter', () => {
      // Highlight segment
      path.setAttribute("opacity", "1.0");
      path.setAttribute("transform", "scale(1.02)");
      path.style.transformOrigin = `${cx}px ${cy}px`;
      updateCenterDisplay(hourObj);
    });
    
    path.addEventListener('mouseleave', () => {
      path.setAttribute("opacity", CATEGORY_META[hourObj.category].opacity || "0.85");
      path.setAttribute("transform", "scale(1)");
      resetCenterDisplay();
    });
    
    svg.appendChild(path);
    
    // Add hour numbers around the outer rim of the wheel (every 2 hours for readability)
    if (hourObj.hour % 2 === 0) {
      const angle = (hourObj.hour + 0.5) * 15 - 90;
      const textPos = polarToCartesian(cx, cy, outerRadius + 18, angle);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", textPos.x);
      text.setAttribute("y", textPos.y + 4);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "text-[10px] font-bold fill-slate-500");
      text.textContent = hourObj.hour.toString().padStart(2, '0');
      
      svg.appendChild(text);
    }
  });
  
  // Center info card (nested inside the donut hole)
  const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  centerCircle.setAttribute("cx", cx);
  centerCircle.setAttribute("cy", cy);
  centerCircle.setAttribute("r", innerRadius - 2);
  centerCircle.setAttribute("fill", "#ffffff");
  centerCircle.setAttribute("class", "shadow-sm filter drop-shadow-sm");
  svg.appendChild(centerCircle);
  
  // Text containers in SVG center
  const timeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  timeText.setAttribute("x", cx);
  timeText.setAttribute("y", cy - 25);
  timeText.setAttribute("text-anchor", "middle");
  timeText.setAttribute("class", "font-bold text-sm fill-slate-400 tracking-wider");
  timeText.setAttribute("id", "wheel-time");
  timeText.textContent = "CIRCADIAN CYCLE";
  svg.appendChild(timeText);
  
  const categoryText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  categoryText.setAttribute("x", cx);
  categoryText.setAttribute("y", cy + 5);
  categoryText.setAttribute("text-anchor", "middle");
  categoryText.setAttribute("class", "font-extrabold text-base fill-slate-800");
  categoryText.setAttribute("id", "wheel-category");
  categoryText.textContent = "Hover sectors";
  svg.appendChild(categoryText);
  
  const energyText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  energyText.setAttribute("x", cx);
  energyText.setAttribute("y", cy + 30);
  energyText.setAttribute("text-anchor", "middle");
  energyText.setAttribute("class", "text-xs fill-slate-500 font-semibold");
  energyText.setAttribute("id", "wheel-energy");
  energyText.textContent = "to view schedule";
  svg.appendChild(energyText);
  
  container.appendChild(svg);
}

function updateCenterDisplay(hourObj) {
  const meta = CATEGORY_META[hourObj.category];
  const tText = document.getElementById('wheel-time');
  const cText = document.getElementById('wheel-category');
  const eText = document.getElementById('wheel-energy');
  
  if (!tText || !cText || !eText) return;
  
  tText.textContent = `${hourObj.timeString} - ${((hourObj.hour + 1) % 24).toString().padStart(2, '0')}:00`;
  cText.textContent = meta.label;
  cText.setAttribute("fill", meta.colorHex);
  
  // Custom display for energy score
  let energyStr = `⚡ Cog Energy: ${hourObj.energy}%`;
  if (hourObj.warnings.length > 0) {
    energyStr = `⚠️ Energy: ${hourObj.energy}% (LOW)`;
  }
  eText.textContent = energyStr;
  eText.setAttribute("fill", hourObj.warnings.length > 0 ? "#ef4444" : "#475569");
}

function resetCenterDisplay() {
  const tText = document.getElementById('wheel-time');
  const cText = document.getElementById('wheel-category');
  const eText = document.getElementById('wheel-energy');
  
  if (!tText || !cText || !eText) return;
  
  tText.textContent = "CIRCADIAN CYCLE";
  tText.setAttribute("class", "font-bold text-sm fill-slate-400 tracking-wider");
  cText.textContent = "Hover sectors";
  cText.setAttribute("fill", "#1e293b");
  eText.textContent = "to view schedule";
  eText.setAttribute("fill", "#64748b");
}

// 2. Linear Timeline Blocks
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.hourlyData.forEach(hourObj => {
    const meta = CATEGORY_META[hourObj.category];
    const isWarn = hourObj.warnings.length > 0;
    
    const block = document.createElement('div');
    block.className = `flex flex-col md:flex-row items-start md:items-center p-4 rounded-xl border transition-all hover:shadow-md ${
      isWarn ? 'border-red-300 bg-red-50/70 hover:bg-red-50' : 'bg-white border-slate-100 hover:border-indigo-100'
    }`;
    
    // Time segment indicator
    const timeDiv = document.createElement('div');
    timeDiv.className = 'w-24 flex items-center gap-2 flex-shrink-0';
    timeDiv.innerHTML = `
      <span class="text-sm font-extrabold text-slate-800">${hourObj.timeString}</span>
      <span class="text-xs text-slate-400">to ${((hourObj.hour + 1) % 24).toString().padStart(2, '0')}:00</span>
    `;
    
    // Category tag
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'w-48 flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0';
    badgeDiv.innerHTML = `
      <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg ${meta.colorClass.split(' ')[0]} ${meta.colorClass.split(' ')[1]}">
        <i class="fas ${meta.icon} text-xs"></i>
      </span>
      <span class="text-xs font-bold ${meta.colorClass.split(' ')[1]}">${meta.label}</span>
    `;
    
    // Details block
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'flex-grow mt-2 md:mt-0 px-0 md:px-4';
    detailsDiv.innerHTML = `
      <p class="text-xs font-medium text-slate-600">${hourObj.description}</p>
      <p class="text-[11px] text-slate-400 mt-1 font-semibold italic text-indigo-600/90">${hourObj.advice}</p>
    `;
    
    // Energy levels
    const energyDiv = document.createElement('div');
    energyDiv.className = 'w-32 flex items-center justify-end gap-2 mt-2 md:mt-0 ml-auto flex-shrink-0';
    
    // Percentage bar
    const barColor = isWarn ? 'bg-red-500' : (hourObj.energy > 80 ? 'bg-amber-500' : (hourObj.energy > 60 ? 'bg-emerald-500' : 'bg-blue-400'));
    
    energyDiv.innerHTML = `
      <div class="flex flex-col items-end w-full">
        <span class="text-xs font-bold ${isWarn ? 'text-red-600' : 'text-slate-700'}">
          ${isWarn ? '⚠️ ' : ''}${hourObj.energy}% Energy
        </span>
        <div class="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
          <div class="h-full ${barColor}" style="width: ${hourObj.energy}%"></div>
        </div>
      </div>
    `;
    
    block.appendChild(timeDiv);
    block.appendChild(badgeDiv);
    block.appendChild(detailsDiv);
    block.appendChild(energyDiv);
    
    container.appendChild(block);
  });
}

// 3. Overall Scenario Health and Insights
function renderInsightsPanel() {
  const activeScen = getActiveScenario();
  const isSleepDeprived = activeScen.sleepHours < 6.5;
  const isOptimalSleep = activeScen.sleepHours >= 7.5 && activeScen.sleepHours <= 9;
  
  const scoreCard = document.getElementById('overall-health-card');
  const detailsList = document.getElementById('insights-details-list');
  
  if (!scoreCard || !detailsList) return;
  
  // Compute health score
  let score = 100;
  if (isSleepDeprived) {
    score -= (6.5 - activeScen.sleepHours) * 30; // Lose points for lack of sleep
  } else if (activeScen.sleepHours > 9.5) {
    score -= 15; // Oversleeping penalty
  }
  score = Math.max(10, Math.min(100, Math.round(score)));
  
  // Style scorecard
  let rating = "Optimal";
  let ringColor = "border-emerald-500 text-emerald-600";
  let bgClass = "bg-emerald-50";
  
  if (score < 60) {
    rating = "Severe Sleep Debt";
    ringColor = "border-red-500 text-red-600";
    bgClass = "bg-red-50";
  } else if (score < 85) {
    rating = "Moderate Recovery";
    ringColor = "border-amber-500 text-amber-600";
    bgClass = "bg-amber-50";
  }
  
  scoreCard.className = `flex flex-col items-center justify-center p-6 rounded-2xl ${bgClass} text-center border border-current/10`;
  scoreCard.innerHTML = `
    <div class="w-20 h-20 rounded-full border-4 ${ringColor} flex items-center justify-center font-black text-2xl bg-white mb-3">
      ${score}
    </div>
    <span class="text-xs uppercase tracking-wider text-slate-500 font-bold">Circadian Score</span>
    <span class="font-extrabold text-slate-800 text-base mt-0.5">${rating}</span>
  `;
  
  // Construct list of bullet points
  const listItems = [];
  
  if (isSleepDeprived) {
    listItems.push({
      type: 'warning',
      title: 'Sleep Debt Warning',
      text: `With only ${activeScen.sleepHours} hours of sleep, your prefrontal cortex operates at reduced capacity. You will experience higher impulsivity and shorter attention spans.`
    });
    listItems.push({
      type: 'tip',
      title: 'Strategic Scheduling',
      text: 'Avoid scheduling critical reviews or legal contracts today. Focus on execution-only tasks during your Peak (centered at ' + activeScen.peakTime + ').'
    });
    listItems.push({
      type: 'action',
      title: 'Caffeine Timing',
      text: 'Delay your first cup of coffee by 2 hours. Do not consume caffeine past ' + formatFloatToTime((parseTimeToFloat(activeScen.dipTime) - 1.5 + 24) % 24) + ' to ensure you can fall asleep on time tonight.'
    });
    listItems.push({
      type: 'action',
      title: 'Scheduled Micro-Recovery',
      text: 'We injected a mandatory Recovery/Nap slot at ' + activeScen.dipTime + '. Close your eyes for 20 minutes to reset adenosine build-up.'
    });
  } else if (isOptimalSleep) {
    listItems.push({
      type: 'success',
      title: 'Excellent Recovery Base',
      text: `Your ${activeScen.sleepHours}-hour sleep foundation allows for fully loaded 3-hour focus blocks. Your brain glymphatic cycle completed all clearing stages.`
    });
    listItems.push({
      type: 'tip',
      title: 'Max Productivity Window',
      text: `Optimize your day: Lock yourself away from notifications between ${formatFloatToTime((parseTimeToFloat(activeScen.peakTime) - 1.5 + 24) % 24)} and ${formatFloatToTime((parseTimeToFloat(activeScen.peakTime) + 1.5) % 24)}. This is your absolute cognitive peak.`
    });
    listItems.push({
      type: 'success',
      title: 'Perfect Wind Down Buffer',
      text: 'You have a healthy 2-hour melatonin buildup cycle before sleep. Keep lighting low to prevent circadian shift.'
    });
  } else {
    // Over 9 hours
    listItems.push({
      type: 'info',
      title: 'Extended Sleep',
      text: `Sleeping ${activeScen.sleepHours} hours might cause sleep inertia (grogginess) in the morning. Ensure you seek instant sunlight to boot up.`
    });
  }
  
  detailsList.innerHTML = '';
  listItems.forEach(item => {
    let borderC = 'border-slate-200 bg-slate-50 text-slate-800';
    let icon = 'fa-info-circle text-slate-500';
    
    if (item.type === 'warning') {
      borderC = 'border-red-200 bg-red-50 text-red-900';
      icon = 'fa-exclamation-triangle text-red-500';
    } else if (item.type === 'success') {
      borderC = 'border-emerald-200 bg-emerald-50 text-emerald-950';
      icon = 'fa-check-circle text-emerald-600';
    } else if (item.type === 'tip') {
      borderC = 'border-amber-200 bg-amber-50/70 text-amber-900';
      icon = 'fa-lightbulb text-amber-500';
    } else if (item.type === 'action') {
      borderC = 'border-indigo-200 bg-indigo-50/70 text-indigo-900';
      icon = 'fa-bolt text-indigo-500';
    }
    
    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border flex items-start gap-3 shadow-sm ${borderC}`;
    card.innerHTML = `
      <i class="fas ${icon} mt-1 text-sm flex-shrink-0"></i>
      <div>
        <h4 class="font-extrabold text-xs uppercase tracking-wide">${item.title}</h4>
        <p class="text-xs font-medium mt-1">${item.text}</p>
      </div>
    `;
    detailsList.appendChild(card);
  });
}

function renderDashboard() {
  drawCircadianWheel();
  renderTimeline();
  renderInsightsPanel();
}

// --- Form & Action Submissions ---

function setupEventListeners() {
  const form = document.getElementById('scheduler-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('input-name').value.trim() || 'Custom Scenario';
      const sleepHours = parseFloat(document.getElementById('input-sleep').value) || 8.0;
      const wakeTime = document.getElementById('input-wake').value;
      const peakTime = document.getElementById('input-peak').value;
      const dipTime = document.getElementById('input-dip').value;
      const midTime = document.getElementById('input-mid').value;
      
      const currentActive = getActiveScenario();
      
      if (currentActive.isSystem) {
        // Create new custom scenario if currently viewing system default
        const newId = 'custom-' + Date.now();
        const newScenario = {
          id: newId,
          name: name === currentActive.name ? `${name} (Copy)` : name,
          sleepHours,
          wakeTime,
          peakTime,
          dipTime,
          midTime,
          isSystem: false
        };
        state.scenarios.push(newScenario);
        state.currentScenarioId = newId;
      } else {
        // Edit existing custom scenario
        currentActive.name = name;
        currentActive.sleepHours = sleepHours;
        currentActive.wakeTime = wakeTime;
        currentActive.peakTime = peakTime;
        currentActive.dipTime = dipTime;
        currentActive.midTime = midTime;
      }
      
      saveScenariosToStorage();
      renderScenarioList();
      selectScenario(state.currentScenarioId);
    });
  }
  
  // "Save as Copy" button
  const saveCopyBtn = document.getElementById('btn-save-copy');
  if (saveCopyBtn) {
    saveCopyBtn.addEventListener('click', () => {
      const name = document.getElementById('input-name').value.trim() || 'Custom Scenario';
      const sleepHours = parseFloat(document.getElementById('input-sleep').value) || 8.0;
      const wakeTime = document.getElementById('input-wake').value;
      const peakTime = document.getElementById('input-peak').value;
      const dipTime = document.getElementById('input-dip').value;
      const midTime = document.getElementById('input-mid').value;
      
      const newId = 'custom-' + Date.now();
      const newScenario = {
        id: newId,
        name: name + ' (Custom Copy)',
        sleepHours,
        wakeTime,
        peakTime,
        dipTime,
        midTime,
        isSystem: false
      };
      
      state.scenarios.push(newScenario);
      state.currentScenarioId = newId;
      saveScenariosToStorage();
      renderScenarioList();
      selectScenario(newId);
    });
  }
}

// Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  loadScenarios();
  renderScenarioList();
  
  // Set default initial scenario state
  selectScenario(state.currentScenarioId);
  setupEventListeners();
});

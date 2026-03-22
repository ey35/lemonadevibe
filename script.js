// ===== LEMONADE EMPIRE — game.js =====

// ─── GAME STATE ────────────────────────────────────────────────────────────
const G = {
  money: 10,
  day: 1,
  weather: 'sunny',
  rep: 50,          // 0–100 reputation
  cups: 0,          // cups in stock
  price: 1.00,
  recipe: { lemons: 2, sugar: 1, ice: 1 },
  batch: 10,
  dayProfit: 0,
  selling: false,
  // stats
  totalSold: 0,
  totalEarned: 0,
  bestDay: 0,
  totalCustomers: 0,
  totalWasted: 0,
  dailyRevenue: [],
  achievementsUnlocked: new Set(),
  // upgrades owned (key → level)
  upgrades: {},
};

// ─── UPGRADE DEFINITIONS ──────────────────────────────────────────────────
const UPGRADES = {
  // EQUIPMENT
  pitcher: {
    id:'pitcher', name:'Better Pitcher', icon:'🫗', tab:'equipment',
    desc:'Bigger pitcher means faster lemonade prep, reducing batch cost.',
    maxLevel: 3,
    costs: [20, 60, 150],
    effects: ['Batch cost -10%','Batch cost -20%','Batch cost -30%'],
  },
  blender: {
    id:'blender', name:'Electric Blender', icon:'⚡', tab:'equipment',
    desc:'Blend ingredients faster. Increase max batch size.',
    maxLevel: 3,
    costs: [35, 90, 200],
    effects: ['+10 max batch','+25 max batch','+50 max batch'],
  },
  icebox: {
    id:'icebox', name:'Ice Box', icon:'🧊', tab:'equipment',
    desc:'Keep lemonade cold longer. Boosts quality in hot weather.',
    maxLevel: 2,
    costs: [25, 75],
    effects: ['Quality +1 in heat','Quality +2 in heat'],
  },
  sign: {
    id:'sign', name:'Fancy Sign', icon:'📋', tab:'equipment',
    desc:'A professional sign draws more foot traffic.',
    maxLevel: 3,
    costs: [15, 50, 120],
    effects: ['+10% customers','+20% customers','+35% customers'],
  },
  umbrella: {
    id:'umbrella', name:'Stand Umbrella', icon:'☂️', tab:'equipment',
    desc:'Protects from rain and shade. Helps on rainy and hot days.',
    maxLevel: 1,
    costs: [40],
    effects: ['Rain/Heat penalty -50%'],
  },
  cups_upgrade: {
    id:'cups_upgrade', name:'Premium Cups', icon:'🥤', tab:'equipment',
    desc:'Fancy cups increase perceived value.',
    maxLevel: 2,
    costs: [30, 80],
    effects: ['Price ceiling +$0.50','Price ceiling +$1.00'],
  },
  // MARKETING
  flyer: {
    id:'flyer', name:'Flyers', icon:'📄', tab:'marketing',
    desc:'Hand out flyers to boost daily customer count.',
    maxLevel: 3,
    costs: [10, 30, 70],
    effects: ['+5 base customers','+12 base customers','+20 base customers'],
  },
  social: {
    id:'social', name:'Social Media', icon:'📱', tab:'marketing',
    desc:'Go viral! Big reputation boost and more customers.',
    maxLevel: 2,
    costs: [60, 150],
    effects: ['Rep +10, +15% customers','Rep +20, +25% customers'],
  },
  loyalty: {
    id:'loyalty', name:'Loyalty Cards', icon:'🎫', tab:'marketing',
    desc:'Regulars come back more often and pay premium.',
    maxLevel: 2,
    costs: [45, 110],
    effects: ['+15% repeat customers','+30% repeat customers'],
  },
  banner: {
    id:'banner', name:'Grand Banner', icon:'🎪', tab:'marketing',
    desc:'Huge banner visible from afar — major traffic boost.',
    maxLevel: 1,
    costs: [100],
    effects: ['+30 base customers'],
  },
  discount: {
    id:'discount', name:'Happy Hour', icon:'⏰', tab:'marketing',
    desc:'Run a happy hour — sell leftover cups at discount to avoid waste.',
    maxLevel: 1,
    costs: [35],
    effects: ['Sell leftover cups at 50% price'],
  },
  // SPECIAL
  lemon_tree: {
    id:'lemon_tree', name:'Lemon Tree', icon:'🌳', tab:'special',
    desc:'Grow your own lemons! Reduces lemon cost significantly.',
    maxLevel: 3,
    costs: [80, 200, 500],
    effects: ['Lemon cost -20%','Lemon cost -40%','Lemon cost -60%'],
  },
  secret_recipe: {
    id:'secret_recipe', name:'Secret Recipe', icon:'📖', tab:'special',
    desc:'A mysterious recipe that boosts quality and rep gain per sale.',
    maxLevel: 1,
    costs: [150],
    effects: ['Quality +2, Rep gain +50%'],
  },
  lemonade_stand2: {
    id:'lemonade_stand2', name:'Second Stand', icon:'🏪', tab:'special',
    desc:'Open a second stand! Double your selling capacity.',
    maxLevel: 1,
    costs: [300],
    effects: ['2x cups sold per day'],
  },
  robot: {
    id:'robot', name:'Lemonade Robot', icon:'🤖', tab:'special',
    desc:'Automate your stand! Sell even on days you don\'t stock up.',
    maxLevel: 1,
    costs: [500],
    effects: ['Auto-makes 5 cups each morning'],
  },
  golden_lemon: {
    id:'golden_lemon', name:'Golden Lemon', icon:'🌟', tab:'special',
    desc:'A legendary lemon that triples your reputation gain.',
    maxLevel: 1,
    costs: [750],
    effects: ['Rep gain x3'],
  },
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_sale',  icon:'🍋', name:'First Squeeze',    desc:'Make your first sale',                 check: ()=> G.totalSold >= 1 },
  { id:'ten_cups',    icon:'🥤', name:'Ten Cup Club',      desc:'Sell 10 cups in one day',              check: ()=> false /* set on day end */ },
  { id:'hundred_cups',icon:'💯', name:'Century Stand',     desc:'Sell 100 cups total',                  check: ()=> G.totalSold >= 100 },
  { id:'rep_max',     icon:'⭐', name:'Town Legend',       desc:'Reach max reputation',                 check: ()=> G.rep >= 100 },
  { id:'ten_days',    icon:'📅', name:'Ten Day Veteran',   desc:'Survive 10 days',                      check: ()=> G.day >= 10 },
  { id:'rich',        icon:'💰', name:'Lemon Millionaire', desc:'Accumulate $500 total',                check: ()=> G.totalEarned >= 500 },
  { id:'best50',      icon:'📈', name:'Golden Day',        desc:'Earn $50 in a single day',             check: ()=> G.bestDay >= 50 },
  { id:'all_equip',   icon:'⚙️', name:'Fully Equipped',   desc:'Buy all equipment upgrades',           check: checkAllEquipment },
  { id:'no_waste',    icon:'♻️', name:'Zero Waste Hero',   desc:'End a day with 0 wasted cups (10+ made)',check: ()=> false /* set on day end */ },
  { id:'rainy_day',   icon:'🌧️', name:'Rain or Shine',    desc:'Make a profit on a rainy day',         check: ()=> false /* set on day end */ },
];

function checkAllEquipment() {
  return ['pitcher','blender','icebox','sign','umbrella','cups_upgrade'].every(id => (G.upgrades[id]||0) >= 1);
}

// ─── WEATHER SYSTEM ───────────────────────────────────────────────────────
const WEATHERS = [
  { id:'sunny',   label:'☀️ Sunny',     custMult:1.0,  priceMult:1.0,  iceMult:1.0  },
  { id:'hot',     label:'🔥 Scorching', custMult:1.4,  priceMult:1.15, iceMult:1.3  },
  { id:'cloudy',  label:'⛅ Cloudy',    custMult:0.75, priceMult:0.9,  iceMult:0.7  },
  { id:'rainy',   label:'🌧️ Rainy',    custMult:0.45, priceMult:0.8,  iceMult:0.5  },
  { id:'windy',   label:'💨 Windy',     custMult:0.85, priceMult:0.9,  iceMult:0.8  },
  { id:'perfect', label:'🌈 Perfect',   custMult:1.6,  priceMult:1.2,  iceMult:1.2  },
];

function getWeather() {
  const w = WEATHERS.find(w => w.id === G.weather);
  return w || WEATHERS[0];
}

function rollWeather() {
  const weights = [30, 15, 20, 12, 10, 13];
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
  for (let i = 0; i < WEATHERS.length; i++) {
    r -= weights[i];
    if (r <= 0) { G.weather = WEATHERS[i].id; return; }
  }
  G.weather = 'sunny';
}

// ─── RANDOM EVENTS ────────────────────────────────────────────────────────
const EVENTS = [
  { chance: 0.08, msg: '🎪 A local fair nearby — extra customers today!', custBonus: 20, moneyBonus: 0 },
  { chance: 0.06, msg: '📰 You were featured in the school paper! Rep +10', custBonus: 5, repBonus: 10 },
  { chance: 0.05, msg: '🚌 Tour bus stopped nearby — lots of thirsty tourists!', custBonus: 30, moneyBonus: 0 },
  { chance: 0.07, msg: '😤 A health inspector visited — found nothing wrong! Rep +5', custBonus: 0, repBonus: 5 },
  { chance: 0.04, msg: '🎤 Local influencer posted about your stand! +25 customers', custBonus: 25, moneyBonus: 0 },
  { chance: 0.06, msg: '🔧 Your pitcher cracked — batch cost +$2 today', custBonus: 0, extraCost: 2 },
  { chance: 0.04, msg: '🐝 Bee swarm nearby — customers scared away! -15 customers', custBonus: -15, moneyBonus: 0 },
  { chance: 0.03, msg: '💸 Found a $5 bill on the ground! Lucky!', custBonus: 0, moneyBonus: 5 },
];

// ─── COST HELPERS ─────────────────────────────────────────────────────────
function getLemonCost() {
  let base = 0.30;
  const lvl = G.upgrades['lemon_tree'] || 0;
  const discounts = [0, 0.20, 0.40, 0.60];
  return base * (1 - discounts[lvl]);
}

function getSugarCost() { return 0.10; }
function getIceCost()   { return 0.05; }

function getCostPerCup() {
  const { lemons, sugar, ice } = G.recipe;
  let cost = lemons * getLemonCost() + sugar * getSugarCost() + ice * getIceCost();
  // pitcher discount
  const pLvl = G.upgrades['pitcher'] || 0;
  const pDisc = [0, 0.10, 0.20, 0.30];
  cost *= (1 - pDisc[pLvl]);
  return cost;
}

function getBatchCost() {
  return getCostPerCup() * G.batch;
}

function getMaxBatch() {
  let max = 30;
  const lvl = G.upgrades['blender'] || 0;
  const bonuses = [0, 10, 25, 50];
  return max + bonuses[lvl];
}

// ─── QUALITY ──────────────────────────────────────────────────────────────
function getQuality() {
  const { lemons, sugar, ice } = G.recipe;
  let q = 0;
  // lemons 1-5 → quality 0-5, sweet spot around 2-3
  if (lemons === 0) q -= 2;
  else if (lemons === 1) q += 1;
  else if (lemons === 2) q += 3;
  else if (lemons === 3) q += 2;
  else if (lemons >= 4) q += 1;
  // sugar
  if (sugar === 0) q -= 1;
  else if (sugar === 1) q += 2;
  else if (sugar === 2) q += 1;
  // ice
  const w = getWeather();
  if (ice >= 1) q += (w.iceMult > 1 ? 2 : 1);
  // upgrades
  if (G.upgrades['icebox'] && (G.weather === 'hot' || G.weather === 'perfect')) q += G.upgrades['icebox'];
  if (G.upgrades['secret_recipe']) q += 2;
  return Math.max(1, Math.min(5, Math.round(q)));
}

function qualityStars(q) {
  return '⭐'.repeat(q) + '☆'.repeat(Math.max(0,5-q));
}

// ─── DEMAND / PRICING ─────────────────────────────────────────────────────
function getDemandMultiplier() {
  const costPerCup = getCostPerCup();
  const ratio = G.price / Math.max(0.05, costPerCup);
  // ratio 1 = selling at cost = very low (but still some sales)
  // ratio 2 = 2x markup = moderate
  // ratio 4+ = very low demand
  if (ratio < 1) return 1.3;
  if (ratio < 1.5) return 1.15;
  if (ratio < 2) return 1.0;
  if (ratio < 2.5) return 0.85;
  if (ratio < 3) return 0.65;
  if (ratio < 4) return 0.4;
  return 0.2;
}

function getDemandPercent() {
  // 0–100 visual indicator
  return Math.round(Math.min(100, Math.max(5, getDemandMultiplier() * 75)));
}

function getDemandLabel(pct) {
  if (pct >= 85) return '🔥 Excellent';
  if (pct >= 65) return '👍 Good';
  if (pct >= 45) return '😐 Moderate';
  if (pct >= 25) return '😕 Low';
  return '💀 Very Low';
}

// ─── RECIPE ADJUSTMENT ────────────────────────────────────────────────────
function adjustRecipe(ingredient, delta) {
  const min = 0, max = 5;
  G.recipe[ingredient] = Math.max(min, Math.min(max, G.recipe[ingredient] + delta));
  updateRecipeUI();
}

function adjustPrice(delta) {
  const maxPrice = 3.00 + (G.upgrades['cups_upgrade'] || 0) * 0.50;
  G.price = Math.max(0.25, Math.min(maxPrice, parseFloat((G.price + delta).toFixed(2))));
  updateRecipeUI();
  updateDemandBar();
}

function adjustBatch(delta) {
  G.batch = Math.max(1, Math.min(getMaxBatch(), G.batch + delta));
  updateMakeUI();
}

// ─── MAKE LEMONADE ────────────────────────────────────────────────────────
function makeLemonade() {
  if (G.selling) { notify('⚠️ Can\'t restock while selling!'); return; }
  const cost = getBatchCost();
  if (cost > G.money) { notify('❌ Not enough money!'); return; }
  G.money -= cost;
  G.cups += G.batch;
  addLog(`🍋 Made ${G.batch} cups for $${cost.toFixed(2)}`, 'log-info');
  updateAll();
  animatePitcher();
}

function animatePitcher() {
  const el = document.getElementById('stand-pitcher');
  el.style.transform = 'scale(1.5) rotate(-20deg)';
  setTimeout(() => el.style.transform = '', 400);
}

// ─── OPEN SHOP ────────────────────────────────────────────────────────────
function openShop() {
  if (G.selling) return;
  if (G.cups === 0) { notify('❌ No cups to sell! Make some lemonade first.'); return; }
  G.selling = true;
  G.dayProfit = 0;

  const sellBtn = document.getElementById('sell-btn');
  const progressWrap = document.getElementById('sell-progress-wrap');
  sellBtn.style.display = 'none';
  progressWrap.style.display = 'block';

  // Roll random event
  let eventCustBonus = 0;
  let eventRepBonus  = 0;
  let eventExtraCost = 0;
  for (const ev of EVENTS) {
    if (Math.random() < ev.chance) {
      addLog(ev.msg, 'log-event');
      eventCustBonus += ev.custBonus || 0;
      eventRepBonus  += ev.repBonus  || 0;
      eventExtraCost += ev.extraCost || 0;
      if (ev.moneyBonus) { G.money += ev.moneyBonus; addLog(`💸 +$${ev.moneyBonus} bonus!`, 'log-sale'); }
      break; // one event per day
    }
  }
  if (eventExtraCost > 0) G.money = Math.max(0, G.money - eventExtraCost);

  // Calculate customers
  const w = getWeather();
  let baseCustomers = 15;
  // rep effect
  baseCustomers += Math.round((G.rep - 50) / 10);
  // weather
  baseCustomers = Math.round(baseCustomers * w.custMult);
  // upgrades
  const signLvl = G.upgrades['sign'] || 0;
  const signBonus = [1, 1.10, 1.20, 1.35];
  baseCustomers = Math.round(baseCustomers * signBonus[signLvl]);

  const flyerLvl = G.upgrades['flyer'] || 0;
  const flyerBonus = [0, 5, 12, 20];
  baseCustomers += flyerBonus[flyerLvl];

  if (G.upgrades['banner']) baseCustomers += 30;

  const socialLvl = G.upgrades['social'] || 0;
  const socialBonus = [1, 1.15, 1.25];
  baseCustomers = Math.round(baseCustomers * socialBonus[socialLvl]);

  const loyaltyLvl = G.upgrades['loyalty'] || 0;
  const loyaltyBonus = [1, 1.15, 1.30];
  baseCustomers = Math.round(baseCustomers * loyaltyBonus[loyaltyLvl]);

  if (G.upgrades['lemonade_stand2']) baseCustomers = Math.round(baseCustomers * 2);
  baseCustomers = Math.round(baseCustomers * getDemandMultiplier());

  // umbrella
  if (G.upgrades['umbrella']) {
    if (G.weather === 'rainy' || G.weather === 'hot') baseCustomers = Math.round(baseCustomers * 1.5);
  }

  baseCustomers += eventCustBonus;
  baseCustomers = Math.max(0, baseCustomers);

  // jitter
  const customers = Math.max(0, baseCustomers + Math.floor((Math.random()-0.5)*6));
  const quality   = getQuality();

  // Simulate selling day
  let cupsToSell = Math.min(G.cups, customers);
  let soldCount  = 0;
  let revenue    = 0;
  let repGain    = 0;
  const steps    = 30;
  let step       = 0;
  const startCups = G.cups;
  const startStock = G.cups;

  // Show customers
  showCustomers(Math.min(customers, 8));

  const interval = setInterval(() => {
    step++;
    const pct = (step / steps) * 100;
    document.getElementById('sell-progress-fill').style.width = pct + '%';

    // Sell batch per tick
    const batch = Math.floor(cupsToSell / steps) + (step <= (cupsToSell % steps) ? 1 : 0);
    const actualSold = Math.min(batch, G.cups);
    if (actualSold > 0) {
      G.cups -= actualSold;
      revenue += actualSold * G.price;
      G.money += actualSold * G.price;
      soldCount += actualSold;
      repGain += actualSold * 0.3 * (quality / 3);
      if (G.upgrades['secret_recipe']) repGain *= 1.5;
      G.totalSold += actualSold;
      G.totalEarned += actualSold * G.price;
    }

    const status = `Selling... ${soldCount} cups sold | $${revenue.toFixed(2)}`;
    document.getElementById('sell-status').textContent = status;
    updateCupsDisplay();
    updateMoneyDisplay();

    if (step >= steps) {
      clearInterval(interval);
      G.selling = false;
      G.dayProfit = revenue;

      // Happy hour — sell leftovers at 50%
      if (G.upgrades['discount'] && G.cups > 0) {
        const leftover = G.cups;
        const halfRevenue = leftover * G.price * 0.5;
        G.money += halfRevenue;
        G.totalEarned += halfRevenue;
        revenue += halfRevenue;
        G.dayProfit += halfRevenue;
        addLog(`⏰ Happy Hour! Sold ${leftover} leftover cups for $${halfRevenue.toFixed(2)}`, 'log-sale');
        G.totalWasted += 0;
        G.cups = 0;
      } else {
        const wasted = G.cups;
        G.totalWasted += wasted;
        if (wasted > 0) addLog(`🗑️ ${wasted} cups went unsold and were wasted.`, 'log-bad');
      }

      // Apply rep change
      if (soldCount > 0) repGain += eventRepBonus;
      if (G.upgrades['golden_lemon']) repGain *= 3;
      G.rep = Math.round(Math.min(100, Math.max(0, G.rep + repGain - (customers > soldCount ? 1 : 0))));

      G.totalCustomers += soldCount;
      if (G.dayProfit > G.bestDay) G.bestDay = G.dayProfit;
      G.dailyRevenue.push(parseFloat(G.dayProfit.toFixed(2)));

      addLog(`📊 Day ${G.day} done: sold ${soldCount}/${customers} customers | Revenue: $${revenue.toFixed(2)}`, 'log-system');

      // Achievements
      if (soldCount >= 10) tryUnlock('ten_cups');
      if (G.cups === 0 && startStock >= 10) tryUnlock('no_waste');
      if (G.weather === 'rainy' && G.dayProfit > 0) tryUnlock('rainy_day');
      checkAllAchievements();

      // Show end of day modal
      setTimeout(() => showEndOfDay(soldCount, customers, revenue, startStock - soldCount), 800);
      sellBtn.style.display = '';
      progressWrap.style.display = 'none';
      clearCustomers();
      updateAll();
    }
  }, 120);
}

function showEndOfDay(sold, customers, revenue, wasted) {
  const w = getWeather();
  document.getElementById('modal-title').textContent = `Day ${G.day} Summary 🍋`;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-stat"><span>Weather</span><span>${w.label}</span></div>
    <div class="modal-stat"><span>Customers</span><span>${customers}</span></div>
    <div class="modal-stat"><span>Cups Sold</span><span>${sold}</span></div>
    <div class="modal-stat"><span>Wasted</span><span>${Math.max(0,wasted)}</span></div>
    <div class="modal-stat"><span>Revenue</span><span>$${revenue.toFixed(2)}</span></div>
    <div class="modal-stat"><span>Reputation</span><span>${G.rep}/100</span></div>
    <div class="modal-stat"><span>Total Cash</span><span>$${G.money.toFixed(2)}</span></div>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function nextDay() {
  document.getElementById('modal-overlay').style.display = 'none';
  G.day++;
  G.dayProfit = 0;
  G.cups = 0;
  rollWeather();

  // Robot auto-makes
  if (G.upgrades['robot']) {
    G.cups += 5;
    addLog('🤖 Your robot made 5 cups automatically!', 'log-info');
  }

  addLog(`━━━ DAY ${G.day} begins — ${getWeather().label} ━━━`, 'log-system');
  updateAll();
}

// ─── CUSTOMER ANIMATION ───────────────────────────────────────────────────
const CUSTOMER_EMOJIS = ['👧','👦','👨','👩','👴','👵','🧑','🧒','👮','🧑‍🎓'];
function showCustomers(n) {
  const queue = document.getElementById('customer-queue');
  queue.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'customer';
    el.textContent = CUSTOMER_EMOJIS[i % CUSTOMER_EMOJIS.length];
    el.style.animationDelay = (i * 0.15) + 's';
    queue.appendChild(el);
  }
}
function clearCustomers() {
  document.getElementById('customer-queue').innerHTML = '';
}

// ─── LOG ──────────────────────────────────────────────────────────────────
function addLog(msg, cls = 'log-info') {
  const log = document.getElementById('event-log');
  const el  = document.createElement('div');
  el.className = `log-entry ${cls}`;
  el.textContent = msg;
  log.prepend(el);
  if (log.children.length > 80) log.lastChild.remove();
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────
function notify(msg) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._notifTimeout);
  window._notifTimeout = setTimeout(() => el.classList.remove('show'), 2800);
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────
function tryUnlock(id) {
  if (G.achievementsUnlocked.has(id)) return;
  const a = ACHIEVEMENTS.find(a => a.id === id);
  if (!a) return;
  G.achievementsUnlocked.add(id);
  showAchievementPopup(a);
  renderAchievements();
}

function checkAllAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!G.achievementsUnlocked.has(a.id) && a.check()) tryUnlock(a.id);
  }
}

function showAchievementPopup(a) {
  const el = document.getElementById('achievement-popup');
  el.innerHTML = `🏆 Achievement Unlocked!<br><strong>${a.icon} ${a.name}</strong><br><small>${a.desc}</small>`;
  el.classList.add('show');
  clearTimeout(window._achieveTimeout);
  window._achieveTimeout = setTimeout(() => el.classList.remove('show'), 3500);
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = '';
  for (const a of ACHIEVEMENTS) {
    const unlocked = G.achievementsUnlocked.has(a.id);
    const card = document.createElement('div');
    card.className = `achieve-card ${unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="achieve-icon">${unlocked ? a.icon : '🔒'}</div>
      <div class="achieve-info">
        <div class="achieve-name">${a.name}</div>
        <div class="achieve-desc">${unlocked ? a.desc : '???'}</div>
      </div>
    `;
    grid.appendChild(card);
  }
}

// ─── SHOP ─────────────────────────────────────────────────────────────────
function renderShop() {
  ['equipment','marketing','special'].forEach(tab => {
    const container = document.getElementById(`shop-${tab}`);
    container.innerHTML = '';
    const tabUpgrades = Object.values(UPGRADES).filter(u => u.tab === tab);
    for (const upg of tabUpgrades) {
      const lvl = G.upgrades[upg.id] || 0;
      const maxed = lvl >= upg.maxLevel;
      const cost  = maxed ? null : upg.costs[lvl];
      const canAfford = cost !== null && G.money >= cost;

      const card = document.createElement('div');
      card.className = `upgrade-card ${maxed ? 'maxed' : (!canAfford ? 'locked' : '')}`;
      // Level dots
      let dots = '';
      for (let i = 0; i < upg.maxLevel; i++) {
        dots += `<span class="dot ${i < lvl ? 'filled' : ''}"></span>`;
      }
      card.innerHTML = `
        <div class="upgrade-header">
          <span class="upgrade-icon">${upg.icon}</span>
          <span class="upgrade-name">${upg.name}</span>
          <span class="upgrade-level">Lv ${lvl}/${upg.maxLevel}</span>
        </div>
        <div class="upgrade-level-dots">${dots}</div>
        <div class="upgrade-desc">${upg.desc}</div>
        <div class="upgrade-footer">
          <span class="upgrade-effect">${maxed ? '✅ Maxed' : (cost ? `Next: ${upg.effects[lvl]}` : '')}</span>
          ${maxed
            ? '<button class="buy-btn maxed-btn" disabled>MAX</button>'
            : `<button class="buy-btn" ${canAfford?'':'disabled'} onclick="buyUpgrade('${upg.id}')">$${cost?.toFixed(2)}</button>`
          }
        </div>
      `;
      container.appendChild(card);
    }
  });
}

function buyUpgrade(id) {
  const upg = UPGRADES[id];
  const lvl = G.upgrades[id] || 0;
  if (lvl >= upg.maxLevel) return;
  const cost = upg.costs[lvl];
  if (G.money < cost) { notify('❌ Not enough money!'); return; }
  G.money -= cost;
  G.upgrades[id] = lvl + 1;
  // social media rep bonus
  if (id === 'social') {
    const bonuses = [10, 20];
    G.rep = Math.min(100, G.rep + bonuses[lvl]);
  }
  addLog(`⬆️ Upgraded: ${upg.name} → Level ${G.upgrades[id]}`, 'log-system');
  notify(`✅ ${upg.name} upgraded!`);
  checkAllAchievements();
  updateAll();
}

function switchShopTab(tab) {
  document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.shop-tab[onclick*="${tab}"]`).classList.add('active');
  document.getElementById(`shop-${tab}`).classList.add('active');
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (tab === 'stats') drawChart();
  if (tab === 'achievements') renderAchievements();
}

// ─── CHART ────────────────────────────────────────────────────────────────
function drawChart() {
  const canvas = document.getElementById('revenue-chart');
  const ctx = canvas.getContext('2d');
  const data = G.dailyRevenue;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (data.length === 0) {
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet — sell some lemonade!', W/2, H/2);
    return;
  }
  const max = Math.max(...data, 1);
  const padL = 40, padR = 10, padT = 10, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;
  const barW = Math.min(40, cW / data.length - 4);
  const gap  = cW / data.length;

  // Axes
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H-padB); ctx.lineTo(W-padR, H-padB); ctx.stroke();

  // Y labels
  ctx.fillStyle = '#999'; ctx.font = '11px Nunito'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padT + cH - (i/4)*cH;
    const val = (max * i/4).toFixed(0);
    ctx.fillText('$'+val, padL-4, y+4);
    ctx.strokeStyle = '#eee'; ctx.lineWidth = .5;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W-padR, y); ctx.stroke();
  }

  // Bars
  data.forEach((v, i) => {
    const x = padL + i * gap + (gap - barW) / 2;
    const barH = (v / max) * cH;
    const y = padT + cH - barH;
    // gradient
    const grad = ctx.createLinearGradient(0, y, 0, y+barH);
    grad.addColorStop(0, '#FFD93D');
    grad.addColorStop(1, '#FF6B35');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4,4,0,0]);
    ctx.fill();
    // day label
    ctx.fillStyle = '#888'; ctx.font = '10px Nunito'; ctx.textAlign = 'center';
    ctx.fillText(`D${i+1}`, x + barW/2, H - padB + 14);
  });
}

// ─── UI UPDATES ───────────────────────────────────────────────────────────
function updateMoneyDisplay() {
  document.getElementById('money-display').textContent = `$${G.money.toFixed(2)}`;
  document.getElementById('money-pill').style.background = G.money < 1 ? 'rgba(239,83,80,.5)' : 'rgba(255,255,255,.25)';
}
function updateCupsDisplay() {
  document.getElementById('cups-display').textContent = `${G.cups} cups`;
  document.getElementById('stock-count').textContent   = G.cups;
}

function updateRecipeUI() {
  document.getElementById('lemons-val').textContent = G.recipe.lemons;
  document.getElementById('sugar-val').textContent  = G.recipe.sugar;
  document.getElementById('ice-val').textContent    = G.recipe.ice;
  document.getElementById('lemon-cost').textContent  = getLemonCost().toFixed(2);
  document.getElementById('sugar-cost').textContent  = getSugarCost().toFixed(2);
  document.getElementById('ice-cost').textContent    = getIceCost().toFixed(2);
  const cpp = getCostPerCup();
  document.getElementById('cost-per-cup').textContent = `$${cpp.toFixed(2)}`;
  document.getElementById('quality-stars').textContent = qualityStars(getQuality());
  document.getElementById('price-display').textContent = `$${G.price.toFixed(2)}`;
  document.getElementById('sign-price').textContent = `$${G.price.toFixed(2)}/cup`;
  updateDemandBar();
}

function updateDemandBar() {
  const pct = getDemandPercent();
  document.getElementById('demand-fill').style.width = pct + '%';
  document.getElementById('demand-fill').style.background =
    pct >= 65 ? 'linear-gradient(90deg,#4CAF50,#8BC34A)' :
    pct >= 40 ? 'linear-gradient(90deg,#FFC107,#FF9800)' :
                'linear-gradient(90deg,#EF5350,#E53935)';
  document.getElementById('demand-label').textContent = getDemandLabel(pct);
}

function updateMakeUI() {
  document.getElementById('batch-val').textContent   = G.batch;
  document.getElementById('batch-cost').textContent  = `$${getBatchCost().toFixed(2)}`;
  document.getElementById('cash-available').textContent = `$${G.money.toFixed(2)}`;
  const makeBtn = document.getElementById('make-btn');
  makeBtn.disabled = getBatchCost() > G.money || G.selling;
}

function updateStatsUI() {
  document.getElementById('stat-total-sold').textContent  = G.totalSold;
  document.getElementById('stat-total-earned').textContent = `$${G.totalEarned.toFixed(2)}`;
  document.getElementById('stat-best-day').textContent    = `$${G.bestDay.toFixed(2)}`;
  document.getElementById('stat-days').textContent        = G.day;
  document.getElementById('stat-customers').textContent   = G.totalCustomers;
  document.getElementById('stat-wasted').textContent      = G.totalWasted;
}

function updateHeaderUI() {
  document.getElementById('day-display').textContent     = `Day ${G.day}`;
  document.getElementById('weather-display').textContent = getWeather().label;
  document.getElementById('rep-display').textContent     = `Rep: ${G.rep}`;
  document.getElementById('sign-name').textContent       = G.day > 1 ? 'Lemon Empire' : 'My Stand';
}

function updateSellUI() {
  document.getElementById('day-profit').textContent = `$${G.dayProfit.toFixed(2)}`;
  const sellBtn = document.getElementById('sell-btn');
  sellBtn.disabled = G.cups === 0 || G.selling;
}

function updateAll() {
  updateMoneyDisplay();
  updateCupsDisplay();
  updateRecipeUI();
  updateMakeUI();
  updateSellUI();
  updateHeaderUI();
  updateStatsUI();
  renderShop();
}

// ─── INIT ─────────────────────────────────────────────────────────────────
function init() {
  rollWeather();
  addLog(`🍋 Welcome to Lemonade Empire! Day ${G.day} — ${getWeather().label}`, 'log-system');
  addLog('💡 Tip: Set your recipe, price a cup, make lemonade, then open your stand!', 'log-info');
  renderAchievements();
  updateAll();
  // First day intro
  setTimeout(() => notify('🍋 Welcome! Set your recipe, then hit Open Stand!'), 500);
}

init();

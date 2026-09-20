// --- JÁTÉK ADATBÁZIS ÉS LOGIKA ---
const vKeresztNevek = ["Bence", "Máté", "Levente", "Dániel", "Anna", "Hanna", "Lili", "Zsófia", "Patrik"];
const vVezetekNevek = ["Kovács", "Tóth", "Szabó", "Németh", "Farkas", "Horváth", "Töttös"];

// Random események, amik öregedéskor spontán történhetnek
const randomEvents = [
    { minAge: 2, maxAge: 8, text: "A szüleid vettek neked egy új kisautót/babát.", stat: "happiness", val: 10 },
    { minAge: 6, maxAge: 18, text: "Az iskolában egy osztálytársad csúfolt.", stat: "happiness", val: -15 },
    { minAge: 12, maxAge: 25, text: "Nagyon pattanásos lett az arcod.", stat: "looks", val: -15 },
    { minAge: 14, maxAge: 80, text: "Találtál az utcán 10 000 Ft-ot!", stat: "money", val: 10000 },
    { minAge: 18, maxAge: 80, text: "Elkaptad a kemény influenzát.", stat: "health", val: -20 },
    { minAge: 10, maxAge: 100, text: "Ettél egy nagyon finom édesburgonyás csirkét DM Pestóval.", stat: "happiness", val: 20 },
    { minAge: 20, maxAge: 60, text: "Előléptettek a munkahelyeden! (+50 000 Ft)", stat: "money", val: 50000 },
    { minAge: 40, maxAge: 90, text: "Fájni kezdett a hátad a sok üléstől.", stat: "health", val: -15 }
];

// Döntéses (Választós) Események
const choiceEvents = [
    {
        minAge: 14, maxAge: 18,
        title: "ROSSZ TÁRSASÁG",
        desc: "A suli mögött a 'menő' srácok megkínálnak cigivel. Mit teszel?",
        choices: [
            { text: "Elfogadom és elszívom", effect: () => { player.health -= 15; player.happiness += 10; return "Rászoktál a dohányzásra. (-15 Egészség, de menőnek érzed magad)"; } },
            { text: "Nem kérek, kösz", effect: () => { player.smarts += 10; player.happiness -= 10; return "Kinevettek, mert nem kértél. (-10 Boldogság, de megőrizted az egészséged)"; } }
        ]
    },
    {
        minAge: 18, maxAge: 25,
        title: "EGYETEMI BULI",
        desc: "Hatalmas buli lesz pénteken, de hétfőn nehéz vizsgád lesz.",
        choices: [
            { text: "Bulizás hajnalig!", effect: () => { player.happiness += 20; player.smarts -= 15; return "Hatalmasat buliztál, de megbuktál a vizsgán. (-15 Okosság)"; } },
            { text: "Otthon maradok tanulni", effect: () => { player.smarts += 20; player.happiness -= 15; return "Átmentél a vizsgán jelesre! De nagyon unatkoztál. (+20 Okosság, -15 Boldogság)"; } }
        ]
    },
    {
        minAge: 22, maxAge: 45,
        title: "BEFEKTETÉS",
        desc: "Egy barátod egy új 'tuti' kriptovalutát ajánl, a KockaCoin-t.",
        choices: [
            { text: "Befektetek 50 000 Ft-ot", reqMoney: 50000, effect: () => { 
                player.money -= 50000;
                let siker = Math.random() > 0.5;
                if(siker) { player.money += 200000; return "A KockaCoin az egekbe lőtt! Nyeremény: 200.000 Ft."; }
                else { player.happiness -= 20; return "A kripto becsődölt, elvesztetted a pénzed."; }
            } },
            { text: "Kihagyom", effect: () => { player.smarts += 5; return "Biztonságban maradt a pénzed."; } }
        ]
    }
];

// --- JÁTÉK ÁLLAPOT (STATE) ---
let player = {};
let logs = [];

// --- INICIALIZÁLÁS ÉS MENTÉS ---
function initGame(forceReset = false) {
    if (!forceReset && localStorage.getItem('weblife_save')) {
        let savedData = JSON.parse(localStorage.getItem('weblife_save'));
        player = savedData.player;
        logs = savedData.logs;
    } else {
        const vezNev = vVezetekNevek[Math.floor(Math.random() * vVezetekNevek.length)];
        const kerNev = vKeresztNevek[Math.floor(Math.random() * vKeresztNevek.length)];
        player = {
            name: `${vezNev} ${kerNev}`,
            age: 0, money: 0,
            happiness: 90, health: 100, smarts: Math.floor(Math.random()*40)+30, looks: Math.floor(Math.random()*60)+20,
            isDead: false
        };
        logs = [];
        addLog(`Megszülettél. A neved ${player.name}. Kezdődik a játék!`, 'positive');
    }
    updateUI();
}

function saveGame() {
    localStorage.setItem('weblife_save', JSON.stringify({ player, logs }));
}

// --- FELÜLET FRISSÍTÉSE ---
function updateUI() {
    document.getElementById('player-name').innerText = player.name;
    document.getElementById('player-age').innerText = `Kor: ${player.age}`;
    document.getElementById('player-money').innerText = `Pénz: ${player.money.toLocaleString('hu-HU')} Ft`;

    // Limit stats between 0 and 100
    ['happiness', 'health', 'smarts', 'looks'].forEach(stat => {
        if(player[stat] > 100) player[stat] = 100;
        if(player[stat] < 0) player[stat] = 0;
        
        const val = player[stat];
        const bar = document.getElementById(`bar-${stat}`);
        document.getElementById(`val-${stat}`).innerText = `${Math.floor(val)}%`;
        bar.style.width = `${val}%`;
        
        // Color transition logic based on percentage
        if(val < 25) bar.style.backgroundColor = '#eb3b5a'; // Red
        else if(val < 50) bar.style.backgroundColor = '#fa8231'; // Orange
        else bar.style.backgroundColor = ''; // Default CSS color
    });

    // Render Logs
    const logContainer = document.getElementById('log-container');
    logContainer.innerHTML = '';
    logs.slice().reverse().forEach(log => {
        const div = document.createElement('div');
        div.className = `log-entry ${log.type}`;
        div.innerText = log.text;
        logContainer.appendChild(div);
    });

    // Handle Death state
    if (player.isDead) {
        document.getElementById('btn-age-up').disabled = true;
        document.getElementById('btn-study').disabled = true;
        document.getElementById('btn-work').disabled = true;
        document.getElementById('btn-gym').disabled = true;
        document.getElementById('btn-doctor').disabled = true;
    } else {
        document.getElementById('btn-age-up').disabled = false;
        document.getElementById('btn-study').disabled = player.age < 6;
        document.getElementById('btn-work').disabled = player.age < 14;
        document.getElementById('btn-gym').disabled = player.age < 12;
        document.getElementById('btn-doctor').disabled = player.age < 0;
    }
    
    saveGame();
}

function addLog(text, type = '') {
    logs.push({ text, type });
    // Tartalék maximum 50 logra, ne teljen meg a memória
    if(logs.length > 50) logs.shift(); 
}

// --- JÁTÉK LOGIKA: ÖREGEDÉS ---
document.getElementById('btn-age-up').addEventListener('click', () => {
    if (player.isDead) return;

    player.age++;
    addLog(`-- ${player.age}. ÉVED --`, 'age-up');

    // Természetes statisztika csökkenés / növekedés
    player.happiness -= Math.random() * 5;
    if (player.age > 40) player.health -= Math.random() * 4;
    if (player.age > 60) player.looks -= Math.random() * 3;
    if (player.age >= 6 && player.age <= 18) player.smarts += Math.random() * 5; // suli magától okosít

    // Halál ellenőrzés
    if (player.health <= 0 || (player.age > 80 && Math.random() < 0.1)) {
        player.isDead = true;
        player.health = 0;
        addLog(`MEGHALTÁL ${player.age} évesen. Éltél, amennyit bírtál.`, 'death');
        updateUI();
        return;
    }

    // Esemény generátor (Döntés VAGY Random esemény)
    let hadEvent = false;
    
    // 1. Döntéses esemény tesztelése (20% esély minden évben)
    if (Math.random() < 0.2) {
        const possibleChoices = choiceEvents.filter(e => player.age >= e.minAge && player.age <= e.maxAge);
        if (possibleChoices.length > 0) {
            const event = possibleChoices[Math.floor(Math.random() * possibleChoices.length)];
            showModal(event);
            hadEvent = true;
        }
    }

    // 2. Random hír tesztelése (30% esély), ha nem volt döntés
    if (!hadEvent && Math.random() < 0.3) {
        const possibleRandoms = randomEvents.filter(e => player.age >= e.minAge && player.age <= e.maxAge);
        if (possibleRandoms.length > 0) {
            const event = possibleRandoms[Math.floor(Math.random() * possibleRandoms.length)];
            player[event.stat] += event.val;
            
            let type = event.val > 0 ? 'positive' : 'negative';
            addLog(event.text, type);
        }
    }

    if(!hadEvent) updateUI(); // Ha volt döntés, a modal zárása frissít
});

// --- AKCIÓK (TEVÉKENYSÉGEK) ---
document.getElementById('btn-study').addEventListener('click', () => {
    player.smarts += 4;
    player.happiness -= 2;
    addLog("Tanultál. Kicsit okosabb lettél, de fárasztó volt.");
    updateUI();
});

document.getElementById('btn-work').addEventListener('click', () => {
    const fizu = player.age < 18 ? 10000 : 80000 + (player.smarts * 500);
    player.money += fizu;
    player.happiness -= 5;
    player.health -= 2;
    addLog(`Elmentél dolgozni. Kerestél ${fizu.toLocaleString('hu-HU')} Ft-ot.`);
    updateUI();
});

document.getElementById('btn-gym').addEventListener('click', () => {
    if (player.money >= 5000) {
        player.money -= 5000;
        player.health += 5;
        player.looks += 3;
        addLog("Voltál edzeni. Erősebbnek és vonzóbbnak érzed magad.", "positive");
    } else {
        addLog("Nincs elég pénzed kondibérletre!", "negative");
    }
    updateUI();
});

document.getElementById('btn-doctor').addEventListener('click', () => {
    if (player.money >= 15000) {
        player.money -= 15000;
        player.health += 25;
        addLog("Elmentél orvoshoz, aki kikezelt a bajodból.", "positive");
    } else {
        addLog("Nincs elég pénzed a magánorvosra!", "negative");
    }
    updateUI();
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Biztosan új életet akarsz kezdeni? Minden jelenlegi haladásod elvész!")) {
        initGame(true);
    }
});

// --- MODÁLIS ABLAK (DÖNTÉSEKHEZ) ---
function showModal(eventData) {
    document.getElementById('modal-title').innerText = eventData.title;
    document.getElementById('modal-desc').innerText = eventData.desc;
    
    const btnContainer = document.getElementById('modal-buttons');
    btnContainer.innerHTML = ''; // Régi gombok törlése

    eventData.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        
        if(choice.reqMoney && player.money < choice.reqMoney) {
            btn.disabled = true;
            btn.innerText += ` (Nincs pénz)`;
        }

        btn.addEventListener('click', () => {
            const resultText = choice.effect();
            addLog(`Döntés: ${choice.text} -> ${resultText}`, 'positive');
            document.getElementById('event-modal').classList.add('hidden');
            updateUI(); // Itt frissítünk, mert az öregedés gomb megvárta a döntést
        });
        btnContainer.appendChild(btn);
    });

    document.getElementById('event-modal').classList.remove('hidden');
}

// Start
initGame();

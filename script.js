// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyAd3f4ZRaZ0oWsYKj5XABJtUsshjVcQu64",
  authDomain: "timerun-d6094.firebaseapp.com",
  databaseURL: "https://timerun-d6094-default-rtdb.firebaseio.com",
  projectId: "timerun-d6094",
  storageBucket: "timerun-d6094.firebasestorage.app",
  messagingSenderId: "552931384812",
  appId: "1:552931384812:web:3c802e1247621fe23f34c9",
  measurementId: "G-X5JNCJ6KW3"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== ЭКРАНЫ =====
let currentMode = "";
let running = false;
let startTime = 0;
let animationId = 0;

let step = 0;
let lastClickTime = 0;
let steps = [];
let lastResult = 0;

// Click-Battle
let clickCount = 0;

// Hours-Tab
let holdStart = 0;
let holdInterval = 0;
let holdTime = 0;

// ===== ЭКРАНЫ =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // Скрываем специальные контейнеры
  document.getElementById("clickbattle-container").style.display = "none";
  document.getElementById("hours-container").style.display = "none";

  if(id === "screen-timer") {
    if(currentMode === "clickbattle") {
      document.getElementById("clickbattle-container").style.display = "block";
    } else if(currentMode === "hours-tab") {
      document.getElementById("hours-container").style.display = "block";
    }
  }
}

// ===== НАВИГАЦИЯ =====
function goHome() {
  resetTimer();
  showScreen("screen-main");
}

function openMode(mode) {
  currentMode = mode;
  document.getElementById("mode-title").innerText = mode.toUpperCase();
  loadLeaderboard();
  showScreen("screen-mode");
}

function openTimer() {
  resetTimer();
  showScreen("screen-timer");
}

function openPublish() {
  showScreen("screen-publish");
}

// ===== ТАЙМЕР =====
function resetTimer() {
  running = false;
  step = 0;
  steps = [];
  lastResult = 0;
  clickCount = 0;
  holdTime = 0;
  document.getElementById("timer").innerText = "00:00:00";
  document.getElementById("step-info").innerText = "";
  document.getElementById("timer-btn").innerText = "START";
  document.getElementById("click-count").innerText = "0";
  document.getElementById("hold-time").innerText = "0.000";
  cancelAnimationFrame(animationId);
  clearInterval(holdInterval);
}

// ===== RUN КНОПКА =====
document.querySelectorAll(".run-btn").forEach(btn => {
  btn.addEventListener("click", () => openTimer());
});

// ===== TIMER ACTION =====
document.getElementById("timer-btn").addEventListener("click", () => {
  if(currentMode === "clickbattle" || currentMode === "hours-tab") return;

  if(!running) {
    startTime = performance.now();
    lastClickTime = startTime;
    running = true;
    document.getElementById("timer-btn").innerText = "STOP";
    updateTimer();
  } else {
    running = false;
    cancelAnimationFrame(animationId);

    if(currentMode === "timerrun") {
      lastResult = performance.now() - startTime;
      showResult();
    } else if(currentMode === "theetab") {
      const stepTime = performance.now() - lastClickTime;
      steps.push(stepTime);
      step++;
      document.getElementById("step-info").innerText = `ШАГ ${step} / 3`;

      if(step === 3) {
        lastResult = steps.reduce((a,b)=>a+b,0);
        showResult();
      } else {
        document.getElementById("timer-btn").innerText = "START";
        lastClickTime = performance.now();
      }
    }
  }
});

// ===== TIMER UPDATE =====
function updateTimer() {
  if(!running) return;

  const now = performance.now();
  if(currentMode === "hours-tab") {
    document.getElementById("timer").innerText = formatHoldTime(holdTime);
  } else {
    document.getElementById("timer").innerText = ((now - startTime)/1000).toFixed(3);
  }
  animationId = requestAnimationFrame(updateTimer);
}

// ===== Click-Battle =====
document.getElementById("click-btn").addEventListener("click", () => {
  if(!running) {
    startTime = performance.now(); // стартуем таймер на первый клик
    running = true;
    updateTimer(); // анимация таймера
  }

  clickCount++;
  document.getElementById("click-count").innerText = clickCount;

  if(clickCount === 100) {
    running = false;
    cancelAnimationFrame(animationId);
    lastResult = performance.now() - startTime;
    showResult();
  }
});


// ===== Hours-Tab =====
const holdBtn = document.getElementById("hold-btn");

function startHold() {
  if(!running) running = true, startTime = performance.now();
  holdStart = performance.now();
  holdInterval = setInterval(() => {
    holdTime = performance.now() - holdStart;
    document.getElementById("hold-time").innerText = (holdTime/1000).toFixed(3);
    document.getElementById("timer").innerText = formatHoldTime(holdTime);
  }, 30);
}

function endHold() {
  clearInterval(holdInterval);
  lastResult = holdTime;
  showResult();
  running = false;
}

holdBtn.addEventListener("mousedown", startHold);
holdBtn.addEventListener("mouseup", endHold);
holdBtn.addEventListener("mouseleave", endHold);

// Mobile support
holdBtn.addEventListener("touchstart", e => { e.preventDefault(); startHold(); });
holdBtn.addEventListener("touchend", e => { e.preventDefault(); endHold(); });

// ===== SHOW RESULT =====
function showResult() {
  if(currentMode === "hours-tab") {
    document.getElementById("result-time").innerText = formatHoldTime(lastResult);
  } else {
    document.getElementById("result-time").innerText = (lastResult/1000).toFixed(3) + " сек";
  }
  showScreen("screen-result");
}

document.getElementById("again-btn").addEventListener("click", () => openTimer());
document.getElementById("publish-btn").addEventListener("click", () => openPublish());

// ===== LEADERBOARD =====
function loadLeaderboard() {
  const ref = database.ref('leaderboard/' + currentMode);
  ref.once('value').then(snapshot => {
    const dataObj = snapshot.val() || {};
    const dataArr = Object.keys(dataObj).map(k => ({ name:k, ...dataObj[k] }));

    // sort: hours-tab max first, others min first
    dataArr.sort((a,b)=>{
      if(currentMode==="hours-tab") return b.time - a.time;
      return a.time - b.time;
    });

    const tbody = document.getElementById("leaderboard");
    tbody.innerHTML = "";
    for(let i=0;i<10;i++){
      const row = dataArr[i];
      tbody.innerHTML += `
        <tr>
          <td>${i+1}</td>
          <td>${row?.name||""}</td>
          <td>${row ? (currentMode==="hours-tab" ? formatHoldTime(row.time) : (row.time/1000).toFixed(3)) : ""}</td>
          <td>${row?.date||""}</td>
        </tr>
      `;
    }
  });
}

// ===== PUBLISH =====
document.getElementById("publish-final").addEventListener("click", () => {
  const name = document.getElementById("username").value || "anon";
  const passwordInput = prompt("Введите или придумайте пароль для ника: ");
  const ref = database.ref('leaderboard/' + currentMode + '/' + name);

  ref.once('value').then(snapshot => {
    const data = snapshot.val();
    if(data) {
      if(data.password !== passwordInput){
        alert("Неверный пароль!");
        return;
      }
      // Hours-Tab: максимальное время, остальные минимальное
      if((currentMode==="hours-tab" && lastResult > data.time) || (currentMode!=="hours-tab" && lastResult < data.time)){
        ref.update({time:lastResult, date:new Date().toLocaleDateString()});
      }
    } else {
      ref.set({time:lastResult, date:new Date().toLocaleDateString(), password: passwordInput});
    }
    loadLeaderboard();
    showScreen("screen-mode");
  });
});

// ===== START =====
showScreen("screen-main");

// ===== BUTTONS =====
document.getElementById("mode-timerrun").addEventListener("click", ()=>openMode("timerrun"));
document.getElementById("mode-theetab").addEventListener("click", ()=>openMode("theetab"));
document.getElementById("mode-clickbattle").addEventListener("click", ()=>openMode("clickbattle"));
document.getElementById("mode-hours-tab").addEventListener("click", ()=>openMode("hours-tab"));

// ===== HELPERS =====
function formatHoldTime(ms) {
  const totalSeconds = Math.floor(ms/1000);
  const hours = Math.floor(totalSeconds/3600);
  const minutes = Math.floor((totalSeconds%3600)/60);
  const seconds = totalSeconds%60;
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

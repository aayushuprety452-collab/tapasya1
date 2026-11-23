const STORAGE_KEY = "tapasya_v2_workspace_state";
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_DATA = {
  hasOnboarded: false,
  theme: "light",
  storageFolderName: "",
  alarmSettings: {
    tone: "fireflies",
    vibrate: true,
    volume: 1.0,
    hasCustomTrack: false,
    customTrackName: ""
  },
  nukeToday: {
    title: "Nuke XYX",
    quote: "If you don’t subtract and schedule, you will forget where time went. If you do, all your dreams will come true.",
    instructions: "<li>Whenever you wake up, think <strong>how many hours do you have</strong> before you have to do something (sleep, class, meeting).</li><li>Divide the tasks, assign exact time, and start doing the first.</li><li><strong>Formula:</strong> Hours left × important tasks × start doing = phone disappears.</li><li><em>\"I will work\"</em> — at what time? what precise task? for how long?</li>",
    todos: [
      { text: "Running", done: false },
      { text: "App work", done: false },
      { text: "Studying Physics", done: false },
      { text: "Psychology", done: false },
      { text: "Book reading", done: false },
      { text: "", done: false }
    ],
    weekly: [
      { text: "Pay xyz", done: false },
      { text: "Pay Rent", done: false },
      { text: "", done: false }
    ],
    scheduleTasks: [
      { id: 1, title: "Physics Numericals", time: "07:00", alarm: true, status: "Not started", rung: false },
      { id: 2, title: "Deep Work Block", time: "16:30", alarm: true, status: "Not started", rung: false }
    ]
  },
  nukeGoal: {
    title: "Nuke a Goal",
    deadline: new Date(Date.now() + 41 * 86400000).toISOString().slice(0, 16),
    objective: "xyz needs to be achieved/nuked before deadline.",
    mustDo: "The tasks of the current day must be absolutely clear and defined a day before.",
    whatWorks: "Blocking phone in another room during morning study sessions.",
    whatDoesnt: "Starting the day without writing tomorrow's exact schedule.",
    whenNext: "Answer: Tomorrow at 7:00 AM sharp.",
    whatNext: "Answer: Complete Chapter 1 derivations and solve 20 problems.",
    todayTasks: [
      { id: 101, name: "Subject 1 — Chapter 1", date: new Date().toISOString().slice(0, 10), time: "07:00", alarm: true, rung: false }
    ],
    tomorrowTasks: [
      { id: 201, name: "Example 1 — Morning Mock Test", time: "07:00", alarm: true, rung: false }
    ]
  },
  deadlines: [
    { id: 301, name: "Complete Syllabus Phase 1", datetime: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16), alarm: true, done: false, rung: false }
  ],
  droneView: {
    activeDay: "Monday",
    days: {},
    activeYear: "2026",
    openMonthId: null,
    years: {
      "2026": [
        {
          id: "m_nov_2026",
          name: "November",
          entries: [
            { date: "2026-11-22", done: 3, total: 4, pct: 75, notes: "Strong morning workout & study block" }
          ]
        },
        { id: "m_dec_2026", name: "December", entries: [] }
      ]
    }
  },
  atomicCore: {
    activeDay: "Monday",
    days: {},
    activeYear: "2026",
    openMonthId: null,
    years: {
      "2026": [
        {
          id: "a_nov_2026",
          name: "November",
          entries: [
            { date: "2026-11-22", done: 16, total: 20, pct: 80, notes: "Hardest subject 4h + Hard subject 4h + Next subject" }
          ]
        },
        { id: "a_dec_2026", name: "December", entries: [] }
      ]
    }
  }
};

DAYS_OF_WEEK.forEach(function (d) {
  DEFAULT_DATA.droneView.days[d] = [
    {
      id: "p_rich",
      title: "BECOME INCREDIBLY RICH",
      tasks: [{ text: "Studied for Exam", done: false }, { text: "", done: false }]
    },
    {
      id: "p_musc",
      title: "BECOME INCREDIBLY MUSCULAR",
      tasks: [{ text: "Running", done: false }, { text: "Evening Workout", done: false }, { text: "", done: false }]
    },
    {
      id: "p_intel",
      title: "BECOME INCREDIBLY INTELLIGENT",
      tasks: [{ text: "Read Philosophy / Psychology / Book", done: false }, { text: "", done: false }]
    }
  ];

  DEFAULT_DATA.atomicCore.days[d] = {
    mainTitle: "University/Exam preparation (16 points)",
    hardestTitle: "Hardest subject (8 points highest)",
    hardestOptions: [
      { id: "h1", label: "2 - 4 hours (8 points rewarded)", pts: 8, subject: "", done: false },
      { id: "h2", label: "1 - 2 hour (4 points rewarded)", pts: 4, subject: "", done: false },
      { id: "h3", label: "30 mins (2 points rewarded)", pts: 2, subject: "", done: false }
    ],
    hardTitle: "Hard subject (6 points highest)",
    hardOptions: [
      { id: "m1", label: "2 - 4 hours (6 points rewarded)", pts: 6, subject: "", done: false },
      { id: "m2", label: "1 - 2 hour (3 points rewarded)", pts: 3, subject: "", done: false },
      { id: "m3", label: "30 mins (1 point rewarded)", pts: 1, subject: "", done: false }
    ],
    directTasks: [
      { id: "d1", label: "Next subject (2 points)", pts: 2, subject: "", done: false },
      { id: "d2", label: "Revision / Assignment (4 points optional)", pts: 4, subject: "", done: false }
    ],
    bonusTitle: "Skill upgradation / Knowledge acquisition (4 points)",
    bonusTasks: [
      { id: "b1", label: "Skill upgradation or Knowledge acquisition (4 points)", pts: 4, subject: "", done: false }
    ]
  };
});

let state = loadState();
let audioCtx = null;
let melodyLoopTimer = null;
let vibrateInterval = null;
let customAudioObj = null;
let directoryHandle = null;
let pickerContext = null;

function mergeDefaults(base, incoming) {
  if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : JSON.parse(JSON.stringify(base));
  if (!base || typeof base !== "object") return incoming === undefined ? base : incoming;
  const result = Object.assign({}, base);
  Object.keys(base).forEach(function (key) {
    result[key] = incoming && incoming[key] !== undefined
      ? mergeDefaults(base[key], incoming[key])
      : JSON.parse(JSON.stringify(base[key]));
  });
  if (incoming && typeof incoming === "object") {
    Object.keys(incoming).forEach(function (key) {
      if (!(key in result)) result[key] = incoming[key];
    });
  }
  return result;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const fallback = JSON.parse(JSON.stringify(DEFAULT_DATA));
    if (!saved) return fallback;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
    return mergeDefaults(fallback, parsed);
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Unable to save Tapasya state locally.", e);
  }
  const ind = document.getElementById("saveIndicator");
  if (ind) {
    ind.textContent = "Saving to Tapasya...";
    setTimeout(function () {
      ind.textContent = "Saved locally in Tapasya";
    }, 350);
  }
  syncToTapasyaFolder(false).catch(function () {});
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
  });
}

function toLocalDateKey(inputDate) {
  const dt = (inputDate instanceof Date && !isNaN(inputDate.getTime())) ? inputDate : new Date();
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

// ==================== WELCOME & STORAGE FOLDER ====================
function enterWorkspace() {
  state.hasOnboarded = true;
  saveState();
  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
}

async function setupTapasyaStorageFolder() {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
    try {
      const Filesystem = window.Capacitor.Plugins.Filesystem;
      await Filesystem.requestPermissions();
      await Filesystem.mkdir({ path: "Tapasya", directory: "DOCUMENTS", recursive: true }).catch(function () {});
      state.storageFolderName = "Internal Storage / Documents / Tapasya";
      saveState();
      updateFolderStatusUI();
      await syncToTapasyaFolder(true);
      return;
    } catch (e) {
      alert("Please allow Storage permission in Android Settings to create the Tapasya folder.");
      return;
    }
  }

  if ("showDirectoryPicker" in window && window.isSecureContext) {
    try {
      const parentDir = await window.showDirectoryPicker({ mode: "readwrite" });
      directoryHandle = await parentDir.getDirectoryHandle("Tapasya", { create: true });
      state.storageFolderName = parentDir.name + "/Tapasya";
      saveState();
      updateFolderStatusUI();
      await syncToTapasyaFolder(true);
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }

  state.storageFolderName = "Local Device Storage (Tapasya)";
  saveState();
  updateFolderStatusUI();
  await syncToTapasyaFolder(true);
  alert("Saved! Direct folder creation runs automatically inside the Android APK or on http://localhost. A backup file 'tapasya-backup.json' has been saved.");
}

async function syncToTapasyaFolder(showToast) {
  const payload = JSON.stringify(state, null, 2);

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem && state.storageFolderName) {
    try {
      await window.Capacitor.Plugins.Filesystem.writeFile({
        path: "Tapasya/tapasya-backup.json",
        data: payload,
        directory: "DOCUMENTS",
        encoding: "utf8"
      });
      if (showToast) alert("Saved backup to Documents/Tapasya/tapasya-backup.json");
      return;
    } catch (e) {}
  }

  if (directoryHandle) {
    try {
      const fileHandle = await directoryHandle.getFileHandle("tapasya-backup.json", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(payload);
      await writable.close();
      if (showToast) alert("Saved backup to " + state.storageFolderName + "/tapasya-backup.json");
      return;
    } catch (e) {}
  }

  if (showToast) {
    const blob = new Blob([payload], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tapasya-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
  }
}

function updateFolderStatusUI() {
  const txt = state.storageFolderName
    ? "Linked Folder: " + state.storageFolderName
    : "Using internal device storage (Tap to link Tapasya folder)";
  const wEl = document.getElementById("welcomeFolderStatus");
  const sEl = document.getElementById("settingsFolderStatus");
  if (wEl) wEl.textContent = txt;
  if (sEl) sEl.textContent = txt;
}

function saveCustomAudioBlob(file) {
  const req = indexedDB.open("TapasyaAudioDB", 1);
  req.onupgradeneeded = function (e) {
    e.target.result.createObjectStore("tracks");
  };
  req.onsuccess = function (e) {
    const tx = e.target.result.transaction("tracks", "readwrite");
    tx.objectStore("tracks").put(file, "userTrack");
  };
}

function loadCustomAudioBlob() {
  const req = indexedDB.open("TapasyaAudioDB", 1);
req.onupgradeneeded = function (e) {
e.target.result.createObjectStore("tracks");
};
req.onsuccess = function (e) {
const tx = e.target.result.transaction("tracks", "readonly");
const getReq = tx.objectStore("tracks").get("userTrack");
getReq.onsuccess = function () {
if (getReq.result) {
customAudioObj = new Audio(URL.createObjectURL(getReq.result));
customAudioObj.loop = true;
}
};
};
}
loadCustomAudioBlob();
// ==================== NAVIGATION & THEME ====================
function setTheme(theme) {
state.theme = theme;
document.documentElement.setAttribute("data-theme", theme);
saveState();
}
function switchTab(tabId, labelText) {
document.querySelectorAll(".nav-item").forEach(function (b) {
b.classList.toggle("active", b.dataset.tab === tabId);
});
document.querySelectorAll(".page-section").forEach(function (s) {
s.classList.remove("active");
});
const targetSection = document.getElementById("tab-" + tabId);
if (targetSection) targetSection.classList.add("active");
if (labelText) document.getElementById("mobilePageTitle").textContent = labelText;
document.getElementById("sidebar").classList.remove("open");
}
function openSettingsTab() {
switchTab("settings", "Settings");
}
document.querySelectorAll(".nav-item").forEach(function (btn) {
btn.addEventListener("click", function () {
switchTab(btn.dataset.tab, btn.textContent.replace(/^[^\w]+/, "").trim());
});
});
document.getElementById("menuToggle").onclick = function () {
document.getElementById("sidebar").classList.add("open");
};
document.getElementById("closeSidebar").onclick = function () {
document.getElementById("sidebar").classList.remove("open");
};
function initEditableBindings() {
document.querySelectorAll("[data-bind]").forEach(function (el) {
const parts = el.dataset.bind.split(".");
if (parts.length !== 2) return;
const section = parts[0];
const key = parts[1];
if (state[section] && state[section][key] !== undefined) {
el.innerHTML = state[section][key];
}
el.addEventListener("input", function () {
state[section][key] = el.innerHTML;
saveState();
});
});
}
// ==================== CUSTOM SMARTPHONE CLOCK & DATE PICKER ====================
function initPickerWheels() {
const hSel = document.getElementById("pickerHourSelect");
const mSel = document.getElementById("pickerMinSelect");
hSel.innerHTML = "";
mSel.innerHTML = "";
for (let h = 1; h <= 12; h++) {
const opt = document.createElement("option");
opt.value = String(h).padStart(2, "0");
opt.textContent = String(h).padStart(2, "0");
hSel.appendChild(opt);
}
for (let m = 0; m < 60; m++) {
const opt = document.createElement("option");
opt.value = String(m).padStart(2, "0");
opt.textContent = String(m).padStart(2, "0");
mSel.appendChild(opt);
}
}
function openCustomPicker(type, index) {
pickerContext = { type: type, index: index };
const dateRow = document.getElementById("pickerDateSection");
const timeRow = document.getElementById("pickerTimeSection");
const titleEl = document.getElementById("pickerModalTitle");
let initialDate = new Date().toISOString().slice(0, 10);
let initialTime = "07:00";
if (type === "nukeTodayTime") {
titleEl.textContent = "Set Task Alarm";
dateRow.classList.add("hidden");
timeRow.classList.remove("hidden");
initialTime = state.nukeToday.scheduleTasks[index].time || "07:00";
} else if (type === "goalDeadline") {
titleEl.textContent = "Set Goal Deadline";
dateRow.classList.remove("hidden");
timeRow.classList.remove("hidden");
const parts = String(state.nukeGoal.deadline || "").split("T");
initialDate = parts[0] || initialDate;
initialTime = parts[1] || "23:59";
} else if (type === "goalTodayDate") {
titleEl.textContent = "Select Task Date";
dateRow.classList.remove("hidden");
timeRow.classList.add("hidden");
initialDate = state.nukeGoal.todayTasks[index].date || initialDate;
} else if (type === "goalTodayTime") {
titleEl.textContent = "Set Task Alarm";
dateRow.classList.add("hidden");
timeRow.classList.remove("hidden");
initialTime = state.nukeGoal.todayTasks[index].time || "07:00";
} else if (type === "goalTomorrowTime") {
titleEl.textContent = "Set Tomorrow Alarm";
dateRow.classList.add("hidden");
timeRow.classList.remove("hidden");
initialTime = state.nukeGoal.tomorrowTasks[index].time || "07:00";
} else if (type === "deadlineItem") {
titleEl.textContent = "Set Deadline Date & Time";
dateRow.classList.remove("hidden");
timeRow.classList.remove("hidden");
const parts = String(state.deadlines[index].datetime || "").split("T");
initialDate = parts[0] || initialDate;
initialTime = parts[1] || "12:00";
}
document.getElementById("pickerDateInput").value = initialDate;
const timeParts = initialTime.split(":");
const hh24 = parseInt(timeParts[0], 10) || 0;
const mm = parseInt(timeParts[1], 10) || 0;
const ampm = hh24 >= 12 ? "PM" : "AM";
const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
document.getElementById("pickerHourSelect").value = String(hh12).padStart(2, "0");
document.getElementById("pickerMinSelect").value = String(mm).padStart(2, "0");
document.getElementById("pickerAmPmSelect").value = ampm;
document.getElementById("customPickerModal").classList.remove("hidden");
}
function closeCustomPicker() {
document.getElementById("customPickerModal").classList.add("hidden");
}
function confirmCustomPicker() {
const dateVal = document.getElementById("pickerDateInput").value || new Date().toISOString().slice(0, 10);
let hh = parseInt(document.getElementById("pickerHourSelect").value, 10);
const mm = document.getElementById("pickerMinSelect").value;
const ampm = document.getElementById("pickerAmPmSelect").value;
if (ampm === "PM" && hh !== 12) hh += 12;
if (ampm === "AM" && hh === 12) hh = 0;
const time24 = String(hh).padStart(2, "0") + ":" + mm;
const type = pickerContext.type;
const index = pickerContext.index;
if (type === "nukeTodayTime") {
state.nukeToday.scheduleTasks[index].time = time24;
state.nukeToday.scheduleTasks[index].rung = false;
scheduleNativeNotification(state.nukeToday.scheduleTasks[index].title, time24);
renderNukeToday();
} else if (type === "goalDeadline") {
state.nukeGoal.deadline = dateVal + "T" + time24;
renderNukeGoal();
} else if (type === "goalTodayDate") {
state.nukeGoal.todayTasks[index].date = dateVal;
renderNukeGoal();
} else if (type === "goalTodayTime") {
state.nukeGoal.todayTasks[index].time = time24;
state.nukeGoal.todayTasks[index].rung = false;
scheduleNativeNotification(state.nukeGoal.todayTasks[index].name, time24);
renderNukeGoal();
} else if (type === "goalTomorrowTime") {
state.nukeGoal.tomorrowTasks[index].time = time24;
state.nukeGoal.tomorrowTasks[index].rung = false;
scheduleNativeNotification(state.nukeGoal.tomorrowTasks[index].name, time24);
renderNukeGoal();
} else if (type === "deadlineItem") {
state.deadlines[index].datetime = dateVal + "T" + time24;
state.deadlines[index].rung = false;
  scheduleNativeNotification("Deadline: " + state.deadlines[index].name, time24);
renderDeadlines();
}
saveState();
closeCustomPicker();
}
function format12Hour(time24) {
if (!time24) return "Set Time";
const parts = String(time24).split(":");
let h = parseInt(parts[0], 10);
const mStr = (parts[1] || "00").padStart(2, "0");
const ampm = h >= 12 ? "PM" : "AM";
h = h % 12 === 0 ? 12 : h % 12;
return h + ":" + mStr + " " + ampm;
}
function formatPrettyDateTime(dtStr) {
if (!dtStr) return "Select Date & Time";
const parts = String(dtStr).split("T");
return (parts[0] || "Select Date") + " • " + format12Hour(parts[1] || "");
}
// ==================== SEAMLESS NOTION CHECKLISTS ====================
function ensureTrailingBlankCheckbox(list) {
  if (!Array.isArray(list)) return;
  if (list.length === 0 || String(list[list.length - 1].text || "").trim() !== "") {
    list.push({ text: "", done: false });
  }
}

function handleChecklistEnter(event, listRef, idx, rerenderFn, focusPrefix) {
  if (event.key === "Enter") {
    event.preventDefault();
    const currentText = (event.target.textContent || "").trim();
    // Do not spawn another empty checkbox if the current one is still empty
    if (currentText === "") return;

    listRef[idx].text = currentText;
    listRef.splice(idx + 1, 0, { text: "", done: false });
    saveState();
    rerenderFn();
    setTimeout(function () {
      const nextEl = document.getElementById(focusPrefix + "_" + (idx + 1));
      if (nextEl) nextEl.focus();
    }, 15);
  }
}

// ==================== 1. NUKE XYX ====================
function renderNukeToday() {
  ensureTrailingBlankCheckbox(state.nukeToday.todos);
  ensureTrailingBlankCheckbox(state.nukeToday.weekly);

  function renderSeamless(arr, containerId, typeKey) {
    const box = document.getElementById(containerId);
    box.innerHTML = arr.map(function (item, idx) {
      const delBtn = arr.length > 1
        ? "<button class='del-mini' title='Delete row' onclick=\"state.nukeToday['" + typeKey + "'].splice(" + idx + ",1);saveState();renderNukeToday()\">✕</button>"
        : "";
      return "<div class='check-row'>" +
        "<input type='checkbox' " + (item.done ? "checked" : "") + " onchange=\"state.nukeToday['" + typeKey + "'][" + idx + "].done=this.checked;saveState();renderNukeToday()\" />" +
        "<div id='nuke_" + typeKey + "_" + idx + "' class='check-text-editable " + (item.done ? "done" : "") + "' contenteditable='true' data-placeholder='Type task and press Enter...' " +
        "oninput=\"state.nukeToday['" + typeKey + "'][" + idx + "].text=this.textContent;saveState()\" " +
        "onkeydown=\"handleChecklistEnter(event, state.nukeToday['" + typeKey + "'], " + idx + ", renderNukeToday, 'nuke_" + typeKey + "')\" " +
        "onblur='renderNukeToday()'>" + escapeHtml(item.text) + "</div>" +
        delBtn +
        "</div>";
    }).join("");
  }

  renderSeamless(state.nukeToday.todos, "nukeTodayTodoList", "todos");
  renderSeamless(state.nukeToday.weekly, "nukeTodayWeeklyList", "weekly");

  const tbody = document.getElementById("nukeTodayTableBody");
  tbody.innerHTML = state.nukeToday.scheduleTasks.map(function (t, i) {
    return "<tr>" +
      "<td><span contenteditable='true' onblur='state.nukeToday.scheduleTasks[" + i + "].title=this.textContent;saveState()'>" + escapeHtml(t.title) + "</span></td>" +
      "<td><button class='picker-trigger-btn' onclick=\"openCustomPicker('nukeTodayTime', " + i + ")\">⏰ " + format12Hour(t.time) + "</button></td>" +
      "<td><input type='checkbox' " + (t.alarm ? "checked" : "") + " onchange='state.nukeToday.scheduleTasks[" + i + "].alarm=this.checked;state.nukeToday.scheduleTasks[" + i + "].rung=false;saveState()' /></td>" +
      "<td><select class='status-select' onchange='state.nukeToday.scheduleTasks[" + i + "].status=this.value;saveState()'>" +
      "<option " + (t.status === "Not started" ? "selected" : "") + ">Not started</option>" +
      "<option " + (t.status === "In progress" ? "selected" : "") + ">In progress</option>" +
      "<option " + (t.status === "Done" ? "selected" : "") + ">Done</option>" +
      "</select></td>" +
      "<td><button class='del-mini' onclick='state.nukeToday.scheduleTasks.splice(" + i + ",1);saveState();renderNukeToday()'>✕</button></td>" +
      "</tr>";
  }).join("");
}

function addTodayTaskRow() {
  state.nukeToday.scheduleTasks.push({ id: Date.now(), title: "New Focus Block", time: "12:00", alarm: true, status: "Not started", rung: false });
  saveState();
  renderNukeToday();
}

// ==================== 2. NUKE A GOAL ====================
function renderNukeGoal() {
  document.getElementById("goalDeadlineDisplayBtn").textContent = "📅 " + formatPrettyDateTime(state.nukeGoal.deadline);

  document.getElementById("goalTodayBody").innerHTML = state.nukeGoal.todayTasks.map(function (t, i) {
    return "<tr>" +
      "<td><span contenteditable='true' onblur='state.nukeGoal.todayTasks[" + i + "].name=this.textContent;saveState()'>" + escapeHtml(t.name) + "</span></td>" +
      "<td><button class='picker-trigger-btn' onclick=\"openCustomPicker('goalTodayDate', " + i + ")\">" + t.date + "</button></td>" +
      "<td><button class='picker-trigger-btn' onclick=\"openCustomPicker('goalTodayTime', " + i + ")\">⏰ " + format12Hour(t.time) + "</button></td>" +
      "<td><input type='checkbox' " + (t.alarm ? "checked" : "") + " onchange='state.nukeGoal.todayTasks[" + i + "].alarm=this.checked;saveState()' /></td>" +
      "<td><button class='del-mini' onclick='state.nukeGoal.todayTasks.splice(" + i + ",1);saveState();renderNukeGoal()'>✕</button></td>" +
      "</tr>";
  }).join("");

  document.getElementById("goalTomorrowBody").innerHTML = state.nukeGoal.tomorrowTasks.map(function (t, i) {
    return "<tr>" +
      "<td><span contenteditable='true' onblur='state.nukeGoal.tomorrowTasks[" + i + "].name=this.textContent;saveState()'>" + escapeHtml(t.name) + "</span></td>" +
      "<td><button class='picker-trigger-btn' onclick=\"openCustomPicker('goalTomorrowTime', " + i + ")\">⏰ " + format12Hour(t.time) + "</button></td>" +
      "<td><input type='checkbox' " + (t.alarm ? "checked" : "") + " onchange='state.nukeGoal.tomorrowTasks[" + i + "].alarm=this.checked;saveState()' /></td>" +
      "<td><button class='del-mini' onclick='state.nukeGoal.tomorrowTasks.splice(" + i + ",1);saveState();renderNukeGoal()'>✕</button></td>" +
      "</tr>";
  }).join("");
}

function addGoalTask(which) {
  if (which === "today") {
    state.nukeGoal.todayTasks.push({ id: Date.now(), name: "New Today Task", date: new Date().toISOString().slice(0, 10), time: "08:00", alarm: true, rung: false });
  } else {
    state.nukeGoal.tomorrowTasks.push({ id: Date.now(), name: "Tomorrow Task", time: "07:00", alarm: true, rung: false });
  }
  saveState();
  renderNukeGoal();
}

// ==================== 3. GOD - DEADLINES ====================
function renderDeadlines() {
  const tbody = document.getElementById("deadlinesTableBody");
  const now = Date.now();
  tbody.innerHTML = state.deadlines.map(function (d, i) {
    const diff = new Date(d.datetime).getTime() - now;
    let statusHtml = "<span class='badge-ok'>Completed</span>";
    if (!d.done) {
      statusHtml = diff < 0
        ? "<span class='badge-overdue'>OVERDUE (" + formatDuration(Math.abs(diff)) + " ago)</span>"
        : "<span class='badge-ok'>" + formatDuration(diff) + " left</span>";
    }
    return "<tr>" +
      "<td><span contenteditable='true' onblur='state.deadlines[" + i + "].name=this.textContent;saveState();updateLiveTimers()'>" + escapeHtml(d.name) + "</span></td>" +
      "<td><button class='picker-trigger-btn' onclick=\"openCustomPicker('deadlineItem', " + i + ")\">📅 " + formatPrettyDateTime(d.datetime) + "</button></td>" +
      "<td>" + statusHtml + "</td>" +
      "<td><input type='checkbox' " + (d.alarm ? "checked" : "") + " onchange='state.deadlines[" + i + "].alarm=this.checked;saveState()' /></td>" +
      "<td><input type='checkbox' " + (d.done ? "checked" : "") + " onchange='state.deadlines[" + i + "].done=this.checked;saveState();renderDeadlines()' /></td>" +
      "<td><button class='del-mini' onclick='state.deadlines.splice(" + i + ",1);saveState();renderDeadlines()'>✕</button></td>" +
      "</tr>";
  }).join("");
}

function addDeadlineRow() {
  state.deadlines.push({
    id: Date.now(),
    name: "New Critical Deadline",
    datetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    alarm: true,
    done: false,
    rung: false
  });
  saveState();
  renderDeadlines();
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return d + "d " + h + "h " + m + "m " + s + "s";
}

// ==================== 4. DRONE VIEW & PROGRESS ====================
function getDroneDayStats(day) {
  const pillars = state.droneView.days[day] || [];
  let done = 0;
  let total = 0;
  pillars.forEach(function (p) {
    (p.tasks || []).forEach(function (t) {
      if (String(t.text || "").trim() !== "") {
        total++;
        if (t.done) done++;
      }
    });
  });
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done: done, total: total, pct: pct };
}

function renderDroneView() {
  const selector = document.getElementById("droneDaySelector");
  if (!selector) return;
  selector.innerHTML = DAYS_OF_WEEK.map(function (day) {
    return "<button class='day-pill " + (state.droneView.activeDay === day ? "active" : "") + "' onclick=\"selectDroneDay('" + day + "')\">" + escapeHtml(day) + "</button>";
  }).join("");

  const active = state.droneView.activeDay;
  const pillars = state.droneView.days[active] || [];
  pillars.forEach(function (p) { ensureTrailingBlankCheckbox(p.tasks); });

  const container = document.getElementById("droneActiveDayContainer");
  container.innerHTML = "<h3 style='margin-bottom:6px;'>" + escapeHtml(active) + " — Execution Pillars</h3>" +
    "<small style='color:var(--text-muted); display:block; margin-bottom:10px;'>Type an action and press <strong>Enter</strong> for a new line. Click <strong>✕</strong> on any row to remove it.</small>" +
    pillars.map(function (p, pIdx) {
      const tasksHtml = p.tasks.map(function (t, tIdx) {
        const delBtn = p.tasks.length > 1
          ? "<button class='del-mini' title='Delete checkbox' onclick=\"state.droneView.days['" + active + "'][" + pIdx + "].tasks.splice(" + tIdx + ",1);saveState();renderDroneView()\">✕</button>"
          : "";
        return "<div class='check-row'>" +
          "<input type='checkbox' " + (t.done ? "checked" : "") + " onchange=\"state.droneView.days['" + active + "'][" + pIdx + "].tasks[" + tIdx + "].done=this.checked;saveState();renderDroneView()\" />" +
          "<div id='drone_" + pIdx + "_" + tIdx + "' class='check-text-editable " + (t.done ? "done" : "") + "' contenteditable='true' data-placeholder='Type action and press Enter...' " +
          "oninput=\"state.droneView.days['" + active + "'][" + pIdx + "].tasks[" + tIdx + "].text=this.textContent;saveState()\" " +
          "onkeydown=\"handleChecklistEnter(event, state.droneView.days['" + active + "'][" + pIdx + "].tasks, " + tIdx + ", renderDroneView, 'drone_" + pIdx + "')\" " +
          "onblur='renderDroneView()'>" + escapeHtml(t.text) + "</div>" + delBtn + "</div>";
      }).join("");
      return "<div class='pillar-block'><div class='pillar-title' contenteditable='true' onblur=\"state.droneView.days['" + active + "'][" + pIdx + "].title=this.textContent;saveState()\">" + escapeHtml(p.title) + "</div>" + tasksHtml + "</div>";
    }).join("");

  const dayStats = getDroneDayStats(active);
  document.getElementById("droneTodayDisplay").textContent = dayStats.done + " / " + dayStats.total + " Tasks (" + dayStats.pct + "%)";
  let weekSumPct = 0;
  DAYS_OF_WEEK.forEach(function (d) { weekSumPct += getDroneDayStats(d).pct; });
  const weekAvg = Math.round(weekSumPct / 7);
  document.getElementById("droneWeeklyDisplay").textContent = weekAvg + "% (" + (weekAvg >= 50 ? "Goal Met (>50%)" : "Target: >50%") + ")";
  renderPerfWorld("drone", "dronePerfWorld");
}
function selectDroneDay(day) {
state.droneView.activeDay = day;
saveState();
renderDroneView();
}
// ==================== 5. ATOMIC CORE ====================
function getAtomicDayStats(day) {
  const d = state.atomicCore.days[day] || {};
  let pts = 0;
  ["hardestOptions", "hardOptions", "directTasks", "bonusTasks"].forEach(function (group) {
    (d[group] || []).forEach(function (o) { if (o.done) pts += Number(o.pts || 0); });
  });
  const capped = Math.min(20, pts);
  return { done: capped, total: 20, pct: Math.round((capped / 20) * 100) };
}

function renderAtomicCore() {
  const selector = document.getElementById("atomicDaySelector");
  if (!selector) return;
  selector.innerHTML = DAYS_OF_WEEK.map(function (day) {
    return "<button class='day-pill " + (state.atomicCore.activeDay === day ? "active" : "") + "' onclick=\"selectAtomicDay('" + day + "')\">" + escapeHtml(day) + "</button>";
  }).join("");

  const active = state.atomicCore.activeDay;
  const d = state.atomicCore.days[active] || {};
  const container = document.getElementById("atomicActiveDayContainer");

  function renderTierRows(arr, groupName) {
    return arr.map(function (opt, idx) {
      return "<div class='atomic-row'>" +
        "<input type='checkbox' " + (opt.done ? "checked" : "") + " onchange=\"toggleAtomicTier('" + groupName + "', " + idx + ")\" />" +
        "<div class='check-text-editable " + (opt.done ? "done" : "") + "' contenteditable='true' onblur=\"state.atomicCore.days['" + active + "']['" + groupName + "'][" + idx + "].label=this.textContent;saveState()\">" + escapeHtml(opt.label) + "</div>" +
        "<input type='text' class='subject-note-input' placeholder='Subject / Topic...' value='" + escapeHtml(opt.subject || "") + "' onchange=\"state.atomicCore.days['" + active + "']['" + groupName + "'][" + idx + "].subject=this.value;saveState()\" />" +
        "<input type='number' style='width:40px;border:none;background:transparent;font-weight:800;color:inherit;text-align:right;' value='" + Number(opt.pts || 0) + "' onchange=\"state.atomicCore.days['" + active + "']['" + groupName + "'][" + idx + "].pts=Number(this.value);saveState();renderAtomicCore()\" /> pts" +
        "</div>";
    }).join("");
  }

  container.innerHTML = "<h3 style='margin-bottom:6px;'>" + escapeHtml(active) + " (20 Points) — Atomic Core</h3>" +
    "<div class='atomic-title' contenteditable='true' onblur=\"state.atomicCore.days['" + active + "'].mainTitle=this.textContent;saveState()\">" + escapeHtml(d.mainTitle) + "</div>" +
    "<h4 contenteditable='true' onblur=\"state.atomicCore.days['" + active + "'].hardestTitle=this.textContent;saveState()\">" + escapeHtml(d.hardestTitle) + "</h4>" + renderTierRows(d.hardestOptions || [], "hardestOptions") +
    "<h4 contenteditable='true' onblur=\"state.atomicCore.days['" + active + "'].hardTitle=this.textContent;saveState()\">" + escapeHtml(d.hardTitle) + "</h4>" + renderTierRows(d.hardOptions || [], "hardOptions") +
    renderTierRows(d.directTasks || [], "directTasks") +
    "<h4 contenteditable='true' onblur=\"state.atomicCore.days['" + active + "'].bonusTitle=this.textContent;saveState()\">" + escapeHtml(d.bonusTitle) + "</h4>" + renderTierRows(d.bonusTasks || [], "bonusTasks");

  const dayStats = getAtomicDayStats(active);
  document.getElementById("atomicTodayDisplay").textContent = dayStats.done + " / 20 pts (" + dayStats.pct + "%)";
  let weekSum = 0;
  DAYS_OF_WEEK.forEach(function (day) { weekSum += getAtomicDayStats(day).done; });
  const weekPct = Math.round((weekSum / 140) * 100);
  document.getElementById("atomicWeeklyDisplay").textContent = weekPct + "% (" + (weekPct >= 50 ? "Goal Met (>50%)" : "Target: >50%") + ")";
  renderPerfWorld("atomic", "atomicPerfWorld");
}
function selectAtomicDay(day) {
state.atomicCore.activeDay = day;
saveState();
renderAtomicCore();
}
function toggleAtomicTier(groupName, idx) {
const d = state.atomicCore.days[state.atomicCore.activeDay];
const wasChecked = d[groupName][idx].done;
if (groupName === "hardestOptions" || groupName === "hardOptions") {
d[groupName].forEach(function (item) { item.done = false; });
}
d[groupName][idx].done = !wasChecked;
saveState();
renderAtomicCore();
}
// ==================== AUTOMATIC PERFORMANCE REVIEW DATABASE (NO ADD/DELETE) ====================
function buildSvgRing(pct) {
  const r = 7.5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return "<svg class='perf-ring-svg' viewBox='0 0 20 20'>" +
    "<circle class='ring-track' cx='10' cy='10' r='" + r + "'></circle>" +
    "<circle class='ring-val' cx='10' cy='10' r='" + r + "' stroke-dasharray='" + circ.toFixed(1) + "' stroke-dashoffset='" + offset.toFixed(1) + "'></circle>" +
    "</svg>";
}
function autoSyncPerformanceDatabase(sysKey) {
const sys = sysKey === "drone" ? state.droneView : state.atomicCore;
if (!sys || typeof sys !== "object") return;
if (!sys.dailyArchive) sys.dailyArchive = {};
const today = new Date();
const todayStr = toLocalDateKey(today);
if (!sys.firstUsedDate) sys.firstUsedDate = todayStr;
// 1. Update all 7 days of the current active week directly from checkboxes above
const currentDow = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
const mondayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
mondayDate.setDate(mondayDate.getDate() - currentDow);
DAYS_OF_WEEK.forEach(function (dayName, idx) {
const d = new Date(mondayDate);
d.setDate(mondayDate.getDate() + idx);
const dStr = toLocalDateKey(d);
const stats = sysKey === "drone" ? getDroneDayStats(dayName) : getAtomicDayStats(dayName);
const prevNote = sys.dailyArchive[dStr] ? sys.dailyArchive[dStr].notes : "";
sys.dailyArchive[dStr] = {
date: dStr,
dayName: dayName,
done: stats.done,
total: stats.total,
pct: stats.pct,
notes: prevNote
};
});
// 2. Backfill any missed days between firstUsedDate and today as 0 Tasks / 0 Pts
let cursor = new Date(String(sys.firstUsedDate).slice(0, 10) + "T12:00:00");
if (isNaN(cursor.getTime())) cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
const endCursor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
while (cursor <= endCursor) {
const cStr = toLocalDateKey(cursor);
if (!sys.dailyArchive[cStr]) {
const wName = cursor.toLocaleDateString("en-US", { weekday: "long" });
const defaultTotal = sysKey === "drone" ? getDroneDayStats(wName).total : 20;
sys.dailyArchive[cStr] = {
date: cStr,
dayName: wName,
done: 0,
total: defaultTotal,
pct: 0,
notes: ""
};
}
cursor.setDate(cursor.getDate() + 1);
}
// 3. Group all records automatically into Years and Months
const grouped = {};
Object.keys(sys.dailyArchive).sort().forEach(function (dateKey) {
const rec = sys.dailyArchive[dateKey];
const dt = new Date(dateKey + "T12:00:00");
if (isNaN(dt.getTime()) || !rec) return;
const yearStr = String(dt.getFullYear());
const monthIndex = dt.getMonth();
const monthName = dt.toLocaleDateString("en-US", { month: "long" });
const monthId = "auto_" + yearStr + "_" + monthIndex;
if (!grouped[yearStr]) grouped[yearStr] = {};
if (!grouped[yearStr][monthId]) {
grouped[yearStr][monthId] = {
id: monthId,
monthIndex: monthIndex,
name: monthName,
entries: []
};
}
grouped[yearStr][monthId].entries.push(rec);
});
sys.years = {};
Object.keys(grouped).sort().forEach(function (y) {
sys.years[y] = Object.values(grouped[y]).sort(function (a, b) {
return a.monthIndex - b.monthIndex;
});
});
if (!sys.years[sys.activeYear]) {
  const availableYears = Object.keys(sys.years).sort();
  sys.activeYear = availableYears.length ? availableYears[availableYears.length - 1] : String(today.getFullYear());
}
}
function renderPerfWorld(sysKey, containerId) {
  autoSyncPerformanceDatabase(sysKey);
  const sys = sysKey === "drone" ? state.droneView : state.atomicCore;
  const box = document.getElementById(containerId);
  if (!box) return;
  const years = Object.keys(sys.years).sort();

  const yearBarHtml = "<div class='perf-year-bar'><div class='perf-year-tabs'>" +
    years.map(function (y) {
      return "<button class='perf-year-tab " + (sys.activeYear === y ? "active" : "") + "' onclick=\"selectPerfYear('" + sysKey + "', '" + y + "')\">" + y + "</button>";
    }).join("") +
    "</div></div>";

  const months = sys.years[sys.activeYear] || [];

  // VIEW A: INSIDE OPENED MONTH SUB-PAGE
  if (sys.openMonthId) {
    const monthObj = months.find(function (m) { return m.id === sys.openMonthId; });
    if (!monthObj) {
      sys.openMonthId = null;
      return renderPerfWorld(sysKey, containerId);
    }

    const avgPct = monthObj.entries.length === 0
      ? 0
      : Math.round(monthObj.entries.reduce(function (s, e) { return s + e.pct; }, 0) / monthObj.entries.length);

    const scoreColTitle = sysKey === "drone" ? "Tasks done" : "Points";

    const rowsHtml = monthObj.entries.map(function (e) {
      let badgeHtml = "";
      if (e.done === 0) {
        badgeHtml = "<span class='perf-zero-pill'>0 " + (sysKey === "drone" ? "TASKS" : "PTS") + "</span>";
      } else if (e.pct >= 50) {
        badgeHtml = "<span class='perf-pass-pill'>" + e.done + " / " + e.total + "</span>";
      } else {
        badgeHtml = "<span class='perf-mid-pill'>" + e.done + " / " + e.total + "</span>";
      }

      return "<tr>" +
        "<td><div class='perf-name-flex'><span class='perf-page-title-wrap'><span class='perf-doc-badge'>📄</span> " + e.dayName + "</span></div></td>" +
        "<td class='perf-date-text'>" + e.date + "</td>" +
        "<td><div class='perf-score-cell'>" + badgeHtml + buildSvgRing(e.pct) + "<span style='font-size:12px;color:var(--text-muted);'>" + e.pct + "%</span></div></td>" +
        "<td><span class='perf-note-editable' contenteditable='true' onblur=\"editMonthEntryNote('" + sysKey + "', '" + e.date + "', this.textContent)\">" + (e.notes || "") + "</span></td>" +
        "</tr>";
    }).join("");

    box.innerHTML = yearBarHtml +
      "<div class='perf-notion-shell'>" +
        "<div class='perf-month-hero'>" +
          "<button class='perf-back-crumb' onclick=\"closePerfMonth('" + sysKey + "')\">‹ Performance review</button>" +
          "<div class='perf-month-title-row'>" +
            "<div class='perf-month-heading'>" + monthObj.name + "</div>" +
            "<button class='perf-refresh-btn' onclick=\"refreshPerfMonth('" + sysKey + "')\">↻ Refresh</button>" +
          "</div>" +
          "<div class='perf-prop-strip'>" +
            "<div class='perf-prop-item'><span class='perf-prop-key'>⚛️ Monthly Progress</span><span class='perf-prop-val'>" + avgPct + "%</span>" + buildSvgRing(avgPct) + "</div>" +
            "<div class='perf-progress-track'><div class='perf-progress-fill' style='width:" + avgPct + "%'></div></div>" +
            "<div class='perf-prop-item'><span class='perf-prop-key'>Year</span><span class='perf-prop-val'>" + sys.activeYear + "</span></div>" +
          "</div>" +
        "</div>" +
        "<div class='perf-table-scroll'>" +
          "<table class='perf-notion-table'>" +
            "<thead><tr>" +
              "<th><span class='perf-col-icon'>Aa</span> Name</th>" +
              "<th><span class='perf-col-icon'>📅</span> Date</th>" +
              "<th><span class='perf-col-icon'>#</span> " + scoreColTitle + "</th>" +
              "<th><span class='perf-col-icon'>≡</span> Notes</th>" +
            "</tr></thead>" +
            "<tbody>" + rowsHtml + "</tbody>" +
          "</table>" +
        "</div>" +
      "</div>";
    return;
  }

  // VIEW B: NOTION MONTH DATABASE LIST
  const monthRowsHtml = months.map(function (m) {
    const avg = m.entries.length === 0 ? 0 : Math.round(m.entries.reduce(function (s, e) { return s + e.pct; }, 0) / m.entries.length);
    return "<tr>" +
      "<td><div class='perf-name-flex'><span class='perf-page-title-wrap'><span class='perf-doc-badge'>📄</span> " + m.name + "</span><button class='perf-open-btn' onclick=\"openPerfMonth('" + sysKey + "', '" + m.id + "')\">OPEN</button></div></td>" +
      "<td><div class='perf-score-cell'>" + buildSvgRing(avg) + "<span>" + avg + "%</span></div></td>" +
      "<td class='perf-date-text'>" + m.entries.length + " days tracked</td>" +
      "</tr>";
  }).join("");

  box.innerHTML = yearBarHtml +
    "<div class='perf-notion-shell'>" +
      "<div class='perf-db-header'>" +
        "<div class='perf-db-title-group'>" +
          "<span class='perf-db-badge-icon'>⊞</span>" +
          "<span class='perf-db-title'>Performance review</span>" +
          "<span class='perf-db-chevron'>⌄</span>" +
        "</div>" +
        "<button class='perf-refresh-btn' onclick=\"refreshPerfMonth('" + sysKey + "')\">↻ Refresh</button>" +
      "</div>" +
      "<div class='perf-table-scroll'>" +
        "<table class='perf-notion-table'>" +
          "<thead><tr>" +
            "<th><span class='perf-col-icon'>Aa</span> Name</th>" +
            "<th><span class='perf-col-icon'>⚛️</span> Monthly Progress</th>" +
            "<th><span class='perf-col-icon'>#</span> Tracked Days</th>" +
          "</tr></thead>" +
          "<tbody>" + monthRowsHtml + "</tbody>" +
        "</table>" +
      "</div>" +
    "</div>";
}
function refreshPerfMonth(sysKey) {
autoSyncPerformanceDatabase(sysKey);
saveState();
sysKey === "drone" ? renderDroneView() : renderAtomicCore();
}
function selectPerfYear(sysKey, year) {
const sys = sysKey === "drone" ? state.droneView : state.atomicCore;
sys.activeYear = year;
sys.openMonthId = null;
saveState();
sysKey === "drone" ? renderDroneView() : renderAtomicCore();
}
function openPerfMonth(sysKey, monthId) {
const sys = sysKey === "drone" ? state.droneView : state.atomicCore;
sys.openMonthId = monthId;
saveState();
sysKey === "drone" ? renderDroneView() : renderAtomicCore();
}
function closePerfMonth(sysKey) {
const sys = sysKey === "drone" ? state.droneView : state.atomicCore;
sys.openMonthId = null;
saveState();
sysKey === "drone" ? renderDroneView() : renderAtomicCore();
}
function editMonthEntryNote(sysKey, dateKey, text) {
const sys = sysKey === "drone" ? state.droneView : state.atomicCore;
if (sys.dailyArchive && sys.dailyArchive[dateKey]) {
sys.dailyArchive[dateKey].notes = text;
saveState();
}
}


const MELODIES = {
  morning_glory: [
    { f: 523.25, d: 0.22 }, { f: 659.25, d: 0.22 }, { f: 783.99, d: 0.22 }, { f: 1046.50, d: 0.36 },
    { f: 880.00, d: 0.22 }, { f: 1046.50, d: 0.22 }, { f: 783.99, d: 0.42 }
  ],
  morning_flower: [
    { f: 659.25, d: 0.20 }, { f: 739.99, d: 0.20 }, { f: 830.61, d: 0.20 }, { f: 987.77, d: 0.34 },
    { f: 830.61, d: 0.20 }, { f: 739.99, d: 0.20 }, { f: 659.25, d: 0.40 }
  ],
  homecoming: [
    { f: 440.00, d: 0.26 }, { f: 554.37, d: 0.26 }, { f: 659.25, d: 0.26 }, { f: 880.00, d: 0.42 },
    { f: 739.99, d: 0.26 }, { f: 659.25, d: 0.26 }, { f: 554.37, d: 0.44 }
  ],
  fireflies: [
    { f: 523.25, d: 0.18 }, { f: 659.25, d: 0.18 }, { f: 783.99, d: 0.18 }, { f: 1046.50, d: 0.32 },
    { f: 987.77, d: 0.18 }, { f: 783.99, d: 0.18 }, { f: 659.25, d: 0.35 }
  ],
  horizon: [
    { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.25 }, { f: 493.88, d: 0.25 }, { f: 587.33, d: 0.35 },
    { f: 783.99, d: 0.45 }, { f: 659.25, d: 0.45 }
  ],
  betteroff: [
    { f: 493.88, d: 0.16 }, { f: 493.88, d: 0.16 }, { f: 415.30, d: 0.16 }, { f: 493.88, d: 0.22 },
    { f: 554.37, d: 0.22 }, { f: 493.88, d: 0.18 }, { f: 415.30, d: 0.22 }, { f: 369.99, d: 0.32 }
  ],
  insomnia: [
    { f: 329.63, d: 0.15 }, { f: 329.63, d: 0.15 }, { f: 493.88, d: 0.22 }, { f: 493.88, d: 0.15 },
    { f: 523.25, d: 0.22 }, { f: 493.88, d: 0.18 }, { f: 440.00, d: 0.18 }, { f: 392.00, d: 0.28 }
  ]
};

function selectAlarmTone(tone) {
  state.alarmSettings.tone = tone;
  saveState();
  updateRingtoneSelectionUI();
  resyncAllNativeAlarms();
}

function updateRingtoneSelectionUI() {
  document.querySelectorAll(".ringtone-item").forEach(function (el) {
    el.classList.toggle("selected", el.dataset.tone === state.alarmSettings.tone);
  });
  if (state.alarmSettings.hasCustomTrack) {
    document.getElementById("customTrackTitle").textContent = state.alarmSettings.customTrackName;
    document.getElementById("customTrackSub").textContent = "Local audio file loaded & ready";
  }
}

function toggleVibrationSetting(enabled) {
  state.alarmSettings.vibrate = enabled;
  saveState();
  resyncAllNativeAlarms();
}

function setAlarmVolume(val) {
  state.alarmSettings.volume = Number(val);
  if (customAudioObj) customAudioObj.volume = state.alarmSettings.volume;
  saveState();
}

function uploadCustomAlarmTrack(event) {
  const file = event.target.files;
  if (!file) return;
  saveCustomAudioBlob(file);
  customAudioObj = new Audio(URL.createObjectURL(file));
  customAudioObj.loop = true;
  customAudioObj.volume = state.alarmSettings.volume;

  // Also save custom audio to native Android Filesystem so AlarmActivity can play it when app is closed
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
    const reader = new FileReader();
    reader.onload = function () {
      const base64Data = String(reader.result).split(",");
      window.Capacitor.Plugins.Filesystem.writeFile({
        path: "tapasya_custom_alarm.audio",
        data: base64Data,
        directory: "DATA"
      }).catch(function () {});
    };
    reader.readAsDataURL(file);
  }

  state.alarmSettings.tone = "custom";
  state.alarmSettings.hasCustomTrack = true;
  state.alarmSettings.customTrackName = file.name;
  saveState();
  updateRingtoneSelectionUI();
  resyncAllNativeAlarms();
}

function unlockAudioEngine() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}
document.addEventListener("pointerdown", unlockAudioEngine, { passive: true });
document.addEventListener("keydown", unlockAudioEngine, { passive: true });

function playMelodySequence(toneKey) {
  unlockAudioEngine();
  if (toneKey === "custom") {
    if (customAudioObj) {
      customAudioObj.volume = state.alarmSettings.volume || 1.0;
      customAudioObj.currentTime = 0;
      customAudioObj.play().catch(function () {});
    } else {
      alert("Please choose an audio file from your device first.");
    }
    return;
  }

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    const startNotes = function () {
      const notes = MELODIES[toneKey] || MELODIES.morning_glory;
      let offset = audioCtx.currentTime + 0.03;
      const masterVol = Math.max(0.25, Number(state.alarmSettings.volume || 1.0)) * 0.85;

      notes.forEach(function (n) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = toneKey === "insomnia" ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(n.f, offset);

        gain.gain.setValueAtTime(0.01, offset);
        gain.gain.linearRampToValueAtTime(masterVol, offset + 0.02);
        gain.gain.linearRampToValueAtTime(0.01, offset + n.d);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(offset);
        osc.stop(offset + n.d + 0.03);
        offset += n.d + 0.05;
      });
    };

    if (audioCtx.state === "suspended") audioCtx.resume().then(startNotes);
    else startNotes();
  } catch (e) {}
}

function previewTone(toneKey) {
  stopAlarmAudioOnly();
  selectAlarmTone(toneKey);
  playMelodySequence(toneKey);
  if (toneKey === "custom" && customAudioObj) {
    setTimeout(stopAlarmAudioOnly, 5000);
  }
}

function testAlarmNow() {
  // On Android APK, also launches the real native lock-screen AlarmActivity
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TapasyaAlarm) {
    window.Capacitor.Plugins.TapasyaAlarm.testNow({
      title: "Work",
      tone: state.alarmSettings.tone || "morning_glory",
      vibrate: state.alarmSettings.vibrate !== false
    });
    return;
  }
  triggerAlarmPopup("Work", "TAPASYA Test Alarm");
}

function triggerAlarmPopup(title, desc) {
  const now = new Date();
  const clockEl = document.getElementById("alarmModalClock");
  if (clockEl) {
    clockEl.textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }
  document.getElementById("alarmModalTitle").textContent = title;
  document.getElementById("alarmModalDesc").textContent = desc || "";
  document.getElementById("alarmModal").classList.remove("hidden");

  try {
    if (state.alarmSettings.vibrate && typeof navigator.vibrate === "function") {
      navigator.vibrate();
      clearInterval(vibrateInterval);
      vibrateInterval = setInterval(function () { navigator.vibrate(); }, 2200);
    }
  } catch (e) {}

  const tone = state.alarmSettings.tone || "morning_glory";
  playMelodySequence(tone);
  clearInterval(melodyLoopTimer);
  if (tone !== "custom") {
    melodyLoopTimer = setInterval(function () { playMelodySequence(tone); }, 2100);
  }
}

function stopAlarmAudioOnly() {
  clearInterval(melodyLoopTimer);
  clearInterval(vibrateInterval);
  if (typeof navigator.vibrate === "function") navigator.vibrate(0);
  if (customAudioObj) {
    customAudioObj.pause();
    customAudioObj.currentTime = 0;
  }
}

function stopAlarm() {
  stopAlarmAudioOnly();
  document.getElementById("alarmModal").classList.add("hidden");
}

function snoozeAlarm() {
  const title = document.getElementById("alarmModalTitle").textContent;
  stopAlarm();
  setTimeout(function () { triggerAlarmPopup(title, "Snoozed"); }, 300000);
}

async function openSystemAlarmSettings() {
  const statusEl = document.getElementById("permStatusText");
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TapasyaAlarm) {
    try {
      await window.Capacitor.Plugins.TapasyaAlarm.openAlarmSettings();
      statusEl.textContent = "Opened Android Alarm & Lock-Screen Settings.";
      return;
    } catch (e) {}
  }
  if ("Notification" in window) {
    const res = await Notification.requestPermission();
    statusEl.textContent = res === "granted"
      ? "Notifications allowed. Inside the Android APK, this opens your phone's Exact Alarm & Lock-Screen settings."
      : "Permission blocked in browser.";
  }
}

function scheduleNativeNotification(title, timeStr, alarmId) {
  if (!timeStr) return;
  const parts = timeStr.split(":");
  const target = new Date();
  target.setHours(parseInt(parts, 10) || 0, parseInt(parts, 10) || 0, 0, 0);
  if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TapasyaAlarm) {
    window.Capacitor.Plugins.TapasyaAlarm.scheduleAlarm({
      id: Number(alarmId || Math.floor(Math.random() * 100000)),
      title: title || "Work",
      triggerAtMillis: target.getTime(),
      tone: state.alarmSettings.tone || "morning_glory",
      vibrate: state.alarmSettings.vibrate !== false
    }).catch(function () {});
  }
}

function resyncAllNativeAlarms() {
  if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.TapasyaAlarm) return;
  state.nukeToday.scheduleTasks.forEach(function (t) {
    if (t.alarm && t.status !== "Done") scheduleNativeNotification(t.title, t.time, t.id);
  });
  state.nukeGoal.todayTasks.concat(state.nukeGoal.tomorrowTasks).forEach(function (t) {
    if (t.alarm) scheduleNativeNotification(t.name, t.time, t.id);
  });
}


// ==================== LIVE TIMERS & ALARM CHECKER ====================
function updateLiveTimers() {
const now = new Date();
const nowMs = now.getTime();
const goalDiff = Math.max(0, new Date(state.nukeGoal.deadline).getTime() - nowMs);
const gSec = Math.floor(goalDiff / 1000);
document.getElementById("goalDays").textContent = String(Math.floor(gSec / 86400)).padStart(2, "0");
document.getElementById("goalHours").textContent = String(Math.floor((gSec % 86400) / 3600)).padStart(2, "0");
document.getElementById("goalMins").textContent = String(Math.floor((gSec % 3600) / 60)).padStart(2, "0");
document.getElementById("goalSecs").textContent = String(gSec % 60).padStart(2, "0");
const activeDeadlines = state.deadlines.filter(function (d) { return !d.done; });
const upcoming = activeDeadlines
.filter(function (d) { return new Date(d.datetime).getTime() > nowMs; })
.sort(function (a, b) { return new Date(a.datetime) - new Date(b.datetime); });
const overdue = activeDeadlines.filter(function (d) { return new Date(d.datetime).getTime() <= nowMs; });
if (upcoming.length > 0) {
const next = upcoming[0];
document.getElementById("nearestTaskName").textContent = next.name;
document.getElementById("nearestCountdown").textContent = formatDuration(new Date(next.datetime).getTime() - nowMs) + " left";
} else {
document.getElementById("nearestTaskName").textContent = "All upcoming deadlines clear";
document.getElementById("nearestCountdown").textContent = "Assign a future deadline below";
}
const overdueBanner = document.getElementById("overdueDeadlineBanner");
if (overdue.length > 0) {
overdueBanner.classList.remove("hidden");
document.getElementById("overdueListText").textContent = overdue
.map(function (o) {
return "You crossed the deadline for " + o.name + " (" + formatDuration(nowMs - new Date(o.datetime).getTime()) + " overdue)";
})
.join("\n");
} else {
overdueBanner.classList.add("hidden");
}
const currentHHMM = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
state.nukeToday.scheduleTasks.forEach(function (t) {
if (t.time !== currentHHMM && t.rung) t.rung = false;
if (t.alarm && !t.rung && t.time === currentHHMM && t.status !== "Done") {
t.rung = true;
saveState();
triggerAlarmPopup("Nuke XYX Alarm", t.title);
}
});
state.nukeGoal.todayTasks.forEach(function (t) {
if (t.time !== currentHHMM && t.rung) t.rung = false;
if (t.alarm && !t.rung && t.time === currentHHMM) {
t.rung = true;
saveState();
triggerAlarmPopup("Nuke a Goal Alarm", t.name);
}
});
state.nukeGoal.tomorrowTasks.forEach(function (t) {
if (t.time !== currentHHMM && t.rung) t.rung = false;
if (t.alarm && !t.rung && t.time === currentHHMM) {
t.rung = true;
saveState();
triggerAlarmPopup("Nuke a Goal Alarm", t.name);
}
});
state.deadlines.forEach(function (d) {
if (d.alarm && !d.rung && !d.done && new Date(d.datetime).getTime() <= nowMs) {
d.rung = true;
saveState();
triggerAlarmPopup("Deadline Reached", "Deadline crossed for: " + d.name);
renderDeadlines();
}
});
}
function importBackup(event) {
const file = event.target.files && event.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = function (e) {
try {
const imported = JSON.parse(e.target.result);
if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("Invalid backup format");
state = mergeDefaults(JSON.parse(JSON.stringify(DEFAULT_DATA)), imported);
saveState();
location.reload();
} catch (err) {
alert("Invalid backup file.");
}
};
reader.readAsText(file);
}
// ==================== INITIALIZE APP ====================
setTheme(state.theme);
initPickerWheels();
updateFolderStatusUI();
updateRingtoneSelectionUI();
document.getElementById("vibrateToggle").checked = state.alarmSettings.vibrate !== false;
document.getElementById("alarmVolumeSlider").value = state.alarmSettings.volume ?? 1;
if (state.hasOnboarded) {
document.getElementById("welcomeScreen").classList.add("hidden");
document.getElementById("appShell").classList.remove("hidden");
}
initEditableBindings();
renderNukeToday();
renderNukeGoal();
renderDeadlines();
renderDroneView();
renderAtomicCore();
updateLiveTimers();
setInterval(updateLiveTimers, 1000);
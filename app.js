const STORAGE_KEY = 'mytasks-v2';
const THEME_KEY = 'mytasks-theme';
const ARC_KEY = 'mytasks-winter-arc-v1';
const DEFAULT_HABITS = ['GATE Study', 'Workout', 'Reading', 'Deep Work'];
const ARC_START = '2026-10-01';
const ARC_END = '2026-12-31';

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';
let currentView = 'tasks';
let selectedDate = todayKey();

const $ = (id) => document.getElementById(id);
const input = $('taskInput');

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function dateFromKey(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
function keyFromDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function formatDate(ts) { return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
function prettyDate(key, options = { weekday: 'short', month: 'short', day: 'numeric' }) { return dateFromKey(key).toLocaleDateString(undefined, options); }
function clampDate(key) { if (key < ARC_START) return ARC_START; if (key > ARC_END) return ARC_END; return key; }

function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

function getArc() {
  const saved = JSON.parse(localStorage.getItem(ARC_KEY) || 'null');
  if (saved && Array.isArray(saved.habits) && saved.days) return saved;
  return { habits: DEFAULT_HABITS.map((name, i) => ({ id: `habit-${i+1}`, name })), days: {} };
}
let arc = getArc();
function saveArc() { localStorage.setItem(ARC_KEY, JSON.stringify(arc)); }

function ensureDay(key) {
  if (!arc.days[key]) arc.days[key] = { completed: {}, note: '' };
  return arc.days[key];
}

function renderTasks() {
  const filtered = tasks.filter(t => currentFilter === 'all' || (currentFilter === 'done' ? t.done : !t.done));
  $('taskList').innerHTML = filtered.map(t => `
    <article class="task ${t.done ? 'done' : ''}">
      <button class="check" aria-label="${t.done ? 'Mark pending' : 'Mark complete'}" data-action="toggle" data-id="${t.id}">${t.done ? '✓' : ''}</button>
      <div class="task-text">${escapeHtml(t.text)}<span class="task-time">${formatDate(t.createdAt)}</span></div>
      <button class="delete" aria-label="Delete task" data-action="delete" data-id="${t.id}">✕</button>
    </article>`).join('');
  $('totalCount').textContent = tasks.length;
  $('activeCount').textContent = tasks.filter(t => !t.done).length;
  $('doneCount').textContent = tasks.filter(t => t.done).length;
  const empty = filtered.length === 0;
  $('emptyState').classList.toggle('hidden', !empty);
  if (empty) {
    const title = currentFilter === 'done' ? 'No completed tasks' : currentFilter === 'active' ? 'All caught up!' : 'No tasks yet';
    const text = currentFilter === 'done' ? 'Complete a task and it will appear here.' : currentFilter === 'active' ? 'You have no pending tasks.' : 'Add your first task above and start getting things done.';
    $('emptyTitle').textContent = title; $('emptyText').textContent = text;
  }
}
function addTask() {
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), text, done: false, createdAt: Date.now() });
  input.value = ''; saveTasks(); renderTasks(); input.focus();
}

function arcDates() {
  const dates = [];
  for (let d = dateFromKey(ARC_START); keyFromDate(d) <= ARC_END; d.setDate(d.getDate() + 1)) dates.push(keyFromDate(d));
  return dates;
}
function completedCount(key) {
  const day = arc.days[key]; if (!day) return 0;
  return arc.habits.filter(h => day.completed[h.id]).length;
}
function completionRatio(key) { return arc.habits.length ? completedCount(key) / arc.habits.length : 0; }
function currentStreak() {
  let cursor = clampDate(todayKey());
  let streak = 0;
  while (cursor >= ARC_START) {
    if (completionRatio(cursor) < 1) break;
    streak++;
    const d = dateFromKey(cursor); d.setDate(d.getDate() - 1); cursor = keyFromDate(d);
  }
  return streak;
}
function bestStreak() {
  let best = 0, run = 0;
  for (const key of arcDates()) {
    if (completionRatio(key) === 1) { run++; best = Math.max(best, run); } else run = 0;
  }
  return best;
}
function arcOverallProgress() {
  const dates = arcDates();
  if (!arc.habits.length) return 0;
  const total = dates.length * arc.habits.length;
  const done = dates.reduce((sum, key) => sum + completedCount(key), 0);
  return Math.round((done / total) * 100);
}
function arcDayNumber(key) { return Math.floor((dateFromKey(key) - dateFromKey(ARC_START)) / 86400000) + 1; }

function renderWinter() {
  selectedDate = clampDate(selectedDate);
  const day = ensureDay(selectedDate);
  const today = todayKey();
  const progress = arcOverallProgress();
  const todayRatio = completionRatio(selectedDate);
  const end = dateFromKey(ARC_END);
  const actualToday = dateFromKey(today);
  const daysLeft = today < ARC_START ? arcDates().length : today > ARC_END ? 0 : Math.max(0, Math.ceil((end - actualToday) / 86400000));

  $('winterDates').textContent = `${prettyDate(ARC_START, {month:'short', day:'numeric', year:'numeric'})} → ${prettyDate(ARC_END, {month:'short', day:'numeric', year:'numeric'})}`;
  $('daysLeft').textContent = daysLeft;
  $('arcProgressBar').style.width = `${progress}%`;
  $('arcProgressText').textContent = `${progress}% complete`;
  $('arcDayText').textContent = `Day ${arcDayNumber(selectedDate)} / ${arcDates().length}`;
  $('todayPercent').textContent = `${Math.round(todayRatio * 100)}%`;
  $('currentStreak').textContent = currentStreak();
  $('bestStreak').textContent = bestStreak();
  $('selectedDateLabel').textContent = prettyDate(selectedDate, { weekday:'long', month:'long', day:'numeric' });

  $('habitSummary').textContent = `${completedCount(selectedDate)} of ${arc.habits.length} complete`;
  $('habitList').innerHTML = arc.habits.map(h => {
    const done = !!day.completed[h.id];
    return `<div class="habit-row ${done ? 'done' : ''}">
      <button class="habit-check" data-habit="${h.id}" aria-label="${done ? 'Mark incomplete' : 'Mark complete'}">${done ? '✓' : ''}</button>
      <span>${escapeHtml(h.name)}</span>
      <span class="habit-status">${done ? 'Done' : 'Open'}</span>
    </div>`;
  }).join('');
  $('habitEmpty').classList.toggle('hidden', arc.habits.length !== 0);
  $('dailyNote').value = day.note || '';
  renderCalendar();
}

function renderCalendar() {
  const days = arcDates();
  $('arcCalendar').innerHTML = days.map(key => {
    const ratio = completionRatio(key);
    const isSelected = key === selectedDate;
    const isToday = key === todayKey();
    const pct = Math.round(ratio * 100);
    return `<button class="calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${key}" title="${prettyDate(key)} — ${pct}%">
      <span>${dateFromKey(key).getDate()}</span><i style="--fill:${pct}%"></i>
    </button>`;
  }).join('');
}

function openHabitDialog() {
  $('habitName').value = '';
  $('habitDialog').showModal();
  setTimeout(() => $('habitName').focus(), 50);
}
function addHabit() {
  const name = $('habitName').value.trim();
  if (!name) return;
  arc.habits.push({ id: crypto.randomUUID ? crypto.randomUUID() : `habit-${Date.now()}`, name });
  saveArc(); renderWinter();
}
function renderManageHabits() {
  $('manageHabitList').innerHTML = arc.habits.map(h => `<div class="manage-row"><span>${escapeHtml(h.name)}</span><button type="button" class="delete" data-remove-habit="${h.id}">Remove</button></div>`).join('');
}
function openManageDialog() { renderManageHabits(); $('manageDialog').showModal(); }
function removeHabit(id) {
  arc.habits = arc.habits.filter(h => h.id !== id);
  Object.values(arc.days).forEach(day => { if (day.completed) delete day.completed[id]; });
  saveArc(); renderManageHabits(); renderWinter();
}

$('addBtn').addEventListener('click', addTask);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
$('taskList').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]'); if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'toggle') tasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
  if (btn.dataset.action === 'delete') tasks = tasks.filter(t => t.id !== id);
  saveTasks(); renderTasks();
});
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  currentFilter = btn.dataset.filter;
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
  renderTasks();
}));
$('clearDone').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); saveTasks(); renderTasks(); });

document.querySelectorAll('.main-tab').forEach(btn => btn.addEventListener('click', () => {
  currentView = btn.dataset.view;
  document.querySelectorAll('.main-tab').forEach(b => b.classList.toggle('active', b === btn));
  $('tasksView').classList.toggle('hidden', currentView !== 'tasks');
  $('winterView').classList.toggle('hidden', currentView !== 'winter');
  if (currentView === 'winter') renderWinter();
}));

$('habitList').addEventListener('click', e => {
  const btn = e.target.closest('[data-habit]'); if (!btn) return;
  const day = ensureDay(selectedDate);
  const id = btn.dataset.habit;
  day.completed[id] = !day.completed[id];
  saveArc(); renderWinter();
});
$('arcCalendar').addEventListener('click', e => {
  const btn = e.target.closest('[data-date]'); if (!btn) return;
  selectedDate = btn.dataset.date; renderWinter();
});
$('prevDay').addEventListener('click', () => { const d = dateFromKey(selectedDate); d.setDate(d.getDate()-1); selectedDate = clampDate(keyFromDate(d)); renderWinter(); });
$('nextDay').addEventListener('click', () => { const d = dateFromKey(selectedDate); d.setDate(d.getDate()+1); selectedDate = clampDate(keyFromDate(d)); renderWinter(); });
$('dailyNote').addEventListener('input', e => { ensureDay(selectedDate).note = e.target.value; saveArc(); });
$('addHabitBtn').addEventListener('click', openHabitDialog);
$('manageHabitsBtn').addEventListener('click', openManageDialog);
$('habitForm').addEventListener('submit', e => { e.preventDefault(); addHabit(); $('habitDialog').close(); });
$('manageHabitList').addEventListener('click', e => { const btn = e.target.closest('[data-remove-habit]'); if (btn) removeHabit(btn.dataset.removeHabit); });
$('resetArcBtn').addEventListener('click', () => {
  if (confirm('Reset all Winter Arc habit history and notes? Your normal tasks will not be deleted.')) {
    arc = { habits: DEFAULT_HABITS.map((name, i) => ({ id: `habit-${i+1}`, name })), days: {} };
    selectedDate = todayKey(); saveArc(); renderWinter();
  }
});

$('dateText').textContent = new Date().toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'});
function setTheme(theme) { document.body.classList.toggle('dark', theme === 'dark'); $('themeBtn').textContent = theme === 'dark' ? '☀' : '☾'; localStorage.setItem(THEME_KEY, theme); }
$('themeBtn').addEventListener('click', () => setTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));
setTheme(localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
renderTasks();
renderWinter();

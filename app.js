const STORAGE_KEY = 'mytasks-v1';
const THEME_KEY = 'mytasks-theme';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';

const $ = (id) => document.getElementById(id);
const input = $('taskInput');

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function escapeHtml(value) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function formatDate(ts) { return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
function render() {
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
    $('emptyTitle').textContent = title;
    $('emptyText').textContent = text;
  }
}
function addTask() {
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), text, done: false, createdAt: Date.now() });
  input.value = ''; save(); render(); input.focus();
}
$('addBtn').addEventListener('click', addTask);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
$('taskList').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]'); if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'toggle') tasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
  if (btn.dataset.action === 'delete') tasks = tasks.filter(t => t.id !== id);
  save(); render();
});
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  currentFilter = btn.dataset.filter;
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
  render();
}));
$('clearDone').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); save(); render(); });
$('dateText').textContent = new Date().toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'});

function setTheme(theme) { document.body.classList.toggle('dark', theme === 'dark'); $('themeBtn').textContent = theme === 'dark' ? '☀' : '☾'; localStorage.setItem(THEME_KEY, theme); }
$('themeBtn').addEventListener('click', () => setTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));
setTheme(localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
render();

/* app.js
  Simple client-side demo logic for:
  - Signup, login (mock)
  - Dashboard, balance, transfers
  - Transactions stored in localStorage
*/

/* Simple helper util */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* Elements */
const authSection = $('#auth');
const dashboardSection = $('#dashboard');
const btnLogout = $('#btn-logout');

const tabLogin = $('#tab-login');
const tabSignup = $('#tab-signup');
const formLogin = $('#form-login');
const formSignup = $('#form-signup');

const loginEmail = $('#login-email');
const loginPassword = $('#login-password');

const signupName = $('#signup-name');
const signupEmail = $('#signup-email');
const signupPassword = $('#signup-password');

const balanceAmount = $('#balance-amount');
const accountOwner = $('#account-owner');
const transferForm = $('#transfer-form');
const txListEl = $('#tx-list');
const transferMsg = $('#transfer-msg');

const STORAGE_KEY = 'nino_demo_users';
const SESSION_KEY = 'nino_demo_session';

/* Utilities for storage */
function readUsers(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}
function writeUsers(obj){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}
function setSession(email){
  localStorage.setItem(SESSION_KEY, email);
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}
function getSession(){
  return localStorage.getItem(SESSION_KEY);
}

/* Create a demo user on first load if none exist */
function ensureDemoUser(){
  const users = readUsers();
  if(!users['demo@ninobank.test']){
    users['demo@ninobank.test'] = {
      name: 'Demo User',
      email: 'demo@ninobank.test',
      // NOTE: plain text for demo only
      password: 'demo1234',
      balance: 50000,
      tx: [
        {id: genId(), type:'credit', amount:50000, note:'Initial demo deposit', date: new Date().toISOString()}
      ]
    };
    writeUsers(users);
  }
}

/* Helpers */
function genId(){ return 'tx_' + Math.random().toString(36).slice(2,9); }
function formatCurrency(n){
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);
}
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

/* UI wiring */
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active'); tabSignup.classList.remove('active');
  show(formLogin); hide(formSignup);
});
tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active'); tabLogin.classList.remove('active');
  show(formSignup); hide(formLogin);
});

/* Signup */
formSignup.addEventListener('submit', e => {
  e.preventDefault();
  const name = signupName.value.trim();
  const email = signupEmail.value.trim().toLowerCase();
  const pwd = signupPassword.value;

  if(!name || !email || !pwd) return alert('Please fill all fields');

  const users = readUsers();
  if(users[email]) return alert('An account with that email already exists (demo)');

  users[email] = {
    name, email, password: pwd, balance: 1000, tx: [
      {id: genId(), type:'credit', amount:1000, note:'Welcome bonus', date: new Date().toISOString()}
    ]
  };
  writeUsers(users);
  alert('Account created! You can now login.');
  // switch to login
  tabLogin.click();
});

/* Login */
formLogin.addEventListener('submit', e => {
  e.preventDefault();
  const email = loginEmail.value.trim().toLowerCase();
  const pwd = loginPassword.value;

  const users = readUsers();
  const u = users[email];
  if(!u || u.password !== pwd) return alert('Invalid credentials (demo). Try demo@ninobank.test / demo1234');

  setSession(email);
  renderDashboard();
});

/* Logout */
btnLogout.addEventListener('click', () => {
  clearSession();
  refreshUI();
});

/* Transfer */
transferForm.addEventListener('submit', e => {
  e.preventDefault();
  const to = $('#to-account').value.trim().toLowerCase();
  const amount = Number($('#amount').value);
  transferMsg.textContent = '';

  if(!to || !amount || amount <= 0) {
    transferMsg.textContent = 'Enter a valid recipient and amount';
    return;
  }

  const users = readUsers();
  const fromEmail = getSession();
  const fromUser = users[fromEmail];

  if(!fromUser || fromUser.balance < amount){
    transferMsg.textContent = 'Insufficient funds';
    return;
  }

  // If recipient doesn't exist in demo, create a placeholder account
  if(!users[to]){
    users[to] = { name: 'Recipient (external)', email: to, password: '', balance: 0, tx: [] };
  }

  // Process transfer
  fromUser.balance -= amount;
  users[to].balance += amount;

  const txOut = { id: genId(), type:'debit', amount, note:`To ${to}`, date: new Date().toISOString() };
  const txIn = { id: genId(), type:'credit', amount, note:`From ${fromEmail}`, date: new Date().toISOString() };

  fromUser.tx.unshift(txOut);
  users[to].tx.unshift(txIn);

  writeUsers(users);
  transferMsg.textContent = `Sent ${formatCurrency(amount)} to ${to} (demo)`;
  $('#to-account').value = ''; $('#amount').value = '';
  renderDashboard();
});

/* Render dashboard */
function renderDashboard(){
  const email = getSession();
  if(!email) return refreshUI();

  const users = readUsers();
  const user = users[email];
  if(!user) return refreshUI();

  // show top bar logout
  btnLogout.classList.remove('hidden');

  // Fill data
  balanceAmount.textContent = formatCurrency(user.balance || 0);
  accountOwner.textContent = user.name + ' · ' + user.email;

  // Transactions
  txListEl.innerHTML = '';
  (user.tx || []).slice(0,50).forEach(tx=>{
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.innerHTML = `
      <div>
        <div class="small">${new Date(tx.date).toLocaleString()}</div>
        <div class="muted small">${tx.note || ''}</div>
      </div>
      <div class="tx-amount ${tx.type==='credit' ? 'credit' : 'debit'}">
        ${tx.type==='credit' ? '+' : '-'} ${formatCurrency(tx.amount)}
      </div>
    `;
    txListEl.appendChild(li);
  });

  // Show dashboard, hide auth
  hide(authSection);
  show(dashboardSection);
}

/* Refresh UI (logged out) */
function refreshUI(){
  hide(dashboardSection);
  show(authSection);
  btnLogout.classList.add('hidden');
}

/* Init */
(function init(){
  ensureDemoUser();
  const active = getSession();
  if(active) renderDashboard();
  else refreshUI();
})();

// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase, ref, runTransaction, push, update,
  serverTimestamp, query, limitToLast, orderByChild, onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ---------------------------------------------------
   Firebase Config  (FORMAT A)
---------------------------------------------------- */

const firebaseConfig = {
  apiKey: "AIzaSyBDSsUcnL_M9ive8QqykUopmdp-27W0GnE",
  authDomain: "schoolphone-ccbfb.firebaseapp.com",
  databaseURL: "https://schoolphone-ccbfb-default-rtdb.firebaseio.com",
  projectId: "schoolphone-ccbfb",
  messagingSenderId: "1001388666054",
  appId: "1:1001388666054:web:84d2fb59f0849c90f9fbc7",
  measurementId: "G-71T5F62SH4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

/* ---------------------------------------------------
   Variables
---------------------------------------------------- */

let myId = null;
let myUid = null;

const myIdEl = document.getElementById("my-id");
const setupMsg = document.getElementById("setup-msg");
const genBtn = document.getElementById("gen-btn");
const convSelect = document.getElementById("conv-select");
const newConvBtn = document.getElementById("new-conv-btn");
const messagesEl = document.getElementById("messages");
const sendForm = document.getElementById("send-form");
const textInput = document.getElementById("text-input");

/* ---------------------------------------------------
   Sign In Anonymous
---------------------------------------------------- */

signInAnonymously(auth);
onAuthStateChanged(auth, user => { 
  if (user) myUid = user.uid; 
});

/* ---------------------------------------------------
   4-Digit ID Claim System
---------------------------------------------------- */

function pad4(n){ return String(n).padStart(4, "0"); }

async function tryClaim(id) {
  const r = ref(db, `ids/${id}`);

  const tx = await runTransaction(r, current => {
    if (current === null) {
      return {
        uid: myUid,
        claimedAt: Date.now(),
        lastActive: Date.now()
      };
    }
    return; // already taken
  });

  return tx.committed;
}

async function generateId() {
  genBtn.disabled = true;
  setupMsg.textContent = "Searching for an open ID…";

  for (let i = 0; i < 30; i++) {
    const attempt = pad4(Math.floor(Math.random() * 10000));
    const ok = await tryClaim(attempt);

    if (ok) {
      onClaim(attempt);
      genBtn.disabled = false;
      return;
    }
  }

  setupMsg.textContent = "No free IDs found. Try again.";
  genBtn.disabled = false;
}

function onClaim(id) {
  myId = id;
  myIdEl.textContent = `ID: ${id}`;
  setupMsg.textContent = `Your ID is ${id}.`;

  addConversation("global", "Global chat");
  startGlobalListener();
}

/* ---------------------------------------------------
   Conversation Helpers
---------------------------------------------------- */

function addConversation(value, label) {
  for (const opt of convSelect.options)
    if (opt.value === value) return;

  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = label;
  convSelect.appendChild(opt);
}

function convKey(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/* ---------------------------------------------------
   Listeners
---------------------------------------------------- */

let currentUnsub = null;

function clearListener() {
  if (typeof currentUnsub === "function") {
    currentUnsub(); // detach listener
    currentUnsub = null;
  }
}

function startGlobalListener() {
  clearListener();

  const r = ref(db, "messages/global");
  const q = query(r, orderByChild("timestamp"), limitToLast(200));

  currentUnsub = onValue(q, snap => {
    if (convSelect.value !== "global") return;
    renderMessages(snap);
  });
}

function listenPM(other) {
  clearListener();

  const path = convKey(myId, other);
  const r = ref(db, `messages/pm/${path}`);
  const q = query(r, orderByChild("timestamp"), limitToLast(200));

  currentUnsub = onValue(q, snap => {
    if (convSelect.value !== `user_${other}`) return;
    renderMessages(snap);
  });
}

/* ---------------------------------------------------
   Render Messages (Format A)
---------------------------------------------------- */

function renderMessages(snap) {
  messagesEl.innerHTML = "";

  const list = [];
  snap.forEach(row => list.push(row.val()));
  list.sort((a, b) => a.timestamp - b.timestamp);

  list.forEach(m => {
    const box = document.createElement("div");
    box.classList.add("msg", m.from === myId ? "me" : "other");

    box.innerHTML = `
      <div>${m.text}</div>
      <div class="meta">${m.from} → ${m.to} · ${new Date(m.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
    `;

    messagesEl.appendChild(box);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* ---------------------------------------------------
   Send Message (Format A)
---------------------------------------------------- */

sendForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!myId) return;

  const text = textInput.value.trim();
  if (!text) return;

  let path = "messages/global";
  let to = "global";

  if (convSelect.value !== "global") {
    const other = convSelect.value.split("_")[1];
    to = other;
    path = `messages/pm/${convKey(myId, other)}`;
  }

  push(ref(db, path), {
    from: myId,
    to: to,
    text: text,
    timestamp: Date.now()
  });

  // update activity
  update(ref(db, `ids/${myId}`), {
    lastActive: Date.now()
  });

  textInput.value = "";
});

/* ---------------------------------------------------
   Create New PM
---------------------------------------------------- */

newConvBtn.addEventListener("click", () => {
  const id = prompt("Enter 4-digit ID:");
  if (!/^\d{4}$/.test(id)) return alert("Must be 4 digits.");

  onValue(ref(db, `ids/${id}`), snap => {
    if (!snap.exists()) return alert("That ID does not exist.");

    addConversation(`user_${id}`, `Chat with ${id}`);
    convSelect.value = `user_${id}`;
    listenPM(id);
  }, { onlyOnce: true });
});

/* ---------------------------------------------------
   UI interactions
---------------------------------------------------- */

genBtn.addEventListener("click", generateId);

convSelect.addEventListener("change", () => {
  messagesEl.innerHTML = "";

  if (convSelect.value === "global") {
    startGlobalListener();
  } else if (convSelect.value.startsWith("user_")) {
    const other = convSelect.value.split("_")[1];
    listenPM(other);
  }
});


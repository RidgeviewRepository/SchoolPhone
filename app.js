// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase, ref, runTransaction, push, set, update,
  serverTimestamp, query, limitToLast, orderByChild, onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ---------------------------------------------------
   INSERT YOUR FIREBASE CONFIG HERE
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

let myId = null;
let myUid = null;

// Elements
const myIdEl = document.getElementById("my-id");
const setupMsg = document.getElementById("setup-msg");
const genBtn = document.getElementById("gen-btn");
const convSelect = document.getElementById("conv-select");
const newConvBtn = document.getElementById("new-conv-btn");
const messagesEl = document.getElementById("messages");
const sendForm = document.getElementById("send-form");
const textInput = document.getElementById("text-input");

// Sign in anonymously
signInAnonymously(auth);
onAuthStateChanged(auth, user => { if(user) myUid = user.uid });

/* -----------------------------
   ID Claiming (Unique 4-digit)
------------------------------ */

function pad4(n){ return String(n).padStart(4,"0"); }

async function tryClaim(id){
  const r = ref(db, `ids/${id}`);
  const tx = await runTransaction(r, current => {
    if(current === null){
      return {
        uid: myUid,
        claimedAt: Date.now(),
        lastActive: Date.now()
      };
    }
    return;
  });
  return tx.committed;
}

async function generateId(){
  genBtn.disabled = true;
  setupMsg.textContent = "Searching for free ID…";

  for(let i=0;i<20;i++){
    const attempt = pad4(Math.floor(Math.random()*10000));
    const ok = await tryClaim(attempt);
    if(ok){
      onClaim(attempt);
      genBtn.disabled = false;
      return;
    }
  }
  setupMsg.textContent = "Could not find an open ID. Try again.";
  genBtn.disabled = false;
}

function onClaim(id){
  myId = id;
  myIdEl.textContent = `ID: ${id}`;
  setupMsg.textContent = `Your ID is ${id}.`;

  // Add conversation entry for yourself
  addConversation(`user_${id}`, `You (${id})`);

  startGlobalListener();
}

/* -----------------------------
    Conversation Handling
------------------------------ */

function addConversation(value, label){
  for(const opt of convSelect.options)
    if(opt.value === value) return;

  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = label;
  convSelect.appendChild(opt);
}

function targetConvKey(other){
  const a = myId;
  const b = other;
  return (a < b) ? `${a}_${b}` : `${b}_${a}`;
}

/* -----------------------------
       Listening for messages
------------------------------ */

function startGlobalListener(){
  const refG = ref(db, "messages/global");
  onValue(query(refG, orderByChild("ts"), limitToLast(200)), snap => {
    if(convSelect.value !== "global") return;
    renderMsgList(snap);
  });
}

function listenPM(otherId){
  const path = targetConvKey(otherId);
  const r = ref(db, `messages/pm/${path}`);

  onValue(query(r, orderByChild("ts"), limitToLast(200)), snap => {
    if(convSelect.value !== `user_${otherId}`) return;
    renderMsgList(snap);
  });
}

/* -----------------------------
       Rendering Messages
------------------------------ */

function formatTS(ts){
  return new Date(ts).toLocaleTimeString([], {
    hour:"2-digit",
    minute:"2-digit"
  });
}

function renderMsgList(snap){
  messagesEl.innerHTML = "";

  const list = [];
  snap.forEach(c => list.push({...c.val()}));

  list.sort((a,b)=> a.ts - b.ts);

  list.forEach(m=>{
    const box = document.createElement("div");
    box.classList.add("msg", m.fromId === myId ? "me" : "other");
    box.innerHTML = `
      <div>${m.text}</div>
      <div class="meta">${m.fromId} → ${m.toId} · ${formatTS(m.ts)}</div>
    `;
    messagesEl.appendChild(box);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* -----------------------------
        Sending Messages
------------------------------ */

sendForm.addEventListener("submit", e=>{
  e.preventDefault();
  if(!myId) return;

  const text = textInput.value.trim();
  if(!text) return;

  let toId = "all";
  let path = "messages/global";

  if(convSelect.value !== "global"){
    const other = convSelect.value.split("_")[1];
    toId = other;
    path = `messages/pm/${targetConvKey(other)}`;
  }

  push(ref(db, path), {
    fromId: myId,
    toId,
    text,
    ts: Date.now()
  });

  // keep user active
  update(ref(db, `ids/${myId}`), {
    lastActive: Date.now()
  });

  textInput.value = "";
});

/* -----------------------------
       New PM conversation
------------------------------ */

newConvBtn.addEventListener("click", ()=>{
  const id = prompt("Enter 4-digit ID:");
  if(!/^\d{4}$/.test(id)) return alert("Must be 4 digits.");

  // Does that ID exist?
  onValue(ref(db, `ids/${id}`), snap=>{
    if(!snap.exists()){
      alert("That ID does not exist or expired.");
      return;
    }

    addConversation(`user_${id}`, `Chat with ${id}`);
    convSelect.value = `user_${id}`;
    listenPM(id);
  }, {onlyOnce:true});
});

/* -----------------------------
        Start process
------------------------------ */

genBtn.addEventListener("click", generateId);
convSelect.addEventListener("change", ()=>{
  messagesEl.innerHTML = "";
  if(convSelect.value.startsWith("user_")){
    listenPM(convSelect.value.split("_")[1]);
  }
});

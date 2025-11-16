console.log("APP.JS LOADED");

// ---------------------------------------------------------
// Firebase Setup
// ---------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, serverTimestamp } 
    from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// ---------------------------------------------------------
// UI Elements
// ---------------------------------------------------------
const chatbox = document.getElementById("chatbox");
const msginput = document.getElementById("msginput");
const pmInput = document.getElementById("pm-id");
const sendbtn = document.getElementById("sendbtn");

// Your device ID (temporary; normally you'd log users in)
const myID = Math.floor(Math.random() * 9000) + 1000;

// ---------------------------------------------------------
// Render a message
// ---------------------------------------------------------
function render(msg) {
    const div = document.createElement("div");
    const time = new Date(msg.ts).toLocaleTimeString();

    div.innerHTML = `<b>${msg.from}</b> @ ${time}: ${msg.text}`;
    chatbox.appendChild(div);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// ---------------------------------------------------------
// Listen to global chat
// ---------------------------------------------------------
onChildAdded(ref(db, "messages/global"), snap => {
    const data = snap.val();
    render(data);
});

// ---------------------------------------------------------
// Listen to private messages for me
// ---------------------------------------------------------
onChildAdded(ref(db, `messages/pm/${myID}`), snap => {
    const data = snap.val();
    render({ ...data, from: `PM from ${data.from}` });
});

// ---------------------------------------------------------
// Send message
// ---------------------------------------------------------
sendbtn.onclick = sendMsg;
msginput.onkeypress = (e) => { if (e.key === "Enter") sendMsg(); };

function sendMsg() {
    const text = msginput.value.trim();
    if (!text) return;

    const pmTarget = pmInput.value.trim();

    const payload = {
        from: myID,
        text: text,
        ts: Date.now()
    };

    if (pmTarget) {
        // PRIVATE MESSAGE
        push(ref(db, `messages/pm/${pmTarget}`), payload);
    } else {
        // GLOBAL MESSAGE
        push(ref(db, "messages/global"), payload);
    }

    msginput.value = "";
}


// -----------------------------------------------------
//  IMPORTS
// -----------------------------------------------------
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
  getDatabase, ref, set, push, onValue, update, query, orderByChild, limitToLast 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// -----------------------------------------------------
//  FIREBASE CONFIG
// -----------------------------------------------------
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
const db  = getDatabase(app);
const auth = getAuth();


// -----------------------------------------------------
//  GLOBAL VARIABLES
// -----------------------------------------------------
let myId = null;
let currentPM = null;


// -----------------------------------------------------
//  AUTHENTICATION
// -----------------------------------------------------
signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if (!user) return;

  myId = user.uid;

  // Save user to /ids
  update(ref(db, "ids/" + myId), {
    uid: myId,
    claimedAt: Date.now(),
    lastActive: Date.now()
  });

  startGlobalListener();
});


// -----------------------------------------------------
//  SEND MESSAGE
// -----------------------------------------------------
window.sendMessage = function () {
  const input = document.getElementById("msginput");
  const text = input.value.trim();
  if (!text) return;

  let path;
  let msg = {
    from: myId,
    text,
    timestamp: Date.now()
  };

  if (currentPM) {
    path = "messages/pm/" + currentPM;
  } else {
    path = "messages/global";
    msg.to = "global";
  }

  push(ref(db, path), msg);
  input.value = "";
};


// -----------------------------------------------------
//  GLOBAL CHAT LISTENER
// -----------------------------------------------------
function startGlobalListener() {
  const r = ref(db, "messages/global");
  const q = query(r, orderByChild("timestamp"), limitToLast(200));

  onValue(q, snapshot => {
    renderMessages(snapshot);
  });
}


// -----------------------------------------------------
//  PM LISTENER
// -----------------------------------------------------
window.openPM = function(otherId) {
  const ids = [myId, otherId].sort();
  currentPM = ids[0] + "_" + ids[1];

  const r = ref(db, "messages/pm/" + currentPM);
  const q = query(r, orderByChild("timestamp"), limitToLast(200));

  onValue(q, snapshot => {
    renderMessages(snapshot);
  });
};


// -----------------------------------------------------
//  RENDERING FUNCTION
// --------------------------------------------------




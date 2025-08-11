// Replace this with your Firebase project config:
const firebaseConfig = {
  apiKey: "YOUR FB API",
  authDomain: "project_name-6b0ff.firebaseapp.com",
  databaseURL: "https://project_name-default-rtdb.firebaseio.com",
  projectId: "project_name",
  storageBucket: "project_name.appspot.com",
  messagingSenderId: "sender",
  appId: "fb appid"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let username = null;

const usernameInput = document.getElementById("username");
const setUsernameBtn = document.getElementById("setUsernameBtn");
const chatUI = document.getElementById("chatUI");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typingRef = db.ref("typing"); // Firebase path to track typing users
let typingTimeout;
setUsernameBtn.addEventListener("click", () => {
  const enteredName = usernameInput.value.trim();
  if (enteredName.length < 1) {
    alert("Please enter a nickname.");
    return;
  }
  username = enteredName;
  usernameInput.disabled = true;
  setUsernameBtn.disabled = true;
  chatUI.style.display = "flex";
  messageInput.focus();
});

messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendBtn.click();
});

sendBtn.addEventListener("click", sendMessage);

// Listen for new messages and update UI
db.ref("messages").on("child_added", snapshot => {
  const msg = snapshot.val();

  const timeString = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  const userColor = stringToColor(msg.username);

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.innerHTML = `
    <strong style="color:${userColor}">${escapeHtml(msg.username)}</strong> 
    <span class="timestamp">${timeString}</span>: 
    ${escapeHtml(msg.text)}
  `;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  if (!username) {
    alert("Please set your nickname first.");
    return;
  }
  const timestamp = Date.now();
  db.ref("messages").push({ text, username, timestamp });
  messageInput.value = "";
}

// Simple escaping to prevent HTML injection
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
// Generate a consistent color from a string (username)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Convert hash to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
}
messageInput.addEventListener("input", () => {
  if (!username) return;

  typingRef.child(username).set(true);

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingRef.child(username).remove();
  }, 1500); // Clear typing after 1.5 seconds of no input
});

// Listen for typing users
const typingDiv = document.createElement("div");
typingDiv.id = "typingIndicator";
typingDiv.style.marginBottom = "10px";
chatUI.insertBefore(typingDiv, messagesDiv);

typingRef.on("value", snapshot => {
  const typingUsers = snapshot.val() || {};
  // Remove current user from list
  delete typingUsers[username];

  const names = Object.keys(typingUsers);
  if (names.length === 0) {
    typingDiv.textContent = "";
  } else if (names.length === 1) {
    typingDiv.textContent = `${names[0]} is typing...`;
  } else {
    typingDiv.textContent = `${names.join(", ")} are typing...`;
  }
});
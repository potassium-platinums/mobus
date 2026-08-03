
const seatsForm = document.getElementById("seatsFrom")
const addseats = document.getElementById("seatsBtn")


// seats
seatsForm.onsubmit = (e) =>{
    e.preventDefault();
}

addseats.onclick = ()=>{
    fetch("/api/booking", {
        method: "POST",
        aysnc: true, 
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            bus_id: document.getElementById("bus_id").value,
            seat_id: document.getElementById("seats").value,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showNotification(data.message, "success")
            location.href = '/dashboard'
            closepopup('popupOverlay_book_seat')
        }else{
            showNotification(data.error, "error")
        }
    })
    .catch(error => console.error(error));
}










// ===== NOTIFICATION =====
function showNotification(msg, type = 'success') {
            const el = document.getElementById('notification');
            const txt = document.getElementById('notificationText');
            const icon = el.querySelector('i');
            txt.textContent = msg;
            el.className = 'notification show';
            if (type === 'error') {
            el.classList.add('error');
            icon.className = 'fas fa-exclamation-circle';
            } else {
            el.classList.remove('error');
            icon.className = 'fas fa-check-circle';
            }
            clearTimeout(el._timer);
            el._timer = setTimeout(() => { el.className = 'notification'; }, 2000);
}

// welcome
window.addEventListener('load', function() {
            setTimeout(() => showNotification('👋 Welcome to MoBus Africa!'), 500);
});


// ===== TAB SWITCHING =====
function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('.tab').forEach(tab => {
                if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(tabId)) {
                    tab.classList.add('active');
                }
            });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
            if (e.key === '1') switchTab('daily');
            if (e.key === '2') switchTab('school');
            if (e.key === '3') switchTab('tourism');
            if (e.key === '4') switchTab('logistics');
            if (e.key === '5') switchTab('corporate');
            if (e.key === '6') switchTab('crossborder');
            if (e.key === '7') switchTab('ai');
            if (e.key === '8') switchTab('security');
            if (e.key === '9') switchTab('promotions');
});

// ===== CHATBOT =====
function toggleChatbot() {
            const window = document.getElementById('chatbotWindow');
            window.classList.toggle('open');
}

function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;
            
            const messages = document.getElementById('chatMessages');
            
            const userMsg = document.createElement('div');
            userMsg.className = 'chatbot-message user';
            userMsg.textContent = message;
            messages.appendChild(userMsg);
            
            input.value = '';
            
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot';
                const responses = [
                    "I can help you book a bus! What route are you interested in?",
                    "We have special promotions this week. Would you like to hear about them?",
                    "I can assist with cross-border travel requirements. Which countries are you traveling between?",
                    "Our AI can optimize your route for the best price and time. Want to try?",
                    "You can book school trips, corporate shuttles, or even safari tours with us!"
                ];
                botMsg.textContent = responses[Math.floor(Math.random() * responses.length)];
                messages.appendChild(botMsg);
                messages.scrollTop = messages.scrollHeight;
            }, 800);
            
            messages.scrollTop = messages.scrollHeight;
}


        
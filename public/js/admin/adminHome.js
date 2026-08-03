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
            setTimeout(() => showNotification('👋 Welcome ADMINISTRATION!'), 500);
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
        // document.addEventListener('keydown', function(e) {
        //     if (e.key === '1') switchTab('daily');
        //     if (e.key === '2') switchTab('school');
        //     if (e.key === '3') switchTab('tourism');
        //     if (e.key === '4') switchTab('logistics');
        //     if (e.key === '5') switchTab('corporate');
        //     if (e.key === '6') switchTab('crossborder');
        //     if (e.key === '7') switchTab('ai');
        //     if (e.key === '8') switchTab('security');
        //     if (e.key === '9') switchTab('promotions');
        // });

        // ======== POP UP FORM ==========
        function togglePopup() {
            const overlay = document.getElementById('popupOverlay');
            overlay.classList.toggle('show');
        }

// ========================================== admin sector =======================================

async function loadBooking() {
    const booking = await fetch("/api/get_total_booking")
    const response = await booking.json()
    // console.log(response);
    const totalBookings = document.getElementById("totalBookings")
    if (response.count == 0) {
        totalBookings.innerHTML = response.count
    }else{
        totalBookings.innerHTML = response.count
    }
}

async function loadUser() {
    const users = await fetch("/api/get_total_users")
    const response = await users.json()
    // console.log(response);
    const totalusers = document.getElementById("activePassengers")
    if (response.count == 0) {
        totalusers.innerHTML = response.count
    }else{
        totalusers.innerHTML = response.count
    }
}

async function loadBuses() {
    const Buses = await fetch("/api/get_total_buses")
    const response = await Buses.json()
    // console.log(response);
    const totalBuses = document.getElementById("activeBuses")
    if (response.count == 0) {
        totalBuses.innerHTML = response.count
    }else{
        totalBuses.innerHTML = response.count
    }
}

async function loadRoutes() {
    const Routes = await fetch("/api/get_total_routes")
    const response = await Routes.json()
    // console.log(response);
    const totalRoutes = document.getElementById("liveRoutes")
    if (response.count == 0) {
        totalRoutes.innerHTML = response.count
    }else{
        totalRoutes.innerHTML = response.count
    }
}

        









// ================= LOAD DATA TO UX ============================
loadBooking()
loadUser()
loadBuses()
loadRoutes()
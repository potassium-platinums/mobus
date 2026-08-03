
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
    el._timer = setTimeout(() => { el.className = 'notification'; }, 3200);
  }

  // ===== WALLET =====
  let balance = 124500;
  function updateBalanceUI() {
    document.getElementById('balanceDisplay').textContent = balance.toLocaleString();
  }
  function topUp(amount) {
    balance += amount;
    updateBalanceUI();
    showNotification(`💰 +UGX ${amount.toLocaleString()}`);
  }
  function customTopUp() {
    const val = prompt('Enter amount (UGX):');
    if (val && !isNaN(val) && parseInt(val) > 0) {
      topUp(parseInt(val));
    } else {
      showNotification('Invalid amount', 'error');
    }
  }

  // ===== TOUCH FEEDBACK =====
  document.querySelectorAll('.stat-card, .feature-card, .route-card, .btn').forEach(el => {
    el.addEventListener('touchstart', function() {
      // just a tiny haptic feedback simulation (no-op)
    }, { passive: true });
  });

  // welcome
  // window.addEventListener('load', function() {
  //   setTimeout(() => showNotification('👋 Welcome to MoBus Africa!'), 500);
  // });

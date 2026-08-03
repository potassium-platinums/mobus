const loginForm = document.getElementById("loginFormElement")
const loginBtn = document.getElementById("loginBtn");
const showpass = document.getElementById("showpass");
const hidepass = document.getElementById("hidepass");

// user information
const userEmail = document.getElementById("loginEmail")
const userPassword = document.getElementById("loginPassword")


loginForm.onsubmit = (e) => {
    e.preventDefault();
}

loginBtn.onclick = () => { 
    fetch("/login", {
        method: "POST",
        async: true,   
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: userEmail.value.trim(),
            password: userPassword.value,
        })
    })
    .then(response => response.json())  
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            location.href = "/dashboard"
            loginForm.reset()
        }
        else {
            showNotification(data.error[0], 'error'); 
        }
    })
    .catch(error => console.error(error));
}

// ======= SHOW PASSWORD ====
showpass.onclick = ()=>{
    userPassword.type = 'text';
    showpass.style.display = "none";
    hidepass.style.display = "block";
}

// ======== HIDE PASSWORD =====
hidepass.onclick = ()=>{
    userPassword.type = 'password';
    hidepass.style.display = 'none';
    showpass.style.display = "block";
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
    el._timer = setTimeout(() => { el.className = 'notification'; }, 6000);
  }

 
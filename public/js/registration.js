const form = document.getElementById("sign_Up_Form");
const errorContainer = document.getElementById("errorContainer");
const submitButton = document.getElementById("signupbtn");
const showpass = document.getElementById("showpass");
const hidepass = document.getElementById("hidepass");

// user info
const password = document.getElementById("signupPassword")
const confirmPass = document.getElementById("signupConfirm")


form.onsubmit = (e) => {
    e.preventDefault();
};

submitButton.onclick = () => {

      fetch("/register", {
        method: "POST",
        async: true,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            first_name: document.getElementById("signupFirst").value.trim(),
            last_name: document.getElementById("signupLast").value.trim(),
            email: document.getElementById("signupEmail").value.trim(),
            phone: document.getElementById("signupPhone").value.trim(),
            password: password.value,
            confirm_password: confirmPass.value,
            checkbox: document.getElementById("termsCheck").checked,
        })
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data.message);
        if (data.success) {
          // console.log(data.message);
          showNotification(data.message, 'success');
          location.href = '/dashboard'; // Redirect to dashboard after successful registration
          form.reset(); // Reset the form fields
        }
        else {
            // console.log(data.error[0]);
            showNotification(data.error[0], 'error'); 
        }
    })
    .catch(error => console.error(error));

}

// ======= SHOW PASSWORD ====
showpass.onclick = ()=>{
    confirmPass.type = 'text';
    password.type = "text";
    showpass.style.display = "none";
    hidepass.style.display = "block";
}

// ======== HIDE PASSWORD =====
hidepass.onclick = ()=>{
    confirmPass.type = 'password';
    password.type = "password";
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

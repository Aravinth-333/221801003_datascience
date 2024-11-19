// Toggle between Sign In and Sign Up forms
const signInBtnLink = document.querySelector('.signInBtn-link');
const signUpBtnLink = document.querySelector('.signUpBtn-link');
const wrapper = document.querySelector('.wrapper');

signUpBtnLink.addEventListener('click', () => {
    wrapper.classList.add('active');
});

signInBtnLink.addEventListener('click', () => {
    wrapper.classList.remove('active');
});

// Toggle password visibility
function togglePasswordVisibility(id) {
    const passwordInput = document.getElementById(id);
    if (passwordInput) {
        passwordInput.type = (passwordInput.type === 'password') ? 'text' : 'password';
    }
}

// Handle OTP dialog
async function verifyOtp() {
    const otpInputs = document.querySelectorAll('.otp-box');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    const emailInput = sessionStorage.getItem('email');

    const data = { Email: emailInput, otp: otp };

    const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.text();
    alert(result);

    if (response.ok) {
        sessionStorage.setItem('otpVerified', true);
        window.location.href = '/success.html';
    }
}

// Handle the login form submission
document.querySelector('.sign-in form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));

    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.text();
    alert(result);

    if (response.ok) {
        const email = encodeURIComponent(data.Email); // Encode the email for URL
        window.location.href = `http://localhost:3000/gemini.html?email=${email}`; // Redirect with email as URL parameter
      }

    // if (response.ok) {
    //     const email = encodeURIComponent(data.Email); // Encode the email for URL
    //     console.log('Redirecting to localhost:3020 with email:', data.Email);
    //     localStorage.setItem('userEmail', email); // Store email in localStorage
    //     window.location.href = `http://localhost:3020?email=${email}`; // Redirect to localhost:3020 with email as URL parameter
    // }
    
    

  });
document.getElementById('signup-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('passwordField').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        alert('Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    // Check if email is already registered
    const emailCheckResponse = await fetch('/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
    });

    const emailCheckResult = await emailCheckResponse.text();
    if (emailCheckResult === 'Email already registered.') {
        alert('Email you entered is already registered. You can directly login.');
        document.querySelector('.wrapper').classList.remove('active');
        return; // Stop further processing
    }

    // If email is not registered, proceed with sending OTP
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));

    const response = await fetch('/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.text();
    alert(result);

    if (response.ok) {
        sessionStorage.setItem('email', email); // Store email in sessionStorage
        window.location.href = '/otp-dialog.html';
    }
});


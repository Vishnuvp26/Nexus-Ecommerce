// Regex validation
document.getElementById('name').addEventListener('input', function () {
    const nameRegex = /^[A-Za-z][A-Za-z\s]*$/;
    if (!nameRegex.test(this.value)) {
        this.setCustomValidity('Name should start with a letter and contain only letters and spaces.');
    } else {
        this.setCustomValidity('');
    }
});

document.getElementById('phone').addEventListener('input', function () {
    const phoneRegex = /^[1-9]\d{9}$/;
    if (!phoneRegex.test(this.value)) {
        this.setCustomValidity('Please provide a valid 10 digit mobile number.');
    } else {
        this.setCustomValidity('');
    }
});

document.getElementById('password').addEventListener('input', function () {
    const passwordRegex = /^[^\W_][\w\W]{4,}$/;
    if (!passwordRegex.test(this.value)) {
        this.setCustomValidity('Password must be 5 characters long and cannot start with a symbol or space.');
    } else {
        this.setCustomValidity('');
    }
});

// Password Match
document.getElementById('confirmPassword').addEventListener('input', function () {
    var passwordInput = document.getElementById('password');
    var confirmPasswordInput = document.getElementById('confirmPassword');

    if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity('Passwords do not match.');
    } else {
        confirmPasswordInput.setCustomValidity('');
    }
});

// Checking email exist or not
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };

    fetch('/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        const emailInput = document.getElementById('email');
        if (data.success) {
            window.location.href = '/otp';
        } else {
            emailInput.value = '';
            emailInput.placeholder = data.message;
            emailInput.classList.add('is-invalid');
            
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


// Password eye toggle
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const passwordToggleIcon = document.getElementById(inputId + '-toggle-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggleIcon.classList.remove('fa-eye');
        passwordToggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordToggleIcon.classList.remove('fa-eye-slash');
        passwordToggleIcon.classList.add('fa-eye');
    }
}
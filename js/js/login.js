function goToPage(){
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    const emailIsValid = emailInput.includes('@gmail.com');
    const passwordIsValid = /^\d+$/.test(passwordInput); // numbers only

    if (emailIsValid && passwordIsValid) {
        window.location.href = 'dashboard.html'; 
    } else {
        alert('Invalid input. Email must contain "@gmail" and password must be only numbers.');
    }
}

const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btn = document.querySelector('.btn');
const loginForm = document.getElementById('loginForm');


loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let username = document.getElementById('username');
    let pass = document.getElementById('pass');
    console.log(username.value);

})

registerLink.addEventListener('click', ()=> {
    wrapper.classList.add('active');
})

loginLink.addEventListener('click', ()=> {
    wrapper.classList.remove('active');
})




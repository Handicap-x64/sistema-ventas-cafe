const users = [
    {
        username: "admin",
        password: "admin"
    }
];

const login = document.getElementById("login");

login.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(login));

    const valido = users.some(user => user.username === data.username && user.password === data.password);

    if (valido) {
        window.location.href = "home.html";
    } else {
        alert("Usuario o contraseña incorrectos");
    }
});
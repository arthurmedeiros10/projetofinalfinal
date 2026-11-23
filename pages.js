function mostrarToast(mensagem, bgClass) {
    const toastEl = document.getElementById("liveToast");
    const toastMessage = document.getElementById("toast-message");

    if (!toastEl || !toastMessage || typeof bootstrap === "undefined") {
        console.warn("[toast]", mensagem);
        return;
    }

    const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toastMessage.textContent = mensagem;

    toastEl.classList.remove("bg-success", "bg-danger");
    toastEl.classList.add(bgClass);

    bsToast.show();
}

function atualizar_navbar() {
    const nome = localStorage.getItem("nome_cliente");
    const token = localStorage.getItem("token");

    const nav_login = document.getElementById("nav-login");
    const btn_user_info = document.getElementById("user-info");

    if (!nav_login || !btn_user_info) return;

    if (token && nome) {
        nav_login.style.display = "none";
        btn_user_info.style.display = "inline";
        btn_user_info.innerText = "Olá, " + nome.split(" ")[0];
    } else {
        nav_login.style.display = "inline";    // Fallback se o toast/bootstrap não existir
        btn_user_info.style.display = "none";
    }
}

function logout() {
    localStorage.removeItem("nome_cliente");
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

window.addEventListener("DOMContentLoaded", atualizar_navbar);
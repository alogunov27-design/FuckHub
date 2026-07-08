const SUPABASE_URL = 'https://nuyeqiiopptdykxvurrk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6YKf0lc-mTAB0FdVhQQzcQ_DFttxToY';

let supabaseClient;
let currentUser = null;

function init() {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('%cFuckHub от FuckFaz запущен', 'color:orange; font-size:18px; font-weight:bold');
}

async function registerWithSupabase() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!email || !password || !username) {
        alert("Заполните все поля!");
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });

        if (error) throw error;
        alert("✅ Регистрация прошла! Проверь почту для подтверждения.");
        hideModal();
    } catch (e) {
        alert("❌ Ошибка: " + e.message);
        console.error(e);
    }
}

async function loginWithSupabase() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        currentUser = data.user;
        alert("✅ Вход выполнен!");
        hideModal();
    } catch (e) {
        alert("❌ Ошибка входа: " + e.message);
    }
}

function showRegisterModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('modal-title').textContent = 'РЕГИСТРАЦИЯ В FUCKHUB';
    document.getElementById('switch-btn').textContent = 'Уже есть аккаунт? Войти';
}

function showLoginModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'ВОЙТИ В FUCKHUB';
    document.getElementById('switch-btn').textContent = 'Нет аккаунта? Зарегистрироваться';
}

function toggleForms() {
    if (document.getElementById('register-form').classList.contains('hidden')) {
        showRegisterModal();
    } else {
        showLoginModal();
    }
}

function hideModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

function showMyGames() {
    if (!currentUser) {
        alert("Сначала войдите в аккаунт!");
        showLoginModal();
        return;
    }
    alert("Раздел 'Мои Игры' — здесь будут твои опубликованные игры (в разработке)");
}

// Запуск
window.onload = init;
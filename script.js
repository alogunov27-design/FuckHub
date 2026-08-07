const SUPABASE_URL = 'https://nuyeqiiopptdykxvurrk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6YKf0lc-mTAB0FdVhQQzcQ_DFttxToY';
const BUCKET_NAME = 'covers';
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

let supabaseClient;
let currentUser = null;

function initSupabase() {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('%cFuckHub от FuckFaz запущен', 'color:orange; font-size:18px; font-weight:bold');
}

// ===== АВТОРИЗАЦИЯ =====
async function getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) currentUser = session.user;
    return currentUser;
}

function getUsername() {
    if (!currentUser) return 'Аноним';
    return (currentUser.user_metadata?.username) || (currentUser.email ? currentUser.email.split('@')[0] : 'User');
}

function getAvatarUrl() {
    return currentUser?.user_metadata?.avatar_url || null;
}

async function registerUser(email, password, username) {
    // Проверка на уникальность ника сделается сама через триггер SQL, который я дал выше
    const { data, error } = await supabaseClient.auth.signUp({
        email, password,
        options: { data: { username } }
    });
    if (error) throw error;
    return data;
}

async function loginUser(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    return data;
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// ===== ЗАГРУЗЧИК ФАЙЛОВ (Экономия памяти) =====
async function uploadFileToStorage(file, folder) {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) {
        alert('Файл слишком большой! Максимум 1 МБ.');
        return null;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${folder}/${currentUser?.id || 'anon'}_${Date.now()}.${ext}`;

    try {
        const { error: uploadError } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        return data.publicUrl;
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        alert('Ошибка загрузки: ' + e.message);
        return null;
    }
}

// ===== ЮТИЛИТЫ =====
function parseImageUrls(imageUrlField) {
    if (!imageUrlField) return [];
    const raw = String(imageUrlField).trim();
    if (!raw) return [];
    try {
        if (raw.startsWith('[')) {
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr.filter(Boolean) : [raw];
        }
    } catch (e) {}
    if (raw.includes('|')) return raw.split('|').map(s => s.trim()).filter(Boolean);
    return [raw];
}

function renderImageGallery(urls) {
    if (!urls || urls.length === 0) return '';
    if (urls.length === 1) {
        return `<div class="mb-4 rounded-xl overflow-hidden border border-[#2a3344] news-gallery">
            <img src="${urls[0]}" class="w-full" onerror="this.parentElement.style.display='none'">
        </div>`;
    }
    let html = '<div class="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 news-gallery">';
    for (let url of urls) {
        html += `<div class="rounded-xl overflow-hidden border border-[#2a3344]">
            <img src="${url}" class="w-full h-48 object-cover" onerror="this.parentElement.style.display='none'">
        </div>`;
    }
    html += '</div>';
    return html;
}

function renderCommentHTML(c) {
    const avatar = c.avatar_url
        ? `<img src="${c.avatar_url}" class="avatar-sm w-8 h-8 rounded-full shrink-0" onerror="this.style.display='none'">`
        : `<div class="w-8 h-8 rounded-full bg-[#2a3344] flex items-center justify-center text-xs shrink-0">${(c.username || 'A').charAt(0).toUpperCase()}</div>`;

    return `<div class="flex gap-3 border-t border-[#2a3344] pt-3 mt-3">
        ${avatar}
        <div class="min-w-0 flex-1">
            <span class="font-semibold text-orange-400 text-sm">${c.username || 'Аноним'}</span>
            <p class="text-zinc-300 text-sm mt-0.5">${c.content || ''}</p>
        </div>
    </div>`;
}

// Инициализация
initSupabase();

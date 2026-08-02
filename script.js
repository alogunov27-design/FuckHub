// ===== ОПТИМИЗИРОВАННЫЙ ЗАГРУЗЧИК (экономия памяти) =====
const BUCKET_NAME = 'covers'; // Имя твоего бакета в Supabase

async function uploadFileToStorage(file, folder) {
    if (!file) return null;
    
    // Проверка размера (1 МБ)
    if (file.size > 1 * 1024 * 1024) {
        alert('Файл слишком большой! Максимум 1 МБ.');
        return null;
    }

    // Генерируем уникальное имя файла: папка/айдишник_время.расширение
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${folder}/${currentUser.id}_${Date.now()}.${ext}`;

    try {
        // Загружаем в хранилище Supabase
        const { error: uploadError } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, { 
                cacheControl: '3600', 
                upsert: false,
                contentType: file.type 
            });

        if (uploadError) throw uploadError;

        // Получаем публичную ссылку (не храним base64, только строку URL)
        const { data } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (e) {
        console.error('Ошибка загрузки файла:', e);
        alert('Не удалось загрузить файл на сервер: ' + e.message);
        return null;
    }
}

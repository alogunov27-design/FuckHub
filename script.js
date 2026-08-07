
# Также нужно обновить script.js — добавить поле is_hidden в ai_messages
# и проверить что всё совместимо

# Сначала проверим что у нас есть
print("Файлы сохранены. Проверяем структуру...")

import os
files = os.listdir('/mnt/agents/output/')
for f in files:
    size = os.path.getsize(f'/mnt/agents/output/{f}')
    print(f"  {f} ({size} bytes)")

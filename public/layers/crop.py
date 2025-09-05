import os
import threading
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def crop_image(input_path, output_path):
    """
    Обрезает изображение на 2% сверху и снизу
    """
    try:
        # Открываем изображение
        with Image.open(input_path) as img:
            width, height = img.size
            
            # Вычисляем координаты для обрезки (2% сверху и снизу)
            crop_top = int(height * 0.01)
            crop_bottom = int(height * 0.99)
            
            # Обрезаем изображение (left, top, right, bottom)
            cropped_img = img.crop((0, crop_top, width, crop_bottom))
            
            # Создаем директорию если её нет
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Сохраняем обрезанное изображение
            cropped_img.save(output_path, 'WEBP', quality=95)
            
            print(f"✓ Обработано: {input_path.name}")
            return True
            
    except Exception as e:
        print(f"✗ Ошибка при обработке {input_path}: {e}")
        return False

def find_webp_images(source_dir):
    """
    Находит все WebP изображения в директории и подпапках
    """
    source_path = Path(source_dir)
    webp_files = []
    
    # Рекурсивно ищем все .webp файлы
    for file_path in source_path.rglob("*.webp"):
        if file_path.is_file():
            webp_files.append(file_path)
    
    return webp_files

def process_images_multithreaded(source_dir, max_workers=None):
    """
    Обрабатывает изображения с использованием многозадачности
    """
    # Если не указано количество потоков, используем количество CPU ядер
    if max_workers is None:
        max_workers = os.cpu_count()
    
    source_path = Path(source_dir)
    crop_path = source_path / "crop"
    
    # Находим все WebP файлы
    webp_files = find_webp_images(source_dir)
    
    if not webp_files:
        print("WebP изображения не найдены!")
        return
    
    print(f"Найдено {len(webp_files)} WebP изображений")
    print(f"Используется {max_workers} потоков")
    print("-" * 50)
    
    # Подготавливаем задачи для обработки
    tasks = []
    for input_file in webp_files:
        # Вычисляем относительный путь от исходной директории
        relative_path = input_file.relative_to(source_path)
        output_file = crop_path / relative_path
        tasks.append((input_file, output_file))
    
    # Обрабатываем изображения в многопоточном режиме
    start_time = time.time()
    successful = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Отправляем задачи в пул потоков
        future_to_task = {
            executor.submit(crop_image, input_path, output_path): (input_path, output_path)
            for input_path, output_path in tasks
        }
        
        # Получаем результаты по мере выполнения
        for future in as_completed(future_to_task):
            input_path, output_path = future_to_task[future]
            try:
                if future.result():
                    successful += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"✗ Неожиданная ошибка для {input_path}: {e}")
                failed += 1
    
    end_time = time.time()
    
    print("-" * 50)
    print(f"Обработка завершена за {end_time - start_time:.2f} секунд")
    print(f"Успешно обработано: {successful}")
    print(f"Ошибок: {failed}")
    print(f"Результаты сохранены в: {crop_path}")

def main():
    """
    Основная функция
    """
    # Путь к папке с изображениями (текущая директория по умолчанию)
    source_directory = input("Введите путь к папке с изображениями (Enter для текущей папки): ").strip()
    
    if not source_directory:
        source_directory = "."
    
    if not os.path.exists(source_directory):
        print(f"Папка {source_directory} не существует!")
        return
    
    # Количество потоков (по умолчанию - количество CPU ядер)
    threads_input = input(f"Количество потоков (Enter для {os.cpu_count()}): ").strip()
    
    try:
        max_workers = int(threads_input) if threads_input else None
    except ValueError:
        max_workers = None
    
    print(f"\nНачинаем обработку изображений в папке: {os.path.abspath(source_directory)}")
    
    # Запускаем обработку
    process_images_multithreaded(source_directory, max_workers)

if __name__ == "__main__":
    # Проверяем наличие необходимых библиотек
    try:
        from PIL import Image
    except ImportError:
        print("Ошибка: Библиотека Pillow не установлена!")
        print("Установите её командой: pip install Pillow")
        exit(1)
    
    main()
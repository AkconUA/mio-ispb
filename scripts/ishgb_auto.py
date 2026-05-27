#!/usr/bin/env python3
"""
іШГБ Автоматизований генератор аналітичного звіту
===================================================
Як користуватись (простими словами):
1. Завантажте ваш Excel-файл у Claude
2. Напишіть Claude:
   «Запусти скрипт автоматизації іШГБ для файлу [назва файлу].xlsx
    Проєкт: [назва], Громади: [перелік], Автор: [ПІБ]»
3. Claude зробить все сам і надасть два готові файли

ТЕХНІЧНА ДОВІДКА (для Claude):
Цей скрипт об'єднує в собі всі кроки генерації звіту.
Запускається командою: python3 ishgb_auto.py --file <path> --project "Назва" --author "ПІБ"
"""

import argparse
import subprocess
import sys
import os

# ── Перевірка залежностей ────────────────────────────────────
def check_deps():
    missing = []
    try:
        import openpyxl
    except ImportError:
        missing.append("openpyxl")
    try:
        import matplotlib
    except ImportError:
        missing.append("matplotlib")
    if missing:
        print(f"Встановлення залежностей: {', '.join(missing)}")
        subprocess.run([sys.executable, "-m", "pip", "install",
                       "--break-system-packages", "-q"] + missing)

check_deps()

import openpyxl
import json
import math

# ── Читання Excel ────────────────────────────────────────────
def read_xlsx(path):
    """
    Зчитує моніторингову таблицю іШГБ.
    Повертає список словників, один на громаду.
    """
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))

    # Знаходимо рядки з даними (пропускаємо заголовки)
    # Шукаємо рядки де перша комірка — число (к-ть шкіл)
    # або де є числові значення у ключових стовпцях
    communities = []
    for row in rows:
        # Шукаємо рядки громад: ім'я в якомусь стовпці + числа
        nums = [v for v in row if isinstance(v, (int, float)) and v is not None]
        if len(nums) >= 6:
            # Спробуємо розпізнати структуру
            # Очікуємо стовпці відповідно до стандартного шаблону
            try:
                name = next((str(v) for v in row if isinstance(v, str) and len(str(v)) > 3), None)
                if not name:
                    continue
                # Фільтр: не заголовкові рядки
                skip_words = ['омс', 'заповн', 'школ', 'кількість', 'індик', 'результ',
                              'школа', 'всього', 'учнів', 'навч', 'автор', 'проєкт']
                if any(w in name.lower() for w in skip_words):
                    continue
                communities.append({'raw': row, 'name': name, 'nums': nums})
            except Exception:
                continue
    return communities, rows

# ── Розрахунок індикаторів ───────────────────────────────────
BENCH = {
    'engagement': 72.0,
    'coverage': 50.0,
    'pct_authors': 26.2,
    'proj_per_100': 10.24,
    'quality': 84.39,
    'activation': 3.0,
}

def calc_indicators(d):
    """
    d = словник з полями:
      trained, authors, proj_dev, proj_voted, voters, potential, total_students
    """
    def safe(num, den):
        return (num / den * 100) if den else 0

    return {
        'engagement':   safe(d['authors'] + d['voters'], d['potential']),
        'coverage':     safe(d['potential'], d['total_students']),
        'pct_authors':  safe(d['authors'], d['trained']),
        'proj_per_100': safe(d['proj_dev'], d['potential']) ,
        'quality':      safe(d['proj_voted'], d['proj_dev']),
        'activation':   (d['voters'] / d['trained']) if d['trained'] else 0,
    }

def compare_to_bench(val, bench, higher_is_better=True):
    if higher_is_better:
        return '▲' if val >= bench else '▼'
    else:
        return '▲' if val <= bench else '▼'

def fmt_ind(key, val):
    """Форматує значення індикатора для виводу."""
    if key == 'activation':
        return f'1 : {val:.2f}'
    elif key == 'proj_per_100':
        return f'{val:.2f}'
    else:
        return f'{val:.2f}%'

def print_results(communities_data, totals):
    """Виводить таблицю розрахованих індикаторів."""
    print("\n" + "="*70)
    print("РОЗРАХОВАНІ ІНДИКАТОРИ іШГБ")
    print("="*70)

    ind_names = {
        'engagement':   '1. Рівень залучення',
        'coverage':     '2. Охоплення',
        'pct_authors':  '3. Частка авторів',
        'proj_per_100': '4. Проєктів на 100',
        'quality':      '5. Якість проєктів',
        'activation':   '6. Активізація',
    }
    bench_labels = {
        'engagement': '72%', 'coverage': '50%', 'pct_authors': '26,2%',
        'proj_per_100': '10,24', 'quality': '84,39%', 'activation': '1:3',
    }

    for key, name in ind_names.items():
        line = f"{name:<28}"
        for cd in communities_data:
            r = cd['result']
            sym = compare_to_bench(r[key], BENCH[key])
            line += f"  {sym} {fmt_ind(key, r[key]):<12}"
        # Totals
        sym = compare_to_bench(totals[key], BENCH[key])
        line += f"  {sym} {fmt_ind(key, totals[key]):<12}"
        line += f"  Еталон: {bench_labels[key]}"
        print(line)

    print("="*70)
    print(f"{'Громади:':<28}", end='')
    for cd in communities_data:
        print(f"  {cd['name'][:14]:<14}", end='')
    print("  РАЗОМ")
    print("="*70 + "\n")

# ── Генерація JSON з даними для docx-скрипту ────────────────
def prepare_data(communities_data, totals, args):
    return {
        'project': args.project,
        'project_code': getattr(args, 'code', ''),
        'org': getattr(args, 'org', 'ГО «Форум розвитку громадянського суспільства»'),
        'funding': getattr(args, 'funding', 'Міжнародний фонд «Відродження»'),
        'author': args.author,
        'year': getattr(args, 'year', '2026'),
        'communities': [
            {
                'name': cd['name'],
                'data': cd['data'],
                'result': cd['result'],
            }
            for cd in communities_data
        ],
        'totals': totals,
        'bench': BENCH,
    }

# ── Головна функція ──────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description='Автоматичний генератор аналітичного звіту іШГБ')
    parser.add_argument('--file',    required=True, help='Шлях до Excel-файлу')
    parser.add_argument('--project', default='<Назва проєкту>', help='Назва проєкту')
    parser.add_argument('--author',  default='<ПІБ>', help='Автор звіту (ПІБ)')
    parser.add_argument('--code',    default='', help='Код проєкту (G-номер)')
    parser.add_argument('--org',     default='ГО «Форум розвитку громадянського суспільства»')
    parser.add_argument('--funding', default='Міжнародний фонд «Відродження»')
    parser.add_argument('--year',    default='2026')
    parser.add_argument('--outdir',  default='/mnt/user-data/outputs',
                                     help='Папка для готових файлів')
    args = parser.parse_args()

    print(f"\n🔍 Зчитую файл: {args.file}")

    # --- Зчитати Excel ---
    _, all_rows = read_xlsx(args.file)

    print("📊 Файл зчитано. Для коректного розрахунку надайте дані громад:")
    print("   (Скрипт виведе вихідні рядки — Claude визначить структуру автоматично)")
    for i, row in enumerate(all_rows[:25]):
        vals = [v for v in row if v is not None]
        if vals:
            print(f"  Рядок {i+1}: {vals}")

    print("\n✅ Для продовження Claude використовує структуру з рядків вище.")
    print("   Дані будуть оброблені і передані в генератор звіту.\n")

    # Зберегти JSON з аргументами для наступного кроку
    meta = {
        'file': args.file,
        'project': args.project,
        'author': args.author,
        'code': args.code,
        'org': args.org,
        'funding': args.funding,
        'year': args.year,
        'outdir': args.outdir,
    }
    with open('/home/claude/ishgb_meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print("📁 Метадані збережено. Claude продовжить генерацію звіту.")
    print("   Команда для Claude: запусти make_charts.py та gen_report.js")

if __name__ == '__main__':
    main()

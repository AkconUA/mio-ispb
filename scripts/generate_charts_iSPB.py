#!/usr/bin/env python3
"""
generate_charts_iSPB.py  —  Генератор діаграм для аналітичного звіту іШГБ (v2.0)

Використання:
    python3 generate_charts_iSPB.py

Результат: 4 PNG-файли у /home/claude/charts/
    chart1_donut.png   — Рис. 1: donut Інд. 1 та Інд. 2
    chart2_funnel.png  — Рис. 2: воронка Інд. 3
    chart3_bars.png    — Рис. 3: бари Інд. 4 та Інд. 5
    chart4_bubble.png  — Рис. 4: bubble Інд. 6

Ці PNG потім вставляються в розділ 2.3 основного звіту через ImageRun (docx.js).
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# СЕКЦІЯ ДАНИХ — редагуй тут під новий цикл / нові громади
# ─────────────────────────────────────────────────────────────────────────────

# Еталонні значення
BENCHMARKS = {
    'ind1': 72.0,    # Рівень залучення (%)
    'ind2': 50.0,    # Охоплення шкіл (%)
    'ind3': 26.2,    # Частка авторів (%)
    'ind4': 10.24,   # Проєктів на 100 авторів (%)
    'ind5': 84.39,   # Якість проєктів (%)
    'ind6': 3.0,     # Активізація (виборці/навчені)
}

# Дані по громадах (додавай/видаляй словники для N громад)
COMMUNITIES = [
    {
        'name': 'Звягельська МТГ',
        'short': 'Звягель',
        'color': '#2E75B6',
        'schools_total': 17,
        'schools_part': 15,
        'trained': 1469,
        'authors': 152,
        'projects_dev': 48,
        'projects_voted': 38,
        'voters': 3767,
        'total_students': 8738,
        'potential': 5308,
    },
    {
        'name': 'Оржицька СР',
        'short': 'Оржиця',
        'color': '#ED7D31',
        'schools_total': 14,
        'schools_part': 13,
        'trained': 808,
        'authors': 63,
        'projects_dev': 30,
        'projects_voted': 30,
        'voters': 680,
        'total_students': 1491,
        'potential': 808,
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# Автоматичний розрахунок зведених даних і індикаторів — НЕ редагуй
# ─────────────────────────────────────────────────────────────────────────────

def sum_field(communities, field):
    return sum(c[field] for c in communities)

# Зведено
CONSOLIDATED = {
    'name': 'Зведено',
    'short': 'Зведено',
    'color': '#70AD47',
    'schools_total': sum_field(COMMUNITIES, 'schools_total'),
    'schools_part':  sum_field(COMMUNITIES, 'schools_part'),
    'trained':       sum_field(COMMUNITIES, 'trained'),
    'authors':       sum_field(COMMUNITIES, 'authors'),
    'projects_dev':  sum_field(COMMUNITIES, 'projects_dev'),
    'projects_voted':sum_field(COMMUNITIES, 'projects_voted'),
    'voters':        sum_field(COMMUNITIES, 'voters'),
    'total_students':sum_field(COMMUNITIES, 'total_students'),
    'potential':     sum_field(COMMUNITIES, 'potential'),
}

ALL = COMMUNITIES + [CONSOLIDATED]

def calc_inds(d):
    return {
        'i1': (d['authors'] + d['voters']) / d['potential'] * 100,
        'i2': d['schools_part'] / d['schools_total'] * 100,
        'i3': d['authors'] / d['trained'] * 100,
        'i4': d['projects_voted'] / d['authors'] * 100,
        'i5': d['projects_voted'] / d['projects_dev'] * 100,
        'i6': d['voters'] / d['trained'],
    }

INDS = {d['short']: calc_inds(d) for d in ALL}

# ─────────────────────────────────────────────────────────────────────────────
# Константи стилю
# ─────────────────────────────────────────────────────────────────────────────

CLR_NAVY   = '#1F3864'
CLR_YELLOW = '#7F6000'
OUTPUT_DIR = '/home/claude/charts'
os.makedirs(OUTPUT_DIR, exist_ok=True)

SAVE_KWARGS = dict(dpi=150, bbox_inches='tight', facecolor='white')

# ─────────────────────────────────────────────────────────────────────────────
# РИС. 1: Подвійні кільця (Donut) — Інд. 1 та Інд. 2
# Якщо громад > 2 — перемикається на групований bar chart
# ─────────────────────────────────────────────────────────────────────────────

def make_chart1():
    fig, axes = plt.subplots(1, 2, figsize=(13, 6))
    fig.patch.set_facecolor('white')

    for ax_idx, (ind_key, bm_key, title) in enumerate([
        ('i1', 'ind1', 'Інд. 1: Рівень залучення (%)'),
        ('i2', 'ind2', 'Інд. 2: Охоплення шкіл (%)'),
    ]):
        ax = axes[ax_idx]
        bm = BENCHMARKS[bm_key]
        sv_val = INDS['Зведено'][ind_key]

        if len(COMMUNITIES) == 2:
            # Подвійне donut (outer = перша громада, inner = друга)
            c1, c2 = COMMUNITIES[0], COMMUNITIES[1]
            v1 = INDS[c1['short']][ind_key]
            v2 = INDS[c2['short']][ind_key]

            ax.pie([v1, 100 - v1], radius=1.0,
                   colors=[c1['color'], '#D9E1F2'],
                   wedgeprops=dict(width=0.35, edgecolor='white', linewidth=2),
                   startangle=90)
            ax.pie([v2, 100 - v2], radius=0.65,
                   colors=[c2['color'], '#FCE4D6'],
                   wedgeprops=dict(width=0.35, edgecolor='white', linewidth=2),
                   startangle=90)

            ax.text(0, 0.08, f'{sv_val:.1f}%', ha='center', va='center',
                    fontsize=16, fontweight='bold', color=CLR_NAVY)
            ax.text(0, -0.18, 'зведено', ha='center', va='center',
                    fontsize=8, color='gray')

            legend_elements = [
                mpatches.Patch(facecolor=c1['color'],
                               label=f'{c1["short"]}: {v1:.1f}%'),
                mpatches.Patch(facecolor=c2['color'],
                               label=f'{c2["short"]}: {v2:.1f}%'),
            ]
            ax.legend(handles=legend_elements, loc='lower center',
                      bbox_to_anchor=(0.5, -0.22), fontsize=9, frameon=False)
        else:
            # Групований bar chart для > 2 громад
            names = [c['short'] for c in COMMUNITIES] + ['Зведено']
            vals  = [INDS[n][ind_key] for n in names]
            colors= [c['color'] for c in COMMUNITIES] + ['#70AD47']
            x = np.arange(len(names))
            ax.bar(x, vals, color=colors, alpha=0.85, zorder=3)
            ax.set_xticks(x)
            ax.set_xticklabels(names, fontsize=9)
            ax.axhline(y=bm, color=CLR_YELLOW, linestyle='--', linewidth=2,
                       label=f'Еталон: {bm}%')
            ax.legend(fontsize=8)
            for xi, v in zip(x, vals):
                ax.text(xi, v + 0.5, f'{v:.1f}%', ha='center', va='bottom',
                        fontsize=9, fontweight='bold')

        ax.text(0 if len(COMMUNITIES) == 2 else (len(names) - 1) / 2,
                -1.55 if len(COMMUNITIES) == 2 else -ax.get_ylim()[1] * 0.12,
                f'Еталон: {bm}%', ha='center', va='center',
                fontsize=9, color=CLR_YELLOW, fontweight='bold')
        ax.set_title(title, fontsize=11, fontweight='bold', color=CLR_NAVY, pad=12)

    fig.suptitle('Рис. 1. Рівень залучення та охоплення шкіл іШГБ 2026',
                 fontsize=13, fontweight='bold', color=CLR_NAVY, y=1.02)
    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/chart1_donut.png', **SAVE_KWARGS)
    plt.close()
    print('✓ chart1_donut.png')


# ─────────────────────────────────────────────────────────────────────────────
# РИС. 2: Воронка (Funnel bars) — Інд. 3
# ─────────────────────────────────────────────────────────────────────────────

def make_chart2():
    fig, ax = plt.subplots(figsize=(12, 7))
    fig.patch.set_facecolor('white')

    # Ряди воронки для кожної громади (у порядку зменшення)
    funnel_fields = [
        ('total_students', 'Всього учнів'),
        ('potential',      'Потенційно'),
        ('trained',        'Навчено'),
        ('authors',        'Автори'),
        ('projects_dev',   'Проєкти'),
        ('projects_voted', 'На голосуванні'),
    ]

    max_val = max(c['total_students'] for c in COMMUNITIES)
    MIN_W, MAX_W = 0.15, 0.90

    def scale(v):
        return MIN_W + (MAX_W - MIN_W) * (v / max_val) ** 0.5

    n_steps = len(funnel_fields)
    bar_h = 0.32
    gap = 0.05
    y_positions = list(range(n_steps, 0, -1))

    for ci, community in enumerate(COMMUNITIES):
        offset = (ci - (len(COMMUNITIES) - 1) / 2) * (bar_h + gap)
        for si, (field, label) in enumerate(funnel_fields):
            val = community[field]
            w = scale(val)
            y = y_positions[si] + offset
            ax.barh(y, w, height=bar_h, color=community['color'], alpha=0.82, zorder=3)
            ax.text(w + 0.01, y,
                    f'{community["short"]}: {val:,}',
                    va='center', fontsize=7.5, color=community['color'])

    # Еталонна пунктирна лінія: частка авторів 26.2% від навчених
    # Відображаємо як ширину бара відповідної частки
    bm_trained = CONSOLIDATED['trained']
    bm_authors_expected = int(bm_trained * BENCHMARKS['ind3'] / 100)
    bm_w = scale(bm_authors_expected)
    # Рядок "Автори" = індекс 3 (0-based)
    y_authors = y_positions[3]
    ax.axvline(x=bm_w, ymin=0, ymax=1,
               color=CLR_YELLOW, linestyle='--', linewidth=1.8,
               label=f'Еталон частки авторів ({BENCHMARKS["ind3"]}% від навчених)')

    # Мітки рядків зліва
    for si, (_, label) in enumerate(funnel_fields):
        ax.text(-0.02, y_positions[si], label, va='center', ha='right',
                fontsize=9, color=CLR_NAVY, fontweight='bold')

    legend_elements = [
        mpatches.Patch(facecolor=c['color'], label=c['name']) for c in COMMUNITIES
    ] + [mpatches.Patch(facecolor=CLR_YELLOW, label=f'Еталон авторства {BENCHMARKS["ind3"]}%')]
    ax.legend(handles=legend_elements, loc='lower right', fontsize=9, frameon=True)

    ax.set_xlim(0, 1.25)
    ax.set_yticks([])
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.set_xlabel('Масштаб (√-пропорційний)', fontsize=9, color='gray')
    ax.set_title(
        f'Рис. 2. Воронка залучення учнів до іШГБ 2026\n'
        f'(Інд. 3 — Частка авторів, еталон: {BENCHMARKS["ind3"]}%)',
        fontsize=12, fontweight='bold', color=CLR_NAVY)

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/chart2_funnel.png', **SAVE_KWARGS)
    plt.close()
    print('✓ chart2_funnel.png')


# ─────────────────────────────────────────────────────────────────────────────
# РИС. 3: Кластерний стовпчиковий — Інд. 4 та Інд. 5
# ─────────────────────────────────────────────────────────────────────────────

def make_chart3():
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.patch.set_facecolor('white')

    names  = [c['short'] for c in COMMUNITIES] + ['Зведено']
    colors = [c['color'] for c in COMMUNITIES] + ['#70AD47']
    x = np.arange(len(names))

    for ax_idx, (ind_key, bm_key, ylabel, title_suffix) in enumerate([
        ('i4', 'ind4', 'Проєктів на 100 авторів (%)',
         'Проєктів на 100 авторів\n(проголосованих / авторів × 100)'),
        ('i5', 'ind5', 'Якість проєктів (%)',
         'Якість проєктів\n(% що вийшли на голосування)'),
    ]):
        ax = axes[ax_idx]
        bm = BENCHMARKS[bm_key]
        vals = [INDS[n][ind_key] for n in names]
        bar_colors = [c if INDS[n][ind_key] >= bm else '#C9C9C9'
                      for c, n in zip(colors, names)]

        bars = ax.bar(x, vals, color=bar_colors, alpha=0.87, zorder=3, width=0.5)
        ax.axhline(y=bm, color=CLR_YELLOW, linestyle='--', linewidth=2,
                   label=f'Еталон: {bm}%')
        ax.set_xticks(x)
        ax.set_xticklabels(names, fontsize=9)
        ax.set_ylabel(ylabel, fontsize=9)
        ax.set_title(f'Інд. {4 + ax_idx}: {title_suffix}',
                     fontsize=10, fontweight='bold', color=CLR_NAVY)
        ax.legend(fontsize=8)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.set_ylim(0, max(max(vals) * 1.3, bm * 1.3))
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 0.5,
                    f'{v:.1f}%', ha='center', va='bottom',
                    fontsize=9, fontweight='bold')

    fig.suptitle('Рис. 3. Проєктна активність та якість іШГБ 2026',
                 fontsize=12, fontweight='bold', color=CLR_NAVY)
    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/chart3_bars.png', **SAVE_KWARGS)
    plt.close()
    print('✓ chart3_bars.png')


# ─────────────────────────────────────────────────────────────────────────────
# РИС. 4: Bubble (кола) — Інд. 6
# ─────────────────────────────────────────────────────────────────────────────

def make_chart4():
    fig, ax = plt.subplots(figsize=(11, 6))
    fig.patch.set_facecolor('white')

    BASE_R = 0.28
    bm = BENCHMARKS['ind6']

    all_entries = [(c['short'], c['color']) for c in COMMUNITIES] + [('Зведено', '#70AD47')]

    for xi, (short, color) in enumerate(all_entries, start=1):
        ratio = INDS[short]['i6']
        radius = BASE_R * (ratio ** 0.5)
        circle = plt.Circle((xi, ratio), radius, color=color, alpha=0.72, zorder=3)
        ax.add_patch(circle)
        ax.text(xi, ratio + radius + 0.06,
                f'1:{ratio:.2f}', ha='center', va='bottom',
                fontsize=12, fontweight='bold', color=color)
        ax.text(xi, -0.35, short, ha='center', va='top',
                fontsize=9, color=CLR_NAVY)

        # Двостороння стрілка між колом і еталоном (якщо нижче)
        if ratio < bm:
            ax.annotate('', xy=(xi, bm - 0.04),
                        xytext=(xi, ratio + radius + 0.04),
                        arrowprops=dict(arrowstyle='<->', color=color, lw=1.5))

    ax.axhline(y=bm, color=CLR_YELLOW, linestyle='--', linewidth=2,
               label=f'Еталон 1:{bm:.0f}', zorder=2)
    ax.text(len(all_entries) + 0.55, bm + 0.06,
            f'Еталон\n1:{bm:.0f}', fontsize=9, color=CLR_YELLOW, fontweight='bold')

    ax.set_xlim(0.3, len(all_entries) + 0.9)
    max_ratio = max(INDS[s]['i6'] for s, _ in all_entries)
    ax.set_ylim(-0.6, max(max_ratio, bm) * 1.45)
    ax.set_xticks([])
    ax.set_ylabel('Виборці / Навчений (коефіцієнт)', fontsize=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.legend(fontsize=10, loc='upper left')
    ax.set_title(
        'Рис. 4. Активізація через голосування (Інд. 6)\n'
        '(відношення виборців до навчених)',
        fontsize=12, fontweight='bold', color=CLR_NAVY)

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/chart4_bubble.png', **SAVE_KWARGS)
    plt.close()
    print('✓ chart4_bubble.png')


# ─────────────────────────────────────────────────────────────────────────────
# ЗАПУСК
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print(f'Генерація діаграм іШГБ → {OUTPUT_DIR}/')
    print(f'Громади: {[c["name"] for c in COMMUNITIES]}')
    print()
    make_chart1()
    make_chart2()
    make_chart3()
    make_chart4()
    print()
    print('Готово! Всі 4 діаграми збережено.')
    print('Наступний крок: запустити generate_report.js для вставки PNG у звіт.')

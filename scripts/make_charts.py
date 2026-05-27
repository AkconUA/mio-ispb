import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

OUT = '/home/claude/charts'
os.makedirs(OUT, exist_ok=True)

NAVY   = '#1F3864'
BLUE   = '#2E75B6'
LBLUE  = '#BDD7EE'
GREEN  = '#375623'
LGREEN = '#E2EFDA'
RED    = '#833C00'
LRED   = '#FCE4D6'
ORANGE = '#C55A11'
GREY   = '#D9D9D9'
WHITE  = '#FFFFFF'
DARK   = '#1A1A1A'
FONT   = 'DejaVu Serif'
plt.rcParams.update({'font.family': FONT, 'axes.unicode_minus': False})

def save(name):
    plt.savefig(f'{OUT}/{name}.png', dpi=180, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print(f'  saved {name}.png')


# ════════════════════════════════════════════════════
# CHART 1–2  ·  Double Donut via nested rings
# ════════════════════════════════════════════════════
def make_donut(ax, mag, ver, tot, bench, title):
    """
    Outer ring  = Магдалинівська
    Inner ring  = Верхівцівська
    Using wedgeprops width for donut effect
    """
    ring_kw = dict(startangle=90, counterclock=False)

    # outer ring
    _, texts_o = ax.pie(
        [mag, 100-mag],
        colors=[BLUE, GREY],
        radius=1.0,
        wedgeprops=dict(width=0.30, edgecolor='white', linewidth=1.5),
        **ring_kw)

    # inner ring
    ax.pie(
        [ver, 100-ver],
        colors=[LBLUE, GREY],
        radius=0.68,
        wedgeprops=dict(width=0.30, edgecolor='white', linewidth=1.5),
        **ring_kw)

    # Centre labels
    ax.text(0,  0.13, f'{tot:.1f}%', ha='center', va='center',
            fontsize=20, fontweight='bold', color=NAVY)
    ax.text(0, -0.13, 'Разом', ha='center', va='center',
            fontsize=9, color=DARK)
    ax.text(0, -0.33, f'Еталон: {bench}% ▲', ha='center', va='center',
            fontsize=8.5, color=ORANGE, fontweight='bold')

    ax.set_title(title, fontsize=11, fontweight='bold', color=NAVY, pad=12)

    p1 = mpatches.Patch(color=BLUE,  label=f'Магдалинівська  {mag:.2f}%')
    p2 = mpatches.Patch(color=LBLUE, label=f'Верхівцівська  {ver:.2f}%')
    ax.legend(handles=[p1, p2], loc='lower center',
              bbox_to_anchor=(0.5, -0.10), fontsize=9, frameon=False)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 6.5))
fig.patch.set_facecolor(WHITE)
fig.suptitle('Індикатори 1–2: Рівень залучення та Охоплення закладів',
             fontsize=14, fontweight='bold', color=NAVY, y=1.01)

make_donut(ax1, 87.95, 81.19, 85.37, 72,
           '1. Рівень залучення учнів\nдо іШГБ (%)')
make_donut(ax2, 65.37, 66.96, 65.97, 50,
           '2. Охоплення\n(потенц. / всього учнів, %)')

plt.tight_layout()
save('chart_1_2_donut')


# ════════════════════════════════════════════════════
# CHART 3  ·  Funnel bars — Авторство
# ════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(9, 6.5))
fig.patch.set_facecolor(WHITE)
ax.set_facecolor(WHITE)

stages = ['Навчено учнів\n(загалом)',
          'Стали авторами\nпроєктів',
          'Проєктів вийшло\nна голосування']
values  = [1700,  81,  44]
colors  = [BLUE, '#4472C4', '#70AD47']
pcts    = [100.0, round(81/1700*100, 1), round(44/1700*100, 1)]

bar_h = 0.48
gap   = 0.20
y_bot = [(2-i)*(bar_h+gap) for i in range(3)]
max_w = 0.72
widths = [max_w * v / values[0] for v in values]

for i in range(3):
    x0 = -widths[i]/2
    rect = mpatches.FancyBboxPatch(
        (x0, y_bot[i]), widths[i], bar_h,
        boxstyle='round,pad=0.01',
        facecolor=colors[i], edgecolor=NAVY, linewidth=1.2)
    ax.add_patch(rect)
    ax.text(0, y_bot[i] + bar_h/2,
            f'{values[i]:,} осіб  ({pcts[i]}%)',
            ha='center', va='center', fontsize=12,
            fontweight='bold', color=WHITE)
    ax.text(-max_w/2 - 0.03, y_bot[i] + bar_h/2, stages[i],
            ha='right', va='center', fontsize=10, color=DARK)
    if i < 2:
        mid_y = y_bot[i]
        ax.annotate('', xy=(0, y_bot[i+1]+bar_h+0.02),
                    xytext=(0, y_bot[i]-0.02),
                    arrowprops=dict(arrowstyle='->', color=NAVY, lw=2))

# Benchmark annotation (etalon: 26.2% of 1700 ≈ 445 authors)
bench_n = round(0.262 * 1700)
bw = max_w * bench_n / values[0]
ax.annotate(
    f'Еталон: {bench_n} авторів\n(26,2% від навчених)',
    xy=(bw/2, y_bot[1] + bar_h/2),
    xytext=(max_w/2 + 0.05, y_bot[1] + bar_h/2),
    arrowprops=dict(arrowstyle='->', color=ORANGE, lw=1.5),
    fontsize=9, color=ORANGE, fontweight='bold', va='center')

ax.set_xlim(-max_w/2 - 0.52, max_w/2 + 0.55)
ax.set_ylim(-0.1, 3*(bar_h+gap) + 0.1)
ax.axis('off')
ax.set_title('Індикатор 3: Від навчання до авторства проєктів',
             fontsize=13, fontweight='bold', color=NAVY, pad=14)
plt.tight_layout()
save('chart_3_funnel')


# ════════════════════════════════════════════════════
# CHART 4–5  ·  Clustered Bar
# ════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 2, figsize=(13, 6))
fig.patch.set_facecolor(WHITE)
fig.suptitle('Індикатори 4–5: Проєктна щільність та Якість проєктів',
             fontsize=14, fontweight='bold', color=NAVY, y=1.01)

# --- 4: projects per 100 ---
ax = axes[0]
ax.set_facecolor(WHITE)
cats = ['Магдалинівська\nСТГ', 'Верхівцівська\nМТГ', 'Разом']
vals4 = [2.33, 1.33, 1.95]
bench4 = 10.24
x = np.arange(len(cats))
bars = ax.bar(x, vals4, width=0.45, color=[BLUE, LBLUE, '#4472C4'],
              edgecolor=NAVY, linewidth=0.8, zorder=3)
ax.axhline(bench4, color=ORANGE, linewidth=2, linestyle='--', zorder=4)
ax.text(len(cats)-0.45, bench4 + 0.2,
        f'Еталон {bench4}', fontsize=9, color=ORANGE, fontweight='bold')
for bar, v in zip(bars, vals4):
    ax.text(bar.get_x()+bar.get_width()/2, v+0.06,
            str(v), ha='center', fontsize=11, fontweight='bold', color=DARK)
ax.set_xticks(x); ax.set_xticklabels(cats, fontsize=10)
ax.set_ylabel('Проєктів на 100 учнів', fontsize=10)
ax.set_title('4. Проєктів на 100 учнів', fontsize=12, fontweight='bold', color=NAVY)
ax.set_ylim(0, bench4*1.4); ax.grid(axis='y', alpha=0.3, zorder=0)
ax.spines[['top','right']].set_visible(False)

# --- 5: quality ---
ax = axes[1]
ax.set_facecolor(WHITE)
grps  = ['Магдалинівська\nСТГ', 'Верхівцівська\nМТГ', 'Разом']
dev   = [34, 12, 46]
voted = [32, 12, 44]
x = np.arange(len(grps)); w2 = 0.32
b1 = ax.bar(x-w2/2, dev,   width=w2, label='Розроблено',
            color=BLUE,   edgecolor=NAVY,  linewidth=0.8, zorder=3)
b2 = ax.bar(x+w2/2, voted, width=w2, label='Вийшло на голосування',
            color='#70AD47', edgecolor=GREEN, linewidth=0.8, zorder=3)
for bar, v in zip(list(b1)+list(b2), dev+voted):
    ax.text(bar.get_x()+bar.get_width()/2, v+0.3,
            str(v), ha='center', fontsize=10, fontweight='bold', color=DARK)
qpct = [f'{round(v/d*100,1)}%' for v,d in zip(voted,dev)]
for i,(q,xi) in enumerate(zip(qpct,x)):
    ax.text(xi, max(dev[i],voted[i])+2.2,
            q, ha='center', fontsize=10, color=GREEN, fontweight='bold')
ax.set_xticks(x); ax.set_xticklabels(grps, fontsize=10)
ax.set_ylabel('Кількість проєктів', fontsize=10)
ax.set_title('5. Якість проєктів\n(розроблено vs вийшло на голосування)',
             fontsize=12, fontweight='bold', color=NAVY)
ax.set_ylim(0, max(dev)*1.65)
ax.legend(fontsize=9, frameon=False, loc='upper right')
ax.grid(axis='y', alpha=0.3, zorder=0)
ax.spines[['top','right']].set_visible(False)

fig.text(0.73, -0.04,
         f'Еталон якості: 84,39%  |  Результат: 94,12–100%  ▲',
         ha='center', fontsize=9, color=ORANGE, fontweight='bold')
plt.tight_layout()
save('chart_4_5_bar')


# ════════════════════════════════════════════════════
# CHART 6  ·  Bubble — Активізація
# ════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(11, 6.5))
fig.patch.set_facecolor(WHITE)
ax.set_facecolor('#F7FAFD')

items = [
    # label, ratio, color, text_color
    ('База:\n1 навчений\n учень',          1.00, GREY,        DARK),
    ('Магдалинівська\n1 : 1,19',           1.19, BLUE,        WHITE),
    ('Верхівцівська\n1 : 1,06',            1.06, LBLUE,       DARK),
    ('Разом\nпо проєкту\n1 : 1,14',        1.14, '#4472C4',   WHITE),
    ('Еталон\n1 : 3',                      3.00, ORANGE,      WHITE),
]
xpos   = [0.5, 1.7, 2.9, 4.1, 6.0]
BASE_R = 0.32   # radius for ratio=1

for (lbl, ratio, col, tcol), xp in zip(items, xpos):
    r = BASE_R * np.sqrt(ratio)
    circ = plt.Circle((xp, 1.0), r, color=col,
                       linewidth=1.5, edgecolor=NAVY, zorder=3)
    ax.add_patch(circ)
    ax.text(xp, 1.0, lbl, ha='center', va='center',
            fontsize=8.5, fontweight='bold', color=tcol,
            multialignment='center', zorder=4)

# Gap arrow between project total and benchmark
ax.annotate('', xy=(6.0-BASE_R*np.sqrt(3.0)+0.02, 1.0),
            xytext=(4.1+BASE_R*np.sqrt(1.14)+0.02, 1.0),
            arrowprops=dict(arrowstyle='<->', color=RED, lw=2.2), zorder=5)
ax.text(5.05, 1.42, 'Розрив\nдо еталону\n×2,63', ha='center',
        fontsize=9, color=RED, fontweight='bold')

ax.set_xlim(0, 7.2); ax.set_ylim(0.2, 1.95)
ax.axis('off')
ax.set_title(
    'Індикатор 6: Активізація учнів\n'
    'скільки виборців залучає 1 навчений учень (розмір кола — пропорційний)',
    fontsize=12, fontweight='bold', color=NAVY, pad=14)

fig.text(0.5, 0.01,
         'Еталон: 1 навчений → 3 виборці  |  Результат проєкту: 1 навчений → 1,14 виборця  ▼',
         ha='center', fontsize=9, color=DARK, style='italic')
plt.tight_layout(rect=[0, 0.06, 1, 1])
save('chart_6_bubble')

print('\nAll 4 chart files generated.')

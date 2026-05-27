# Redesign: horizontal funnel with fixed min-width so labels fit
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

OUT = '/home/claude/charts'
NAVY   = '#1F3864'; BLUE = '#2E75B6'; ORANGE = '#C55A11'
WHITE  = '#FFFFFF'; DARK = '#1A1A1A'; GREEN_L= '#70AD47'
plt.rcParams.update({'font.family': 'DejaVu Serif'})

stages = ['Навчено учнів\n(загалом)', 'Стали авторами\nпроєктів', 'Проєктів вийшло\nна голосування']
values  = [1700, 81, 44]
pcts    = [100.0, round(81/1700*100, 1), round(44/1700*100, 1)]
colors  = [BLUE, '#4472C4', GREEN_L]

fig, ax = plt.subplots(figsize=(12, 5.5))
fig.patch.set_facecolor(WHITE); ax.set_facecolor(WHITE)

# Horizontal layout — each stage = one row (y), width from 0 to value_w
total_h = len(stages) * 1.1
bar_h   = 0.62
MIN_W   = 3.0   # minimum bar width so text fits
MAX_W   = 10.0  # width for 1700

def scale(v): return MIN_W + (MAX_W - MIN_W) * np.sqrt(v) / np.sqrt(1700)

y_positions = [2.2, 1.0, -0.2]   # top to bottom

for i, (lbl, val, pct, col, yp) in enumerate(
        zip(stages, values, pcts, colors, y_positions)):
    w = scale(val)
    # centred bar
    rect = mpatches.FancyBboxPatch((-w/2, yp), w, bar_h,
        boxstyle='round,pad=0.015', facecolor=col,
        edgecolor=NAVY, linewidth=1.4, zorder=3)
    ax.add_patch(rect)
    ax.text(0, yp + bar_h/2,
            f'{val:,} осіб   ({pct}%)',
            ha='center', va='center', fontsize=12,
            fontweight='bold', color=WHITE, zorder=4)
    # Stage label on left
    ax.text(-MAX_W/2 - 0.15, yp + bar_h/2,
            lbl, ha='right', va='center', fontsize=10, color=DARK)
    # Arrow between stages
    if i < 2:
        next_yp = y_positions[i+1]
        ax.annotate('', xy=(0, next_yp + bar_h + 0.02),
                    xytext=(0, yp - 0.03),
                    arrowprops=dict(arrowstyle='->', color=NAVY, lw=2.2), zorder=5)

# Benchmark dashed outline for authors bar
bench_n = round(0.262 * 1700)
bw = scale(bench_n)
yp_a = y_positions[1]
rect_b = mpatches.FancyBboxPatch((-bw/2, yp_a - 0.06), bw, bar_h + 0.12,
    boxstyle='round,pad=0.01', fill=False,
    edgecolor=ORANGE, linewidth=2.2, linestyle='--', zorder=6)
ax.add_patch(rect_b)
ax.text(bw/2 + 0.15, yp_a + bar_h/2,
        f'  Еталон: {bench_n} авторів\n  (26,2% від навчених)',
        ha='left', va='center', fontsize=9.5,
        color=ORANGE, fontweight='bold', zorder=7)

ax.set_xlim(-MAX_W/2 - 2.8, MAX_W/2 + 3.0)
ax.set_ylim(-0.55, 3.3)
ax.axis('off')
ax.set_title('Індикатор 3: Від навчання до авторства проєктів\n'
             '(ширина смуги — √-пропорційна кількості; пунктир — еталонний рівень авторства)',
             fontsize=12, fontweight='bold', color=NAVY, pad=12)

plt.tight_layout()
plt.savefig(f'{OUT}/chart_3_funnel.png', dpi=180, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print('saved chart_3_funnel.png')

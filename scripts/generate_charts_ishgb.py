#!/usr/bin/env python3
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

BENCHMARKS = {'ind1':72.0,'ind2':50.0,'ind3':26.2,'ind4':10.24,'ind5':84.39,'ind6':3.0}

COMMUNITIES = [
    {'name':'Великодимерська селищна рада','short':'Великодимерська','color':'#2E75B6',
     'schools_total':11,'schools_part':7,'trained':49,'authors':76,
     'projects_dev':14,'projects_voted':10,'voters':832,'potential':1081},
    {'name':'Перещепинська міська рада','short':'Перещепинська','color':'#ED7D31',
     'schools_total':4,'schools_part':4,'trained':25,'authors':35,
     'projects_dev':14,'projects_voted':9,'voters':328,'potential':346},
    {'name':'Стрийська міська рада','short':'Стрийська','color':'#A9D18E',
     'schools_total':40,'schools_part':4,'trained':68,'authors':48,
     'projects_dev':13,'projects_voted':13,'voters':482,'potential':1063},
    {'name':'Тернопільська міська рада','short':'Тернопільська','color':'#7030A0',
     'schools_total':42,'schools_part':16,'trained':58,'authors':58,
     'projects_dev':34,'projects_voted':34,'voters':4334,'potential':6127},
    {'name':'Фастівська міська рада','short':'Фастівська','color':'#FF0000',
     'schools_total':21,'schools_part':4,'trained':860,'authors':28,
     'projects_dev':8,'projects_voted':8,'voters':574,'potential':111},
    {'name':'Хмельницька міська рада','short':'Хмельницька','color':'#00B0F0',
     'schools_total':40,'schools_part':39,'trained':2892,'authors':353,
     'projects_dev':122,'projects_voted':122,'voters':15983,'potential':21580},
    {'name':'Вінницька міська рада','short':'Вінницька','color':'#FFC000',
     'schools_total':54,'schools_part':3,'trained':334,'authors':32,
     'projects_dev':9,'projects_voted':9,'voters':1636,'potential':2097},
    {'name':'Коблівська сільська рада','short':'Коблівська','color':'#70AD47',
     'schools_total':5,'schools_part':3,'trained':38,'authors':6,
     'projects_dev':6,'projects_voted':6,'voters':250,'potential':291},
]

def sum_f(f): return sum(c[f] for c in COMMUNITIES)
CONSOLIDATED = {
    'name':'Зведено','short':'Зведено','color':'#1F3864',
    'schools_total':sum_f('schools_total'),'schools_part':sum_f('schools_part'),
    'trained':sum_f('trained'),'authors':sum_f('authors'),
    'projects_dev':sum_f('projects_dev'),'projects_voted':sum_f('projects_voted'),
    'voters':sum_f('voters'),'potential':sum_f('potential'),
}
ALL = COMMUNITIES + [CONSOLIDATED]

def calc(d):
    return {
        'i1':(d['authors']+d['voters'])/d['potential']*100,
        'i2':d['schools_part']/d['schools_total']*100,
        'i3':d['authors']/d['trained']*100,
        'i4':d['projects_voted']/d['authors']*100,
        'i5':d['projects_voted']/d['projects_dev']*100,
        'i6':d['voters']/d['authors'],
    }

INDS = {d['short']:calc(d) for d in ALL}
CLR_NAVY='#1F3864'
OUT='/home/claude/charts'
os.makedirs(OUT,exist_ok=True)
KW=dict(dpi=150,bbox_inches='tight',facecolor='white')

print("=== ІНДИКАТОРИ (8 громад) ===")
for d in ALL:
    s=d['short']; i=INDS[s]
    print(f"{s}: І1={i['i1']:.2f}% І2={i['i2']:.2f}% І3={i['i3']:.2f}% І4={i['i4']:.2f}% І5={i['i5']:.2f}% І6=1:{i['i6']:.2f}")

names=[c['short'] for c in COMMUNITIES]+['Зведено']
colors=[c['color'] for c in COMMUNITIES]+[CLR_NAVY]
x=np.arange(len(names))

# РИС 1
fig,axes=plt.subplots(1,2,figsize=(14,6)); fig.patch.set_facecolor('white')
for ai,(ik,bk,title) in enumerate([('i1','ind1','Інд. 1: Рівень залучення (%)'),('i2','ind2','Інд. 2: Охоплення шкіл (%)')]):
    ax=axes[ai]; bm=BENCHMARKS[bk]
    vals=[INDS[n][ik] for n in names]
    bc=[c if INDS[n][ik]>=bm else '#C9C9C9' for c,n in zip(colors,names)]
    bars=ax.bar(x,vals,color=bc,alpha=0.88,zorder=3,width=0.55)
    ax.axhline(y=bm,color='#C9A227',linestyle='--',linewidth=2,label=f'Еталон: {bm}%')
    ax.set_xticks(x); ax.set_xticklabels(names,fontsize=7,rotation=35,ha='right')
    ax.set_ylabel('%',fontsize=9); ax.set_title(title,fontsize=10,fontweight='bold',color=CLR_NAVY)
    ax.legend(fontsize=9); ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.set_ylim(0,max(max(vals)*1.28,bm*1.28))
    for bar,v in zip(bars,vals):
        ax.text(bar.get_x()+bar.get_width()/2,bar.get_height()+0.3,f'{v:.1f}%',ha='center',va='bottom',fontsize=6.5,fontweight='bold')
fig.suptitle('Рис. 1. Рівень залучення учнів та охоплення шкіл іШГБ 2026',fontsize=11,fontweight='bold',color=CLR_NAVY,y=1.02)
plt.tight_layout(); plt.savefig(f'{OUT}/chart1_donut.png',**KW); plt.close(); print('✓ chart1')

# РИС 2 — ВОРОНКА
fig,ax=plt.subplots(figsize=(13,8)); fig.patch.set_facecolor('white')
funnel=[('potential','Потенційно учнів'),('trained','Навчено'),
        ('authors','Автори'),('projects_dev','Проєкти розроблено'),('projects_voted','На голосуванні')]
max_val=max(c['potential'] for c in COMMUNITIES)
MIN_W,MAX_W=0.12,0.90
def scale(v): return MIN_W+(MAX_W-MIN_W)*(v/max_val)**0.5
n=len(funnel); bh=0.25; gap=0.03
ypos=list(range(n,0,-1))
for ci,community in enumerate(COMMUNITIES):
    off=(ci-(len(COMMUNITIES)-1)/2)*(bh+gap)
    for si,(field,label) in enumerate(funnel):
        val=community[field]; w=scale(val); y=ypos[si]+off
        ax.barh(y,w,height=bh,color=community['color'],alpha=0.80,zorder=3)
        if ci==len(COMMUNITIES)-1:
            ax.text(w+0.01,y,f'{val:,}',va='center',fontsize=6,color='#555555')
for si,(_,label) in enumerate(funnel):
    ax.text(-0.02,ypos[si],label,va='center',ha='right',fontsize=9,color=CLR_NAVY,fontweight='bold')
legend_els=[mpatches.Patch(facecolor=c['color'],label=c['short']) for c in COMMUNITIES]
ax.legend(handles=legend_els,loc='lower right',fontsize=7.5,frameon=True)
ax.set_xlim(0,1.22); ax.set_yticks([])
ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False); ax.spines['left'].set_visible(False)
ax.set_xlabel('Масштаб (√-пропорційний)',fontsize=9,color='gray')
ax.set_title(f'Рис. 2. Воронка залучення учнів до іШГБ 2026\n(Інд. 3 — Частка авторів, еталон: {BENCHMARKS["ind3"]}%)',fontsize=11,fontweight='bold',color=CLR_NAVY)
plt.tight_layout(); plt.savefig(f'{OUT}/chart2_funnel.png',**KW); plt.close(); print('✓ chart2')

# РИС 3
fig,axes=plt.subplots(1,2,figsize=(14,6)); fig.patch.set_facecolor('white')
for ai,(ik,bk,yl,title) in enumerate([
    ('i4','ind4','Проєктів на 100 авторів (%)','Інд. 4: Проєктів на 100 авторів'),
    ('i5','ind5','Якість проєктів (%)','Інд. 5: Якість проєктів')]):
    ax=axes[ai]; bm=BENCHMARKS[bk]
    vals=[INDS[n][ik] for n in names]
    bc=[c if INDS[n][ik]>=bm else '#C9C9C9' for c,n in zip(colors,names)]
    bars=ax.bar(x,vals,color=bc,alpha=0.87,zorder=3,width=0.55)
    ax.axhline(y=bm,color='#C9A227',linestyle='--',linewidth=2,label=f'Еталон: {bm}%')
    ax.set_xticks(x); ax.set_xticklabels(names,fontsize=7,rotation=35,ha='right')
    ax.set_ylabel(yl,fontsize=9); ax.set_title(title,fontsize=10,fontweight='bold',color=CLR_NAVY)
    ax.legend(fontsize=8); ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.set_ylim(0,max(max(vals)*1.3,bm*1.3))
    for bar,v in zip(bars,vals):
        ax.text(bar.get_x()+bar.get_width()/2,bar.get_height()+0.3,f'{v:.1f}%',ha='center',va='bottom',fontsize=6.5,fontweight='bold')
fig.suptitle('Рис. 3. Проєктна активність та якість іШГБ 2026',fontsize=11,fontweight='bold',color=CLR_NAVY)
plt.tight_layout(); plt.savefig(f'{OUT}/chart3_bars.png',**KW); plt.close(); print('✓ chart3')

# РИС 4 — BUBBLE
fig,ax=plt.subplots(figsize=(14,6)); fig.patch.set_facecolor('white')
BASE_R=0.18; bm=BENCHMARKS['ind6']
entries=[(c['short'],c['color']) for c in COMMUNITIES]+[('Зведено',CLR_NAVY)]
for xi,(short,color) in enumerate(entries,start=1):
    ratio=INDS[short]['i6']; radius=BASE_R*(ratio**0.5)
    circle=plt.Circle((xi,ratio),radius,color=color,alpha=0.70,zorder=3)
    ax.add_patch(circle)
    ax.text(xi,ratio+radius+0.4,f'1:{ratio:.1f}',ha='center',va='bottom',fontsize=8.5,fontweight='bold',color=color)
    ax.text(xi,-1.2,short,ha='center',va='top',fontsize=7,color=CLR_NAVY,rotation=20)
ax.axhline(y=bm,color='#C9A227',linestyle='--',linewidth=2,label=f'Еталон 1:{bm:.0f}',zorder=2)
ax.set_xlim(0.2,len(entries)+0.8)
max_r=max(INDS[s]['i6'] for s,_ in entries)
ax.set_ylim(-2.5,max(max_r,bm)*1.4)
ax.set_xticks([]); ax.set_ylabel('Виборці / Автор',fontsize=10)
ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False); ax.spines['bottom'].set_visible(False)
ax.legend(fontsize=10,loc='upper left')
ax.set_title('Рис. 4. Активізація через голосування (Інд. 6)',fontsize=11,fontweight='bold',color=CLR_NAVY)
plt.tight_layout(); plt.savefig(f'{OUT}/chart4_bubble.png',**KW); plt.close(); print('✓ chart4')
print('\nВсі діаграми збережено.')
# (fix: total_students not in new dict — use potential as proxy for funnel scale)

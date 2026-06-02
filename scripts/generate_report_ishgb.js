const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Footer, AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber
} = require('docx');
const fs = require('fs');

const CLR_NAVY='1F3864', CLR_PALE='EBF3FB', CLR_GREEN='E2EFDA', CLR_RED='FCE4D6';
const CLR_YELLOW='FFF2CC', TXT_GREEN='375623', TXT_RED='833C00', TXT_YELLOW='7F6000', CLR_WHITE='FFFFFF';
const BORDER={style:BorderStyle.SINGLE,size:4,color:'CCCCCC'};
const BORDERS={top:BORDER,bottom:BORDER,left:BORDER,right:BORDER};
const CM={top:80,bottom:80,left:120,right:120};

const COMMUNITIES=[
  {name:'Великодимерська селищна рада',short:'Великодимерська',
   schools_total:11,schools_part:7,trained:49,authors:76,projects_dev:14,projects_voted:10,voters:832,potential:1081,winners:7,realized:7},
  {name:'Перещепинська міська рада',short:'Перещепинська',
   schools_total:4,schools_part:4,trained:25,authors:35,projects_dev:14,projects_voted:9,voters:328,potential:346,winners:4,realized:0},
  {name:'Стрийська міська рада',short:'Стрийська',
   schools_total:40,schools_part:4,trained:68,authors:48,projects_dev:13,projects_voted:13,voters:482,potential:1063,winners:4,realized:0},
  {name:'Тернопільська міська рада',short:'Тернопільська',
   schools_total:42,schools_part:16,trained:58,authors:58,projects_dev:34,projects_voted:34,voters:4334,potential:6127,winners:16,realized:0},
  {name:'Фастівська міська рада',short:'Фастівська',
   schools_total:21,schools_part:4,trained:860,authors:28,projects_dev:8,projects_voted:8,voters:574,potential:111,winners:4,realized:4},
  {name:'Хмельницька міська рада',short:'Хмельницька',
   schools_total:40,schools_part:39,trained:2892,authors:353,projects_dev:122,projects_voted:122,voters:15983,potential:21580,winners:12,realized:0},
  {name:'Вінницька міська рада',short:'Вінницька',
   schools_total:54,schools_part:3,trained:334,authors:32,projects_dev:9,projects_voted:9,voters:1636,potential:2097,winners:3,realized:0},
  {name:'Коблівська сільська рада',short:'Коблівська',
   schools_total:5,schools_part:3,trained:38,authors:6,projects_dev:6,projects_voted:6,voters:250,potential:291,winners:3,realized:0},
];

const OOP_DATA={
  'Великодимерська':44,'Перещепинська':10,'Стрийська':29,'Тернопільська':174,
  'Фастівська':18,'Хмельницька':870,'Вінницька':31,'Коблівська':8
};
const OOP_TOTAL=1182;

const CONS={
  name:'Зведено',short:'Зведено',
  schools_total:217,schools_part:80,trained:4324,authors:636,
  projects_dev:220,projects_voted:211,voters:24419,potential:32696,winners:53,realized:11
};
const ALL=[...COMMUNITIES,CONS];
const BM={i1:72,i2:50,i3:26.2,i4:10.24,i5:84.39,i6:3};

function calcInds(d){
  return {
    i1:(d.authors+d.voters)/d.potential*100,
    i2:d.schools_part/d.schools_total*100,
    i3:d.authors/d.trained*100,
    i4:d.projects_voted/d.authors*100,
    i5:d.projects_voted/d.projects_dev*100,
    i6:d.voters/d.authors,
  };
}
const INDS={};
ALL.forEach(d=>{INDS[d.short]=calcInds(d);});

function tnr(text,opts={}){
  return new TextRun({text,font:'Times New Roman',size:24,
    bold:opts.bold||false,italics:opts.italic||false,
    color:opts.color||'000000',allCaps:opts.caps||false});
}
function para(children,opts={}){
  return new Paragraph({
    alignment:opts.align||AlignmentType.JUSTIFIED,
    spacing:{before:opts.sb||60,after:opts.sa||60,line:276},
    children:Array.isArray(children)?children:[children],
    ...(opts.pageBreak?{pageBreakBefore:true}:{}),
    ...(opts.numbering?{numbering:opts.numbering}:{}),
  });
}
function h1(text,pb=false){return new Paragraph({alignment:AlignmentType.LEFT,spacing:{before:240,after:120},pageBreakBefore:pb,children:[new TextRun({text,font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})]});}
function h2(text){return new Paragraph({alignment:AlignmentType.LEFT,spacing:{before:180,after:80},children:[new TextRun({text,font:'Times New Roman',size:24,bold:true,color:CLR_NAVY})]});}
function h3(text){return new Paragraph({alignment:AlignmentType.LEFT,spacing:{before:140,after:60},children:[new TextRun({text,font:'Times New Roman',size:24,bold:true,color:CLR_NAVY})]});}
function empty(){return para([tnr('')]);}
function img(file,w,h){return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:80,after:80},children:[new ImageRun({type:'png',data:fs.readFileSync(file),transformation:{width:w,height:h},altText:{title:file,description:file,name:file}})]});}

function cell(text,opts={}){
  const fill=opts.fill||CLR_WHITE;
  const txtColor=opts.txtColor||(fill===CLR_NAVY?CLR_WHITE:'000000');
  const bold=opts.bold!==undefined?opts.bold:(fill!==CLR_WHITE&&fill!==CLR_PALE);
  return new TableCell({borders:BORDERS,width:opts.width?{size:opts.width,type:WidthType.DXA}:undefined,
    shading:{fill,type:ShadingType.CLEAR},margins:CM,verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({alignment:opts.align||AlignmentType.CENTER,spacing:{before:40,after:40},
      children:[new TextRun({text:String(text),font:'Times New Roman',size:20,bold,color:txtColor})]})]});
}
function hCell(text,w){return cell(text,{fill:CLR_NAVY,bold:true,txtColor:CLR_WHITE,width:w});}

function arrowFill(v,bm){return v>=bm?CLR_GREEN:CLR_RED;}
function arrowTxt(v,bm){return v>=bm?TXT_GREEN:TXT_RED;}
function arrow(v,bm){return v>=bm?'▲':'▼';}

function makeFooter(){
  return new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,
    border:{top:{style:BorderStyle.SINGLE,size:6,color:CLR_NAVY,space:4}},
    spacing:{before:60,after:0},
    children:[new TextRun({font:'Times New Roman',size:18,color:'888888',children:[PageNumber.CURRENT]})]})
  ]});
}

// ── ТИТУЛ ──
function makeTitle(){return[
  empty(),
  para([tnr('ГО «ФОРУМ РОЗВИТКУ ГРОМАДЯНСЬКОГО СУСПІЛЬСТВА»',{bold:true,caps:true,color:CLR_NAVY})],{align:AlignmentType.CENTER,sb:0,sa:60}),
  empty(),empty(),empty(),
  para([tnr('АНАЛІТИЧНИЙ ЗВІТ МіО',{bold:true,color:CLR_NAVY})],{align:AlignmentType.CENTER}),
  para([tnr('Впровадження моделі інклюзивного Шкільного Громадського Бюджету (іШГБ)',{bold:true,color:CLR_NAVY})],{align:AlignmentType.CENTER,sb:40,sa:40}),
  para([tnr('в громадах-партнерах проєкту',{italic:true})],{align:AlignmentType.CENTER}),
  para([tnr('«Зміцнення багаторівневого врядування та місцевої демократії для підтримки відновлення України»',{italic:true})],{align:AlignmentType.CENTER,sa:80}),
  empty(),empty(),
  para([tnr('Підготовлено:',{bold:true}),tnr(' Олексій Коваленко, керівник ГО ФРГС')],{align:AlignmentType.CENTER}),
  para([tnr('Донор: Рада Європи (Council of Europe Office in Ukraine)',{italic:true})],{align:AlignmentType.CENTER}),
  para([tnr('Договір: 9316/2025/01, Order Form № 08',{italic:true})],{align:AlignmentType.CENTER}),
  empty(),empty(),empty(),empty(),
  para([tnr('2026',{bold:true,color:CLR_NAVY})],{align:AlignmentType.CENTER}),
];}

// ── ЗМІСТ ──
function makeContents(){
  const items=['0. Вступ','1. Саммері МіО','   1.1 Методологічна рамка','   1.2 Ключові тези та інсайти',
    '2. Результати: порівняльний аналіз громад','   2.1 Порівняльна матриця індикаторів',
    '   2.2 Детальний аналіз по кожній громаді','   2.3 Інфографіка результатів іШГБ',
    '3. Висновки та рекомендації','   3.1 Загальна оцінка vs еталон',
    '   3.2 Вплив іШГБ на активізацію учнів','   3.3 Сильні сторони та вузькі місця',
    '   3.4 Практичні рекомендації','Примітки (Коблівська, Роздільнянська)'];
  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'ЗМІСТ',font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})],spacing:{before:0,after:120}}),
    ...items.map(t=>para([tnr(t)],{sb:40,sa:40}))];
}

// ── ВСТУП ──
function makeIntro(){
  const reqTable=new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3000,6026],rows:[
    new TableRow({children:[hCell('Параметр',3000),hCell('Зміст',6026)]}),
    ...([['Назва проєкту','«Зміцнення багаторівневого врядування та місцевої демократії для підтримки відновлення України»'],
      ['Код проєкту','3926/BH 9316; Order Form № 08 (9316/2025/01)'],
      ['Організація-виконавець','ГО «Форум розвитку громадянського суспільства» (CSDF NGO)'],
      ['Донор','Рада Європи (Council of Europe Office in Ukraine)'],
      ['Терміни реалізації','02 березня 2026 – 31 травня 2026'],
      ['Охоплені громади','8 із 9 громад подали повний звіт: Великодимерська, Перещепинська, Стрийська, Тернопільська, Фастівська, Хмельницька, Вінницька, Коблівська'],
      ['Підготовлено','Олексій Коваленко, керівник ГО ФРГС'],
    ].map(([k,v],i)=>new TableRow({children:[
      cell(k,{fill:i%2===0?CLR_WHITE:CLR_PALE,bold:true,align:AlignmentType.LEFT,width:3000}),
      cell(v,{fill:i%2===0?CLR_WHITE:CLR_PALE,bold:false,align:AlignmentType.LEFT,width:6026}),
    ]})))
  ]});
  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'0. ВСТУП',font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})],spacing:{before:0,after:120}}),
    h2('Реквізити проєкту'),reqTable,empty(),
    h2('Джерела даних'),
    para([tnr('Основне джерело даних — зведена моніторингова таблиця іШГБ РЄ 2026 (фінальна версія, .xlsx), заповнена представниками 9 громад-партнерів проєкту. До аналізу включено 8 громад, які надали повні дані. Роздільнянська МТГ перенесла впровадження іШГБ на вересень 2026 року і не подала моніторингових даних.')]),
    empty(),
    h2('Методологічні уточнення'),
    para([tnr('Індикатор 2 (Охоплення шкіл): знаменник — загальна кількість закладів освіти в громаді (не учні). Формула: шкіл-учасниць / шкіл всього × 100.')]),
    para([tnr('Індикатор 4 (Проєктів на 100 авторів): знаменник — кількість авторів проєктів (не потенційних учасників). Формула: проєктів на голосуванні / авторів × 100.')]),
    para([tnr('Індикатор 6 (Активізація): відношення виборців до авторів (не до навчених). Формула: виборці / автори, результат — «1 : X».')]),
  ];
}

// ── САММЕРІ ──
function makeSummary(){
  const methodTable=new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[360,2200,2800,3666],rows:[
    new TableRow({children:[hCell('№',360),hCell('Назва',2200),hCell('Формула',2800),hCell('Сутність',3666)]}),
    ...([['1','Рівень залучення','(автори + виборці) / потенційні × 100','Частка учнів, залучених до ШГБ (активна участь)'],
      ['2','Охоплення шкіл','шкіл-учасниць / шкіл всього × 100','Масштаб поширення іШГБ у закладах освіти'],
      ['3','Частка авторів','автори / навчені × 100','Конверсія з навчання в активну проєктну роботу'],
      ['4','Проєктів на 100 авторів','проєктів на голосуванні / авторів × 100','Продуктивність авторських команд'],
      ['5','Якість проєктів','проєктів на голосуванні / розроблених × 100','Відсоток проєктів, що пройшли відбір'],
      ['6','Активізація','виборці / автори → «1 : X»','Мультиплікативний ефект: виборців на 1 автора'],
    ].map(([n,name,form,sens],i)=>new TableRow({children:[
      cell(n,{fill:i%2===0?CLR_WHITE:CLR_PALE,width:360}),
      cell(name,{fill:i%2===0?CLR_WHITE:CLR_PALE,bold:true,align:AlignmentType.LEFT,width:2200}),
      cell(form,{fill:i%2===0?CLR_WHITE:CLR_PALE,align:AlignmentType.LEFT,width:2800}),
      cell(sens,{fill:i%2===0?CLR_WHITE:CLR_PALE,align:AlignmentType.LEFT,width:3666}),
    ]})))
  ]});

  const theses=[
    ['Масштаб охоплення: 8 з 9 громад подали повний звіт.',
     'Вісім громад успішно завершили цикл іШГБ або більшу його частину та подали моніторингові дані. Роздільнянська МТГ офіційно перенесла впровадження на 1 вересня 2026 року, виконавши підготовчий етап у повному обсязі.'],
    ['Рівень залучення учнів (Інд. 1) — 76,63% — перевищив еталон.',
     'Зведений показник (76,63%) вищий за еталон 72%. Загалом у процесі взяли участь 24 419 виборців та 636 авторів із 32 696 потенційних учасників. Лідер — Перещепинська (104,91%), найближче до еталону — Тернопільська (71,68%).'],
    ['Охоплення шкіл (Інд. 2) потребує уваги: 36,87% проти еталону 50%.',
     'Лише 80 із 217 шкіл долучились до іШГБ. Хмельницька охопила 97,5% шкіл, Коблівська — 60%, Великодимерська — 63,6%. Натомість Вінницька (5,56%), Стрийська (10%) та Тернопільська (38,1%) суттєво тягнуть зведений показник вниз.'],
    ['Конверсія навчених в авторів (Інд. 3) — 14,71% — удвічі нижче еталону 26,2%.',
     'Із 4 324 навчених учнів 636 стали авторами проєктів. Критично низький рівень у Великодимерській (155% — аномалія: авторів більше за навчених, потребує уточнення методики обліку) та Фастівській (3,26%) і Вінницькій (9,58%).'],
    ['Якість проєктів (Інд. 5) — 95,91% — суттєво вища за еталон 84,39%.',
     'Із 220 розроблених проєктів 211 вийшли на голосування. П\'ять громад досягли 100% якості. Визначено 53 переможці, 11 із яких вже реалізовано на суму 189 900 грн.'],
    ['Інклюзивний вимір: 1 182 дитини з ООП та інвалідністю залучено до процесу.',
     'У 8 громадах до іШГБ залучено 1 182 дитини з особливими освітніми потребами та інвалідністю. Найбільше — у Хмельницькій (870), Тернопільській (174) та Великодимерській (44). Це підтверджує реальний інклюзивний характер механізму та відповідність стандартам Ради Європи.'],
  ];

  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'1. САММЕРІ МіО',font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})],spacing:{before:0,after:120}}),
    h2('1.1 Методологічна рамка'),methodTable,empty(),
    h2('1.2 Ключові тези та інсайти'),
    ...theses.map(([bold_text,expl])=>para([tnr(bold_text,{bold:true}),tnr(' '+expl)])),
  ];
}

// ── МАТРИЦЯ ──
function makeMatrix(){
  const indNames=['Рівень залучення (%)','Охоплення шкіл (%)','Частка авторів (%)',
    'Проєктів на 100 авторів (%)','Якість (%)','Активізація (1:X)'];
  const bmVals=[72,50,26.2,10.24,84.39,3];
  const indKeys=['i1','i2','i3','i4','i5','i6'];
  const shortNames=[...COMMUNITIES.map(c=>c.short),'Зведено'];
  const colW=1070; const firstW=2100; const bmW=820;

  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'2. РЕЗУЛЬТАТИ: ПОРІВНЯЛЬНИЙ АНАЛІЗ ГРОМАД',font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})],spacing:{before:0,after:120}}),
    h2('2.1 Порівняльна матриця індикаторів'),
    para([tnr('Таблиця 1. Порівняльна матриця індикаторів іШГБ за громадами (2026).',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[firstW,bmW,...shortNames.map(()=>colW)],
      rows:[
        new TableRow({children:[hCell('Індикатор',firstW),hCell('Еталон',bmW),...shortNames.map(n=>hCell(n,colW))]}),
        ...indKeys.map((key,idx)=>{
          const bm=bmVals[idx];
          return new TableRow({children:[
            cell(indNames[idx],{fill:CLR_NAVY,bold:true,txtColor:CLR_WHITE,align:AlignmentType.LEFT,width:firstW}),
            cell(key==='i6'?`1:${bm}`:`${bm}%`,{fill:CLR_YELLOW,bold:true,txtColor:TXT_YELLOW,width:bmW}),
            ...shortNames.map(n=>{
              const v=INDS[n][key];
              const fill=arrowFill(v,bm); const txtColor=arrowTxt(v,bm);
              const display=key==='i6'?`1:${v.toFixed(1)}`:`${v.toFixed(1)}% ${arrow(v,bm)}`;
              return cell(display,{fill,bold:true,txtColor,width:colW});
            }),
          ]});
        }),
      ]
    }),
    empty(),
    para([tnr('Легенда: ',{bold:true}),tnr('▲ ',{bold:true,color:TXT_GREEN}),tnr('— вище еталону; '),
      tnr('▼ ',{bold:true,color:TXT_RED}),tnr('— нижче еталону; '),
      tnr('Жовтий фон ',{color:TXT_YELLOW,bold:true}),tnr('— еталонне значення.')],{align:AlignmentType.LEFT}),
  ];
}

// ── ДЕТАЛЬНИЙ АНАЛІЗ ──
function makeCommunityAnalysis(){
  const indNames=['Рівень залучення','Охоплення шкіл','Частка авторів',
    'Проєктів на 100 авторів','Якість проєктів','Активізація'];
  const bmVals=[72,50,26.2,10.24,84.39,3];
  const indKeys=['i1','i2','i3','i4','i5','i6'];

  const desc={
    i1:(d,v)=>`Інд. 1 — Рівень залучення: ${v.toFixed(2)}% (${arrow(v,72)} формула: (${d.authors}+${d.voters})/${d.potential}×100, еталон 72%). `+(v>=72?`Громада залучила ${(d.authors+d.voters).toLocaleString('uk')} учнів із ${d.potential.toLocaleString('uk')} потенційних, перевищивши еталон.`:`З ${d.potential.toLocaleString('uk')} потенційних учнів залучено ${(d.authors+d.voters).toLocaleString('uk')}.`),
    i2:(d,v)=>`Інд. 2 — Охоплення шкіл: ${v.toFixed(2)}% (${arrow(v,50)} формула: ${d.schools_part}/${d.schools_total}×100, еталон 50%). `+(v>=50?`До іШГБ залучено ${d.schools_part} із ${d.schools_total} шкіл — охоплення вище нормативу.`:`Лише ${d.schools_part} із ${d.schools_total} шкіл взяли участь — потенціал для розширення охоплення.`),
    i3:(d,v)=>`Інд. 3 — Частка авторів: ${v.toFixed(2)}% (${arrow(v,26.2)} формула: ${d.authors}/${d.trained}×100, еталон 26,2%). `+(v>=26.2?`Конверсія навчених в авторів перевищила еталон: із ${d.trained} навчених ${d.authors} стали авторами.`:`Із ${d.trained} навчених лише ${d.authors} перейшли до розробки проєктів.`),
    i4:(d,v)=>`Інд. 4 — Проєктів на 100 авторів: ${v.toFixed(2)}% (${arrow(v,10.24)} формула: ${d.projects_voted}/${d.authors}×100, еталон 10,24%). `+(v>=10.24?`Продуктивність авторів висока: ${v.toFixed(1)} проєктів на 100 авторів.`:`${d.projects_voted} проєктів на ${d.authors} авторів — нижче нормативу.`),
    i5:(d,v)=>`Інд. 5 — Якість проєктів: ${v.toFixed(2)}% (${arrow(v,84.39)} формула: ${d.projects_voted}/${d.projects_dev}×100, еталон 84,39%). `+(v>=84.39?`${d.projects_voted} із ${d.projects_dev} проєктів вийшли на голосування — висока якість підготовки.`:`${d.projects_dev-d.projects_voted} проєктів не пройшли відбір.`),
    i6:(d,v)=>`Інд. 6 — Активізація: 1:${v.toFixed(2)} (${arrow(v,3)} формула: ${d.voters.toLocaleString('uk')}/${d.authors}=${v.toFixed(2)}, еталон 1:3). На кожного автора проголосувало ${v.toFixed(1)} учнів — `+(v>=3?`мультиплікативний ефект перевищує норматив.`:`нижче нормативу.`),
  };

  const sections=[new Paragraph({children:[new TextRun({text:'2.2 Детальний аналіз по кожній громаді',font:'Times New Roman',size:24,bold:true,color:CLR_NAVY})],spacing:{before:180,after:80}})];

  [...COMMUNITIES,CONS].forEach(d=>{
    // OOP note
    const oopCount=OOP_DATA[d.short];
    const oopNote=oopCount?` До процесу залучено ${oopCount} дітей з ООП та інвалідністю.`:'';
    sections.push(h3(d.name));
    indKeys.forEach((key)=>{
      const v=INDS[d.short][key];
      sections.push(para([new TextRun({text:desc[key](d,v)+(key==='i1'?oopNote:''),font:'Times New Roman',size:22,color:'000000'})]));
    });
    if(d.winners!==undefined){
      sections.push(para([tnr(`Переможці та реалізація: визначено ${d.winners} проєктів-переможців, ${d.realized} вже реалізовано.`,{italic:true})]));
    }
    sections.push(empty());
  });
  return sections;
}

// ── ІНФОГРАФІКА ──
function makeInfographics(){
  const panelData=[
    {num:'1',name:'Рівень залучення',val:`${INDS['Зведено'].i1.toFixed(1)}%`,bm:'72%',i:'i1',bm_n:72},
    {num:'2',name:'Охоплення шкіл',val:`${INDS['Зведено'].i2.toFixed(1)}%`,bm:'50%',i:'i2',bm_n:50},
    {num:'3',name:'Частка авторів',val:`${INDS['Зведено'].i3.toFixed(1)}%`,bm:'26,2%',i:'i3',bm_n:26.2},
    {num:'4',name:'Проєктів на 100 авт.',val:`${INDS['Зведено'].i4.toFixed(1)}%`,bm:'10,24%',i:'i4',bm_n:10.24},
    {num:'5',name:'Якість проєктів',val:`${INDS['Зведено'].i5.toFixed(1)}%`,bm:'84,39%',i:'i5',bm_n:84.39},
    {num:'6',name:'Активізація',val:`1:${INDS['Зведено'].i6.toFixed(1)}`,bm:'1:3',i:'i6',bm_n:3},
  ];
  const colW3=3008;
  const panelRows=[];
  for(let r=0;r<2;r++){
    const rowCells=[];
    for(let c=0;c<3;c++){
      const d=panelData[r*3+c];
      const v=INDS['Зведено'][d.i];
      const above=d.i==='i6'?v>=d.bm_n:parseFloat(d.val)>=d.bm_n;
      const fill=above?CLR_GREEN:CLR_RED; const txtC=above?TXT_GREEN:TXT_RED;
      rowCells.push(new TableCell({borders:BORDERS,width:{size:colW3,type:WidthType.DXA},
        shading:{fill,type:ShadingType.CLEAR},margins:CM,verticalAlign:VerticalAlign.CENTER,
        children:[
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:40,after:0},children:[new TextRun({text:`Інд. ${d.num}`,font:'Times New Roman',size:18,bold:true,color:CLR_NAVY})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0},children:[new TextRun({text:d.name,font:'Times New Roman',size:18,color:'444444'})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:20,after:0},children:[new TextRun({text:d.val,font:'Times New Roman',size:32,bold:true,color:txtC})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:40},children:[new TextRun({text:`еталон: ${d.bm}`,font:'Times New Roman',size:16,color:'888888'})]}),
        ]}));
    }
    panelRows.push(new TableRow({children:rowCells}));
  }

  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'2.3 Інфографіка результатів іШГБ',font:'Times New Roman',size:24,bold:true,color:CLR_NAVY})],spacing:{before:0,after:80}}),
    para([tnr('Таблиця 2. Зведена панель індикаторів іШГБ 2026 (8 громад).',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    new Table({width:{size:9024,type:WidthType.DXA},columnWidths:[colW3,colW3,colW3],rows:panelRows}),
    empty(),
    para([tnr('Рис. 1. Рівень залучення учнів та охоплення шкіл іШГБ 2026.',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    img('/home/claude/charts/chart1_donut.png',570,260),empty(),
    para([tnr('Рис. 2. Воронка залучення учнів до іШГБ 2026.',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    img('/home/claude/charts/chart2_funnel.png',570,280),empty(),
    para([tnr('Рис. 3. Проєктна активність та якість іШГБ 2026.',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    img('/home/claude/charts/chart3_bars.png',570,250),empty(),
    para([tnr('Рис. 4. Активізація через голосування (Інд. 6).',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    img('/home/claude/charts/chart4_bubble.png',570,240),
  ];
}

// ── ВИСНОВКИ ──
function makeConclusions(){
  const verdictTable=new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2200,820,1100,1100,3806],rows:[
    new TableRow({children:[hCell('Індикатор',2200),hCell('Еталон',820),hCell('Факт',1100),hCell('Статус',1100),hCell('Вердикт',3806)]}),
    ...([['1. Рівень залучення','72%',`${INDS['Зведено'].i1.toFixed(1)}%`,'УСПІШНО ▲',CLR_GREEN,TXT_GREEN,'Перевищено. Масштабна мобілізація учнів у більшості громад.'],
      ['2. Охоплення шкіл','50%',`${INDS['Зведено'].i2.toFixed(1)}%`,'ЧАСТКОВО ▼',CLR_RED,TXT_RED,'Нижче еталону. Хмельницька, Коблівська — відмінно; Вінницька, Стрийська — потребують уваги.'],
      ['3. Частка авторів','26,2%',`${INDS['Зведено'].i3.toFixed(1)}%`,'ПОТРЕБУЄ ▼',CLR_RED,TXT_RED,'Найслабший показник. Потрібне посилення підтримки на етапі формування команд.'],
      ['4. Проєктів/100 авт.','10,24%',`${INDS['Зведено'].i4.toFixed(1)}%`,'УСПІШНО ▲',CLR_GREEN,TXT_GREEN,'Продуктивність авторів значно перевищила норматив у всіх громадах.'],
      ['5. Якість','84,39%',`${INDS['Зведено'].i5.toFixed(1)}%`,'УСПІШНО ▲',CLR_GREEN,TXT_GREEN,'Висока якість відбору. 5 громад досягли 100%, 53 переможці, 11 реалізовано.'],
      ['6. Активізація','1:3',`1:${INDS['Зведено'].i6.toFixed(1)}`,'УСПІШНО ▲',CLR_GREEN,TXT_GREEN,'Ефект у 12,8 рази перевищує норматив. Широке охоплення голосуванням.'],
    ].map(([name,bm,fact,status,fill,txtC,verdict],i)=>new TableRow({children:[
      cell(name,{fill:i%2===0?CLR_WHITE:CLR_PALE,align:AlignmentType.LEFT,width:2200}),
      cell(bm,{fill:i%2===0?CLR_WHITE:CLR_PALE,width:820}),
      cell(fact,{fill,bold:true,txtColor:txtC,width:1100}),
      cell(status,{fill,bold:true,txtColor:txtC,width:1100}),
      cell(verdict,{fill:i%2===0?CLR_WHITE:CLR_PALE,align:AlignmentType.LEFT,width:3806}),
    ]})))
  ]});

  // OOP table
  const oopTable=new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3600,1500,3926],rows:[
    new TableRow({children:[hCell('Громада',3600),hCell('Дітей з ООП та інвалідністю',1500),hCell('Примітка',3926)]}),
    ...COMMUNITIES.map((c,i)=>new TableRow({children:[
      cell(c.name,{fill:i%2===0?CLR_WHITE:CLR_PALE,align:AlignmentType.LEFT,width:3600}),
      cell(OOP_DATA[c.short]||0,{fill:i%2===0?CLR_WHITE:CLR_PALE,width:1500}),
      cell(OOP_DATA[c.short]>100?'Значне охоплення':'',{fill:i%2===0?CLR_WHITE:CLR_PALE,align:AlignmentType.LEFT,width:3926}),
    ]})),
    new TableRow({children:[
      cell('ЗВЕДЕНО',{fill:CLR_NAVY,bold:true,txtColor:CLR_WHITE,width:3600}),
      cell(OOP_TOTAL,{fill:CLR_NAVY,bold:true,txtColor:CLR_WHITE,width:1500}),
      cell('по 8 громадах (без Роздільнянської)',{fill:CLR_NAVY,bold:true,txtColor:CLR_WHITE,align:AlignmentType.LEFT,width:3926}),
    ]}),
  ]});

  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'3. ВИСНОВКИ ТА РЕКОМЕНДАЦІЇ',font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})],spacing:{before:0,after:120}}),
    h2('3.1 Загальна оцінка vs еталон'),verdictTable,empty(),
    h2('3.2 Вплив іШГБ на активізацію учнів'),
    para([tnr('Кількісний вимір:',{bold:true}),tnr(' У 8 громадах 24 419 учнів взяли участь у голосуванні, 636 стали авторами проєктів, 4 324 пройшли навчання. Визначено 53 переможці на загальну суму 715 000 грн, з яких 11 проєктів вже реалізовано на суму 189 900 грн.')]),
    para([tnr('Інклюзивний вимір:',{bold:true}),tnr(' До процесу залучено 1 182 дитини з ООП та інвалідністю в 8 громадах. Участь фахівців ІРЦ у Тернопільській та тьюторів у Фастівській і Великодимерській громадах забезпечила реальну інклюзію, а не формальне залучення.')]),
    para([tnr('Горизонтальний вимір:',{bold:true}),tnr(' іШГБ охопив учнів 80 шкіл у 8 різних громадах — від великих міст (Хмельницька, Тернопіль) до малих сільських рад (Коблівська), що демонструє масштабованість моделі.')]),
    para([tnr('Структурний вимір:',{bold:true}),tnr(' Новий Тренінг 4 «Користування результатами» у 5 громадах (8 презентацій) дозволив учням осмислити реальний вплив реалізованих проєктів на освітній процес і учнівські спільноти.')]),
    empty(),
    h2('3.3 Інклюзивна участь дітей з ООП та інвалідністю'),
    para([tnr('Таблиця 3. Кількість дітей з ООП та інвалідністю у процесі іШГБ 2026.',{bold:true,italic:true})],{align:AlignmentType.CENTER}),
    oopTable,empty(),
    h2('3.4 Сильні сторони та вузькі місця'),
    para([tnr('Сильні сторони:',{bold:true,color:TXT_GREEN})]),
    ...[
      'Надвисока активізація через голосування (1:38,39) — у 12,8 раза вище еталону.',
      'Якість відбору проєктів 95,91% — 5 громад досягли 100%.',
      'Залучення учнів (76,63%) перевищило еталон 72%.',
      '1 182 дитини з ООП та інвалідністю залучено до процесу.',
      'Тренінг 4 «Користування результатами» — новий ефективний формат завершення циклу.',
    ].map(t=>new Paragraph({numbering:{reference:'bs',level:0},alignment:AlignmentType.JUSTIFIED,spacing:{before:40,after:40},children:[tnr(t)]})),
    empty(),
    para([tnr('Вузькі місця:',{bold:true,color:TXT_RED})]),
    ...[
      'Охоплення шкіл (36,87%) — нижче еталону 50%, особливо Вінницька (5,56%) та Стрийська (10%).',
      'Конверсія навчених в авторів (14,71%) — вдвічі нижче еталону 26,2%.',
      'Значна дисперсія між громадами ускладнює уніфіковані висновки.',
      'Роздільнянська МТГ перенесла цикл — дані будуть доступні після вересня 2026.',
    ].map(t=>new Paragraph({numbering:{reference:'bw',level:0},alignment:AlignmentType.JUSTIFIED,spacing:{before:40,after:40},children:[tnr(t)]})),
    empty(),
    h2('3.5 Практичні рекомендації'),
    para([tnr('Для ОМС:',{bold:true,color:CLR_NAVY})]),
    ...[
      'Встановити внутрішній норматив охоплення шкіл 70%+ для циклу 2027 року.',
      'Роздільнянській МТГ — забезпечити ресурси для запуску у вересні 2026 року.',
    ].map(t=>new Paragraph({numbering:{reference:'r1',level:0},alignment:AlignmentType.JUSTIFIED,spacing:{before:40,after:40},children:[tnr(t)]})),
    empty(),
    para([tnr('Для координаторів:',{bold:true,color:CLR_NAVY})]),
    ...[
      'Посилити підтримку на етапі переходу від навчання до формування проєктних команд.',
      'Закріпити Тренінг 4 «Користування результатами» як стандартний елемент циклу.',
      'Масштабувати практику залучення ІРЦ та тьюторів для дітей з ООП.',
    ].map(t=>new Paragraph({numbering:{reference:'r2',level:0},alignment:AlignmentType.JUSTIFIED,spacing:{before:40,after:40},children:[tnr(t)]})),
  ];
}

// ── ПРИМІТКИ ──
function makeNotes(){
  return[new Paragraph({pageBreakBefore:true,children:[new TextRun({text:'ПРИМІТКИ',font:'Times New Roman',size:26,bold:true,color:CLR_NAVY,allCaps:true})],spacing:{before:0,after:120}}),
    h2('Коблівська сільська рада'),
    para([tnr('Коблівська СТГ завершила цикл іШГБ у скороченому форматі: проведено паперове голосування, визначено 3 переможці, розпочато реалізацію. Цифровий паспорт було остаточно сформовано 2 червня 2026 року. Дані Коблівської включено до зведених показників.')]),
    empty(),
    h2('Роздільнянська міська рада'),
    para([tnr('Роздільнянська МТГ офіційно перенесла запровадження іШГБ на 1 вересня 2026 року (розпорядження начальника відділу освіти від 30.04.2026 №98-ОД). Підготовчий етап виконано повністю: розроблено нормативну базу, сформовано цифровий паспорт, проведено навчання тренерів (13 учасників). Дані Роздільнянської не включено до зведених індикаторів.')]),
  ];
}

async function main(){
  const numbering={config:[
    {reference:'bs',levels:[{level:0,format:LevelFormat.BULLET,text:'•',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    {reference:'bw',levels:[{level:0,format:LevelFormat.BULLET,text:'•',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    {reference:'r1',levels:[{level:0,format:LevelFormat.BULLET,text:'–',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    {reference:'r2',levels:[{level:0,format:LevelFormat.BULLET,text:'–',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
  ]};

  const doc=new Document({numbering,sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1417}}},
    footers:{default:makeFooter()},
    children:[
      ...makeTitle(),...makeContents(),...makeIntro(),...makeSummary(),
      ...makeMatrix(),...makeCommunityAnalysis(),...makeInfographics(),
      ...makeConclusions(),...makeNotes(),
    ],
  }]});

  const buffer=await Packer.toBuffer(doc);
  fs.writeFileSync('/home/claude/analytic_report_v2_temp.docx',buffer);
  console.log('✓ analytic_report_v2_temp.docx');
}
main().catch(console.error);

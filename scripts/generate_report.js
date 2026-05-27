const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageNumberElement, PageBreak, Header, Footer,
  TabStopType, TabStopPosition,
} = require('docx');
const fs = require('fs');

// === DESIGN TOKENS (matching the PDF reference) ===
// Dark navy blue used for org name and document title on cover
const CLR_NAVY   = '1F3864';   // dark navy
const CLR_BLACK  = '000000';
const CLR_DARK   = '1A1A1A';
const CLR_WHITE  = 'FFFFFF';
// Table colours (keep functional colour-coding in tables)
const CLR_LB     = 'DEEAF1';
const CLR_PALE   = 'EBF3FB';
const CLR_GB     = 'E2EFDA';
const CLR_RB     = 'FCE4D6';
const CLR_YB     = 'FFF2CC';
const CLR_GREEN  = '375623';
const CLR_RED    = '833C00';
const CLR_ORANGE = '7F6000';

// Benchmark
const BENCH = { engagement:72, coverage:50, pct_authors:26.2, proj_per_100:10.24, quality:84.39, activation:3 };
const MAG = { trained:1050, authors:36, proj_dev:34, proj_voted:32, voters:1249, potential:1461, total_students:2235, schools:16 };
const VER = { trained:650,  authors:45, proj_dev:12, proj_voted:12, voters:689,  potential:904,  total_students:1350, schools:2  };
function calcR(d){ return {
  engagement:   ((d.authors+d.voters)/d.potential)*100,
  coverage:     (d.potential/d.total_students)*100,
  pct_authors:  (d.authors/d.trained)*100,
  proj_per_100: (d.proj_dev/d.potential)*100,
  quality:      (d.proj_voted/d.proj_dev)*100,
  activation:   d.voters/d.trained,
};}
const mR=calcR(MAG), vR=calcR(VER);
const totD={ trained:MAG.trained+VER.trained, authors:MAG.authors+VER.authors,
  proj_dev:MAG.proj_dev+VER.proj_dev, proj_voted:MAG.proj_voted+VER.proj_voted,
  voters:MAG.voters+VER.voters, potential:MAG.potential+VER.potential,
  total_students:MAG.total_students+VER.total_students, schools:MAG.schools+VER.schools };
const tR=calcR(totD);

// === HELPERS ===
const brd=(c='AAAAAA')=>({style:BorderStyle.SINGLE,size:4,color:c});
const cBrd=c=>({top:brd(c),bottom:brd(c),left:brd(c),right:brd(c)});

function mkC(text,w,fill=CLR_WHITE,bold=false,align=AlignmentType.CENTER,color=CLR_DARK,italic=false){
  return new TableCell({borders:cBrd('999999'),width:{size:w,type:WidthType.DXA},
    shading:{fill,type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:120,right:120},
    verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({alignment:align,children:[
      new TextRun({text:String(text),bold,size:18,font:'Times New Roman',color,italics:italic})
    ]})]});
}
function hC(text,w){
  return new TableCell({borders:cBrd('1F3864'),width:{size:w,type:WidthType.DXA},
    shading:{fill:CLR_NAVY,type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:120,right:120},
    verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({alignment:AlignmentType.CENTER,children:[
      new TextRun({text,bold:true,size:18,font:'Times New Roman',color:CLR_WHITE})
    ]})]});
}

// Paragraph helpers — body font: Times New Roman 12pt (24 half-points)
function p(runs,spacing={before:80,after:80},align=AlignmentType.JUSTIFIED){
  const ch=Array.isArray(runs)?runs:[new TextRun({text:runs,size:24,font:'Times New Roman',color:CLR_DARK})];
  return new Paragraph({alignment:align,spacing,children:ch});
}
function b(t,sz=24){return new TextRun({text:t,bold:true,size:sz,font:'Times New Roman',color:CLR_DARK});}
function n(t,sz=24){return new TextRun({text:t,size:sz,font:'Times New Roman',color:CLR_DARK});}
function itl(t,sz=20){return new TextRun({text:t,size:sz,font:'Times New Roman',color:'555555',italics:true});}
function cap(t,sz=24){return new TextRun({text:t,bold:true,size:sz,font:'Times New Roman',color:CLR_DARK,allCaps:true});}

// H1: bold + allCaps, black, left — matches PDF style
function h1(text){
  return new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:280,after:120},
    children:[new TextRun({text,bold:true,allCaps:true,size:26,font:'Times New Roman',color:CLR_DARK})]});
}
// H2: bold, not caps, black, left
function h2(text){
  return new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:200,after:80},
    children:[new TextRun({text,bold:true,size:24,font:'Times New Roman',color:CLR_DARK})]});
}
// H3: bold italic, not caps
function h3(text){
  return new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:140,after:60},
    children:[new TextRun({text,bold:true,italics:false,size:24,font:'Times New Roman',color:CLR_DARK})]});
}

function bullet(text){
  return new Paragraph({numbering:{reference:'bullets',level:0},spacing:{before:40,after:40},
    children:[new TextRun({text,size:24,font:'Times New Roman',color:CLR_DARK})]});
}
function pb(){return new Paragraph({children:[new PageBreak()]});}
function div(){return new Paragraph({spacing:{before:80,after:80},
  border:{bottom:{style:BorderStyle.SINGLE,size:4,color:'999999',space:1}},children:[]});}

// Compare cells
const fp=v=>v.toFixed(2)+'%', fn=v=>v.toFixed(2), fa=v=>'1 : '+v.toFixed(2);
function cmpC(val,bench,higher=true,w=1500,fmt=fp){
  const good=higher?val>=bench:val<=bench;
  return mkC((good?'▲ ':'▼ ')+fmt(val),w,good?CLR_GB:CLR_RB,true,AlignmentType.CENTER,good?CLR_GREEN:CLR_RED);
}
function benchC(val,w=1500,fmt=fp){return mkC(fmt(val),w,CLR_YB,true,AlignmentType.CENTER,CLR_ORANGE);}

// ===== INFOGRAPHIC TABLE (visual panel) =====
function infographicTable(){
  const TW=9500, cW=Math.floor(TW/3);
  function card(emoji,label,mag,ver,tot,bench,aboveBench){
    const borderColor = aboveBench ? '375623' : 'C55A11';
    const brdStyle = {style:BorderStyle.SINGLE,size:12,color:borderColor};
    return new TableCell({
      borders:{top:brdStyle,bottom:brdStyle,left:brdStyle,right:brdStyle},
      width:{size:cW,type:WidthType.DXA},
      shading:{fill:'F7FAFD',type:ShadingType.CLEAR},
      margins:{top:140,bottom:140,left:160,right:160},
      verticalAlign:VerticalAlign.TOP,
      children:[
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:60},
          children:[new TextRun({text:emoji+' '+label,bold:true,size:20,font:'Times New Roman',color:CLR_NAVY})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:20},
          children:[new TextRun({text:'Магдалинівська:  ',bold:true,size:18,font:'Times New Roman',color:CLR_DARK}),
                    new TextRun({text:mag,size:18,font:'Times New Roman',color:CLR_DARK})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:20},
          children:[new TextRun({text:'Верхівцівська:  ',bold:true,size:18,font:'Times New Roman',color:CLR_DARK}),
                    new TextRun({text:ver,size:18,font:'Times New Roman',color:CLR_DARK})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:30},
          children:[new TextRun({text:'РАЗОМ:  ',bold:true,size:18,font:'Times New Roman',color:CLR_NAVY}),
                    new TextRun({text:tot,bold:true,size:18,font:'Times New Roman',color:CLR_NAVY})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:0},
          border:{top:{style:BorderStyle.SINGLE,size:4,color:'CCCCCC',space:1}},
          children:[new TextRun({text:'Еталон: ',size:16,font:'Times New Roman',color:CLR_ORANGE}),
                    new TextRun({text:bench,bold:true,size:16,font:'Times New Roman',color:CLR_ORANGE}),
                    new TextRun({text:'  '+(aboveBench?'▲':'▼'),bold:true,size:16,font:'Times New Roman',color:aboveBench?CLR_GREEN:CLR_RED})]}),
      ]
    });
  }
  return new Table({
    width:{size:TW,type:WidthType.DXA}, columnWidths:[cW,cW,cW],
    rows:[
      new TableRow({children:[
        card('📊','1. Рівень залучення','87,95%','81,19%','85,37%','72%',true),
        card('🏫','2. Охоплення закладів','65,37%','66,96%','65,97%','50%',true),
        card('✍️','3. Частка авторів','3,43%','6,92%','4,76%','26,2%',false),
      ]}),
      new TableRow({children:[
        card('📁','4. Проєктів на 100 учнів','2,33','1,33','1,95','10,24',false),
        card('✅','5. Якість проєктів','94,12%','100,00%','95,65%','84,39%',true),
        card('🗳️','6. Активізація','1 : 1,19','1 : 1,06','1 : 1,14','1 : 3',false),
      ]}),
    ]
  });
}

// === MAIN COMPARISON TABLE ===
function mainTable(){
  const TW=9500, c0=2700,c1=1250,c2=1250,c3=1250,c4=1500,c5=1550;
  return new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[c0,c1,c2,c3,c4,c5],
    rows:[
      new TableRow({tableHeader:true,children:[hC('Індикатор',c0),hC('Магд.',c1),hC('Верхів.',c2),hC('Разом',c3),hC('Еталон',c4),hC('Оцінка',c5)]}),
      new TableRow({children:[mkC('1. Рівень залучення (%)',c0,CLR_PALE,false,AlignmentType.LEFT),mkC(fp(mR.engagement),c1,CLR_PALE,true),mkC(fp(vR.engagement),c2,CLR_PALE,true),mkC(fp(tR.engagement),c3,CLR_PALE,true),benchC(BENCH.engagement,c4,fp),cmpC(tR.engagement,BENCH.engagement,true,c5,fp)]}),
      new TableRow({children:[mkC('2. Охоплення (потенц./всього, %)',c0,'FFFFFF',false,AlignmentType.LEFT),mkC(fp(mR.coverage),c1,'FFFFFF',true),mkC(fp(vR.coverage),c2,'FFFFFF',true),mkC(fp(tR.coverage),c3,'FFFFFF',true),benchC(BENCH.coverage,c4,fp),cmpC(tR.coverage,BENCH.coverage,true,c5,fp)]}),
      new TableRow({children:[mkC('3. Частка авторів (% від навчених)',c0,CLR_PALE,false,AlignmentType.LEFT),mkC(fp(mR.pct_authors),c1,CLR_PALE,true),mkC(fp(vR.pct_authors),c2,CLR_PALE,true),mkC(fp(tR.pct_authors),c3,CLR_PALE,true),benchC(BENCH.pct_authors,c4,fp),cmpC(tR.pct_authors,BENCH.pct_authors,true,c5,fp)]}),
      new TableRow({children:[mkC('4. Проєктів на 100 учнів',c0,'FFFFFF',false,AlignmentType.LEFT),mkC(fn(mR.proj_per_100),c1,'FFFFFF',true),mkC(fn(vR.proj_per_100),c2,'FFFFFF',true),mkC(fn(tR.proj_per_100),c3,'FFFFFF',true),benchC(BENCH.proj_per_100,c4,fn),cmpC(tR.proj_per_100,BENCH.proj_per_100,true,c5,fn)]}),
      new TableRow({children:[mkC('5. Якість проєктів (%)',c0,CLR_PALE,false,AlignmentType.LEFT),mkC(fp(mR.quality),c1,CLR_PALE,true),mkC(fp(vR.quality),c2,CLR_PALE,true),mkC(fp(tR.quality),c3,CLR_PALE,true),benchC(BENCH.quality,c4,fp),cmpC(tR.quality,BENCH.quality,true,c5,fp)]}),
      new TableRow({children:[mkC('6. Активізація (1 навч : виборці)',c0,'FFFFFF',false,AlignmentType.LEFT),mkC(fa(mR.activation),c1,'FFFFFF',true),mkC(fa(vR.activation),c2,'FFFFFF',true),mkC(fa(tR.activation),c3,'FFFFFF',true),benchC(BENCH.activation,c4,fa),cmpC(tR.activation,BENCH.activation,true,c5,fa)]}),
    ]
  });
}

// === SCORE SUMMARY TABLE ===
function scoreTable(){
  const TW=9200,c0=3200,c1=1200,c2=1500,c3=1500,c4=1800;
  return new Table({width:{size:TW,type:WidthType.DXA},columnWidths:[c0,c1,c2,c3,c4],rows:[
    new TableRow({tableHeader:true,children:[hC('Індикатор',c0),hC('Проєкт',c1),hC('Еталон',c2),hC('Різниця',c3),hC('Статус',c4)]}),
    new TableRow({children:[mkC('1. Рівень залучення',c0,CLR_PALE,false,AlignmentType.LEFT),mkC('85,37%',c1,CLR_PALE,true),mkC('72,00%',c2,CLR_YB,false,AlignmentType.CENTER,CLR_ORANGE),mkC('+13,37 в.п.',c3,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN),mkC('▲ Перевищено',c4,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN)]}),
    new TableRow({children:[mkC('2. Охоплення',c0,'FFFFFF',false,AlignmentType.LEFT),mkC('65,97%',c1,'FFFFFF',true),mkC('50,00%',c2,CLR_YB,false,AlignmentType.CENTER,CLR_ORANGE),mkC('+15,97 в.п.',c3,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN),mkC('▲ Перевищено',c4,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN)]}),
    new TableRow({children:[mkC('3. Частка авторів',c0,CLR_PALE,false,AlignmentType.LEFT),mkC('4,76%',c1,CLR_PALE,true),mkC('26,20%',c2,CLR_YB,false,AlignmentType.CENTER,CLR_ORANGE),mkC('−21,44 в.п.',c3,CLR_RB,true,AlignmentType.CENTER,CLR_RED),mkC('▼ Нижче',c4,CLR_RB,true,AlignmentType.CENTER,CLR_RED)]}),
    new TableRow({children:[mkC('4. Проєктів на 100',c0,'FFFFFF',false,AlignmentType.LEFT),mkC('1,95',c1,'FFFFFF',true),mkC('10,24',c2,CLR_YB,false,AlignmentType.CENTER,CLR_ORANGE),mkC('−8,29',c3,CLR_RB,true,AlignmentType.CENTER,CLR_RED),mkC('▼ Нижче',c4,CLR_RB,true,AlignmentType.CENTER,CLR_RED)]}),
    new TableRow({children:[mkC('5. Якість проєктів',c0,CLR_PALE,false,AlignmentType.LEFT),mkC('95,65%',c1,CLR_PALE,true),mkC('84,39%',c2,CLR_YB,false,AlignmentType.CENTER,CLR_ORANGE),mkC('+11,26 в.п.',c3,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN),mkC('▲ Перевищено',c4,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN)]}),
    new TableRow({children:[mkC('6. Активізація',c0,'FFFFFF',false,AlignmentType.LEFT),mkC('1 : 1,14',c1,'FFFFFF',true),mkC('1 : 3',c2,CLR_YB,false,AlignmentType.CENTER,CLR_ORANGE),mkC('Розрив 2,63×',c3,CLR_RB,true,AlignmentType.CENTER,CLR_RED),mkC('▼ Нижче',c4,CLR_RB,true,AlignmentType.CENTER,CLR_RED)]}),
  ]});
}

// ====================================================
// FOOTER: page number in bottom-right box (matches PDF)
// ====================================================
const pageFooter = new Footer({children:[
  new Paragraph({
    alignment:AlignmentType.RIGHT,
    spacing:{before:40},
    border:{top:{style:BorderStyle.SINGLE,size:4,color:'999999',space:1}},
    children:[
      new TextRun({text:'  ',size:18,font:'Times New Roman'}),
      new PageNumberElement(),
      new TextRun({text:'  ',size:18,font:'Times New Roman'}),
    ]
  })
]});

// ====================================================
// DOCUMENT
// ====================================================
const doc = new Document({
  numbering:{config:[
    {reference:'bullets',levels:[{level:0,format:LevelFormat.BULLET,text:'\u2022',alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    {reference:'numbers',levels:[{level:0,format:LevelFormat.DECIMAL,text:'%1.',alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:720,hanging:360}}}}]},
  ]},
  styles:{
    default:{document:{run:{font:'Times New Roman',size:24,color:CLR_DARK}}},
    paragraphStyles:[
      {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,
        run:{size:26,bold:true,font:'Times New Roman',color:CLR_DARK,allCaps:true},
        paragraph:{spacing:{before:280,after:120},outlineLevel:0}},
      {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,
        run:{size:24,bold:true,font:'Times New Roman',color:CLR_DARK},
        paragraph:{spacing:{before:200,after:80},outlineLevel:1}},
      {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,
        run:{size:24,bold:true,font:'Times New Roman',color:CLR_DARK},
        paragraph:{spacing:{before:140,after:60},outlineLevel:2}},
    ],
  },
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1417}}},
    footers:{default:pageFooter},
    children:[

      // ============================================================
      // ТИТУЛЬНА СТОРІНКА — точно як у PDF-прикладі
      // ============================================================
      // Org name — bold CAPS, navy, top center
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:560,after:80},
        children:[new TextRun({text:'ГРОМАДСЬКА ОРГАНІЗАЦІЯ',bold:true,size:24,font:'Times New Roman',color:CLR_NAVY})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:600},
        children:[new TextRun({text:'«ФОРУМ РОЗВИТКУ ГРОМАДЯНСЬКОГО СУСПІЛЬСТВА»',bold:true,size:24,font:'Times New Roman',color:CLR_NAVY})]}),

      // Document type — large bold CAPS navy (the headline)
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:120},
        children:[new TextRun({text:'АНАЛІТИЧНИЙ ЗВІТ',bold:true,size:56,font:'Times New Roman',color:CLR_NAVY})]}),

      // Subtitle — bold, normal case, centered
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:60},
        children:[new TextRun({text:'за результатами моніторингу та оцінки',bold:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:60},
        children:[new TextRun({text:'впровадження моделі інклюзивного',bold:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:60},
        children:[new TextRun({text:'Шкільного Громадського Бюджету (іШГБ)',bold:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),

      // Project ref — italic, centered
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:60},
        children:[new TextRun({text:'в рамках проєкту «Інноваційні підходи до активізації жителів(ок) –',bold:true,italics:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:60},
        children:[new TextRun({text:'ключ до учасницького відновлення і розвитку двох громад',bold:true,italics:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:60},
        children:[new TextRun({text:'Дніпропетровщини» за фінансової підтримки',bold:true,italics:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:400},
        children:[new TextRun({text:'Міжнародного фонду «Відродження»',bold:true,italics:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),

      // Author
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:800},
        children:[new TextRun({text:'підготовлено _________________________________ (ПІБ)',bold:true,italics:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),

      // Year
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0},
        children:[new TextRun({text:'2026',bold:true,size:24,font:'Times New Roman',color:CLR_DARK})]}),

      pb(),

      // ============================================================
      // ЗМІСТ
      // ============================================================
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:200},
        children:[new TextRun({text:'ЗМІСТ',bold:true,allCaps:true,size:26,font:'Times New Roman',color:CLR_DARK})]}),
      p([b('0.  '), n('Вступ..........................................................................3')]),
      p([b('1.  '), n('Саммері моніторингу та оцінки......................................3')]),
      p([n('     1.1.  Методологічна рамка')]),
      p([n('     1.2.  Ключові тези та інсайти')]),
      p([b('2.  '), n('Результати впровадження: порівняльний аналіз громад....5')]),
      p([n('     2.1.  Порівняльна матриця 6 індикаторів')]),
      p([n('     2.2.  Детальний аналіз по кожній громаді')]),
      p([n('     2.3.  Інфографіка результатів іШГБ')]),
      p([b('3.  '), n('Висновки та рекомендації..............................................10')]),
      p([n('     3.1.  Загальна оцінка успішності vs еталон')]),
      p([n('     3.2.  Вплив іШГБ на активізацію учнів')]),
      p([n('     3.3.  Сильні сторони та вузькі місця')]),
      p([n('     3.4.  Практичні рекомендації')]),
      pb(),

      // ============================================================
      // 0. ВСТУП
      // ============================================================
      h1('0. Вступ'),
      p([n('Цей аналітичний звіт підготовлено в рамках проєкту '), b('G55810 «Інноваційні підходи до активізації жителів(ок) – ключ до учасницького відновлення і розвитку двох громад Дніпропетровщини»'), n(', який реалізується '), b('ГО «Форум розвитку громадянського суспільства»'), n(' в партнерстві із Верхівцівською МТГ, Магдалинівською СТГ та Чернеччинською СТГ за фінансової підтримки '), b('Міжнародного фонду «Відродження»'), n('. Проєкт реалізується впродовж 11 місяців (червень 2025 – квітень 2026 р.).')]),
      p([n('Звіт базується на '), b('зведеній моніторинговій таблиці індикаторів іШГБ 2026'), n(' (файл «Дані_іШГБ.xlsx»), що містить кількісні результати впровадження іШГБ у 18 закладах освіти двох громад. Додатковим джерелом слугував змістовний звіт проєкту G55810.')]),
      new Paragraph({spacing:{before:60,after:120},alignment:AlignmentType.JUSTIFIED,
        children:[itl('Примітка: звіт охоплює дані виключно в рамках компоненту іШГБ. Результати по Верхівцівській МТГ є частково незавершеними — на момент формування звіту переможці не визначені.')]}),
      pb(),

      // ============================================================
      // 1. САММЕРІ
      // ============================================================
      h1('1. Саммері моніторингу та оцінки'),
      h2('1.1. Методологічна рамка'),
      p([b('Мета МіО: '), n('оцінити ефективність та інклюзивність впровадження моделі іШГБ у Магдалинівській СТГ та Верхівцівській МТГ за результатами повного циклу 2025–2026 рр., а також порівняти досягнуті результати зі стандартними (еталонними) значеннями індикаторів.')]),
      p([b('Основні завдання:')]),
      bullet('Розрахувати 6 ключових кількісних індикаторів ефективності іШГБ у кожній громаді та зведено.'),
      bullet('Порівняти результати з еталонними значеннями по кожному індикатору.'),
      bullet('Провести порівняльний аналіз двох громад, виявити сильні сторони та вузькі місця.'),
      bullet('Сформулювати практичні рекомендації для ОМС, НУО та координаторів.'),
      p([b('Джерела даних:')]),
      bullet('Первинне: зведена таблиця індикаторів іШГБ 2026 (файл «Дані_іШГБ.xlsx»).'),
      bullet('Вторинне: змістовний звіт проєкту G55810 (червень 2025 – квітень 2026).'),
      bullet('Еталонні значення: стандартні показники по 6 індикаторах, надані замовником звіту.'),
      p([b('Методи: '), n('кількісний аналіз (розрахунок відносних і абсолютних показників), порівняльний аналіз з еталоном, міжгромадське порівняння.')]),

      h2('1.2. Ключові тези та інсайти'),
      p([b('Проєкт значно перевищив еталонні значення по 3 із 6 індикаторів:'), n(' рівень залучення (85,37% vs еталон 72%), охоплення (65,97% vs 50%) та якість проєктів (95,65% vs 84,39%).')]),
      p([b('Показники авторства, проєктної щільності та активізації — нижче еталону:'), n(' конверсія з навчених у авторів та розповсюдження участі на ширше коло однолітків потребують посилення.')]),
      p([b('Дві громади — дві моделі навчання:'), n(' Магдалинівська — «цільове навчання» команд-авторів (1 050 навчених, авторство 3,43%), Верхівцівська — «масове навчання» (650 навчених, авторство 6,92%).')]),
      p([b('Якість проєктів — найсильніший результат:'), n(' 95,65% проєктів пройшли відбір і вийшли на голосування, що на 11,26 в.п. перевищує еталон.')]),
      p([b('Активізація — найбільше вузьке місце:'), n(' 1:1,14 проти еталону 1:3. Пріоритет для вдосконалення у наступному циклі.')]),
      pb(),

      // ============================================================
      // 2. РЕЗУЛЬТАТИ
      // ============================================================
      h1('2. Результати впровадження: порівняльний аналіз громад'),
      h2('2.1. Порівняльна матриця 6 індикаторів'),
      p([itl('Таблиця 1. Зведені результати впровадження іШГБ 2026 з порівнянням з еталонними значеннями')]),

      // Legend
      (() => {
        const TW2=5200,cL=1400,cR=3800;
        return new Table({width:{size:TW2,type:WidthType.DXA},columnWidths:[cL,cR],rows:[
          new TableRow({children:[
            mkC('▲ Вище еталону',cL,CLR_GB,true,AlignmentType.CENTER,CLR_GREEN),
            mkC('Еталон (стандартний показник)',cR,CLR_YB,true,AlignmentType.CENTER,CLR_ORANGE),
          ]}),
          new TableRow({children:[
            mkC('▼ Нижче еталону',cL,CLR_RB,true,AlignmentType.CENTER,CLR_RED),
            mkC('Порівняння здійснюється з еталонними значеннями по кожному індикатору',cR,CLR_WHITE,false,AlignmentType.LEFT,'666666',true),
          ]}),
        ]});
      })(),
      new Paragraph({spacing:{before:80,after:80},children:[]}),
      mainTable(),
      new Paragraph({spacing:{before:60,after:160},
        children:[itl('Джерело: Дані_іШГБ.xlsx — Зведена таблиця індикаторів ШГБ 2026; власні розрахунки ГО ФРГС.')]}),

      h2('2.2. Детальний аналіз по кожній громаді'),
      h3('2.2.1. Магдалинівська СТГ (16 шкіл, 2 235 учнів, 1 461 потенційний учасник)'),

      p([b('Інд. 1 — Рівень залучення: 87,95% (▲ +15,95 в.п. до еталону 72%).')]),
      p([n('1 285 із 1 461 потенційних учасників долучились до іШГБ як автори або виборці. Перевищення еталону на 16 в.п. є результатом системної мотивації на всіх етапах циклу.')]),
      p([b('Інд. 2 — Охоплення: 65,37% (▲ +15,37 в.п. до еталону 50%).')]),
      p([n('Усі 16 шкіл (100%) охоплені іШГБ. Показник перевищує еталон — свідчить про ефективну координацію між ОМС та педагогічними колективами.')]),
      p([b('Інд. 3 — Частка авторів: 3,43% (▼ −22,77 в.п. до еталону 26,2%).')]),
      p([n('36 авторів із 1 050 навчених учнів. Суттєво нижче еталону. Модель масштабного просвітнього охоплення (1 050 навчених) передбачає, що більшість учасників отримують знання, тоді як авторами стає цільова група команд. Це пояснює низьку відсоткову конверсію.')]),
      p([b('Інд. 4 — Проєктів на 100 учнів: 2,33 (▼ −7,91 до еталону 10,24).')]),
      p([n('34 проєкти на 1 461 потенційного учасника. Пояснення аналогічне: широка база потенційних учасників при невеликій кількості авторів дає низьку проєктну щільність.')]),
      p([b('Інд. 5 — Якість: 94,12% (▲ +9,73 в.п. до еталону 84,39%).')]),
      p([n('32 з 34 проєктів пройшли відбір. 2 відхилено на етапі перевірки кошторисів — нормальна частина процесу. Рівень 94%+ свідчить про якісну менторську підтримку.')]),
      p([b('Інд. 6 — Активізація: 1:1,19 (▼ нижче еталону 1:3).')]),
      p([n('1 249 виборців при 1 050 навчених. Кожен навчений залучив в середньому 1,19 іншої особи. Попри масштаб голосування, показник нижчий за еталон — механізм мобілізації виборців потребує посилення.')]),

      h3('2.2.2. Верхівцівська МТГ (2 школи, 1 350 учнів, 904 потенційних учасники)'),
      p([b('Інд. 1 — Рівень залучення: 81,19% (▲ +9,19 в.п. до еталону 72%).')]),
      p([n('734 із 904 потенційних учасників долучились до іШГБ. Обидві школи (100%) взяли участь.')]),
      p([b('Інд. 2 — Охоплення: 66,96% (▲ +16,96 в.п. до еталону 50%).')]),
      p([n('904 із 1 350 учнів потенційно залучені. Найкращий показник охоплення серед двох громад.')]),
      p([b('Інд. 3 — Частка авторів: 6,92% (▼ −19,28 в.п. до еталону 26,2%).')]),
      p([n('45 авторів із 650 навчених. Вищий показник, ніж у Магдалинівській, але суттєво нижче еталону. Модель масового навчання закономірно знижує відсоток авторства.')]),
      p([b('Інд. 4 — Проєктів на 100 учнів: 1,33 (▼ −8,91 до еталону 10,24).')]),
      p([n('12 проєктів на 904 потенційних учасники — найнижча щільність по проєкту, що прямо пов\'язано з меншою кількістю авторів-команд.')]),
      p([b('Інд. 5 — Якість: 100,00% (▲ +15,61 в.п. до еталону 84,39%).')]),
      p([n('Всі 12 проєктів вийшли на голосування без жодного відхилення — ідеальний показник. Можливо, менша кількість проєктів дозволила приділити кожному більше уваги наставників.')]),
      p([b('Інд. 6 — Активізація: 1:1,06 (▼ нижче еталону 1:3).')]),
      p([n('689 виборців при 650 навчених — практично рівне співвідношення. Голосування фактично не вийшло за межі кола навчених учнів. Виборча кампанія та мобілізація виборців потребують принципового перегляду.')]),

      pb(),

      // ============================================================
      // 2.3 ІНФОГРАФІКА
      // ============================================================
      h2('2.3. Інфографіка результатів іШГБ 2026'),
      p([n('Нижче представлено «панель індикаторів» іШГБ 2026 — зведену інфографіку результатів по обох громадах. Кожна картка відображає значення для кожної громади, зведений підсумок та еталонне значення. Зелена рамка картки означає, що проєктний результат перевищує еталон; помаранчева — нижчий за еталон.')]),
      new Paragraph({spacing:{before:100,after:80},alignment:AlignmentType.CENTER,
        children:[new TextRun({text:'Панель індикаторів іШГБ 2026',bold:true,size:26,font:'Times New Roman',color:CLR_NAVY})]}),
      new Paragraph({spacing:{before:0,after:100},alignment:AlignmentType.CENTER,
        children:[new TextRun({text:'Магдалинівська СТГ  |  Верхівцівська МТГ  |  Зведено по проєкту',size:22,font:'Times New Roman',color:'555555',italics:true})]}),
      infographicTable(),
      p([itl('Примітка: ▲ — значення перевищує еталон; ▼ — значення нижче еталону. Зелена рамка — перевищення, помаранчева — відставання від стандартного показника.')],{before:60,after:160}),
      p([b('Рекомендовані типи діаграм для дизайнерського варіанту інфографіки:')]),
      bullet('Інд. 1–2 (Залучення, Охоплення): кільцева діаграма (Donut chart) — зовнішнє кільце Магдалинівська, внутрішнє Верхівцівська, у центрі — зведений результат.'),
      bullet('Інд. 3 (Авторство): воронкова діаграма (Funnel) — Навчено 1 700 → Авторів 81 → Проєктів на голосуванні 44.'),
      bullet('Інд. 4–5 (Щільність, Якість): кластерний стовпчиковий графік — розроблено vs вийшло на голосування по кожній громаді.'),
      bullet('Інд. 6 (Активізація): пропорційна (Bubble) діаграма — 1 навчений vs кількість залучених виборців + еталон 1:3.'),
      pb(),

      // ============================================================
      // 3. ВИСНОВКИ
      // ============================================================
      h1('3. Висновки та рекомендації'),
      h2('3.1. Загальна оцінка успішності впровадження іШГБ'),
      p([itl('Таблиця 2. Порівняння результатів проєкту з еталонними значеннями')]),
      scoreTable(),
      new Paragraph({spacing:{before:60,after:120},children:[itl('Джерело: власні розрахунки ГО ФРГС на основі Дані_іШГБ.xlsx.')]}),
      p([b('Загальний вердикт: впровадження іШГБ у проєкті оцінюється як УСПІШНЕ.'), n(' Зі стратегічно ключових показників — залучення учнів, охоплення шкіл та якість проєктів — проєкт перевищив стандарт по всіх трьох. Нижчий рівень авторства, проєктної щільності та активізації пояснюється принциповим вибором моделі масового навчання, де широке охоплення є пріоритетом над кількістю авторів. Ця модель обґрунтована для першого циклу і потребує поступового вдосконалення у наступних.')]),

      h2('3.2. Вплив іШГБ на активізацію учнів'),
      p([n('Впровадження іШГБ 2.0 у двох громадах справило значний, але диференційований вплив на активізацію учнівської спільноти.')]),
      p([b('Кількісний вимір:'), n(' загалом 1 938 учнів взяли участь у голосуванні, ще 81 учень став автором проєкту. Загальне число активно залучених до суспільно значимого рішення — 2 019 осіб (85,37% від потенційно можливого).')]),
      p([b('Горизонтальний вплив:'), n(' загальний показник 1:1,14 нижче еталону (1:3), але розрив між громадами вказує на значний потенціал. Відсутність виходу за межі навченої групи є системним обмеженням, що потребує вирішення.')]),
      p([b('Структурний вплив:'), n(' 81 учень пройшов повний цикл від ідеї до публічного захисту — критична маса «активних громадян» у кожній школі. Голосування охопило понад 1 900 учнів, які вперше зробили вибір щодо розвитку свого навчального закладу.')]),
      p([b('Інклюзивний вимір:'), n(' серед учасників — 68 дітей з ООП та 34 дитини з інвалідністю, що підтверджує реальну інклюзивність методології.')]),

      h2('3.3. Сильні сторони та вузькі місця'),
      p([b('Сильні сторони:')]),
      bullet('Надзвичайно високий рівень залучення (85,37%) та охоплення шкіл (100% у обох громадах).'),
      bullet('Висока якість проєктів (95,65%) — на 11,26 в.п. вище еталону — свідчить про зрілість методології.'),
      bullet('100% проєктів Верхівцівської МТГ пройшли відбір без відхилень.'),
      bullet('Реальне залучення 68 дітей з ООП та 34 дітей з інвалідністю.'),
      p([b('Вузькі місця:')]),
      bullet('Частка авторів (4,76%) — у 5,5 разів нижча за еталон (26,2%): конверсія навчених у авторів надто низька.'),
      bullet('Проєктна щільність (1,95 на 100 учнів) — у більш ніж 5 разів нижча за еталон (10,24).'),
      bullet('Активізація (1:1,14) значно нижча за еталон (1:3): голосування не виходить за межі навчених учнів.'),
      bullet('Незавершеність циклу у Верхівцівській МТГ знижує мотивацію для наступного циклу.'),

      h2('3.4. Практичні рекомендації'),
      p([b('Для ОМС обох громад:')]),
      bullet('Інституційно закріпити іШГБ як щорічний механізм. Виділяти бюджет для реалізації проєктів-переможців.'),
      bullet('Верхівцівська МТГ: пришвидшити фіналізацію результатів та публічно оголосити переможців.'),
      bullet('Запровадити публічний онлайн-реєстр проєктів іШГБ (результати голосування, статуси реалізації).'),
      p([b('Для координаторів і НУО:')]),
      bullet('Для підвищення частки авторів: запровадити «Проєктні тижні» після навчання, де кожна група розробляє концепцію проєкту.'),
      bullet('Для підвищення активізації: система учнівських «агентів впливу» — 2–3 навчених учні у класі, відповідальних за мобілізацію виборців.'),
      bullet('«День голосування» як шкільний захід із виставкою проєктів та QR-голосуванням.'),
      p([b('Для педагогічних команд:')]),
      bullet('Сертифіковані вчителі передають знання незалученим колегам — щонайменше 2 педагоги-наставники на заклад.'),
      bullet('Запровадити роль «учня-координатора іШГБ» з числа авторів-переможців для наступного циклу.'),
      p([b('Для МФВ та донорів:')]),
      bullet('Фінансувати «другий цикл» іШГБ — лише повторний цикл дозволить оцінити динаміку зростання слабких індикаторів.'),
      bullet('Тиражувати модель іШГБ 2.0 в інших громадах Дніпропетровщини через ГО ФРГС як ресурсний центр.'),

      div(),
      p([itl('Звіт підготовлено: травень 2026 р.  |  ГО «Форум розвитку громадянського суспільства»')],{before:120,after:60},AlignmentType.CENTER),
    ]
  }]
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync('/home/claude/Аналітичний_звіт_іШГБ_2026_v3.docx',buf);
  console.log('Done!');
}).catch(e=>{console.error(e);process.exit(1);});

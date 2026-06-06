// ============================================================
// graficos.js — Generadores SVG para Carta Natal y Matriz
// Glifos vectoriales (no dependen de fuentes). Lee dataset real.
// ============================================================

const SIGNOS = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];

const GP = {
  sun:`<circle r="7" fill="none" stroke="currentColor" stroke-width="1.3"/><circle r="1.4" fill="currentColor"/>`,
  moon:`<path d="M 2,-7.5 A 7.5,7.5 0 1 0 2,7.5 A 9.5,9.5 0 0 1 2,-7.5 Z" fill="currentColor"/>`,
  mercury:`<path d="M -3.5,-9 A 3.5,3.5 0 0 0 3.5,-9" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cy="-2" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="0" y1="1.5" x2="0" y2="8" stroke="currentColor" stroke-width="1.2"/><line x1="-3" y1="5" x2="3" y2="5" stroke="currentColor" stroke-width="1.2"/>`,
  venus:`<circle cy="-2.5" r="4.2" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="0" y1="1.7" x2="0" y2="9" stroke="currentColor" stroke-width="1.3"/><line x1="-3.2" y1="5.5" x2="3.2" y2="5.5" stroke="currentColor" stroke-width="1.3"/>`,
  mars:`<circle cx="-1.5" cy="2" r="4.5" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="1.7" y1="-1.2" x2="7" y2="-6.5" stroke="currentColor" stroke-width="1.3"/><path d="M 3.5,-6.5 L 7,-6.5 L 7,-3" fill="none" stroke="currentColor" stroke-width="1.3"/>`,
  jupiter:'<path d="M -6,-6 C -6,-9 -2,-9 -2,-6 C -2,-3 -5,-2 -6,1 L 1,1 M 4,-9 L 4,7 M -1,7 L 7,7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  saturn:`<line x1="-2" y1="-8" x2="-2" y2="2" stroke="currentColor" stroke-width="1.3"/><line x1="-5" y1="-5" x2="1" y2="-5" stroke="currentColor" stroke-width="1.3"/><path d="M -2,2 C -2,7 4,7 4,2 C 4,-1 1,-1 0,1" fill="none" stroke="currentColor" stroke-width="1.3"/>`,
  uranus:`<circle cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="0" y1="-8" x2="0" y2="4" stroke="currentColor" stroke-width="1.2"/><line x1="-5" y1="-6" x2="-5" y2="0" stroke="currentColor" stroke-width="1.2"/><line x1="5" y1="-6" x2="5" y2="0" stroke="currentColor" stroke-width="1.2"/><line x1="-5" y1="-3" x2="5" y2="-3" stroke="currentColor" stroke-width="1.2"/>`,
  neptune:`<path d="M 0,-2 L 0,8 M -4,9 L 4,9" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M -6,-6 C -6,0 -3,1 0,1 C 3,1 6,0 6,-6" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="-6" y1="-8" x2="-6" y2="-4" stroke="currentColor" stroke-width="1.2"/><line x1="6" y1="-8" x2="6" y2="-4" stroke="currentColor" stroke-width="1.2"/>`,
  pluto:`<path d="M -5,8 L -5,-6 C -5,-8 5,-8 5,-4 C 5,0 -5,0 -5,-2" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="-5" y1="8" x2="3" y2="8" stroke="currentColor" stroke-width="1.2"/>`,
};

const GS = {
  Aries:`<path d="M -6,4 C -6,-4 -3,-6 0,-6 C 3,-6 6,-4 6,4 M 0,-6 L 0,5" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  Tauro:`<circle cy="2.5" r="5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M -7,-6 C -5,-2 -2,-2.5 0,-2.5 C 2,-2.5 5,-2 7,-6" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  'Géminis':`<path d="M -5,-7 C -2,-5 2,-5 5,-7 M -5,7 C -2,5 2,5 5,7 M -3,-6 L -3,6 M 3,-6 L 3,6" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  'Cáncer':`<path d="M -7,-1 C -7,-4 -4,-5 -2,-4 M -7,-1 C -7,2 -4,2 -3,0" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="-4" cy="-1" r="1.6" fill="currentColor"/><path d="M 7,1 C 7,4 4,5 2,4 M 7,1 C 7,-2 4,-2 3,0" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="4" cy="1" r="1.6" fill="currentColor"/>`,
  Leo:`<circle cx="-3" cy="3" r="3.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M -0.2,4 C 2,2 1,-4 -2,-5 C -6,-6 -7,-1 -5,1 M 0,4 C 3,6 6,3 5,0" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  Virgo:`<path d="M -7,-5 L -7,5 M -7,-4 C -6,-6 -4,-6 -3,-4 L -3,5 M -3,-4 C -2,-6 0,-6 1,-4 L 1,5 C 1,8 4,8 5,5 M 4,2 C 6,3 6,7 3,8" fill="none" stroke="currentColor" stroke-width="1.1"/>`,
  Libra:`<path d="M -7,7 L 7,7 M -7,2 L 7,2 M -5,2 C -5,-4 5,-4 5,2" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  Escorpio:`<path d="M -7,-5 L -7,5 M -7,-4 C -6,-6 -4,-6 -3,-4 L -3,5 M -3,-4 C -2,-6 0,-6 1,-4 L 1,7 L 5,7 M 1,5 L 5,5 L 5,9 M 5,9 L 8,6 M 5,9 L 8,9" fill="none" stroke="currentColor" stroke-width="1.1"/>`,
  Sagitario:`<path d="M -6,7 L 6,-5 M 1,-5 L 6,-5 L 6,0 M -2,1 L 3,6" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  Capricornio:`<path d="M -6,-5 L -2,5 M -6,-5 C -3,-7 0,-5 0,-1 L 0,3 C 0,7 4,7 5,4 C 6,1 3,0 2,2 C 1,4 3,5 4,4" fill="none" stroke="currentColor" stroke-width="1.1"/>`,
  Acuario:`<path d="M -7,-2 L -4,-4 L -1,-2 L 2,-4 L 5,-2 L 7,-3.5 M -7,3 L -4,1 L -1,3 L 2,1 L 5,3 L 7,1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  Piscis:`<path d="M -6,-6 C -3,-3 -3,3 -6,6 M 6,-6 C 3,-3 3,3 6,6 M -6,0 L 6,0" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
};

const GOLD='#C8B89A', INK='#1A1A1A', MIST='#8a8478';
const ARCANA={1:'El Mago',2:'La Sacerdotisa',3:'La Emperatriz',4:'El Emperador',5:'El Hierofante',6:'Los Amantes',7:'El Carro',8:'La Justicia',9:'El Ermitaño',10:'La Rueda',11:'La Fuerza',12:'El Colgado',13:'La Muerte',14:'La Templanza',15:'El Diablo',16:'La Torre',17:'La Estrella',18:'La Luna',19:'El Sol',20:'El Juicio',21:'El Mundo',22:'El Loco'};
const absLon = (sign, deg) => SIGNOS.indexOf(sign)*30 + (deg||0);
const PLANET_ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

function generarCartaNatal(astro){
  const p = astro.planets || {};
  const asc = astro.ascendant || {sign:'Aries',degrees:0};
  const mc = astro.midheaven || {sign:'Cáncer',degrees:0};
  const NOMBRE={sun:'Sol',moon:'Luna',mercury:'Mercurio',venus:'Venus',mars:'Marte',jupiter:'Júpiter',saturn:'Saturno',uranus:'Urano',neptune:'Neptuno',pluto:'Plutón'};
  const ascAbs=absLon(asc.sign,asc.degrees), mcAbs=absLon(mc.sign,mc.degrees);
  const planets=PLANET_ORDER.filter(k=>p[k]).map(k=>({k,abs:absLon(p[k].sign,p[k].degrees),deg:p[k].degrees,sign:p[k].sign}));
  const W=900,H=620,CX=450,CY=310,R_OUT=250,R_SIGN=215,R_HOUSE=190,R_PLANET=165,R_ASPECT=155;
  const ang=a=>(180-(a-ascAbs))*Math.PI/180;
  const pt=(a,r)=>[CX+r*Math.cos(ang(a)),CY-r*Math.sin(ang(a))];
  let s='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" font-family="Georgia,serif"><rect width="'+W+'" height="'+H+'" fill="white"/>';
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R_OUT+'" fill="none" stroke="'+GOLD+'" stroke-width="1.1"/>';
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R_SIGN+'" fill="none" stroke="'+GOLD+'" stroke-width="0.6"/>';
  s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R_ASPECT+'" fill="none" stroke="'+MIST+'" stroke-width="0.35" stroke-dasharray="2 3"/>';
  for(let i=0;i<12;i++){const a1=pt(i*30,R_OUT),a2=pt(i*30,R_SIGN);s+='<line x1="'+a1[0].toFixed(1)+'" y1="'+a1[1].toFixed(1)+'" x2="'+a2[0].toFixed(1)+'" y2="'+a2[1].toFixed(1)+'" stroke="'+GOLD+'" stroke-width="0.5"/>';const g=pt(i*30+15,(R_SIGN+R_OUT)/2);s+='<g transform="translate('+g[0].toFixed(1)+','+g[1].toFixed(1)+') scale(0.75)" color="'+GOLD+'">'+GS[SIGNOS[i]]+'</g>';}
  const ascStart=SIGNOS.indexOf(asc.sign)*30;
  for(let h=0;h<12;h++){const a=ascStart+h*30;const c1=pt(a,R_SIGN),c2=pt(a,R_ASPECT);s+='<line x1="'+c1[0].toFixed(1)+'" y1="'+c1[1].toFixed(1)+'" x2="'+c2[0].toFixed(1)+'" y2="'+c2[1].toFixed(1)+'" stroke="'+MIST+'" stroke-width="0.4"/>';const n=pt(a+15,R_HOUSE-13);s+='<text x="'+n[0].toFixed(1)+'" y="'+(n[1]+3).toFixed(1)+'" font-size="8" fill="'+MIST+'" text-anchor="middle">'+(h+1)+'</text>';}
  [[ascAbs,'ASC'],[mcAbs,'MC']].forEach(function(e){var a=e[0],lbl=e[1];const o1=pt(a,R_OUT),o2=pt(a+180,R_OUT);s+='<line x1="'+o1[0].toFixed(1)+'" y1="'+o1[1].toFixed(1)+'" x2="'+o2[0].toFixed(1)+'" y2="'+o2[1].toFixed(1)+'" stroke="'+INK+'" stroke-width="0.9"/>';s+='<text x="'+o1[0].toFixed(1)+'" y="'+o1[1].toFixed(1)+'" font-size="9" fill="'+INK+'" text-anchor="middle" dy="-3">'+lbl+'</text>';});
  const asps=[{a:0,o:6,c:GOLD},{a:180,o:6,c:'#b06a5a'},{a:120,o:5,c:'#6a8a6a'},{a:90,o:5,c:'#b06a5a'},{a:60,o:4,c:'#6a8a6a'}];
  for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){let d=Math.abs(planets[i].abs-planets[j].abs);if(d>180)d=360-d;for(const A of asps)if(Math.abs(d-A.a)<=A.o){const q1=pt(planets[i].abs,R_ASPECT),q2=pt(planets[j].abs,R_ASPECT);s+='<line x1="'+q1[0].toFixed(1)+'" y1="'+q1[1].toFixed(1)+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="'+A.c+'" stroke-width="0.6" opacity="0.5"/>';break;}}
  const sorted=[...planets].sort((a,b)=>a.abs-b.abs);
  let lastA=-99,off=0;const labels=[];
  sorted.forEach(function(pl){if(pl.abs-lastA<9)off+=15;else off=0;lastA=pl.abs;const pp=pt(pl.abs,R_PLANET-off);s+='<g transform="translate('+pp[0].toFixed(1)+','+pp[1].toFixed(1)+') scale(0.8)" color="'+INK+'">'+GP[pl.k]+'</g>';const bb=pt(pl.abs,R_OUT);labels.push({side:bb[0]<CX?'L':'R',y:bb[1],glyphX:pp[0],glyphY:pp[1],k:pl.k,sign:pl.sign});});
  ['L','R'].forEach(function(side){
    const arr=labels.filter(l=>l.side===side).sort((a,b)=>a.y-b.y);
    const minGap=27;
    for(let i=1;i<arr.length;i++){if(arr[i].y-arr[i-1].y<minGap)arr[i].y=arr[i-1].y+minGap;}
    arr.forEach(function(l){
      if(side==='L'){
        const lineStart=165;const elbowX=Math.min(l.glyphX-12,lineStart+35);
        s+='<polyline points="'+l.glyphX.toFixed(1)+','+l.glyphY.toFixed(1)+' '+elbowX.toFixed(1)+','+l.y.toFixed(1)+' '+lineStart.toFixed(1)+','+l.y.toFixed(1)+'" fill="none" stroke="'+MIST+'" stroke-width="0.4" opacity="0.5"/>';
        s+='<g transform="translate(16,'+l.y.toFixed(1)+') scale(0.85)" color="'+INK+'">'+GP[l.k]+'</g>';
        s+='<text x="30" y="'+l.y.toFixed(1)+'" font-size="11" fill="'+INK+'" text-anchor="start" dy="3.5">'+NOMBRE[l.k]+' · '+l.sign+'</text>';
      } else {
        const lineStart=W-165;const elbowX=Math.max(l.glyphX+12,lineStart-35);
        s+='<polyline points="'+l.glyphX.toFixed(1)+','+l.glyphY.toFixed(1)+' '+elbowX.toFixed(1)+','+l.y.toFixed(1)+' '+lineStart.toFixed(1)+','+l.y.toFixed(1)+'" fill="none" stroke="'+MIST+'" stroke-width="0.4" opacity="0.5"/>';
        s+='<g transform="translate('+(W-16)+','+l.y.toFixed(1)+') scale(0.85)" color="'+INK+'">'+GP[l.k]+'</g>';
        s+='<text x="'+(W-30)+'" y="'+l.y.toFixed(1)+'" font-size="11" fill="'+INK+'" text-anchor="end" dy="3.5">'+NOMBRE[l.k]+' · '+l.sign+'</text>';
      }
    });
  });
  s+='</svg>';
  return '<div class="carta-rueda-full">'+s+'</div>';
}

// ── Estrella de 8 puntas ──────────────────────────────────────────────────────
function star8Path(cx, cy, r1, r2) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const aO = (i*45 - 90) * Math.PI/180;
    const aI = ((i*45+22.5) - 90) * Math.PI/180;
    d += (i===0?'M':'L') + (cx+r1*Math.cos(aO)).toFixed(2)+','+(cy+r1*Math.sin(aO)).toFixed(2)+
         ' L'+(cx+r2*Math.cos(aI)).toFixed(2)+','+(cy+r2*Math.sin(aI)).toFixed(2)+' ';
  }
  return d+'Z';
}

function generarMatriz(matriz) {
  const dia  = matriz.raw?.dia  ?? 1;
  const mes  = matriz.raw?.mes  ?? 1;
  const anio = matriz.raw?.anio ?? 2000;

  const red = n => { let x=n; while(x>22){x=(x%10)+Math.floor(x/10);} return x===0?22:x; };

  // ── Cardinales y centro ───────────────────────────────────────────────────
  const A = red(dia);
  const B = red(mes);
  const C = red([...String(anio)].reduce((a,d)=>a+ +d, 0));
  const D = red(A+B+C);
  const E = red(A+B+C+D);

  // ── Esquinas ──────────────────────────────────────────────────────────────
  const F  = red(A+B);
  const Gv = red(B+C);
  const Hv = red(C+D);
  const Iv = red(D+A);

  // ── Mid-radios (3 niveles) — verificado vs 2 casos reales ─────────────────
  // n1 cerca del cardinal, n2 medio, n3 cerca del centro
  const cardMid = card => {
    const n2 = red(card+E);
    const n1 = red(card+n2);
    const n3 = red(n2+E);
    return { n1, n2, n3 };
  };

  // ── Mids diagonales (esquina → centro) — verificado vs 2 casos reales ─────
  // Reproduce destiny-matrix.online en Priscilla y Raquel (8/8 puntos).
  //   Xdiag       = red(A+B+C+D+E)              (factor de la carta)
  //   cercaCentro = red(esquina + Xdiag)
  //   cercaEsquina= red(esquina + cercaCentro)  (relación ya conocida)
  const Xdiag = red(A+B+C+D+E);
  const diagMid = corner => {
    const cercaCentro  = red(corner + Xdiag);
    const cercaEsquina = red(corner + cercaCentro);
    return { cercaEsquina, cercaCentro };
  };

  // ── Canales de dinero y amor (Ladini Paso 3) — verificado vs 2 casos ──────
  const K1 = red(E+D);      // canal karma, sobre eje BASE (abajo)
  const F1 = red(E+C);      // canal finanzas, sobre eje AÑO (derecha)
  const M  = red(K1+F1);    // punto de unión (sobre diagonal inf-der, cerca centro)
  const dineroPt = red(M+F1);  // número junto al $
  const amorPt   = red(M+K1);  // número junto al ♥

  // ── Talento oculto ────────────────────────────────────────────────────────
  const talOculto = red(A+E);

  // ── Cronología perimetral (bisección recursiva Ladini) — verificada ───────
  function segmento(p1, p2, prof=3) {
    if (prof===0) return [p1];
    const mid = red(p1+p2);
    return [...segmento(p1,mid,prof-1), ...segmento(mid,p2,prof-1)];
  }
  const periSegs = [
    { p1:A, a1:180, p2:F,  a2:225 },
    { p1:F, a1:225, p2:B,  a2:270 },
    { p1:B, a1:270, p2:Gv, a2:315 },
    { p1:Gv,a1:315, p2:C,  a2:0   },
    { p1:C, a1:0,   p2:Hv, a2:45  },
    { p1:Hv,a1:45,  p2:D,  a2:90  },
    { p1:D, a1:90,  p2:Iv, a2:135 },
    { p1:Iv,a1:135, p2:A,  a2:180 },
  ];

  const MONEY='#6b8f5e', LOVE='#9e6070', GEN1='#b06878', GEN2='#7a6a9a';

  // ── Canvas y radios ───────────────────────────────────────────────────────
  const W=1100, SH=1100, CX=550, CY=550;
  const Rc=190;   // cardinales (estrellas)
  const Ro=162;   // octógono / esquinas
  const Re=162;
  const Rp=275;   // anillo perimetral (cronología)

  // Radios de los círculos de serie
  const rStar=30, rN1=15, rN2=13, rN3=11, rCorner=17;
  // Posiciones radiales PEGADAS (cardinal → centro): círculos tocándose
  const posN1 = Rc - rStar - rN1;       // 145
  const posN2 = posN1 - rN1 - rN2;      // 117
  const posN3 = posN2 - rN2 - rN3;      // 93

  // Para esquinas: serie pegada desde esquina (Re) hacia centro
  const posC1 = Re - rCorner - rN1;     // primer mid diagonal (cerca esquina)
  const posC2 = posC1 - rN1 - rN2;      // segundo mid diagonal (cerca centro)

  const pt = (ang, r) => [
    CX + r*Math.cos(ang*Math.PI/180),
    CY + r*Math.sin(ang*Math.PI/180)
  ];

  const mkArrow = (x1,y1,x2,y2,col) => {
    const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
    const nx=dx/len, ny=dy/len;
    const ax=x2-nx*16, ay=y2-ny*16, px=-ny*5, py=nx*5;
    return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+
           '" stroke="'+col+'" stroke-width="1.3" opacity="0.8"/>' +
           '<polygon points="'+x2.toFixed(1)+','+y2.toFixed(1)+
           ' '+(ax+px).toFixed(1)+','+(ay+py).toFixed(1)+
           ' '+(ax-px).toFixed(1)+','+(ay-py).toFixed(1)+'" fill="'+col+'" opacity="0.8"/>';
  };

  const lbl = (x, y, lines, anchor) => {
    const ta = anchor||'middle';
    return lines.map((line,i)=>
      '<text x="'+x.toFixed(1)+'" y="'+(y+i*13).toFixed(1)+
      '" font-size="8" fill="'+MIST+'" text-anchor="'+ta+
      '" letter-spacing="0.6" font-family="Georgia,serif">'+line+'</text>'
    ).join('');
  };

  const circle = (x,y,r,val,strokeCol,fontSize,txtCol) => (
    '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" fill="white" stroke="'+strokeCol+'" stroke-width="0.9"/>'+
    '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" font-size="'+fontSize+'" fill="'+txtCol+'" text-anchor="middle" dominant-baseline="middle">'+val+'</text>'
  );

  let s = '<svg viewBox="0 0 '+W+' '+SH+'" xmlns="http://www.w3.org/2000/svg" font-family="Georgia,serif">'+
          '<rect width="'+W+'" height="'+SH+'" fill="white"/>';

  // ── Octógono exterior ─────────────────────────────────────────────────────
  const octoPts = [270,315,0,45,90,135,180,225].map(a=>pt(a,Ro));
  s += '<polygon points="'+octoPts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')+
       '" fill="none" stroke="'+GOLD+'" stroke-width="1.3"/>';

  // Cuadrado cardinales
  s += '<polygon points="'+[270,0,90,180].map(a=>{const[x,y]=pt(a,Rc);return x.toFixed(1)+','+y.toFixed(1);}).join(' ')+
       '" fill="none" stroke="'+GOLD+'" stroke-width="0.7" opacity="0.35"/>';
  // Cuadrado esquinas
  s += '<polygon points="'+[315,45,135,225].map(a=>{const[x,y]=pt(a,Re);return x.toFixed(1)+','+y.toFixed(1);}).join(' ')+
       '" fill="none" stroke="'+GOLD+'" stroke-width="0.7" opacity="0.35"/>';

  // Radios internos centro→cardinal
  for (const ang of [0,90,180,270]) {
    const [x,y] = pt(ang,Rc);
    s += '<line x1="'+CX+'" y1="'+CY+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+
         '" stroke="'+MIST+'" stroke-width="0.5" opacity="0.2"/>';
  }

  // ── Líneas dinero (vertical) y amor (horizontal) ──────────────────────────
  const [mX,mY]=pt(270,Rc), [bX,bY]=pt(90,Rc);
  s += '<line x1="'+mX.toFixed(1)+'" y1="'+mY.toFixed(1)+'" x2="'+bX.toFixed(1)+'" y2="'+bY.toFixed(1)+
       '" stroke="'+MONEY+'" stroke-width="1.5" opacity="0.5"/>';
  const [dX,dY]=pt(180,Rc), [aX,aY]=pt(0,Rc);
  s += '<line x1="'+dX.toFixed(1)+'" y1="'+dY.toFixed(1)+'" x2="'+aX.toFixed(1)+'" y2="'+aY.toFixed(1)+
       '" stroke="'+LOVE+'" stroke-width="1.5" opacity="0.5"/>';

  // ── Diagonal punteada de dinero/amor (esquina inf-izq I → esquina inf-der H, pasa por centro) ──
  const [diagX1,diagY1]=pt(135,Re), [diagX2,diagY2]=pt(45,Re);
  s += '<line x1="'+diagX1.toFixed(1)+'" y1="'+diagY1.toFixed(1)+'" x2="'+diagX2.toFixed(1)+'" y2="'+diagY2.toFixed(1)+
       '" stroke="'+MIST+'" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6"/>';

  // ── Líneas de generación DESDE EL CENTRO (4 brazos → cerca-centro) ─────────
  // Masculina (morada): sup-izq ↔ inf-der.  Femenina (rosa): sup-der ↔ inf-izq.
  for (const ang of [225,45])  { const [x,y]=pt(ang,posC2); s += mkArrow(CX,CY,x,y,GEN2); }
  for (const ang of [315,135]) { const [x,y]=pt(ang,posC2); s += mkArrow(CX,CY,x,y,GEN1); }

  // ── Mid-radios cardinales — PEGADOS en serie ──────────────────────────────
  // El estándar oficial dibuja n3 (círculo más interno) SOLO en DÍA (izq) y
  // MES (arriba). En AÑO (der) y BASE (abajo) ese tramo lo ocupan los puntos
  // de propósito y los canales dinero/amor, así que ahí no se dibuja n3.
  for (const {ang,card,n3} of [
    {ang:180, card:A, n3:true},   // DÍA  (izquierda)
    {ang:270, card:B, n3:true},   // MES  (arriba)
    {ang:0,   card:C, n3:false},  // AÑO  (derecha)
    {ang:90,  card:D, n3:false},  // BASE (abajo)
  ]) {
    const m = cardMid(card);
    const [x1,y1]=pt(ang,posN1), [x2,y2]=pt(ang,posN2);
    s += circle(x1,y1,rN1,m.n1,MIST,12,INK);
    s += circle(x2,y2,rN2,m.n2,MIST,11,INK);
    if (n3) { const [x3,y3]=pt(ang,posN3); s += circle(x3,y3,rN3,m.n3,MIST,9,MIST); }
  }

  // ── Puntos de propósito junto al centro, lado AÑO (derecha) ────────────────
  // Pegados al arcano central (tocando el círculo 8), igual que la serie cardinal.
  // ⚠️ VERIFICAR valores (Priscilla 7,15) con un 2º gráfico oficial.
  const propCentro = Xdiag;        // 7 en Priscilla
  const propMedio  = red(B + D);   // 15 en Priscilla
  { const [x,y]=pt(0,40); s += circle(x,y,rN2,propCentro,MIST,11,INK); }  // toca al 8
  { const [x,y]=pt(0,66); s += circle(x,y,rN2,propMedio, MIST,11,INK); }  // toca al 7

  // ── Mid-radios diagonales (esquinas) — PEGADOS en serie hacia centro ──────
  // 2 círculos por diagonal: cerca-esquina y cerca-centro (fórmula diagMid).
  for (const [ang,corner] of [[225,F],[315,Gv],[135,Iv]]) {
    const d = diagMid(corner);
    const [x1,y1]=pt(ang,posC1), [x2,y2]=pt(ang,posC2);
    s += circle(x1,y1,rN1,d.cercaEsquina,MIST,12,INK);
    s += circle(x2,y2,rN2,d.cercaCentro,MIST,11,INK);
  }
  // Esquina inf-der (H, 45°): cerca-esquina + cerca-centro.
  {
    const d = diagMid(Hv);
    const [x1,y1]=pt(45,posC1), [x2,y2]=pt(45,posC2);
    s += circle(x1,y1,rN1,d.cercaEsquina,MIST,12,INK);
    s += circle(x2,y2,rN2,d.cercaCentro,MIST,11,INK);
  }

  // ── Canales dinero/amor — zona inf-der, DENTRO del cuadrante interior ───────
  // Diagonal punteada: n2_BASE(90°,117) → amorPt(6) → M(21) → dineroPt(3) → n2_AÑO(0°,117)
  // M en el midpoint geométrico de la diagonal punteada (ang 45°, r≈75).
  // dineroPt(3) entre M y n2_AÑO: ang≈18°, en espacio libre LEJOS del 17.
  // amorPt(6) entre n2_BASE y M: ang≈72°.
  const [mPx,mPy] = pt(45, 75);
  s += circle(mPx,mPy,rN3,M,MIST,9,INK);

  const [dpX,dpY] = pt(18, 93);   // dineroPt — entre M y n2_AÑO, lejos del 17
  s += circle(dpX,dpY,rN3,dineroPt,MIST,9,INK);

  const [amX,amY] = pt(72, 93);   // amorPt — entre n2_BASE y M
  s += circle(amX,amY,rN3,amorPt,MIST,9,INK);

  // $ flota sobre la diagonal punteada (espacio libre arriba-derecha).
  // ♥ flota bajo/izquierda de la diagonal (espacio libre izquierda).
  // Ambos dentro del cuadrante interior, no en el eje horizontal.
  { const [x,y]=pt(26,78);
    s += '<text x="'+x.toFixed(1)+'" y="'+(y+5).toFixed(1)+
         '" font-size="16" fill="'+MONEY+'" font-weight="bold" text-anchor="middle">$</text>'; }
  { const [x,y]=pt(68,70);
    s += '<text x="'+x.toFixed(1)+'" y="'+(y+5).toFixed(1)+
         '" font-size="14" fill="'+LOVE+'" text-anchor="middle">&#9829;</text>'; }


  // ── Esquinas ──────────────────────────────────────────────────────────────
  for (const [ang,n,arcano] of [
    [225,F,ARCANA[F]], [315,Gv,ARCANA[Gv]], [45,Hv,ARCANA[Hv]], [135,Iv,ARCANA[Iv]]
  ]) {
    const [x,y] = pt(ang,Re);
    s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+
         '" r="'+rCorner+'" fill="white" stroke="'+GOLD+'" stroke-width="1.1"/>';
    s += '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+
         '" font-size="13" fill="'+INK+'" text-anchor="middle" dominant-baseline="middle">'+n+'</text>';
    const [lx,ly] = pt(ang,Re+30);
    s += '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+
         '" font-size="7" fill="'+MIST+'" text-anchor="middle">'+arcano+'</text>';
  }

  // ── Cardinales — estrella de 8 puntas ─────────────────────────────────────
  for (const [ang,n,lTxt,arcano,ageLbl] of [
    [180,A,'DÍA',  ARCANA[A], '0'],
    [270,B,'MES',  ARCANA[B], '20'],
    [0,  C,'AÑO',  ARCANA[C], '40'],
    [90, D,'BASE', ARCANA[D], '60'],
  ]) {
    const [x,y] = pt(ang,Rc);
    s += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rStar+'" fill="white"/>';
    s += '<path d="'+star8Path(x,y,rStar,19)+'" fill="white" stroke="'+GOLD+'" stroke-width="1.6"/>';
    s += '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+
         '" font-size="19" fill="'+INK+'" text-anchor="middle" dominant-baseline="middle">'+n+'</text>';
    const [lx,ly] = pt(ang, Rc+56);
    s += '<text x="'+lx.toFixed(1)+'" y="'+(ly-5).toFixed(1)+
         '" font-size="8.5" fill="'+MIST+'" text-anchor="middle" letter-spacing="1.5">'+lTxt+'</text>';
    s += '<text x="'+lx.toFixed(1)+'" y="'+(ly+9).toFixed(1)+
         '" font-size="10" fill="'+INK+'" text-anchor="middle" font-style="italic">'+arcano+'</text>';
    const [axp,ayp] = pt(ang, Rp+16);
    s += '<text x="'+axp.toFixed(1)+'" y="'+ayp.toFixed(1)+
         '" font-size="8" fill="'+MIST+'" text-anchor="middle" font-weight="bold" opacity="0.7">'+ageLbl+'</text>';
  }

  // ── Edades en esquinas (radio perimetral) ─────────────────────────────────
  for (const [ang,age] of [[225,10],[315,30],[45,50],[135,70]]) {
    const [axp,ayp] = pt(ang, Rp+16);
    s += '<text x="'+axp.toFixed(1)+'" y="'+ayp.toFixed(1)+
         '" font-size="8" fill="'+MIST+'" text-anchor="middle" font-weight="bold" opacity="0.7">'+age+'</text>';
  }

  // ── Cronología perimetral ─────────────────────────────────────────────────
  // Cada segmento abarca 10 años. Los 7 círculos intermedios (i=1..7) se ubican
  // a i×1.25 años del inicio del segmento. Patrón de rango verificado contra
  // el oficial (Priscilla 2 segmentos): i=1[+1,+2.5] i=2[+2.5,+3.5]
  // i=3[+3.5,+4] i=4=major i=5[+6,+7.5] i=6[+7.5,+8.5] i=7[+8.5,+9]
  const RANGE_OFF = [
    [1, 2.5], [2.5, 3.5], [3.5, 4],  // i=1,2,3
    null,                              // i=4 → major mark
    [6, 7.5], [7.5, 8.5], [8.5, 9],  // i=5,6,7
  ];
  const fmtAge = n => Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
  const Rage = Rp + 16;
  const Rlbl = Rp + 26;   // radio para etiquetas de rango (fuera del círculo)
  for (let segIdx = 0; segIdx < periSegs.length; segIdx++) {
    const seg = periSegs[segIdx];
    const ageBase = segIdx * 10;
    const pts = segmento(seg.p1, seg.p2, 3);
    let da = seg.a2 - seg.a1;
    if (da < 0) da += 360;
    for (let i = 1; i < 8; i++) {
      const ang = seg.a1 + da*(i/8);
      const val = pts[i];
      const [px,py] = pt(ang, Rp);
      s += '<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+
           '" r="7" fill="white" stroke="'+MIST+'" stroke-width="0.8"/>';
      s += '<text x="'+px.toFixed(1)+'" y="'+py.toFixed(1)+
           '" font-size="8.5" fill="'+INK+'" text-anchor="middle" dominant-baseline="middle">'+val+'</text>';
      const age = ageBase + i*1.25;
      if (Math.abs(age % 5) < 0.01) {
        // marca de 5 años
        const [ax,ay] = pt(ang, Rage);
        s += '<text x="'+ax.toFixed(1)+'" y="'+ay.toFixed(1)+
             '" font-size="6.5" fill="'+MIST+'" text-anchor="middle" dominant-baseline="middle"'+
             ' font-weight="bold" opacity="0.7">'+age+' years old</text>';
      } else {
        // etiqueta de rango para los otros 6 círculos por segmento
        const off = RANGE_OFF[i-1];
        if (off) {
          const lbl = fmtAge(ageBase + off[0]) + '-' + fmtAge(ageBase + off[1]);
          const [lx,ly] = pt(ang, Rlbl);
          s += '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+
               '" font-size="5.5" fill="'+MIST+'" text-anchor="middle" dominant-baseline="middle"'+
               ' opacity="0.75">'+lbl+'</text>';
        }
      }
    }
  }

  // ── Centro ────────────────────────────────────────────────────────────────
  s += '<circle cx="'+CX+'" cy="'+CY+'" r="27" fill="white" stroke="'+INK+'" stroke-width="1.8"/>';
  s += '<text x="'+CX+'" y="'+CY+'" font-size="22" fill="'+INK+'" text-anchor="middle" dominant-baseline="middle">'+E+'</text>';
  s += '<text x="'+CX+'" y="'+(CY+38)+'" font-size="7" fill="'+MIST+'" text-anchor="middle" letter-spacing="1.2">EJE DE PROPÓSITO</text>';
  s += '<text x="'+CX+'" y="'+(CY+49)+'" font-size="9" fill="'+INK+'" text-anchor="middle" font-style="italic">'+ARCANA[E]+'</text>';

  // ── Labels semánticos exteriores ──────────────────────────────────────────
  const Rsem = Rp + 55;
  s += lbl(CX, CY-Rc-130, ['TALENTO OCULTO', ARCANA[talOculto]+' · '+talOculto], 'middle');
  s += lbl(CX, CY+Rc+118, ['PAREJA IDEAL'], 'middle');
  {const [lx,ly]=pt(180,Rsem); s+=lbl(lx,ly-32,['DESEOS','DEL ALMA'],'middle');}
  {const [lx,ly]=pt(0,Rsem);   s+=lbl(lx,ly-32,['VÍNCULO CON','EL DINERO'],'middle');}
  {const [lx,ly]=pt(225,Rsem); s+=lbl(lx,ly-6,['TALENTOS','PATERNOS'],'middle');}
  {const [lx,ly]=pt(315,Rsem); s+=lbl(lx,ly-6,['TALENTOS','MATERNOS'],'middle');}
  {const [lx,ly]=pt(135,Rsem); s+=lbl(lx,ly-6,['DEUDAS KÁRMICAS','MATERNAS'],'middle');}
  {const [lx,ly]=pt(45,Rsem);  s+=lbl(lx,ly-6,['DEUDAS KÁRMICAS','PATERNAS'],'middle');}

  s += '</svg>';
  return s;
}

module.exports = { generarCartaNatal, generarMatriz };

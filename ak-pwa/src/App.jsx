import React, { useState, useMemo, useEffect } from "react";

// Remembers the reader's place on this device. Wrapped so a browser that
// blocks storage (e.g. private mode) falls back to defaults instead of crashing.
const SAVE_KEY = "ak-companion-progress";
function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v.part === "number" && typeof v.chap === "number") return v;
  } catch (e) { /* storage unavailable — use defaults */ }
  return null;
}

// Anna Karenina companion data — verified against the uploaded Maude
// translation (Dover/Inscribe ed.). Every fact carries a `reveal` tag =
// Part*1000 + Chapter, so the spoiler gate hides anything past the reader's
// bookmark. Chapter placements were checked against the source text.
// NOTE: this Maude edition anglicises some names — Stephen Arkadyevich
// (not Stepan), Alexis Alexandrovich Karenin (not Alexei).

const rc = (part, ch) => part * 1000 + ch;
const PARTS = [34, 35, 32, 23, 33, 32, 31, 19];

// ---- THREADS (the two parallel storylines + connective tissue) ----------
const THREADS = {
  affair: { label: "Anna & Vronsky" },
  levin:  { label: "Levin & Kitty" },
  moscow: { label: "The Oblonskys" },
};

// ---- LOCATIONS ----------------------------------------------------------
const LOCATIONS = {
  petersburg: { name: "Petersburg", note: "Court, career, and cold propriety. Karenin's world; where the affair is judged." },
  moscow:     { name: "Moscow", note: "Family, courtship, warmth and muddle. The Oblonskys and Shcherbatskys." },
  pokrovsk:   { name: "Pokrovskoe", note: "Levin's country estate. Land, labour, and the search for meaning." },
  vozdvizh:   { name: "Vozdvizhensk", note: "Vronsky's estate, where he and Anna build a life that society won't accept." },
  spa:        { name: "German spa (Soden)", note: "Where Kitty convalesces and learns to value herself." },
  italy:      { name: "Italy", note: "Anna and Vronsky's idyll abroad — beautiful, aimless, temporary." },
};

// ---- CHARACTERS ---------------------------------------------------------
// home = primary location id. lastSeen entries let the app remind the reader
// where a character was last significant, up to their bookmark.
const CHARACTERS = [
  { id:"anna", mono:"AK", full:"Anna Arkadyevna Karenina", nicks:["Anna","Anna Arkadyevna"], maiden:"Oblonskaya",
    seen:rc(1,18), thread:"affair", home:"petersburg",
    bios:[
      {reveal:rc(1,18), text:"Stephen's sister, arriving from Petersburg to reconcile him with Dolly. Poised, warm, magnetic — everyone is drawn to her."},
      {reveal:rc(1,18), text:"On the platform she meets Count Vronsky; a guard is killed under a train. 'A bad omen,' she says."},
      {reveal:rc(2,11), text:"Has begun an affair with Vronsky, while still living with Karenin and her adored son Seryozha."},
      {reveal:rc(4,17), text:"Pregnant by Vronsky; nearly dies in childbirth and begs Karenin's forgiveness, which he unexpectedly gives."},
      {reveal:rc(5,33), text:"Living openly with Vronsky after travel in Italy; cut by the society that once adored her."},
      {reveal:rc(7,31), text:"Isolated, jealous, and despairing, she goes to the railway — where her story began."},
    ],
    lastSeen:[
      {reveal:rc(1,18), where:"On the train from Petersburg, meeting Vronsky"},
      {reveal:rc(1,28), where:"Returning to Petersburg and her son"},
      {reveal:rc(2,11), where:"In Petersburg, the affair begun"},
      {reveal:rc(4,17), where:"At her sickbed, reconciled with Karenin"},
      {reveal:rc(5,33), text:"", where:"Back in Russia, snubbed at the opera"},
      {reveal:rc(7,31), where:"At the railway station"},
    ]},
  { id:"stiva", mono:"SO", full:"Prince Stephen Arkadyevich Oblonsky", nicks:["Stiva","Oblonsky","Stephen Arkadyevich"],
    seen:rc(1,1), thread:"moscow", home:"moscow",
    bios:[
      {reveal:rc(1,1), text:"Good-natured Moscow official whose affair with the former governess has just been found out by his wife, Dolly."},
      {reveal:rc(1,5), text:"Anna's brother. Genial, popular, always short of money and incapable of self-denial."},
    ],
    lastSeen:[{reveal:rc(1,5),where:"At his office, greeting Levin"},{reveal:rc(1,11),where:"Dining with Levin"}]},
  { id:"dolly", mono:"DO", full:"Princess Darya Alexandrovna Oblonskaya", nicks:["Dolly","Darya Alexandrovna"], maiden:"Shcherbatskaya",
    seen:rc(1,4), thread:"moscow", home:"moscow",
    bios:[
      {reveal:rc(1,4), text:"Stephen's wife, worn down by children and housework, devastated by his infidelity."},
      {reveal:rc(1,19), text:"Kitty's eldest sister. Anna persuades her to forgive Stephen for the family's sake."},
      {reveal:rc(6,16), text:"Visits Anna at Vronsky's estate and sees, beneath the luxury, how precarious Anna's position is."},
    ],
    lastSeen:[{reveal:rc(1,19),where:"At home, reconciled with Stephen"},{reveal:rc(3,7),where:"Summering near Levin's estate"}]},
  { id:"kitty", mono:"KS", full:"Princess Ekaterina Alexandrovna Shcherbatskaya", nicks:["Kitty","Ekaterina Alexandrovna","Katya"], maiden:"Shcherbatskaya",
    seen:rc(1,9), thread:"levin", home:"moscow",
    bios:[
      {reveal:rc(1,9), text:"Dolly's youngest sister, eighteen, in her first season. Both Levin and Vronsky pay court to her."},
      {reveal:rc(1,23), text:"Refuses Levin, expecting Vronsky — who then drops her for Anna at the ball. Humiliated, she falls ill."},
      {reveal:rc(2,32), text:"Recovering at a German spa; through Varenka she begins to see her own worth apart from being chosen."},
      {reveal:rc(4,13), text:"Reunited with Levin; they spell out their feelings in chalk initials and are engaged."},
      {reveal:rc(7,14), text:"A mother now, settled with Levin in the country."},
    ],
    lastSeen:[{reveal:rc(1,23),where:"At the ball, watching Vronsky choose Anna"},{reveal:rc(2,32),where:"At the German spa with Varenka"},{reveal:rc(4,13),where:"Engaged to Levin in Moscow"}]},
  { id:"levin", mono:"KL", full:"Konstantin Dmitrich Levin", nicks:["Levin","Kostya","Konstantin Dmitrich"],
    seen:rc(1,5), thread:"levin", home:"pokrovsk",
    bios:[
      {reveal:rc(1,5), text:"Stephen's friend, a landowner who farms his own estate and distrusts city society. In love with Kitty."},
      {reveal:rc(1,13), text:"Proposes to Kitty and is refused. Retreats, wounded, to his estate."},
      {reveal:rc(3,4), text:"Finds meaning in physical work, mowing all day alongside his peasants."},
      {reveal:rc(4,13), text:"Reunited with Kitty and engaged, scarcely believing his happiness."},
      {reveal:rc(8,19), text:"After much doubt, arrives at a quiet faith — that a life lived for goodness needs no further proof."},
    ],
    lastSeen:[{reveal:rc(1,13),where:"Refused, leaving Moscow for the country"},{reveal:rc(3,4),where:"Mowing in the fields at Pokrovskoe"},{reveal:rc(3,12),where:"Glimpsing Kitty's carriage on the road"},{reveal:rc(4,13),where:"Engaged, in Moscow"}]},
  { id:"vronsky", mono:"AV", full:"Count Alexis Kirillovich Vronsky", nicks:["Vronsky","Alexis Kirillovich"],
    seen:rc(1,14), thread:"affair", home:"petersburg",
    bios:[
      {reveal:rc(1,14), text:"Wealthy, handsome cavalry officer paying court to Kitty — without serious intent."},
      {reveal:rc(1,18), text:"Meets Anna at the station and is captivated; he abandons Kitty and follows Anna to Petersburg."},
      {reveal:rc(2,21), text:"In the officers' race his mare Frou-Frou falls and breaks her back; he reads it as an omen of ruin."},
      {reveal:rc(4,18), text:"After Karenin's forgiveness, humiliated and despairing, he attempts suicide and survives."},
      {reveal:rc(5,33), text:"Has thrown over his career for Anna; they live together, increasingly strained by her insecurity."},
    ],
    lastSeen:[{reveal:rc(1,18),where:"At the station, struck by Anna"},{reveal:rc(2,21),where:"At the races, Frou-Frou's fall"},{reveal:rc(4,18),where:"Recovering from his suicide attempt"}]},
  { id:"karenin", mono:"AA", full:"Alexis Alexandrovich Karenin", nicks:["Karenin","Alexis Alexandrovich"],
    seen:rc(1,30), thread:"affair", home:"petersburg",
    bios:[
      {reveal:rc(1,30), text:"Anna's husband, a senior Petersburg statesman — rational, ambitious, emotionally remote."},
      {reveal:rc(2,9), text:"Suspects the affair but dreads scandal more than betrayal; demands only outward propriety."},
      {reveal:rc(4,17), text:"At Anna's sickbed he forgives her and Vronsky completely, astonishing himself."},
      {reveal:rc(5,24), text:"Hardened again after the reconciliation fails; he keeps their son and refuses divorce."},
    ],
    lastSeen:[{reveal:rc(1,33),where:"Receiving Anna home in Petersburg"},{reveal:rc(2,9),where:"Confronting Anna about appearances"},{reveal:rc(4,17),where:"At Anna's sickbed, forgiving"}]},
  { id:"seryozha", mono:"SK", full:"Sergei Alexeyevich Karenin", nicks:["Seryozha","Sergei"],
    seen:rc(1,28), thread:"affair", home:"petersburg",
    bios:[
      {reveal:rc(1,28), text:"Anna and Karenin's young son. Her love for him is the great counterweight to her love for Vronsky."},
      {reveal:rc(5,30), text:"Anna visits him secretly on his birthday — a brief, wrenching reunion."},
    ],
    lastSeen:[{reveal:rc(1,28),where:"Welcoming his mother home"},{reveal:rc(5,30),where:"His birthday, the secret visit"}]},
  { id:"nikolai", mono:"NL", full:"Nikolai Dmitrich Levin", nicks:["Nikolai","Nikolai Levin"],
    seen:rc(1,24), thread:"levin", home:"moscow",
    bios:[
      {reveal:rc(1,24), text:"Levin's elder brother — once gifted, now ill and poor, his radical ideals curdled."},
      {reveal:rc(5,20), text:"Dies in a shabby provincial inn, with Levin and Kitty at his side."},
    ],
    lastSeen:[{reveal:rc(1,24),where:"In Moscow, estranged and ailing"},{reveal:rc(5,20),where:"On his deathbed in the country"}]},
  { id:"koznyshev", mono:"KZ", full:"Sergei Ivanich Koznyshev", nicks:["Koznyshev","Sergei Ivanich"],
    seen:rc(1,7), thread:"levin", home:"moscow",
    bios:[
      {reveal:rc(1,7), text:"Levin's celebrated half-brother, a writer who lives in the world of ideas Levin mistrusts."},
      {reveal:rc(6,5), text:"Fails to propose to Varenka when the moment comes — a quiet study in over-thought feeling."},
    ],
    lastSeen:[{reveal:rc(1,7),where:"In Moscow, the intellectual"},{reveal:rc(6,5),where:"Mushroom-picking with Varenka"}]},
  { id:"varenka", mono:"Vk", full:"Varenka", nicks:["Varenka","Mademoiselle Varenka"],
    seen:rc(2,30), thread:"levin", home:"spa",
    bios:[{reveal:rc(2,30), text:"A selfless young woman Kitty befriends at the spa; a model of living for others."}],
    lastSeen:[{reveal:rc(2,30),where:"At the German spa"},{reveal:rc(6,5),where:"At Pokrovskoe, courted by Koznyshev"}]},
  { id:"countess_vronskaya", mono:"CV", full:"Countess Vronskaya", nicks:["Countess Vronskaya"],
    seen:rc(1,18), thread:"affair", home:"petersburg",
    bios:[{reveal:rc(1,18), text:"Vronsky's mother, who shares Anna's compartment and approves her son's flirtations — until they turn serious."}],
    lastSeen:[{reveal:rc(1,18),where:"On the train with Anna"}]},
  { id:"betsy", mono:"BT", full:"Princess Elizaveta Tverskaya", nicks:["Betsy","Princess Tverskaya"],
    seen:rc(2,4), thread:"affair", home:"petersburg",
    bios:[{reveal:rc(2,4), text:"Vronsky's cousin and a leader of fashionable Petersburg; her drawing-room shelters the lovers' meetings."}],
    lastSeen:[{reveal:rc(2,4),where:"In her Petersburg salon"}]},
  { id:"old_shch", mono:"Sh", full:"Prince & Princess Shcherbatsky", nicks:["the Shcherbatskys","Prince Shcherbatsky"],
    seen:rc(1,12), thread:"levin", home:"moscow",
    bios:[{reveal:rc(1,12), text:"Kitty and Dolly's parents. The Prince favours Levin; the Princess hoped for the more brilliant Vronsky."}],
    lastSeen:[{reveal:rc(1,12),where:"At home in Moscow"},{reveal:rc(2,30),where:"At the spa with Kitty"}]},
];

// ---- RELATIONSHIPS ------------------------------------------------------
const RELATIONS = [
  {a:"stiva",b:"dolly",kind:"marriage",label:"married",reveal:rc(1,1)},
  {a:"stiva",b:"anna",kind:"sibling",label:"brother & sister",reveal:rc(1,5)},
  {a:"stiva",b:"levin",kind:"friend",label:"old friends",reveal:rc(1,5)},
  {a:"dolly",b:"kitty",kind:"sibling",label:"sisters",reveal:rc(1,9)},
  {a:"dolly",b:"old_shch",kind:"family",label:"daughter",reveal:rc(1,12)},
  {a:"kitty",b:"old_shch",kind:"family",label:"daughter",reveal:rc(1,12)},
  {a:"levin",b:"kitty",kind:"courtship",label:"proposes, refused",reveal:rc(1,13)},
  {a:"levin",b:"kitty",kind:"marriage",label:"engaged",reveal:rc(4,13)},
  {a:"vronsky",b:"kitty",kind:"courtship",label:"courts, then drops",reveal:rc(1,14)},
  {a:"levin",b:"koznyshev",kind:"sibling",label:"half-brothers",reveal:rc(1,7)},
  {a:"levin",b:"nikolai",kind:"sibling",label:"brothers",reveal:rc(1,24)},
  {a:"vronsky",b:"countess_vronskaya",kind:"family",label:"mother & son",reveal:rc(1,18)},
  {a:"anna",b:"seryozha",kind:"family",label:"mother & son",reveal:rc(1,28)},
  {a:"anna",b:"karenin",kind:"marriage",label:"married",reveal:rc(1,30)},
  {a:"karenin",b:"seryozha",kind:"family",label:"father & son",reveal:rc(1,30)},
  {a:"anna",b:"vronsky",kind:"affair",label:"lovers",reveal:rc(2,11)},
  {a:"vronsky",b:"betsy",kind:"family",label:"cousins",reveal:rc(2,4)},
  {a:"anna",b:"betsy",kind:"friend",label:"society friends",reveal:rc(2,4)},
  {a:"kitty",b:"varenka",kind:"friend",label:"spa friendship",reveal:rc(2,30)},
  {a:"koznyshev",b:"varenka",kind:"courtship",label:"near-courtship",reveal:rc(6,5)},
];

// ---- NAME DECODER -------------------------------------------------------
const ALIASES = (() => {
  const m={};
  for(const c of CHARACTERS){
    m[c.full.toLowerCase()]=c.id;
    for(const n of c.nicks) m[n.toLowerCase()]=c.id;
    if(c.maiden) m[c.maiden.toLowerCase()]=c.id;
  }
  return m;
})();

// ---- TIMELINE (parallel threads, beat per row) --------------------------
// thread: affair | levin | moscow. reveal gates each beat.
const TIMELINE = [
  {reveal:rc(1,1),  thread:"moscow", part:1, ch:1,  text:"Stephen's affair is discovered; the Oblonsky house is in turmoil."},
  {reveal:rc(1,13), thread:"levin",  part:1, ch:13, text:"Levin proposes to Kitty and is refused."},
  {reveal:rc(1,18), thread:"affair", part:1, ch:18, text:"Anna and Vronsky meet at the station; a guard is killed — 'a bad omen.'"},
  {reveal:rc(1,23), thread:"affair", part:1, ch:23, text:"At the ball, Vronsky chooses Anna; Kitty is crushed."},
  {reveal:rc(2,11), thread:"affair", part:2, ch:11, text:"Anna and Vronsky become lovers."},
  {reveal:rc(2,21), thread:"affair", part:2, ch:21, text:"Frou-Frou falls at the race; Anna's reaction betrays her to Karenin."},
  {reveal:rc(2,32), thread:"levin",  part:2, ch:32, text:"Kitty, at the German spa, befriends Varenka and begins to heal."},
  {reveal:rc(3,4),  thread:"levin",  part:3, ch:4,  text:"Levin mows with his peasants and feels briefly whole."},
  {reveal:rc(3,12), thread:"levin",  part:3, ch:12, text:"Levin glimpses Kitty in a passing carriage; his love revives."},
  {reveal:rc(4,13), thread:"levin",  part:4, ch:13, text:"Levin and Kitty, spelling words in chalk, become engaged."},
  {reveal:rc(4,17), thread:"affair", part:4, ch:17, text:"Anna nearly dies in childbirth; Karenin forgives her and Vronsky."},
  {reveal:rc(4,18), thread:"affair", part:4, ch:18, text:"Vronsky, humiliated, attempts suicide and survives."},
  {reveal:rc(5,20), thread:"levin",  part:5, ch:20, text:"Nikolai dies with Levin and Kitty beside him; Kitty learns she's pregnant."},
  {reveal:rc(5,30), thread:"affair", part:5, ch:30, text:"Anna secretly visits Seryozha on his birthday."},
  {reveal:rc(5,33), thread:"affair", part:5, ch:33, text:"Snubbed at the opera, Anna feels society close against her."},
  {reveal:rc(6,16), thread:"affair", part:6, ch:16, text:"Dolly visits Anna and Vronsky's estate and senses the strain beneath the comfort."},
  {reveal:rc(7,14), thread:"levin",  part:7, ch:14, text:"Kitty gives birth; Levin is overwhelmed."},
  {reveal:rc(7,31), thread:"affair", part:7, ch:31, text:"In despair, Anna goes to the railway."},
  {reveal:rc(8,19), thread:"levin",  part:8, ch:19, text:"Levin reaches a quiet faith and a kind of peace."},
];

// ---- MOTIFS (tap one to see prior appearances up to bookmark) -----------
const MOTIFS = [
  {id:"trains", name:"The railway", note:"Trains frame Anna's story from first meeting to last.",
   beats:[
     {reveal:rc(1,18), text:"Anna and Vronsky meet at the station; a guard is crushed. 'A bad omen.'"},
     {reveal:rc(1,30), text:"Anna and Vronsky speak in the night at a snowbound station on the way home."},
     {reveal:rc(7,31), text:"Anna returns to the railway in her final despair."},
   ]},
  {id:"scythe", name:"The scythe / mowing", note:"Physical labour as Levin's path to meaning.",
   beats:[
     {reveal:rc(3,4), text:"Levin mows a full day with his peasants and loses himself in the rhythm of the work."},
   ]},
  {id:"race", name:"The horse race", note:"Vronsky's ambition and the cost of his recklessness.",
   beats:[
     {reveal:rc(2,21), text:"Vronsky mishandles Frou-Frou's jump; she breaks her back and is destroyed."},
   ]},
  {id:"faith", name:"Faith & meaning", note:"Levin's long question: how should one live?",
   beats:[
     {reveal:rc(3,4), text:"In the fields, work gives Levin a wordless sense of rightness."},
     {reveal:rc(8,19), text:"A peasant's offhand remark about living 'for the soul' crystallises Levin's faith."},
   ]},
  {id:"light", name:"Anna's candle / light", note:"A recurring image of her inner state.",
   beats:[
     {reveal:rc(7,31), text:"The light by which Anna has read her life flares up, then goes out for ever."},
   ]},
];

// ---- EXCERPTS (public-domain Maude; short, gated) -----------------------
const EXCERPTS = [
  {reveal:rc(1,1),  who:"Narrator", note:"Part 1, Ch. 1 — the opening",
   text:"All happy families resemble one another, each unhappy family is unhappy in its own way."},
  {reveal:rc(1,18), who:"Anna", note:"Part 1, Ch. 18 — at the station",
   text:"It is a bad omen."},
  {reveal:rc(4,13), who:"Narrator", note:"Part 4, Ch. 13 — the chalk initials",
   text:"She wrote the initial letters: w, y, a; i, c, n, b; d, y, m, t, o, n? — and he read her whole heart in them."},
  {reveal:rc(8,19), who:"Levin", note:"Part 8, Ch. 19 — the close",
   text:"My life now, my whole life, independently of anything that may happen to me, every moment of it, is no longer meaningless but has a positive meaning of goodness with which I have the power to invest it."},
];

// ---- GLOSSARY -----------------------------------------------------------
const GLOSSARY = [
  {term:"Patronymic", def:"The middle name formed from the father's: Arkadyevich = 'son of Arkady', Arkadyevna = 'daughter of Arkady'. It's why Anna and Stephen share 'Arkadyev-'."},
  {term:"Name-day", def:"The feast of the saint one is named for — celebrated like a second birthday."},
  {term:"Zemstvo", def:"Elected local council for rural self-government; Levin and Koznyshev argue over its worth."},
  {term:"Verst", def:"Old Russian distance unit, about 1.07 km."},
  {term:"Mir", def:"The peasant village commune that held and redistributed land in common — central to Levin's farming questions."},
  {term:"Mazurka", def:"The lively ballroom dance during which, at the Moscow ball, Vronsky's preference for Anna becomes plain to Kitty."},
];



// Palette — imperial Russian railway: lacquered carriage green, brass, night
// blue. Signal red is reserved strictly for the Anna/Vronsky affair thread.
const C = {
  night:"#10171c", panel:"#16212a", green:"#1f4034", greenLt:"#2e5a47",
  brass:"#c79a45", ink:"#e8e2d0", mute:"#8a9aa0", signal:"#c1352b", rail:"#5d6f73",
};
const THREAD = {
  affair:{dot:C.signal, label:"Anna & Vronsky"},
  levin: {dot:"#5b8c6e", label:"Levin & Kitty"},
  moscow:{dot:C.brass,  label:"The Oblonskys"},
};
// Portrait layout — designed for a phone screen (~390px wide).
// ViewBox is 620×920; on a 390px screen each SVG unit is ~0.63px,
// so R=28 nodes appear ~18px radius and 22px labels read cleanly.
const POS = {
  stiva:   [310, 110],
  dolly:   [160, 110],
  old_shch:[ 80, 230],
  kitty:   [160, 340],
  levin:   [130, 510],
  nikolai: [ 60, 660],
  koznyshev:[280, 660],
  varenka: [ 80, 420],
  anna:    [450, 220],
  karenin: [570, 100],
  seryozha:[580, 290],
  vronsky: [460, 430],
  countess_vronskaya:[370, 570],
  betsy:   [570, 480],
};
const EDGE = {
  marriage: {stroke:C.brass,  width:6,  dash:null,   double:true},
  affair:   {stroke:C.signal, width:5,  dash:"4 9",  double:false},
  sibling:  {stroke:C.rail,   width:5,  dash:null,   double:false},
  family:   {stroke:C.rail,   width:3,  dash:null,   double:false},
  friend:   {stroke:C.greenLt,width:3,  dash:"2 8",  double:false},
  courtship:{stroke:"#7d6f9c",width:4,  dash:"10 7", double:false},
};

const reveals = (m) => ({
  chars: CHARACTERS.filter(c => c.seen <= m),
  rels:  RELATIONS.filter(r => r.reveal <= m),
});
const latest = (arr, m) => {
  const a = arr.filter(x => x.reveal <= m);
  return a.length ? a[a.length-1] : null;
};

// ---- Relationship web (signature) ----------------------------------------
function Web({ marker, onPick, focus }) {
  const { chars } = reveals(marker);
  const present = new Set(chars.map(c => c.id));
  const rels = reveals(marker).rels.filter(r => present.has(r.a) && present.has(r.b));
  return (
    <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <svg viewBox="0 0 620 750" style={{width:"100%",height:"auto",display:"block"}}>
        {rels.map((r,i) => {
          const [x1,y1]=POS[r.a],[x2,y2]=POS[r.b], s=EDGE[r.kind];
          const lit = focus && (r.a===focus||r.b===focus);
          const op = focus && !lit ? 0.1 : 0.85;
          const ang=Math.atan2(y2-y1,x2-x1)+Math.PI/2, dx=Math.cos(ang)*4, dy=Math.sin(ang)*4;
          return (
            <g key={i} opacity={op}>
              {s.double ? (<>
                <line x1={x1+dx} y1={y1+dy} x2={x2+dx} y2={y2+dy} stroke={s.stroke} strokeWidth={2}/>
                <line x1={x1-dx} y1={y1-dy} x2={x2-dx} y2={y2-dy} stroke={s.stroke} strokeWidth={2}/>
              </>) : (
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={s.stroke} strokeWidth={s.width}
                      strokeDasharray={s.dash||undefined} strokeLinecap="round"/>
              )}
            </g>
          );
        })}
        {chars.map(c => {
          const [x,y]=POS[c.id], t=THREAD[c.thread]||THREAD.moscow, isF=focus===c.id;
          const dim = focus && !isF && !rels.some(r => (r.a===focus&&r.b===c.id)||(r.b===focus&&r.a===c.id));
          const r=isF?32:26;
          return (
            <g key={c.id} transform={`translate(${x},${y})`}
               style={{cursor:"pointer",opacity:dim?0.22:1,transition:"opacity .25s"}}
               onClick={()=>onPick(c.id)}>
              <circle r={r} fill={C.night} stroke={C.brass} strokeWidth={isF?3:2}/>
              <circle r={r-4} fill="none" stroke={t.dot} strokeWidth={isF?3.5:2.5}/>
              <text y={1} textAnchor="middle" dominantBaseline="middle" fill={t.dot}
                    fontSize={r-8} fontWeight={700} letterSpacing="1"
                    fontFamily="Georgia,'Times New Roman',serif">{c.mono}</text>
              <text y={-r-10} textAnchor="middle" fill={C.ink}
                    fontSize="18" fontWeight={isF?700:500}
                    fontFamily="Georgia,'Times New Roman',serif"
                    style={{paintOrder:"stroke",stroke:C.night,strokeWidth:5}}>
                {c.nicks[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Decoder({ marker }) {
  const [q,setQ]=useState("");
  const present=new Set(reveals(marker).chars.map(c=>c.id));
  const hit=q.trim()?ALIASES[q.trim().toLowerCase()]:null;
  const ch=hit&&present.has(hit)?CHARACTERS.find(c=>c.id===hit):null;
  const later=hit&&!present.has(hit);
  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Type any name — Stiva, Oblonsky, Kostya…"
        style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",background:C.night,border:`1px solid ${C.greenLt}`,color:C.ink,borderRadius:8,fontSize:15,fontFamily:"Georgia,'Times New Roman',serif"}}/>
      <div style={{marginTop:14,minHeight:60}}>
        {ch && (<div>
          <div style={{color:C.brass,fontSize:13,letterSpacing:1,textTransform:"uppercase"}}>This is</div>
          <div style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:22,margin:"2px 0 6px"}}>{ch.full}</div>
          <div style={{color:C.mute,fontSize:14}}>Also called: {ch.nicks.join(" · ")}{ch.maiden?` · née ${ch.maiden}`:""}</div>
        </div>)}
        {later && <div style={{color:C.mute,fontStyle:"italic"}}>You haven't met this character yet — keep reading.</div>}
        {q.trim()&&!hit && <div style={{color:C.mute,fontStyle:"italic"}}>No match. Try a surname or nickname.</div>}
      </div>
    </div>
  );
}

function Detail({ id, marker, onClose, onPick }) {
  const c=CHARACTERS.find(x=>x.id===id); if(!c) return null;
  const present=new Set(reveals(marker).chars.map(x=>x.id));
  const links=reveals(marker).rels.filter(r=>(r.a===id||r.b===id)&&present.has(r.a)&&present.has(r.b));
  const t=THREAD[c.thread]||THREAD.moscow;
  const bio=latest(c.bios,marker);
  const seen=latest(c.lastSeen||[],marker);
  const loc=c.home && LOCATIONS[c.home];
  return (
    <div style={{background:C.panel,border:`1px solid ${C.greenLt}`,borderRadius:12,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:10,height:10,borderRadius:5,background:t.dot}}/>
            <span style={{color:C.mute,fontSize:12,letterSpacing:1,textTransform:"uppercase"}}>{t.label}</span>
          </div>
          <h3 style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:24,margin:"6px 0 2px"}}>{c.full}</h3>
          <div style={{color:C.mute,fontSize:13}}>{c.nicks.join(" · ")}{c.maiden?` · née ${c.maiden}`:""}</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.mute,fontSize:22,cursor:"pointer"}}>×</button>
      </div>
      <p style={{fontSize:15,lineHeight:1.6,marginTop:14}}>{bio&&bio.text}</p>
      {seen && (
        <div style={{display:"flex",gap:8,alignItems:"baseline",background:C.night,borderRadius:8,padding:"10px 12px",margin:"4px 0 0"}}>
          <span style={{color:C.brass,fontSize:11,letterSpacing:1,textTransform:"uppercase",whiteSpace:"nowrap"}}>Last seen</span>
          <span style={{color:C.ink,fontSize:14}}>{seen.where}</span>
        </div>
      )}
      {loc && <div style={{color:C.mute,fontSize:13,marginTop:10}}>Based at <span style={{color:C.ink}}>{loc.name}</span></div>}
      {links.length>0 && (
        <div style={{marginTop:12,borderTop:`1px solid ${C.green}`,paddingTop:12}}>
          <div style={{color:C.brass,fontSize:12,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Connections</div>
          {links.map((r,i)=>{
            const o=CHARACTERS.find(x=>x.id===(r.a===id?r.b:r.a));
            return (
              <div key={i} onClick={()=>onPick(o.id)} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",cursor:"pointer",borderBottom:`1px solid ${C.night}`}}>
                <span>{o.nicks[0]}</span>
                <span style={{color:C.mute,fontSize:13,fontStyle:"italic"}}>{r.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Parallel timeline ----------------------------------------------------
function Timeline({ marker, onPick }) {
  const beats=TIMELINE.filter(b=>b.reveal<=marker);
  const col={affair:C.signal, levin:"#5b8c6e", moscow:C.brass};
  return (
    <div>
      <div style={{display:"flex",gap:24,marginBottom:16,fontSize:13,color:C.mute}}>
        {Object.entries(THREADS).map(([k,v])=>(
          <span key={k} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:10,height:10,borderRadius:5,background:col[k]}}/>{v.label}
          </span>
        ))}
      </div>
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:2,background:C.green,transform:"translateX(-1px)"}}/>
        {beats.map((b,i)=>{
          const left=b.thread!=="affair"; // affair right, others left
          return (
            <div key={i} style={{display:"flex",justifyContent:left?"flex-start":"flex-end",margin:"0 0 14px"}}>
              <div style={{width:"46%",background:C.panel,border:`1px solid ${C.green}`,borderLeft:`3px solid ${col[b.thread]}`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{color:C.brass,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Part {b.part} · Ch {b.ch}</div>
                <div style={{fontSize:14,lineHeight:1.55}}>{b.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Places ---------------------------------------------------------------
function Places({ marker, onPick }) {
  const present=reveals(marker).chars;
  const byLoc={};
  for(const c of present){ if(!c.home) continue; (byLoc[c.home]=byLoc[c.home]||[]).push(c); }
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
      {Object.entries(LOCATIONS).map(([id,loc])=>{
        const who=byLoc[id]||[];
        return (
          <div key={id} style={{background:C.panel,border:`1px solid ${C.green}`,borderRadius:12,padding:16,opacity:who.length?1:0.5}}>
            <h3 style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:19,color:C.brass,margin:"0 0 6px"}}>{loc.name}</h3>
            <p style={{color:C.mute,fontSize:13,lineHeight:1.55,margin:"0 0 12px"}}>{loc.note}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {who.length?who.map(c=>(
                <button key={c.id} onClick={()=>onPick(c.id)} style={{background:C.night,border:`1px solid ${C.greenLt}`,color:C.ink,borderRadius:20,padding:"4px 12px",fontSize:13,cursor:"pointer"}}>{c.nicks[0]}</button>
              )):<span style={{color:C.mute,fontSize:13,fontStyle:"italic"}}>No one here yet.</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Motifs ---------------------------------------------------------------
function Motifs({ marker }) {
  const [open,setOpen]=useState(MOTIFS[0].id);
  return (
    <div style={{maxWidth:760}}>
      {MOTIFS.map(mo=>{
        const beats=mo.beats.filter(b=>b.reveal<=marker);
        const isOpen=open===mo.id;
        return (
          <div key={mo.id} style={{borderBottom:`1px solid ${C.green}`}}>
            <button onClick={()=>setOpen(isOpen?null:mo.id)} style={{width:"100%",textAlign:"left",background:"none",border:"none",color:C.ink,padding:"16px 0",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:19,color:C.brass}}>{mo.name}</span>
              <span style={{color:C.mute,fontSize:12}}>{beats.length} so far</span>
            </button>
            {isOpen && (
              <div style={{paddingBottom:16}}>
                <p style={{color:C.mute,fontSize:13,margin:"0 0 12px"}}>{mo.note}</p>
                {beats.length?beats.map((b,i)=>(
                  <div key={i} style={{borderLeft:`2px solid ${C.greenLt}`,paddingLeft:14,marginBottom:12}}>
                    <div style={{fontSize:14,lineHeight:1.55}}>{b.text}</div>
                  </div>
                )):<div style={{color:C.mute,fontStyle:"italic",fontSize:14}}>This motif hasn't appeared yet where you are.</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const saved = loadProgress();
  const [part,setPart]=useState(saved ? saved.part : 1);
  const [chap,setChap]=useState(saved ? saved.chap : 18);
  const [picked,setPicked]=useState(null);
  const [tab,setTab]=useState("web");
  const marker=rc(part,chap);
  // Save the reader's place whenever it changes.
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ part, chap })); }
    catch (e) { /* storage unavailable — position just won't persist */ }
  }, [part, chap]);
  const excerpts=useMemo(()=>EXCERPTS.filter(e=>e.reveal<=marker),[marker]);
  const tabs=[["web","Relationship web"],["timeline","Timeline"],["places","Places"],["motifs","Motifs"],["decoder","Name decoder"],["excerpts","Excerpts"],["glossary","Glossary"]];

  return (
    <div style={{minHeight:"100vh",background:C.night,color:C.ink,fontFamily:"system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"}}>
      <style>{`input:focus{outline:2px solid ${C.brass};outline-offset:1px;}
        button:focus-visible{outline:2px solid ${C.brass};outline-offset:2px;}
        @media (prefers-reduced-motion:reduce){*{transition:none!important;}}`}</style>

      <header style={{borderBottom:`1px solid ${C.green}`,background:C.panel}}>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"18px 22px"}}>
          <div style={{color:C.brass,fontSize:12,letterSpacing:3,textTransform:"uppercase"}}>A reading companion · Maude translation</div>
          <h1 style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:30,fontWeight:700,margin:"4px 0 0"}}>Anna Karenina</h1>
        </div>
      </header>

      <div style={{background:C.green,borderBottom:`2px solid ${C.brass}`}}>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"14px 22px",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:13}}>I'm reading <strong style={{color:"#fff"}}>Part {part}, Chapter {chap}</strong> — nothing past here is shown.</span>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>Part
            <select value={part} onChange={e=>{const p=+e.target.value;setPart(p);setChap(Math.min(chap,PARTS[p-1]));}}
              style={{background:C.night,color:C.ink,border:`1px solid ${C.greenLt}`,borderRadius:6,padding:"5px 8px"}}>
              {PARTS.map((_,i)=><option key={i} value={i+1}>{i+1}</option>)}
            </select>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:10,fontSize:13,flex:1,minWidth:200}}>Ch {chap}
            <input type="range" min={1} max={PARTS[part-1]} value={chap} onChange={e=>setChap(+e.target.value)} style={{flex:1,accentColor:C.brass}}/>
          </label>
        </div>
      </div>

      <nav style={{maxWidth:1180,margin:"0 auto",padding:"0 22px",display:"flex",gap:2,borderBottom:`1px solid ${C.green}`,flexWrap:"wrap"}}>
        {tabs.map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:"none",border:"none",color:tab===k?C.ink:C.mute,borderBottom:tab===k?`2px solid ${C.brass}`:"2px solid transparent",padding:"14px 12px",fontSize:14,cursor:"pointer",fontWeight:tab===k?600:400}}>{label}</button>
        ))}
      </nav>

      <main style={{maxWidth:1180,margin:"0 auto",padding:22}}>
        {tab==="web" && (
          <div style={{display:"grid",gridTemplateColumns:picked?"1fr 340px":"1fr",gap:22,alignItems:"start"}}>
            <div style={{background:C.panel,border:`1px solid ${C.green}`,borderRadius:12,padding:10}}>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",padding:"6px 10px 12px",fontSize:12,color:C.mute}}>
                {Object.entries({marriage:"marriage",affair:"affair",courtship:"courtship",sibling:"siblings",friend:"friends"}).map(([k,l])=>{
                  const s=EDGE[k]||EDGE.sibling;
                  return <span key={k} style={{display:"flex",alignItems:"center",gap:6}}><svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={s.stroke} strokeWidth="2.5" strokeDasharray={s.dash||undefined}/></svg>{l}</span>;
                })}
              </div>
              <Web marker={marker} focus={picked} onPick={setPicked}/>
            </div>
            {picked && <Detail id={picked} marker={marker} onClose={()=>setPicked(null)} onPick={setPicked}/>}
          </div>
        )}
        {tab==="timeline" && <Timeline marker={marker} onPick={(id)=>{setPicked(id);setTab("web");}}/>}
        {tab==="places" && <Places marker={marker} onPick={(id)=>{setPicked(id);setTab("web");}}/>}
        {tab==="motifs" && <Motifs marker={marker}/>}
        {tab==="decoder" && (
          <div style={{maxWidth:560}}>
            <p style={{color:C.mute,lineHeight:1.6,marginTop:0}}>Russian characters carry a first name, a patronymic, a surname, and several nicknames. Type whichever one is tripping you up.</p>
            <Decoder marker={marker}/>
          </div>
        )}
        {tab==="excerpts" && (
          <div style={{maxWidth:680}}>
            {excerpts.length===0 && <p style={{color:C.mute}}>No excerpts yet for where you are.</p>}
            {excerpts.map((e,i)=>(
              <blockquote key={i} style={{borderLeft:`3px solid ${C.brass}`,margin:"0 0 22px",padding:"4px 0 4px 18px"}}>
                <p style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:19,lineHeight:1.6,fontStyle:"italic",margin:0}}>"{e.text}"</p>
                <footer style={{color:C.mute,fontSize:13,marginTop:8}}>{e.note}</footer>
              </blockquote>
            ))}
          </div>
        )}
        {tab==="glossary" && (
          <div style={{maxWidth:680}}>
            {GLOSSARY.map((g,i)=>(
              <div key={i} style={{padding:"14px 0",borderBottom:`1px solid ${C.green}`}}>
                <div style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:18,color:C.brass}}>{g.term}</div>
                <div style={{fontSize:14,lineHeight:1.6,marginTop:4}}>{g.def}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

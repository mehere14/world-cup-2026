const team = {
  FRA:["France","FR"], PAR:["Paraguay","PY"], SWE:["Sweden","SE"], RSA:["South Africa","ZA"],
  CAN:["Canada","CA"], NED:["Netherlands","NL"], MAR:["Morocco","MA"], POR:["Portugal","PT"],
  CRO:["Croatia","HR"], ESP:["Spain","ES"], AUT:["Austria","AT"], USA:["United States","US"],
  BIH:["Bosnia & Herzegovina","BA"], BEL:["Belgium","BE"], SEN:["Senegal","SN"], GHA:["Ghana","GH"],
  COL:["Colombia","CO"], ALG:["Algeria","DZ"], SUI:["Switzerland","CH"], EGY:["Egypt","EG"],
  AUS:["Australia","AU"], CPV:["Cape Verde","CV"], ARG:["Argentina","AR"], COD:["DR Congo","CD"],
  ENG:["England","GB-ENG"], ECU:["Ecuador","EC"], MEX:["Mexico","MX"], NOR:["Norway","NO"],
  IRL:["Ireland","IE"], JPN:["Japan","JP"], BRA:["Brazil","BR"], GER:["Germany","DE"],
  CIV:["Côte d'Ivoire","CI"]
};

const prototypeGames = [
  {id:"m0",r:0,s:0,t:["GER","PAR"]},
  {id:"m1",r:0,s:1,t:["FRA","SWE"]},
  {id:"m2",r:0,s:2,t:["RSA","CAN"]},
  {id:"m3",r:0,s:3,t:["NED","MAR"]},
  {id:"m4",r:0,s:4,t:["POR","CRO"]},
  {id:"m5",r:0,s:5,t:["ESP","AUT"]},
  {id:"m6",r:0,s:6,t:["USA","BIH"]},
  {id:"m7",r:0,s:7,t:["BEL","SEN"]},
  {id:"m8",r:0,s:8,t:["BRA","JPN"]},
  {id:"m9",r:0,s:9,t:["CIV","NOR"]},
  {id:"m10",r:0,s:10,t:["MEX","ECU"]},
  {id:"m11",r:0,s:11,t:["ENG","COD"]},
  {id:"m12",r:0,s:12,t:["ARG","CPV"]},
  {id:"m13",r:0,s:13,t:["AUS","EGY"]},
  {id:"m14",r:0,s:14,t:["SUI","ALG"]},
  {id:"m15",r:0,s:15,t:["COL","GHA"]},
  {id:"r0",r:1,s:0,from:["m0","m1"],date:"07 JUL · 3:00 PM",place:"Gillette Stadium · Boston",time:"90 minutes"},
  {id:"r1",r:1,s:1,from:["m2","m3"],date:"07 JUL · 7:00 PM",place:"Hard Rock Stadium · Miami",time:"120 minutes"},
  {id:"r2",r:1,s:2,from:["m4","m5"],date:"08 JUL · 4:00 PM",place:"SoFi Stadium · Los Angeles",time:"90 minutes"},
  {id:"r3",r:1,s:3,from:["m6","m7"],date:"08 JUL · 8:00 PM",place:"Mercedes-Benz Stadium · Atlanta",time:"Scheduled: 90 minutes"},
  {id:"r4",r:1,s:4,from:["m8","m9"],date:"09 JUL · 1:00 PM",place:"NRG Stadium · Houston",time:"Scheduled: 90 minutes"},
  {id:"r5",r:1,s:5,from:["m10","m11"],date:"09 JUL · 5:00 PM",place:"Levi's Stadium · San Francisco",time:"Scheduled: 90 minutes"},
  {id:"r6",r:1,s:6,from:["m12","m13"],date:"10 JUL · 3:00 PM",place:"AT&T Stadium · Dallas",time:"Scheduled: 90 minutes"},
  {id:"r7",r:1,s:7,from:["m14","m15"],date:"10 JUL · 7:00 PM",place:"MetLife Stadium · New York/NJ",time:"Scheduled: 90 minutes"},
  {id:"q0",r:2,s:0,from:["r0","r1"],date:"13 JUL · 3:00 PM",place:"Estadio Azteca · Mexico City",time:"Scheduled: 90 minutes"},
  {id:"q1",r:2,s:1,from:["r2","r3"],date:"13 JUL · 7:00 PM",place:"Lumen Field · Seattle",time:"Scheduled: 90 minutes"},
  {id:"q2",r:2,s:2,from:["r4","r5"],date:"14 JUL · 3:00 PM",place:"SoFi Stadium · Los Angeles",time:"Scheduled: 90 minutes"},
  {id:"q3",r:2,s:3,from:["r6","r7"],date:"14 JUL · 7:00 PM",place:"Hard Rock Stadium · Miami",time:"Scheduled: 90 minutes"},
  {id:"s0",r:3,s:0,from:["q0","q1"],date:"17 JUL · 6:00 PM",place:"Mercedes-Benz Stadium · Atlanta",time:"Scheduled: 90 minutes"},
  {id:"s1",r:3,s:1,from:["q2","q3"],date:"18 JUL · 6:00 PM",place:"AT&T Stadium · Dallas",time:"Scheduled: 90 minutes"}
];

let games = prototypeGames.map(({w,sc,pen,...game}) => ({...game}));
let byId = {};
let champion = null;
const roundTitle = ["Round of 32","Round of 16","Quarter-final","Semi-final"];
const center = 500;
const radii = [350,265,182,105];
const innerFlagRadius = 12 * 1.6;
const branchDrawMs = 200;
const flagRevealFraction = .25;
const stagePauseMs = 0;
const stageIntervalMs = branchDrawMs + stagePauseMs;
const coords = {};
let statusTimer = null;

const crestByCode = {};

const angleFor = (round, slot) => -90 - (slot + .5) * (360 / (16 / 2 ** round));
const branchDelay = round => round * stageIntervalMs;
const flagDelay = round => branchDelay(round) + branchDrawMs * flagRevealFraction;
const championDelay = () => branchDelay(4) + branchDrawMs;
const point = (radius, degrees) => {
  const a = degrees * Math.PI / 180;
  return [center + Math.cos(a)*radius, center + Math.sin(a)*radius];
};

function updateIndexes() {
  byId = Object.fromEntries(games.map(g => [g.id,g]));
  Object.keys(coords).forEach(key => delete coords[key]);
  games.forEach(g => coords[g.id] = point(radii[g.r], angleFor(g.r,g.s)));
}

updateIndexes();

function resolved(g) {
  return g.t || g.from.map(id => byId[id].w || null);
}

function state(g) {
  if (g.w) return "complete";
  return resolved(g).every(Boolean) ? "pending" : "waiting";
}

function flagArt(code) {
  const common = {
    FRA:`<rect width="40" height="40" fill="#fff"/><rect width="13.5" height="40" fill="#234e9a"/><rect x="26.5" width="13.5" height="40" fill="#e1343f"/>`,
    PAR:`<rect width="40" height="13.4" fill="#d52d3a"/><rect y="13.3" width="40" height="13.4" fill="#fff"/><rect y="26.6" width="40" height="13.4" fill="#235095"/><circle cx="20" cy="20" r="3" fill="#d7b84d"/>`,
    SWE:`<rect width="40" height="40" fill="#1768ad"/><rect x="12" width="6" height="40" fill="#f5d733"/><rect y="17" width="40" height="6" fill="#f5d733"/>`,
    RSA:`<rect width="40" height="20" fill="#d92e3b"/><rect y="20" width="40" height="20" fill="#244a8d"/><path d="M0 5L20 20 0 35V29L12 20 0 11Z" fill="#159447"/><path d="M0 11L12 20 0 29Z" fill="#f4cf42"/><path d="M0 14L8 20 0 26Z" fill="#202321"/>`,
    CAN:`<rect width="40" height="40" fill="#fff"/><rect width="10" height="40" fill="#df303d"/><rect x="30" width="10" height="40" fill="#df303d"/><text x="20" y="25" text-anchor="middle" font-size="16" fill="#df303d">✦</text>`,
    NED:`<rect width="40" height="13.4" fill="#ae2435"/><rect y="13.3" width="40" height="13.4" fill="#fff"/><rect y="26.6" width="40" height="13.4" fill="#234789"/>`,
    MAR:`<rect width="40" height="40" fill="#c52e3b"/><text x="20" y="26" text-anchor="middle" font-size="17" fill="#197448">☆</text>`,
    POR:`<rect width="16" height="40" fill="#14734b"/><rect x="16" width="24" height="40" fill="#d42d3c"/><circle cx="16" cy="20" r="5" fill="#e6c449"/>`,
    CRO:`<rect width="40" height="13.4" fill="#d92e3c"/><rect y="13.3" width="40" height="13.4" fill="#fff"/><rect y="26.6" width="40" height="13.4" fill="#244b94"/><path d="M15 14h10v10H15z" fill="#d92e3c"/><path d="M15 14h5v5h-5m5 5h5v-5h-5" fill="#fff"/>`,
    ESP:`<rect width="40" height="40" fill="#b82b38"/><rect y="10" width="40" height="20" fill="#f1c83c"/><circle cx="13" cy="20" r="3" fill="#b82b38"/>`,
    AUT:`<rect width="40" height="13.4" fill="#d92f3d"/><rect y="13.3" width="40" height="13.4" fill="#fff"/><rect y="26.6" width="40" height="13.4" fill="#d92f3d"/>`,
    USA:`${Array.from({length:7},(_,i)=>`<rect y="${i*5.72}" width="40" height="2.86" fill="#cc3341"/>`).join("")}<rect width="18" height="20" fill="#244889"/><text x="9" y="14" text-anchor="middle" fill="#fff" font-size="11">✦</text>`,
    BIH:`<rect width="40" height="40" fill="#2653a1"/><path d="M10 4L34 36H10Z" fill="#f3d33c"/><text x="8" y="35" fill="#fff" font-size="8">✦</text>`,
    BEL:`<rect width="13.4" height="40" fill="#202321"/><rect x="13.3" width="13.4" height="40" fill="#f0cf36"/><rect x="26.6" width="13.4" height="40" fill="#d62e3c"/>`,
    SEN:`<rect width="13.4" height="40" fill="#18814d"/><rect x="13.3" width="13.4" height="40" fill="#f2ce35"/><rect x="26.6" width="13.4" height="40" fill="#d4313d"/><text x="20" y="25" text-anchor="middle" fill="#18814d" font-size="13">★</text>`,
    GHA:`<rect width="40" height="13.4" fill="#cf303d"/><rect y="13.3" width="40" height="13.4" fill="#f0cc36"/><rect y="26.6" width="40" height="13.4" fill="#28744a"/><text x="20" y="25" text-anchor="middle" fill="#222" font-size="12">★</text>`,
    COL:`<rect width="40" height="20" fill="#f2d132"/><rect y="20" width="40" height="10" fill="#25509a"/><rect y="30" width="40" height="10" fill="#d32f3d"/>`,
    CIV:`<rect width="13.4" height="40" fill="#ec8b32"/><rect x="13.3" width="13.4" height="40" fill="#fff"/><rect x="26.6" width="13.4" height="40" fill="#198253"/>`,
    ALG:`<rect width="20" height="40" fill="#17824f"/><rect x="20" width="20" height="40" fill="#fff"/><text x="20" y="27" text-anchor="middle" fill="#d8313d" font-size="18">☾</text>`,
    SUI:`<rect width="40" height="40" fill="#d42e3a"/><rect x="17" y="8" width="6" height="24" fill="#fff"/><rect x="8" y="17" width="24" height="6" fill="#fff"/>`,
    EGY:`<rect width="40" height="13.4" fill="#d3303d"/><rect y="13.3" width="40" height="13.4" fill="#fff"/><rect y="26.6" width="40" height="13.4" fill="#242522"/><circle cx="20" cy="20" r="3" fill="#d4ae3e"/>`,
    AUS:`<rect width="40" height="40" fill="#24458c"/><path d="M0 0h19v18H0z" fill="#fff"/><path d="M0 0l19 18M19 0L0 18" stroke="#d52f3c" stroke-width="3"/><path d="M9.5 0v18M0 9h19" stroke="#fff" stroke-width="5"/><path d="M9.5 0v18M0 9h19" stroke="#d52f3c" stroke-width="2"/><text x="29" y="29" fill="#fff" font-size="12">✦</text>`,
    CPV:`<rect width="40" height="40" fill="#467ab9"/><rect y="22" width="40" height="6" fill="#fff"/><rect y="24" width="40" height="2" fill="#d32f3c"/><text x="13" y="23" fill="#efcc38" font-size="11">✦</text>`,
    ARG:`<rect width="40" height="13.4" fill="#78b5df"/><rect y="13.3" width="40" height="13.4" fill="#fff"/><rect y="26.6" width="40" height="13.4" fill="#78b5df"/><circle cx="20" cy="20" r="3" fill="#d7ad3a"/>`,
    COD:`<rect width="40" height="40" fill="#4a9eda"/><path d="M-8 35L35-5 45 5 2 45Z" fill="#f1d034"/><path d="M-5 35L35-2 42 5 2 42Z" fill="#d42e3b"/><text x="10" y="14" fill="#f2d033" font-size="11">★</text>`,
    ENG:`<rect width="40" height="40" fill="#fff"/><rect x="16" width="8" height="40" fill="#d62e3c"/><rect y="16" width="40" height="8" fill="#d62e3c"/>`,
    ECU:`<rect width="40" height="20" fill="#f2d032"/><rect y="20" width="40" height="10" fill="#25509a"/><rect y="30" width="40" height="10" fill="#d32f3d"/><circle cx="20" cy="20" r="3" fill="#7b6c3e"/>`,
    MEX:`<rect width="13.4" height="40" fill="#187650"/><rect x="13.3" width="13.4" height="40" fill="#fff"/><rect x="26.6" width="13.4" height="40" fill="#d12f3c"/><circle cx="20" cy="20" r="3" fill="#8b6941"/>`,
    NOR:`<rect width="40" height="40" fill="#d52f3c"/><rect x="11" width="8" height="40" fill="#fff"/><rect y="16" width="40" height="8" fill="#fff"/><rect x="13" width="4" height="40" fill="#25447f"/><rect y="18" width="40" height="4" fill="#25447f"/>`,
    IRL:`<rect width="13.4" height="40" fill="#198257"/><rect x="13.3" width="13.4" height="40" fill="#fff"/><rect x="26.6" width="13.4" height="40" fill="#ee8e32"/>`,
    JPN:`<rect width="40" height="40" fill="#fff"/><circle cx="20" cy="20" r="9" fill="#cf2e3a"/>`,
    BRA:`<rect width="40" height="40" fill="#258648"/><path d="M20 5L36 20 20 35 4 20Z" fill="#f1d034"/><circle cx="20" cy="20" r="7" fill="#24509b"/>`,
    GER:`<rect width="40" height="13.4" fill="#232421"/><rect y="13.3" width="40" height="13.4" fill="#d5313d"/><rect y="26.6" width="40" height="13.4" fill="#efc936"/>`
  };
  return common[code] || `<rect width="40" height="40" fill="#ded8cb"/><text x="20" y="23" text-anchor="middle" font-size="9" font-family="monospace" fill="#292a28">${code || "?"}</text>`;
}

function crestArt(code) {
  if (!crestByCode[code]) return flagArt(code);
  if (code === "CAN") {
    return `<rect width="40" height="40" fill="#d52b1e"/>
      <rect x="10" width="20" height="40" fill="#fff"/>
      <image href="${crestByCode[code]}" y="10" width="40" height="20" preserveAspectRatio="xMidYMid meet"/>`;
  }
  if (code === "BIH") {
    return `<rect width="40" height="40" fill="#002395"/>
      <image href="${crestByCode[code]}" y="10" width="40" height="20" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<image href="${crestByCode[code]}" x="-10" y="-10" width="60" height="60" preserveAspectRatio="xMidYMid slice"/>`;
}

function flagSVG(code, x, y, r, id, cls="") {
  const art = crestArt(code);
  return `<g class="flag-roundel ${cls}" transform="translate(${x-r} ${y-r}) scale(${r/20})">
    <defs><clipPath id="clip-${id}"><circle cx="20" cy="20" r="19"/></clipPath></defs>
    <g clip-path="url(#clip-${id})">${art}</g>
    <circle cx="20" cy="20" r="19" fill="none" stroke="#f1ede3" stroke-width="2"/>
    <circle cx="20" cy="20" r="19" fill="none" stroke="#292a28" stroke-opacity=".18" stroke-width=".8"/>
  </g>`;
}

function miniFlag(code) {
  if (!code) return `<span class="mini-flag"></span>`;
  const art = crestArt(code);
  return `<svg class="mini-flag" viewBox="0 0 40 40"><defs><clipPath id="mini-${code}"><circle cx="20" cy="20" r="19"/></clipPath></defs><g clip-path="url(#mini-${code})">${art}</g><circle cx="20" cy="20" r="19" fill="none" stroke="#f1ede3" stroke-width="1.5"/></svg>`;
}

function outerTeams() {
  let out = "";
  games.filter(g => g.r===0).forEach((g,i) => {
    const base = angleFor(0,g.s);
    g.t.forEach((code,j) => {
      const p = point(444, base + (j ? 5.2 : -5.2));
      const labelP = point(472, base + (j ? 5.2 : -5.2));
      out += `<g class="outer-team">${flagSVG(code,p[0],p[1],20,`outer-${i}-${j}`)}
        <text class="outer-label" x="${labelP[0]}" y="${labelP[1]+2}">${code}</text></g>`;
    });
  });
  return out;
}

function branches() {
  let out = "";
  const branchPath = (cls, d, delay) => `<path class="branch ${cls}"${delay == null ? "" : ` style="--branch-delay:${delay}ms"`} d="${d}"/>`;
  games.forEach((g,i) => {
    const target = coords[g.id];
    if (g.r===0) {
      const base = angleFor(0,g.s);
      g.t.forEach((_,j) => {
        const teamAngle = base+(j?5.2:-5.2);
        const source = point(424,teamAngle);
        const stem = point(394,teamAngle);
        const d = `M${source[0]} ${source[1]} L${stem[0]} ${stem[1]} L${target[0]} ${target[1]}`;
        if (state(g)==="complete") out += branchPath("pending branch-guide",d);
        out += branchPath(state(g)==="complete"?"advanced":"pending",d,branchDelay(g.r));
      });
    } else {
      g.from.forEach(id => {
        const child = byId[id];
        const childAngle = angleFor(child.r,child.s);
        const source = coords[id];
        const stemLength = [30,27,23,18][child.r];
        const stem = point(radii[child.r]-stemLength,childAngle);
        const done = byId[id].w;
        const d = `M${source[0]} ${source[1]} L${stem[0]} ${stem[1]} L${target[0]} ${target[1]}`;
        if (done) out += branchPath("pending branch-guide",d);
        out += branchPath(done?"advanced":"pending",d,branchDelay(g.r));
      });
    }
  });
  games.filter(g=>g.r===3).forEach(g => {
    const source=coords[g.id];
    const stem=point(radii[3]-22,angleFor(g.r,g.s));
    const finalClass = g.w ? "advanced final-branch" : "pending";
    const d = `M${source[0]} ${source[1]} L${stem[0]} ${stem[1]} L500 500`;
    if (g.w) out += branchPath("pending branch-guide",d);
    out += branchPath(finalClass,d,g.w ? branchDelay(4) : null);
  });
  return out;
}

function matchNodes() {
  return games.map((g,i) => {
    const [x,y] = coords[g.id];
    const st = state(g);
    const teams = resolved(g);
    const angle = angleFor(g.r,g.s);
    const tangent = angle + 90;
    const scoreOffset = g.w ? 28 : 18;
    const tx = x + Math.cos(tangent*Math.PI/180)*scoreOffset;
    const ty = y + Math.sin(tangent*Math.PI/180)*scoreOffset;
    const score = g.sc ? `${g.sc[0]}–${g.sc[1]}` : st==="pending" ? "VS" : "";
    const winnerFlag = g.w ? flagSVG(g.w,x,y,innerFlagRadius,`winner-${g.id}`,"winner-flag") : "";
    const nodeCore = `<circle class="node-core ${g.w ? "pending staged-placeholder" : st}" cx="${x}" cy="${y}" r="${g.r===0?4.4:5}"/>`;
    return `<g class="match-group" data-id="${g.id}" tabindex="0" role="button" aria-label="${roundTitle[g.r]}: ${teams[0]?team[teams[0]][0]:"to be decided"} versus ${teams[1]?team[teams[1]][0]:"to be decided"}" style="--flag-delay:${flagDelay(g.r)}ms;animation-delay:${i*20}ms">
      ${nodeCore}${winnerFlag}
      <circle class="match-target" cx="${x}" cy="${y}" r="21"/>
      ${score?`<text class="score ${st}" x="${tx}" y="${ty+3}">${score}</text>`:""}
    </g>`;
  }).join("");
}

function championCenter() {
  if (!champion) return `<circle class="center-ring" cx="500" cy="500" r="58"/>`;

  return `<g class="champion-center" aria-label="${team[champion][0]} won the World Cup">
    <defs><clipPath id="champion-clip"><circle cx="500" cy="500" r="58"/></clipPath></defs>
    <g clip-path="url(#champion-clip)">
      <svg class="champion-flag-fill" x="438" y="438" width="124" height="124" viewBox="0 0 40 40" preserveAspectRatio="xMidYMid slice">
        ${crestArt(champion)}
      </svg>
    </g>
    <circle class="center-ring champion-ring" cx="500" cy="500" r="58"/>
  </g>`;
}

function confetti() {
  if (!champion) return "";
  const count = 2008;
  const colors = ["#cf4939","#f1c83c","#1768ad","#18814d","#292a28","#78b5df"];
  return `<g class="confetti" aria-hidden="true">${Array.from({length:count},(_,i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 64 + (i % 6) * 15;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - 18 - (i % 4) * 8;
    const color = colors[i % colors.length];
    const delay = championDelay() + (i % 7) * 26;
    const rotate = 180 + (i % 5) * 92;
    const width = i % 3 === 0 ? 4 : 6;
    const height = i % 2 === 0 ? 10 : 7;
    return `<rect class="confetti-piece" x="${100 - width/2}" y="${100 - height/2}" width="${width}" height="${height}" rx="1" fill="${color}" style="--tx:${x}px;--ty:${y}px;--rot:${rotate}deg;animation-delay:${delay}ms"/>`;
  }).join("")}</g>`;
}

function trophy() {
  return `<g class="trophy" aria-label="World Cup trophy" style="--champion-delay:${championDelay()}ms">
    ${championCenter()}
    <image class="trophy-icon ${champion ? "champion-trophy" : ""}" href="assets/world-cup-trophy.svg" x="470" y="452" width="60" height="75" preserveAspectRatio="xMidYMid meet"/>
    ${confetti()}
    <text class="final-label ${champion ? "champion-label" : ""}" x="500" y="570">${champion ? `CHAMPION · ${champion}` : "THE FINAL · 19 JUL"}</text>
  </g>`;
}

function popMarkup(g) {
  const t = resolved(g), st = state(g);
  const row = (code,i) => `<div class="pop-team">${miniFlag(code)}<span>${code?team[code][0]:"To be decided"}</span><span class="pop-score">${g.sc?g.sc[i]:"—"}</span></div>`;
  return `<div class="pop-top"><span>${roundTitle[g.r].toUpperCase()}</span><span class="pop-state">${st==="complete"?"FULL TIME":st==="pending"?"UPCOMING":"AWAITING TEAMS"}</span></div>
    <div class="pop-teams">${row(t[0],0)}${row(t[1],1)}</div>
    <div class="pop-meta"><div><small>DATE · ET</small><span>${g.date}</span></div><div><small>MATCH TIME</small><span>${g.time}</span></div><div style="grid-column:1/-1"><small>LOCATION</small><span>${g.place}</span></div></div>`;
}

function showPopover(group, event) {
  const pop = document.getElementById("popover");
  pop.innerHTML = popMarkup(byId[group.dataset.id]);
  const rect = group.getBoundingClientRect();
  const width = 330;
  const left = Math.max(12,Math.min(innerWidth-width-12,(event?.clientX ?? rect.left)-width/2));
  const above = rect.top > 360;
  pop.style.left = `${left}px`;
  pop.style.top = above ? "auto" : `${Math.min(innerHeight-310,rect.bottom+12)}px`;
  pop.style.bottom = above ? `${innerHeight-rect.top+12}px` : "auto";
  pop.classList.add("visible");
}

function bindNodes() {
  document.querySelectorAll(".match-group").forEach(group => {
    group.addEventListener("mouseenter", e=>showPopover(group,e));
    group.addEventListener("mousemove", e=>showPopover(group,e));
    group.addEventListener("mouseleave", ()=>document.getElementById("popover").classList.remove("visible"));
    group.addEventListener("focus", e=>showPopover(group,e));
    group.addEventListener("blur", ()=>document.getElementById("popover").classList.remove("visible"));
    group.addEventListener("click", e=>showPopover(group,e));
  });
}

function renderBracket() {
  updateIndexes();
  const svg = document.getElementById("bracket");
  svg.innerHTML = `<title id="svgTitle">World Cup 2026 radial bracket</title><desc id="svgDesc">Thirty-two teams arranged in a circle, advancing toward the World Cup trophy.</desc><g class="branches">${branches()}</g>${outerTeams()}<g class="nodes">${matchNodes()}</g>${trophy()}`;
  bindNodes();
}

function simulateToFinal() {
  games.forEach(g => {
    if (!g.w) {
      const teams = resolved(g);
      if (teams[0] && teams[1]) {
        g.w = Math.random() > 0.5 ? teams[0] : teams[1];
      }
    }
  });

  const finalists = [byId.s0?.w, byId.s1?.w].filter(Boolean);
  champion = finalists.length === 2
    ? finalists[Math.floor(Math.random() * finalists.length)]
    : null;

  renderBracket();

  if (games.every(g => g.w) && champion) {
    document.getElementById("simulate-btn").textContent = "Run Again";
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      document.getElementById("sim-status").textContent = `${team[champion][0]} won the World Cup! Click to run again.`;
    }, championDelay());
  }
}

document.addEventListener("DOMContentLoaded", function() {
  renderBracket();

  const btn = document.getElementById("simulate-btn");
  btn.addEventListener("click", function() {
    // Reset all winners before simulating
    games.forEach(g => g.w = undefined);
    champion = null;
    clearTimeout(statusTimer);
    renderBracket();
    document.getElementById("sim-status").textContent = "Simulating...";
    btn.textContent = "Auto-Simulate to Final";

    // Use setTimeout to allow UI to update before heavy simulation
    setTimeout(() => {
      simulateToFinal();
    }, 100);
  });
});

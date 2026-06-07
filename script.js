/* ============================================================
   AI Job Finder by Anish Inspires
   main.js — extracted from index.html
   Author: Anish Wani | https://github.com/AnishCodes-99
   ============================================================ */

/* ===== STATE ===== */
var D = { name:'', status:null, field:null, skills:[], exp:null, interest:null, ws:null };
var curStep = 1;

/* ===== SCROLL RESET (not named 'top' to avoid window.top conflict) ===== */
function scrollReset() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/* ===== PAGE SWITCHER ===== */
function showPage(id) {
  document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('on'); });
  document.getElementById(id).classList.add('on');
  scrollReset();
  setTimeout(scrollReset, 40);
  setTimeout(scrollReset, 100);
}

/* ===== NAVIGATION ===== */
function goHome() { resetAll(); showPage('pg-hero'); }

function launchForm() {
  showPage('pg-form');
  setStep(1);
}

/* ===== STEP MANAGER — always scrolls to top ===== */
function setStep(n) {
  document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('on'); });
  var el = document.getElementById('st' + n);
  if (el) el.classList.add('on');
  curStep = n;
  document.getElementById('prog').style.width = (n / 4 * 100) + '%';
  for (var i = 1; i <= 4; i++) {
    var p = document.getElementById('pp' + i);
    if (!p) continue;
    p.className = 'pip';
    if (i < n) p.classList.add('done');
    if (i === n) p.classList.add('cur');
  }
  scrollReset();
  setTimeout(scrollReset, 40);
  setTimeout(scrollReset, 100);
}

function goStep(n) {
  if (n > curStep) {
    if (curStep === 1 && !D.status) { showToast('Please select your current status'); return; }
    if (curStep === 2 && !D.field)  { showToast('Please select your field'); return; }
  }
  setStep(n);
}

/* ===== ENTER KEY ===== */
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var fp = document.getElementById('pg-form');
  if (!fp || !fp.classList.contains('on')) return;
  if (document.activeElement && document.activeElement.id === 'sk-inp') return;
  e.preventDefault();
  if (curStep === 1) goStep(2);
  else if (curStep === 2) goStep(3);
  else if (curStep === 3) goStep(4);
  else if (curStep === 4) submitForm();
});

/* ===== OPTION CARDS — no scroll jump ===== */
function pickOpt(el) {
  var k = el.getAttribute('data-k');
  var v = el.getAttribute('data-v');
  var y = window.pageYOffset || document.documentElement.scrollTop || 0;
  document.querySelectorAll('.opt[data-k="' + k + '"]').forEach(function(c) { c.classList.remove('sel'); });
  el.classList.add('sel');
  D[k] = v;
  if (k === 'status') { var b = document.getElementById('nxt1'); if (b) b.disabled = false; }
  if (k === 'field')  { var b = document.getElementById('nxt2'); if (b) b.disabled = false; }
  window.scrollTo(0, y);
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

function pickPill(el) {
  var k = el.getAttribute('data-k');
  var y = window.pageYOffset || document.documentElement.scrollTop || 0;
  document.querySelectorAll('.pill[data-k="' + k + '"]').forEach(function(p) { p.classList.remove('sel'); });
  el.classList.add('sel');
  D[k] = el.getAttribute('data-v');
  window.scrollTo(0, y);
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

/* ===== SKILLS ===== */
function renderSkills() {
  var cnt = document.getElementById('sk-cnt');
  var box = document.getElementById('sk-box');
  if (cnt) cnt.textContent = '(' + D.skills.length + ')';
  if (box) {
    box.innerHTML = D.skills.map(function(s, i) {
      return '<div class="sk-tag">' + xss(s) + '<button class="sk-rm" onclick="removeSk(' + i + ')" type="button">&#x2715;</button></div>';
    }).join('');
  }
}

function addSug(el) {
  var sk = el.textContent.trim();
  if (el.classList.contains('used') || D.skills.includes(sk) || D.skills.length >= 20) return;
  D.skills.push(sk); el.classList.add('used'); renderSkills();
}

function addCustom() {
  var inp = document.getElementById('sk-inp');
  var sk = inp.value.trim();
  if (!sk) return;
  if (D.skills.includes(sk)) { showToast('Already added'); inp.value = ''; return; }
  if (D.skills.length >= 20) { showToast('Max 20 skills'); return; }
  D.skills.push(sk); inp.value = ''; renderSkills();
  document.querySelectorAll('.sug').forEach(function(s) { if (s.textContent.trim() === sk) s.classList.add('used'); });
}

function removeSk(i) {
  var sk = D.skills[i]; D.skills.splice(i, 1); renderSkills();
  document.querySelectorAll('.sug').forEach(function(s) { if (s.textContent.trim() === sk) s.classList.remove('used'); });
}

/* ===== SUBMIT — only from step 4 ===== */
async function submitForm() {
  if (!D.exp)      D.exp      = 'Beginner';
  if (!D.interest) D.interest = 'Full-Time Job';
  if (!D.ws)       D.ws       = 'No Preference';
  D.name = (document.getElementById('inp-name').value || '').trim();
  showPage('pg-load');
  runLoader();
  var result = await callAI();
  renderResults(result);
}

/* ===== LOADER ===== */
function runLoader() {
  var items = document.querySelectorAll('.ld-li');
  items.forEach(function(el) { el.classList.remove('cur', 'done'); });
  if (items[0]) items[0].classList.add('cur');
  var idx = 0;
  var timer = setInterval(function() {
    if (idx < items.length - 1) {
      items[idx].classList.remove('cur'); items[idx].classList.add('done');
      idx++; items[idx].classList.add('cur');
    } else { clearInterval(timer); }
  }, 800);
}

/* ===== ENTERPRISE AI SYSTEM PROMPT ===== */
var SYSTEM_PROMPT = [
  'You are a production-grade career recommendation engine. You behave like a senior career counselor, labor market analyst, and hiring manager combined.',
  '',
  'INDUSTRY LOCK RULE: You must classify the user into exactly one primary industry based on their field and skills. Never mix industries unless real-world transition is proven and common.',
  '',
  'SKILL VALIDATION RULE: Convert each skill into real job functions. Examples:',
  '- Crochet/Knitting = Textile design, handmade craft production',
  '- Python/JavaScript = Software engineering, automation',
  '- Tally/GST = Accounting, finance operations',
  '- AutoCAD = Engineering design, drafting',
  '- Video Editing = Media production, content creation',
  '- Medical Knowledge = Healthcare support, clinical roles',
  '',
  'REJECTION RULE: Never suggest a role if a real company would not hire this person for it.',
  'Never suggest IT/software roles for craft/art/handmade users.',
  'Never suggest cross-industry roles unless strongly proven.',
  'Never hallucinate job titles that do not exist in real hiring markets.',
  '',
  'CONFIDENCE RULE: Only include roles with 70%+ internal confidence. Reject anything below 70%.',
  '',
  'OUTPUT: Return ONLY a raw JSON object. No markdown. No backticks. Start with { end with }.',
  'No newlines inside string values. All 4 match scores must be different and between 70 and 93.',
  '',
  'Return exactly this structure:',
  '{"jobs":[{"title":"str","match":88,"industry":"str","reason":"str"},{"title":"str","match":82,"industry":"str","reason":"str"},{"title":"str","match":76,"industry":"str","reason":"str"},{"title":"str","match":71,"industry":"str","reason":"str"}],"bars":[{"n":"Domain Knowledge","p":82},{"n":"Skill Depth","p":74},{"n":"Market Readiness","p":78},{"n":"Growth Potential","p":70}],"road":[{"st":"Now","r":"str","d":"str","cur":true},{"st":"1-2 Years","r":"str","d":"str","cur":false},{"st":"3-5 Years","r":"str","d":"str","cur":false}],"miss":["s1","s2","s3"],"learn":["s1","s2","s3"],"tips":["t1","t2","t3"]}'
].join('\n');

/* ===== AI CALL ===== */
async function callAI() {
  var skStr   = D.skills.length ? D.skills.join(', ') : 'No specific skills mentioned';
  var nameStr = D.name || 'the user';

  var userMessage = [
    'Analyze this career profile and return industry-validated job recommendations:',
    '',
    'Name: ' + nameStr,
    'Status: ' + D.status,
    'Field: ' + D.field,
    'Skills: ' + skStr,
    'Experience Level: ' + D.exp,
    'Seeking: ' + D.interest,
    'Work Style: ' + D.ws,
    '',
    'Apply strict industry-locking. Do NOT suggest roles from unrelated industries.',
    'All job titles must exist in real hiring market and be achievable with these skills.'
  ].join('\n');

  var payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });

  var MAX_RETRIES = 3;
  var RETRY_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s

  for (var attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        setLoaderMsg('Retrying analysis... please wait');
        await sleep(RETRY_DELAYS[attempt - 1]);
        setLoaderMsg('Generating career report...');
      }

      var resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      // 429 = rate limited — retry after delay
      if (resp.status === 429) {
        if (attempt < MAX_RETRIES - 1) {
          setLoaderMsg('Rate limit reached, retrying in ' + (RETRY_DELAYS[attempt] / 1000) + 's...');
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
        return buildFallback();
      }

      if (!resp.ok) {
        return buildFallback();
      }

      var data = await resp.json();
      var raw = (data.content || []).map(function(b) {
        return b.type === 'text' ? b.text : '';
      }).join('').trim();

      // AI returned "no match" text instead of JSON
      if (raw && raw.toLowerCase().indexOf('no strongly relevant') !== -1 && raw.indexOf('{') === -1) {
        return null;
      }

      return parseJSON(raw);

    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        continue;
      }
      return buildFallback();
    }
  }

  return buildFallback();
}

/* ===== HELPERS: sleep + loader message ===== */
function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function setLoaderMsg(msg) {
  var activeTxt = document.querySelector('.ld-li.cur .ld-txt');
  if (activeTxt) activeTxt.textContent = msg;
}

/* ===== JSON PARSER ===== */
function parseJSON(raw) {
  if (!raw) throw new Error('empty');
  var s = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
  var a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no JSON');
  s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch(_) {}
  var fixed = s.replace(/"((?:[^"\\]|\\.)*)"/g, function(m) { return m.replace(/\r?\n/g, ' '); });
  return JSON.parse(fixed);
}

/* ===== INDUSTRY-LOCKED FALLBACK DATABASE ===== */
function buildFallback() {
  var f = (D.field || '').replace('&amp;', '&').trim();
  var db = {
    'IT / Software': {
      jobs:[{title:'Full Stack Developer',match:91,industry:'Software Engineering',reason:'Directly maps to your IT background. High demand across startups and enterprises with strong salary growth.'},{title:'Software Engineer',match:84,industry:'Technology',reason:'Core engineering role aligned with your field. Product companies and service firms actively hire at all levels.'},{title:'Backend Developer',match:77,industry:'Cloud & APIs',reason:'Server-side specialization suits your technical depth. Python and Node.js roles are consistently in demand.'},{title:'DevOps Engineer',match:70,industry:'Infrastructure',reason:'Natural progression from IT background. CI/CD and cloud roles offer premium compensation and high growth.'}],
      bars:[{n:'Domain Knowledge',p:84},{n:'Skill Depth',p:76},{n:'Market Readiness',p:80},{n:'Growth Potential',p:78}],
      road:[{st:'Now',r:'Junior Developer',d:'Build real projects and contribute to production codebases.',cur:true},{st:'1-2 Years',r:'Software Engineer',d:'Own features end-to-end and expand your technology stack.',cur:false},{st:'3-5 Years',r:'Senior Engineer / Tech Lead',d:'Architect systems, mentor juniors and drive technical roadmap.',cur:false}],
      miss:['System Design Fundamentals','Docker & Containerization','Cloud Platform Basics (AWS/GCP)'],
      learn:['REST API Development','CI/CD Pipeline Setup','Database Optimization'],
      tips:['Publish 3-5 real-world projects on GitHub with clean code and documentation.','Contribute to open-source projects to demonstrate collaboration and code quality.','Earn one cloud certification (AWS or GCP) to increase your hiring eligibility significantly.']
    },
    'Business / Marketing': {
      jobs:[{title:'Digital Marketing Executive',match:89,industry:'Marketing & Growth',reason:'Direct match to your field. Performance marketing is the primary growth function in every modern business.'},{title:'Growth Marketing Manager',match:83,industry:'SaaS & E-commerce',reason:'Data-driven growth roles align with your marketing background. Strong demand across startups and D2C brands.'},{title:'Brand Strategist',match:76,industry:'Advertising & Branding',reason:'Strategic brand management matches your business orientation. Agencies and corporates both hire actively.'},{title:'Social Media Manager',match:71,industry:'Content Marketing',reason:'Platform strategy and community management is a growing full-time function in marketing teams.'}],
      bars:[{n:'Domain Knowledge',p:86},{n:'Skill Depth',p:74},{n:'Market Readiness',p:82},{n:'Growth Potential',p:80}],
      road:[{st:'Now',r:'Marketing Associate',d:'Execute campaigns, track KPIs and learn channel-specific strategy.',cur:true},{st:'1-2 Years',r:'Marketing Manager',d:'Lead campaigns, manage budget and own specific growth channels.',cur:false},{st:'3-5 Years',r:'Head of Marketing',d:'Set company-wide strategy, lead teams and drive revenue growth.',cur:false}],
      miss:['Paid Ads (Google/Meta)','Marketing Analytics Tools','Email Automation Platforms'],
      learn:['Meta Ads Manager','Google Analytics 4','HubSpot CRM Fundamentals'],
      tips:['Run 2-3 real campaigns (even personal projects) to build a results-based portfolio.','Get certified in Google Analytics and Meta Blueprint — both are free and widely recognized.','Build a marketing case study showcasing campaign results with actual numbers.']
    },
    'Finance / Accounting': {
      jobs:[{title:'Financial Analyst',match:88,industry:'Finance & Banking',reason:'Core finance role directly matching your field. Banks and corporates hire continuously at all levels.'},{title:'Accounts Executive',match:83,industry:'Accounting & Audit',reason:'Foundational accounting role well-suited to your background. Tally and Excel proficiency are valued.'},{title:'Tax Consultant',match:76,industry:'Taxation & Compliance',reason:'GST and income tax consulting has strong market demand, especially after regulatory changes in India.'},{title:'Investment Research Analyst',match:71,industry:'Capital Markets',reason:'Entry-level capital markets role for finance graduates with strong analytical and Excel skills.'}],
      bars:[{n:'Domain Knowledge',p:85},{n:'Skill Depth',p:73},{n:'Market Readiness',p:79},{n:'Growth Potential',p:76}],
      road:[{st:'Now',r:'Accounts Executive',d:'Handle day-to-day bookkeeping, reconciliation and tax filing.',cur:true},{st:'1-2 Years',r:'Senior Accountant / Finance Analyst',d:'Lead financial reporting, audit support and budget planning.',cur:false},{st:'3-5 Years',r:'Finance Manager / CFO Track',d:'Own company P&L, strategic planning and investor reporting.',cur:false}],
      miss:['Advanced Financial Modeling','IFRS / Ind AS Standards','ERP Software (SAP/Oracle)'],
      learn:['Tally Prime Advanced Features','Power BI for Finance Dashboards','CFA Level 1 Concepts'],
      tips:['Build financial models for 2-3 real companies using publicly available annual reports.','Pursue CFA or CA Foundation — both significantly increase salary bands and hiring priority.','Get hands-on with accounting software like Tally Prime or QuickBooks for practical credibility.']
    },
    'Healthcare / Medical': {
      jobs:[{title:'Clinical Research Coordinator',match:87,industry:'Healthcare & Pharma',reason:'Directly aligned with medical background. Pharma companies and CROs actively hire coordinators.'},{title:'Medical Sales Representative',match:82,industry:'Pharmaceutical Sales',reason:'Combines medical knowledge with commercial skills. High-demand role across pharma companies in India.'},{title:'Healthcare Data Analyst',match:75,industry:'Health Tech',reason:'Medical knowledge + data skills is a growing niche with excellent prospects in hospital chains and health startups.'},{title:'Hospital Administrator',match:71,industry:'Hospital Management',reason:'Healthcare operations role matching medical background with administrative responsibility.'}],
      bars:[{n:'Domain Knowledge',p:88},{n:'Skill Depth',p:75},{n:'Market Readiness',p:80},{n:'Growth Potential',p:77}],
      road:[{st:'Now',r:'Healthcare Support Role',d:'Clinical coordination, medical sales or health data entry-level positions.',cur:true},{st:'1-2 Years',r:'Senior Medical Representative / Analyst',d:'Own accounts, lead research coordination or manage department data.',cur:false},{st:'3-5 Years',r:'Healthcare Manager / Specialist',d:'Lead clinical operations, manage teams or specialize in health tech.',cur:false}],
      miss:['Clinical Trial Protocols (ICH-GCP)','Healthcare Data Tools (Medidata, EPIC)','Medical Coding Basics (ICD-10)'],
      learn:['Pharmacovigilance Fundamentals','NABH Standards Awareness','Excel for Health Data Analysis'],
      tips:['Get GCP (Good Clinical Practice) certified — it is a standard requirement for clinical roles.','Target pharma companies like Sun Pharma, Cipla, Dr. Reddys for entry-level MR positions.','Learn basic medical coding or pharmacovigilance to open health tech opportunities.']
    },
    'Education / Teaching': {
      jobs:[{title:'School Teacher / Educator',match:90,industry:'K-12 Education',reason:'Direct match to your teaching field. CBSE and ICSE schools actively recruit subject matter teachers.'},{title:'Online Course Creator',match:83,industry:'EdTech & E-Learning',reason:'Strong demand for educators creating digital content. Platforms like Unacademy and Vedantu hire subject experts.'},{title:'Corporate Trainer',match:76,industry:'Learning & Development',reason:'Training professionals with teaching backgrounds are sought by large corporates for L&D departments.'},{title:'Academic Counselor',match:71,industry:'Education Services',reason:'Student guidance and academic counseling roles align well with your teaching experience and communication skills.'}],
      bars:[{n:'Domain Knowledge',p:87},{n:'Skill Depth',p:76},{n:'Market Readiness',p:83},{n:'Growth Potential',p:74}],
      road:[{st:'Now',r:'Teacher / Tutor / Subject Expert',d:'Teach in schools, coaching institutes or online platforms.',cur:true},{st:'1-2 Years',r:'Senior Educator / Content Developer',d:'Design curriculum, create course content or lead academic programs.',cur:false},{st:'3-5 Years',r:'Academic Head / EdTech Lead',d:'Lead educational programs, build learning products or head academic departments.',cur:false}],
      miss:['Learning Management Systems (LMS)','Curriculum Design Frameworks','EdTech Platform Tools (Moodle, Zoom)'],
      learn:['Digital Content Creation for Education','Assessment Design Best Practices','Student Psychology Basics'],
      tips:['Get B.Ed certified if you plan to teach in government or top private schools.','Build an online presence by teaching short courses on YouTube or Unacademy to demonstrate expertise.','Specialize in a high-demand subject (Maths, Science, English) to increase placement priority.']
    },
    'Design / Creative': {
      jobs:[{title:'UI/UX Designer',match:88,industry:'Product & Digital Design',reason:'Direct match for creative and design skills. Tech companies and agencies hire UI/UX designers actively.'},{title:'Graphic Designer',match:84,industry:'Visual Communication',reason:'Core design role suited to your creative background. Used across every industry for branding and marketing.'},{title:'Motion Graphics Designer',match:77,industry:'Media & Animation',reason:'Growing demand for motion designers in OTT platforms, advertising agencies and social media brands.'},{title:'Brand Identity Designer',match:71,industry:'Branding & Advertising',reason:'Strategic design role combining creativity with business communication for agencies and in-house teams.'}],
      bars:[{n:'Domain Knowledge',p:85},{n:'Skill Depth',p:78},{n:'Market Readiness',p:80},{n:'Growth Potential',p:76}],
      road:[{st:'Now',r:'Junior Designer / Freelance',d:'Build portfolio through client projects, internships and freelance work.',cur:true},{st:'1-2 Years',r:'Mid-Level Designer',d:'Own design systems, lead visual projects and work with product teams.',cur:false},{st:'3-5 Years',r:'Senior Designer / Design Lead',d:'Define brand standards, lead design teams and shape product direction.',cur:false}],
      miss:['Figma / Adobe XD Proficiency','Design System Principles','Basic UX Research Methods'],
      learn:['User Research Fundamentals','Responsive Web Design Principles','Motion Design with After Effects'],
      tips:['Build a strong Behance or Dribbble portfolio with 5-8 case study projects.','Learn Figma deeply — it is the industry standard for UI/UX and product design roles.','Freelance on platforms like Toptal or Fiverr to gain real client experience and build your reputation.']
    },
    'Arts / Crafts / Handmade': {
      jobs:[{title:'Handcraft Business Owner / Seller',match:90,industry:'Arts, Crafts & Handmade Commerce',reason:'Your craft skills are directly monetizable through platforms like Etsy, Meesho and local markets.'},{title:'Craft Instructor / Trainer',match:84,industry:'Creative Education',reason:'Teaching your craft skill — crochet, knitting, pottery etc — in workshops, schools or online platforms.'},{title:'Textile / Product Designer',match:77,industry:'Handmade & Textile Industry',reason:'Design and create custom textile products for boutiques, export houses or lifestyle brands.'},{title:'Social Media Content Creator (Craft Niche)',match:71,industry:'Creator Economy',reason:'Document and teach your craft on Instagram or YouTube. Monetizable through brand partnerships and courses.'}],
      bars:[{n:'Domain Knowledge',p:88},{n:'Skill Depth',p:82},{n:'Market Readiness',p:75},{n:'Growth Potential',p:79}],
      road:[{st:'Now',r:'Craft Seller / Instructor',d:'Sell handmade products online and teach your skill locally.',cur:true},{st:'1-2 Years',r:'Established Artisan / Workshop Host',d:'Scale online store, host regular workshops and build brand presence.',cur:false},{st:'3-5 Years',r:'Craft Brand Founder / Lead Educator',d:'Launch your own craft brand, export products or build a learning community.',cur:false}],
      miss:['Online Store Setup (Etsy/Meesho)','Product Photography Basics','Basic Business & Pricing Knowledge'],
      learn:['Social Media Marketing for Artisans','Etsy / Meesho Seller Platform','Customer Communication & Branding'],
      tips:['Open an Etsy or Meesho store — handmade crafts have strong global and domestic demand.','Document your craft process on Instagram Reels or YouTube Shorts to grow an audience organically.','Learn product photography with just your phone to make listings look premium and drive more sales.']
    },
    'Content Creation / Media': {
      jobs:[{title:'Content Creator / YouTuber',match:89,industry:'Creator Economy & Media',reason:'Direct match to your field. Monetizable via YouTube, sponsorships and digital products.'},{title:'Video Editor',match:84,industry:'Media Production',reason:'Core post-production role needed by every content creator, agency and media house.'},{title:'Social Media Manager',match:77,industry:'Digital Marketing & Media',reason:'Platform strategy and content scheduling is a full-time role in agencies and brand teams.'},{title:'Scriptwriter / Content Strategist',match:71,industry:'Content & Copywriting',reason:'Writing compelling scripts and content strategies is high-demand in both agencies and in-house teams.'}],
      bars:[{n:'Domain Knowledge',p:86},{n:'Skill Depth',p:79},{n:'Market Readiness',p:81},{n:'Growth Potential',p:83}],
      road:[{st:'Now',r:'Content Creator / Junior Editor',d:'Build your channel or portfolio with consistent content output.',cur:true},{st:'1-2 Years',r:'Professional Creator / Media Manager',d:'Monetize content, manage brand collaborations or lead a media team.',cur:false},{st:'3-5 Years',r:'Digital Media Director / Creator Brand',d:'Build a media business, launch courses or direct large-scale content operations.',cur:false}],
      miss:['Advanced Video Editing (DaVinci Resolve / Premiere Pro)','YouTube / Instagram SEO','Brand Partnership Outreach'],
      learn:['Content Strategy Planning','Short-Form Video Optimization','Thumbnail Design & CTR Optimization'],
      tips:['Post consistently for 90 days on one platform — consistency beats perfection in the creator economy.','Study top creators in your niche and reverse-engineer their hook, structure and editing style.','Build an email list early — it is your most valuable asset that no algorithm can take away.']
    },
    'Data & Analytics': {
      jobs:[{title:'Data Analyst',match:90,industry:'Data & Business Intelligence',reason:'Direct match to your field. Every company with data needs analysts to extract insights and drive decisions.'},{title:'Business Intelligence Analyst',match:83,industry:'Analytics & Reporting',reason:'BI roles combine data skills with business context. High demand in retail, finance and tech companies.'},{title:'Data Science Associate',match:76,industry:'AI & Machine Learning',reason:'Entry-level data science role for those with strong analytics foundation and Python knowledge.'},{title:'Analytics Consultant',match:71,industry:'Consulting & Advisory',reason:'Data-driven consulting roles at firms like Deloitte and EY for analysts with strong presentation skills.'}],
      bars:[{n:'Domain Knowledge',p:87},{n:'Skill Depth',p:79},{n:'Market Readiness',p:82},{n:'Growth Potential',p:84}],
      road:[{st:'Now',r:'Junior Data Analyst',d:'Build dashboards, clean data and generate regular reports for business teams.',cur:true},{st:'1-2 Years',r:'Data Analyst / BI Developer',d:'Own analytics pipelines, design dashboards and advise business on data strategy.',cur:false},{st:'3-5 Years',r:'Senior Analyst / Data Science Lead',d:'Lead data strategy, build ML models and mentor analytics teams.',cur:false}],
      miss:['SQL Optimization & Advanced Queries','Python for Data Analysis (Pandas/NumPy)','Machine Learning Fundamentals'],
      learn:['Power BI or Tableau Dashboard Design','Statistics for Data Analysis','Cloud Data Warehousing (BigQuery/Redshift)'],
      tips:['Build a public portfolio on Kaggle — participate in competitions and publish notebooks regularly.','Learn SQL deeply first — it is the single most important skill for data analyst hiring decisions.','Get a Google Data Analytics or IBM Data Science certificate on Coursera to validate your skills.']
    },
    'Mechanical Engineering': {
      jobs:[{title:'Mechanical Design Engineer',match:89,industry:'Manufacturing & Engineering',reason:'Core engineering role directly matching your field. Automotive, aerospace and FMCG companies hire continuously.'},{title:'Production / Manufacturing Engineer',match:83,industry:'Industrial Manufacturing',reason:'Shop floor and production engineering roles suit mechanical graduates with practical knowledge.'},{title:'Quality Control Engineer',match:76,industry:'Quality Assurance',reason:'QC roles across manufacturing sectors require mechanical engineering knowledge and inspection skills.'},{title:'HVAC Engineer',match:71,industry:'Building Services & MEP',reason:'Heating, ventilation and AC design is a growing specialization with demand in construction and facility management.'}],
      bars:[{n:'Domain Knowledge',p:85},{n:'Skill Depth',p:77},{n:'Market Readiness',p:79},{n:'Growth Potential',p:74}],
      road:[{st:'Now',r:'Junior Engineer / Graduate Trainee',d:'Work on design, manufacturing processes and quality inspection tasks.',cur:true},{st:'1-2 Years',r:'Mechanical Engineer',d:'Own design projects, optimize manufacturing processes and lead quality checks.',cur:false},{st:'3-5 Years',r:'Senior Engineer / Project Manager',d:'Lead engineering projects, manage teams and drive process improvements.',cur:false}],
      miss:['SolidWorks or CATIA 3D Modeling','GD&T (Geometric Dimensioning & Tolerancing)','Lean Manufacturing / Six Sigma Basics'],
      learn:['AutoCAD 2D / 3D Advanced Usage','Finite Element Analysis (FEA) Basics','Manufacturing Process Optimization'],
      tips:['Get SolidWorks or AutoCAD certified — these are the most commonly required tools in mechanical job descriptions.','Apply for graduate trainee programs at Tata Motors, Mahindra, Bosch and L&T Engineering early.','Learn Lean Six Sigma basics — it demonstrates process improvement mindset valued highly by manufacturers.']
    },
    'Electrical Engineering': {
      jobs:[{title:'Electrical Design Engineer',match:88,industry:'Electrical & Power Systems',reason:'Core role for electrical engineering graduates. Power distribution, switchgear and panel design companies hire.'},{title:'Automation / PLC Engineer',match:83,industry:'Industrial Automation',reason:'PLC and SCADA skills are high-demand in manufacturing plants and process industries across India.'},{title:'Electrical Site Engineer',match:76,industry:'Construction & Infra',reason:'Site supervision and installation management for electrical systems in building and infrastructure projects.'},{title:'Power Systems Engineer',match:71,industry:'Energy & Utilities',reason:'Working with transmission and distribution systems in power sector companies like NTPC, PGCIL and discoms.'}],
      bars:[{n:'Domain Knowledge',p:86},{n:'Skill Depth',p:75},{n:'Market Readiness',p:80},{n:'Growth Potential',p:77}],
      road:[{st:'Now',r:'Junior Electrical Engineer',d:'Work on electrical drawings, site supervision and panel testing.',cur:true},{st:'1-2 Years',r:'Electrical Engineer',d:'Design systems independently, handle client projects and lead site teams.',cur:false},{st:'3-5 Years',r:'Senior Engineer / Project Manager',d:'Lead complex electrical projects and manage cross-functional engineering teams.',cur:false}],
      miss:['PLC Programming (Siemens / Allen Bradley)','AutoCAD Electrical for Panel Design','Power System Simulation (ETAP)'],
      learn:['SCADA Systems Fundamentals','Electrical Safety Standards (IS/IEC)','Energy Audit Techniques'],
      tips:['Get trained on Siemens S7 or Allen Bradley PLC — automation skills double your hiring options.','Apply for trainee roles at ABB, Siemens, Schneider Electric and L&T Electrical for strong career starts.','Learn ETAP or MATLAB for power system analysis — it opens government and utility sector roles.']
    },
    'Civil Engineering': {
      jobs:[{title:'Site Engineer',match:90,industry:'Construction & Infrastructure',reason:'Direct match to civil engineering. Construction companies hire site engineers at all experience levels.'},{title:'Structural Design Engineer',match:83,industry:'Structural Engineering',reason:'Structural analysis and design is a core specialization with demand in consultancies and construction firms.'},{title:'Project Manager (Construction)',match:76,industry:'Project Management',reason:'Civil engineers with site experience are natural candidates for construction project management roles.'},{title:'Urban Planner / Infrastructure Analyst',match:71,industry:'Urban Development',reason:'Government agencies and planning consultancies hire civil graduates for infrastructure planning work.'}],
      bars:[{n:'Domain Knowledge',p:87},{n:'Skill Depth',p:76},{n:'Market Readiness',p:82},{n:'Growth Potential',p:78}],
      road:[{st:'Now',r:'Graduate Engineer Trainee / Site Engineer',d:'Manage construction activities, quality checks and contractor coordination.',cur:true},{st:'1-2 Years',r:'Civil Engineer / Design Engineer',d:'Take independent charge of project phases and technical design work.',cur:false},{st:'3-5 Years',r:'Senior Engineer / Project Manager',d:'Lead large construction projects, manage teams and client relationships.',cur:false}],
      miss:['AutoCAD Civil 3D / Revit BIM','Primavera P6 for Project Scheduling','IS Code Knowledge (Design Standards)'],
      learn:['Building Information Modeling (BIM)','Construction Cost Estimation','Quality Control in Construction (QA/QC)'],
      tips:['Get trained on AutoCAD Civil 3D or Revit BIM — most top firms now require BIM proficiency.','Apply to L&T Construction, Shapoorji Pallonji, NCC and government PWD for strong entry-level exposure.','Learn Primavera P6 or MS Project for scheduling — project management skills accelerate civil career growth.']
    },
    'HR / People Ops': {
      jobs:[{title:'HR Executive / Recruiter',match:90,industry:'Human Resources',reason:'Core HR role directly aligned with your field. Every company with 20+ employees actively hires HR executives.'},{title:'Talent Acquisition Specialist',match:84,industry:'Talent & Recruiting',reason:'Specialized recruiting role with high demand in IT, manufacturing and e-commerce sectors across India.'},{title:'HR Business Partner (HRBP)',match:77,industry:'Strategic HR',reason:'Business-aligned HR role combining people management with business strategy. Valued in mid to large companies.'},{title:'Learning & Development Executive',match:71,industry:'L&D / Training',reason:'Training and development role suited to HR professionals with strong communication and facilitation skills.'}],
      bars:[{n:'Domain Knowledge',p:85},{n:'Skill Depth',p:74},{n:'Market Readiness',p:81},{n:'Growth Potential',p:77}],
      road:[{st:'Now',r:'HR Executive / HR Associate',d:'Handle recruitment, onboarding, payroll support and employee engagement.',cur:true},{st:'1-2 Years',r:'HR Manager / Senior HR Executive',d:'Lead HR operations for a department, manage full recruitment cycle independently.',cur:false},{st:'3-5 Years',r:'HR Business Partner / HR Head',d:'Drive people strategy, partner with business leaders and manage entire HR function.',cur:false}],
      miss:['HRMS Tools (Darwinbox, Keka, SAP HCM)','Labour Law Compliance (PF, ESI, Gratuity)','Compensation & Benefits Design'],
      learn:['Recruitment Metrics & Analytics','Employee Engagement Frameworks','Structured Interviewing Techniques'],
      tips:['Get certified in SHRM-CP or a LinkedIn HR certification to improve hiring shortlisting rates.','Learn at least one HRMS platform like Keka or Darwinbox — most Indian companies use these.','Build expertise in a specific HR niche (talent acquisition, L&D, or compensation) to differentiate yourself.']
    },
    'Freelancing / General Skills': {
      jobs:[{title:'Freelance Project Manager',match:87,industry:'Freelance & Consulting',reason:'General project coordination skills are highly monetizable on freelance platforms like Upwork and Toptal.'},{title:'Virtual Assistant / Operations Support',match:82,industry:'Remote Work & Admin',reason:'Strong general skills translate directly into VA and remote ops roles with high international demand.'},{title:'Business Development Associate',match:75,industry:'Sales & Growth',reason:'Communication and coordination skills are core requirements for BD roles across startups and SMEs.'},{title:'Content Coordinator / Community Manager',match:71,industry:'Content & Community',reason:'General communication and organizational skills fit content and community management roles well.'}],
      bars:[{n:'Domain Knowledge',p:78},{n:'Skill Depth',p:72},{n:'Market Readiness',p:80},{n:'Growth Potential',p:76}],
      road:[{st:'Now',r:'Freelancer / Entry-Level Associate',d:'Build a client base or join a company in a generalist support role.',cur:true},{st:'1-2 Years',r:'Specialist in One Domain',d:'Pick one skill area to deepen — marketing, operations, writing or sales.',cur:false},{st:'3-5 Years',r:'Senior Specialist / Independent Consultant',d:'Command premium rates or lead a team in your chosen specialization.',cur:false}],
      miss:['One Deep Specialization (pick: marketing, tech, sales or ops)','Client Acquisition & Proposal Writing','Freelance Platform Proficiency (Upwork, Fiverr)'],
      learn:['Digital Marketing Fundamentals','Basic Excel / Google Sheets for Reporting','Project Management Tools (Notion, Trello, Asana)'],
      tips:['Pick one specific skill to go deep on — generalists get paid less; specialists get premium rates.','Create a strong LinkedIn profile and start posting about your work to attract inbound opportunities.','Start on Fiverr or Upwork with competitive pricing to build reviews and a client portfolio quickly.']
    }
  };

  var d = db[f] || db[f.replace(' / ', ' ')] || null;
  if (!d) return null;
  return { jobs: d.jobs, bars: d.bars, road: d.road, miss: d.miss, learn: d.learn, tips: d.tips };
}

/* ===== NO MATCH UI ===== */
function showNoMatch() {
  document.getElementById('res-tags').innerHTML = D.field
    ? '<span class="rtag">' + xss(D.field) + '</span>'
    : '';

  var field = xss(D.field || 'your field');
  var skills = D.skills.length ? xss(D.skills.join(', ')) : 'None added';

  var noMatchHTML =
    '<div style="grid-column:1/-1;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.22);' +
    'border-radius:12px;padding:28px 24px;text-align:center">' +
    '<div style="font-size:32px;margin-bottom:14px">&#128683;</div>' +
    '<div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:8px">' +
    'No Strongly Relevant Careers Found</div>' +
    '<div style="font-size:13px;color:rgba(255,255,255,.65);line-height:1.75;max-width:420px;margin:0 auto 20px">' +
    'Based on <strong style="color:#fff">' + field + '</strong> with skills ' +
    '<strong style="color:#fff">[' + skills + ']</strong>, ' +
    'our AI could not find validated career roles that meet the minimum 70% confidence threshold. ' +
    'This means the current skill set is either too limited, mismatched, or needs more depth ' +
    'to qualify for any hireable role in this field.</div>' +
    '<div style="font-size:12px;font-weight:700;color:var(--ac);letter-spacing:.8px;' +
    'text-transform:uppercase;margin-bottom:12px">What you can do</div>' +
    '<div style="display:flex;flex-direction:column;gap:9px;max-width:400px;margin:0 auto">' +
    '<div style="background:rgba(166,255,0,.07);border:1px solid rgba(166,255,0,.18);' +
    'border-radius:8px;padding:12px 16px;font-size:12px;color:rgba(255,255,255,.75);text-align:left">' +
    '&#128161; Add more specific skills related to your chosen field</div>' +
    '<div style="background:rgba(166,255,0,.07);border:1px solid rgba(166,255,0,.18);' +
    'border-radius:8px;padding:12px 16px;font-size:12px;color:rgba(255,255,255,.75);text-align:left">' +
    '&#128161; Re-check your field selection — make sure it matches your actual background</div>' +
    '<div style="background:rgba(166,255,0,.07);border:1px solid rgba(166,255,0,.18);' +
    'border-radius:8px;padding:12px 16px;font-size:12px;color:rgba(255,255,255,.75);text-align:left">' +
    '&#128161; Build foundational skills first — enroll in a short course for your chosen field</div>' +
    '</div></div>';

  document.getElementById('jgrid').innerHTML = noMatchHTML;
  document.getElementById('sbars').innerHTML = '';
  document.getElementById('roadmap').innerHTML = '';
  document.getElementById('gap-grid').innerHTML = '';

  var blks = document.querySelectorAll('#pg-res .rblk');
  blks.forEach(function(b, i) {
    if (i > 0 && i < 4) b.style.display = 'none';
  });

  document.querySelector('#pg-res .res-h').textContent = 'Career Analysis Result';
  document.querySelector('#pg-res .res-sub').textContent = 'AI could not find validated matches for this profile';
  document.querySelector('#pg-res .res-badge').innerHTML =
    '<span style="width:5px;height:5px;background:#ff6b6b;border-radius:50%;box-shadow:0 0 5px #ff6b6b;display:inline-block"></span>' +
    '&nbsp;No Match Found';

  showPage('pg-res');
}

/* ===== RENDER RESULTS ===== */
function renderResults(data) {
  if (!data || !data.jobs || data.jobs.length === 0) {
    showNoMatch();
    return;
  }

  // Restore sections (in case of previous no-match state)
  document.querySelectorAll('#pg-res .rblk').forEach(function(b) {
    b.style.display = '';
  });
  document.querySelector('#pg-res .res-h').textContent = 'Your Career Report';
  document.querySelector('#pg-res .res-sub').textContent = 'Industry-validated recommendations based on your real skills';
  document.querySelector('#pg-res .res-badge').innerHTML =
    '<span class="res-dot"></span>Analysis Complete';

  // Tags
  document.getElementById('res-tags').innerHTML =
    [D.name||null, D.field, D.exp, D.interest].filter(Boolean)
    .map(function(t) { return '<span class="rtag">' + xss(cap(t)) + '</span>'; }).join('');

  // Job cards
  document.getElementById('jgrid').innerHTML = (data.jobs || []).map(function(j) {
    return '<div class="jcard">' +
      '<div class="jcard-top"><div class="jcard-title">' + xss(j.title) + '</div>' +
      '<div class="jcard-match">' + j.match + '% Match</div></div>' +
      '<div class="jcard-ind">' +
        '<svg width="7" height="7" viewBox="0 0 7 7" fill="none"><circle cx="3.5" cy="3.5" r="2.8" stroke="currentColor" stroke-width="1"/></svg> ' +
        xss(j.industry) +
      '</div>' +
      '<div class="jcard-reason">' + xss(j.reason) + '</div>' +
      '</div>';
  }).join('');

  // Skill bars
  document.getElementById('sbars').innerHTML = (data.bars || []).map(function(b) {
    return '<div>' +
      '<div class="sbar-top"><span class="sbar-n">' + xss(b.n) + '</span><span class="sbar-v">' + b.p + '%</span></div>' +
      '<div class="sbar-tr"><div class="sbar-f" data-p="' + b.p + '"></div></div>' +
      '</div>';
  }).join('');

  // Roadmap
  document.getElementById('roadmap').innerHTML = (data.road || []).map(function(r, i) {
    return '<div class="rm-row' + (r.cur ? ' cur' : '') + '">' +
      '<div class="rm-left"><div class="rm-c">' + (i+1) + '</div><div class="rm-line"></div></div>' +
      '<div class="rm-body">' +
        '<div class="rm-st">' + xss(r.st) + '</div>' +
        '<div class="rm-r">' + xss(r.r) + '</div>' +
        '<div class="rm-d">' + xss(r.d) + '</div>' +
      '</div></div>';
  }).join('');

  // Gap analysis
  var mH = (data.miss||[]).map(function(s){return '<div class="gitem">'+xss(s)+'</div>';}).join('');
  var lH = (data.learn||[]).map(function(s){return '<div class="gitem">'+xss(s)+'</div>';}).join('');
  var tH = (data.tips||[]).map(function(t){return '<div class="gtip">'+xss(t)+'</div>';}).join('');
  document.getElementById('gap-grid').innerHTML =
    '<div class="gcard"><div class="gc-type miss"><span class="gc-dot"></span>Missing Skills</div><div class="gitems">' + mH + '</div></div>' +
    '<div class="gcard"><div class="gc-type learn"><span class="gc-dot"></span>Learn Next</div><div class="gitems">' + lH + '</div></div>' +
    '<div class="gcard" style="grid-column:1/-1"><div class="gc-type tips"><span class="gc-dot"></span>Improvement Tips</div><div class="gtips">' + tH + '</div></div>';

  showPage('pg-res');

  // Animate skill bars after render
  requestAnimationFrame(function() {
    setTimeout(function() {
      document.querySelectorAll('.sbar-f').forEach(function(b) {
        b.style.width = b.getAttribute('data-p') + '%';
      });
    }, 120);
  });
}

/* ===== RESET ===== */
function resetAll() {
  D = { name:'', status:null, field:null, skills:[], exp:null, interest:null, ws:null };
  var ni = document.getElementById('inp-name'); if (ni) ni.value = '';
  document.querySelectorAll('.opt').forEach(function(c){c.classList.remove('sel');});
  document.querySelectorAll('.pill').forEach(function(p){p.classList.remove('sel');});
  document.querySelectorAll('.sug').forEach(function(s){s.classList.remove('used');});
  var sb = document.getElementById('sk-box'); if (sb) sb.innerHTML = '';
  var sc = document.getElementById('sk-cnt'); if (sc) sc.textContent = '(0)';
  var si = document.getElementById('sk-inp'); if (si) si.value = '';
  var n1 = document.getElementById('nxt1'); if (n1) n1.disabled = true;
  var n2 = document.getElementById('nxt2'); if (n2) n2.disabled = true;
  document.querySelectorAll('.step').forEach(function(s){s.classList.remove('on');});
  var s1 = document.getElementById('st1'); if (s1) s1.classList.add('on');
  curStep = 1;
  var pf = document.getElementById('prog'); if (pf) pf.style.width = '25%';
  for (var i=1;i<=4;i++){var p=document.getElementById('pp'+i);if(p){p.className='pip';if(i===1)p.classList.add('cur');}}
}

/* ===== HELPERS ===== */
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function xss(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

var _tt = null;
function showToast(msg) {
  var t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(function(){t.classList.remove('show');}, 2800);
}

function doShare() {
  if (navigator.share) {
    navigator.share({title:'My Career Report — AI Job Finder by Anish Inspires',url:location.href}).catch(function(){});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(location.href); showToast('Link copied!');
  }
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', function() {
  var hb = document.getElementById('hero-btn');
  if (hb) hb.addEventListener('click', function() { launchForm(); });

  var nb = document.getElementById('nav-brand');
  if (nb) nb.addEventListener('click', function() { goHome(); });

  var n1 = document.getElementById('nxt1'); if (n1) n1.disabled = true;
  var n2 = document.getElementById('nxt2'); if (n2) n2.disabled = true;
});

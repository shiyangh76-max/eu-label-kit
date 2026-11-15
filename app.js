/* EU Label Kit. Fills the four documents EU marketplaces ask for. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  var CONFIG = {
    buyUrl: '',
    validateUrl: '',
    productId: '',
    price: '$9'
  };

  var MARKETS = [
    { code: 'DE', name: 'Germany', lang: 'German', epr: 'LUCID packaging register (VerpackG)', eprUrl: 'https://www.verpackungsregister.org/', extra: 'WEEE: Stiftung EAR registration', extraUrl: 'https://www.stiftung-ear.de/' },
    { code: 'FR', name: 'France', lang: 'French', epr: 'ADEME UIN register, plus the Triman logo', eprUrl: 'https://www.ademe.fr/', extra: 'WEEE and furniture EPR are separate filieres' },
    { code: 'IT', name: 'Italy', lang: 'Italian', epr: 'CONAI packaging consortium', eprUrl: 'https://www.conai.org/', extra: 'WEEE: RAEE register via CdC RAEE' },
    { code: 'ES', name: 'Spain', lang: 'Spanish', epr: 'Ecoembes packaging', eprUrl: 'https://www.ecoembes.com/', extra: 'WEEE: Registro de productores' },
    { code: 'NL', name: 'Netherlands', lang: 'Dutch', epr: 'Afvalfonds Verpakkingen', eprUrl: 'https://www.afvalfonds.nl/', extra: 'WEEE: Stichting OPEN' },
    { code: 'PL', name: 'Poland', lang: 'Polish', epr: 'BDO register', eprUrl: 'https://bdo.mos.gov.pl/', extra: 'WEEE and batteries are separate entries in BDO' },
    { code: 'BE', name: 'Belgium', lang: 'Dutch, French or German', epr: 'Fost Plus packaging', eprUrl: 'https://www.fostplus.be/', extra: 'WEEE: Recupel' },
    { code: 'AT', name: 'Austria', lang: 'German', epr: 'ARA packaging licence', eprUrl: 'https://www.ara.at/', extra: 'WEEE: Elektroaltgeräte Koordinierungsstelle' },
    { code: 'SE', name: 'Sweden', lang: 'Swedish', epr: 'Naturvårdsverket producer register', eprUrl: 'https://www.naturvardsverket.se/', extra: 'WEEE: El-Kretsen' }
  ];

  var CATS = {
    general: { label: 'General goods', ce: false, docs: [] },
    electronics: { label: 'Electronics', ce: true, docs: ['EMC Directive 2014/30/EU', 'Low Voltage Directive 2014/35/EU', 'RoHS 2011/65/EU'] },
    toys: { label: 'Toys', ce: true, docs: ['Toy Safety Directive 2009/48/EC', 'EN 71 series'] },
    cosmetics: { label: 'Cosmetics', ce: false, docs: ['Cosmetics Regulation 1223/2009', 'CPNP notification'] },
    textiles: { label: 'Textiles', ce: false, docs: ['Textile Labelling Regulation 1007/2011'] },
    food_contact: { label: 'Food contact', ce: false, docs: ['Food Contact Materials Regulation 1935/2004', 'Declaration of Compliance'] },
    batteries: { label: 'Batteries', ce: true, docs: ['Battery Regulation 2023/1542', 'CE marking for portable batteries'] }
  };

  var WARNINGS = [
    { id: 'age3', text: 'Not suitable for children under 36 months.' },
    { id: 'choke', text: 'Warning: choking hazard, contains small parts.' },
    { id: 'fire', text: 'Keep away from fire and open flame.' },
    { id: 'button', text: 'Contains a button cell battery. Swallowing can cause serious injury.' },
    { id: 'adult', text: 'Use only under adult supervision.' },
    { id: 'nottoy', text: 'This is not a toy.' }
  ];

  var S = {
    product: '', brand: '', model: '', batch: '', cat: 'general',
    maker: '', makerAddr: '', rp: '', rpMail: '', rpAddr: '',
    markets: ['DE'], warnings: [], warnOwn: '', licensed: false,
    mode: 'single', batchRows: [], batchName: ''
  };

  /* ---------- storage ---------- */
  function save() {
    try { localStorage.setItem('eulabelkit.v1', JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem('eulabelkit.v1');
      if (raw) {
        var o = JSON.parse(raw);
        Object.keys(S).forEach(function (k) { if (o[k] !== undefined && k !== 'licensed' && k !== 'batchRows') S[k] = o[k]; });
      }
      S.licensed = localStorage.getItem('eulabelkit.license') === 'ok';
    } catch (e) {}
  }

  /* ---------- requirements ---------- */
  function requirements() {
    var cat = CATS[S.cat], out = [];
    out.push({
      tag: 'required', title: 'EU responsible person on the product',
      body: 'The name, registered trade name or trade mark, postal address and email or website of the responsible person established in the EU, on the product or its packaging. If the product is too small, on the accompanying document.',
      why: 'GPSR Article 16. Applies to every consumer product, and to distance sales.',
      link: 'https://eur-lex.europa.eu/eli/reg/2023/988/oj', linkText: 'Regulation (EU) 2023/988'
    });
    out.push({
      tag: 'required', title: 'Traceability: maker and batch',
      body: 'The manufacturer name and address plus a batch, serial or model number that lets the unit be identified. Importers must add their own name and address.',
      why: 'GPSR Article 19. Batch marking has to survive the shelf life of the product.',
      link: 'https://eur-lex.europa.eu/eli/reg/2023/988/oj', linkText: 'Regulation (EU) 2023/988'
    });
    out.push({
      tag: 'required', title: 'Warnings in the local language',
      body: 'Warnings and safety information must be in the language of each member state where the product is sold: German for DE and AT, French for FR and BE, and so on.',
      why: 'GPSR Article 21. A single English sheet is the most common listing rejection.',
      link: 'https://eur-lex.europa.eu/eli/reg/2023/988/oj', linkText: 'Regulation (EU) 2023/988'
    });
    out.push({
      tag: 'required', title: 'Listing block for distance sales',
      body: 'The offer must show the responsible person name, postal address and email, the warnings, and the product identification before the buyer orders.',
      why: 'GPSR Article 25. Marketplaces check this field automatically.',
      link: 'https://eur-lex.europa.eu/eli/reg/2023/988/oj', linkText: 'Regulation (EU) 2023/988'
    });

    if (cat.ce) {
      out.push({
        tag: 'conditional', title: 'CE marking and declaration of conformity',
        body: 'Affix the CE mark, keep a technical file, and sign an EU declaration of conformity naming the directives and the harmonised standards you applied: ' + cat.docs.join(', ') + '.',
        why: 'Required for the ' + cat.label.toLowerCase() + ' category before the product can be placed on the EU market.',
        link: 'https://eur-lex.europa.eu/eli/reg/2019/1020/oj', linkText: 'Market surveillance Regulation (EU) 2019/1020'
      });
    }
    if (S.cat === 'electronics' || S.cat === 'batteries') {
      out.push({
        tag: 'conditional', title: 'WEEE registration in every market',
        body: 'Register as an electrical producer in each country before the first sale, and print the crossed-out bin symbol.',
        why: 'WEEE Directive 2012/19/EU. Registration numbers are per country, not EU-wide.',
        link: 'https://eur-lex.europa.eu/eli/dir/2012/19/oj', linkText: 'Directive 2012/19/EU'
      });
    }
    if (S.cat === 'batteries') {
      out.push({
        tag: 'conditional', title: 'Battery Regulation labelling',
        body: 'Capacity label, chemistry symbol, separate collection symbol, and from 2027 a QR code linking to the battery passport data.',
        why: 'Regulation (EU) 2023/1542 replaced the 2006 battery directive and applies in stages.',
        link: 'https://eur-lex.europa.eu/eli/reg/2023/1542/oj', linkText: 'Regulation (EU) 2023/1542'
      });
    }
    if (S.cat === 'cosmetics') {
      out.push({
        tag: 'conditional', title: 'Cosmetic product notification (CPNP)',
        body: 'A responsible person in the EU must notify the product in CPNP before placing it on the market, and keep a product information file.',
        why: 'Cosmetics Regulation 1223/2009. The responsible person is mandatory and cannot be a mailbox.',
        link: 'https://eur-lex.europa.eu/eli/reg/2009/1223/oj', linkText: 'Regulation (EC) 1223/2009'
      });
    }
    if (S.cat === 'food_contact') {
      out.push({
        tag: 'conditional', title: 'Declaration of Compliance for food contact',
        body: 'A written declaration that the material complies with 1935/2004 and the specific measure for the material, plus migration test evidence.',
        why: 'Regulation (EC) 1935/2004 Article 16.',
        link: 'https://eur-lex.europa.eu/eli/reg/2004/1935/oj', linkText: 'Regulation (EC) 1935/2004'
      });
    }

    out.push({
      tag: 'required', title: 'Packaging EPR registration',
      body: 'Register the packaging you put on the market in each country and license the volume. ' + (S.markets.length ? S.markets.map(function (c) { var m = MARKETS.find(function (x) { return x.code === c; }); return m ? m.code + ': ' + m.epr : ''; }).filter(Boolean).join(' · ') : 'Pick a market to list the registers.'),
      why: 'Extended producer responsibility applies to the packaging, not the product, and is separate from GPSR.',
      link: S.markets.length ? (MARKETS.find(function (x) { return x.code === S.markets[0]; }) || {}).eprUrl : 'https://eur-lex.europa.eu/eli/reg/2025/40/oj',
      linkText: 'Open the first market register'
    });
    out.push({
      tag: 'info', state: 'From 12 Aug 2026', title: 'Packaging and Packaging Waste Regulation',
      body: 'PPWR adds harmonised recyclability requirements, a material composition label on packaging, and minimum recycled content. If your packaging is printed before August 2026, plan the label change now.',
      why: 'Regulation (EU) 2025/40. It replaces the packaging directive and applies directly in every member state.',
      link: 'https://eur-lex.europa.eu/eli/reg/2025/40/oj', linkText: 'Regulation (EU) 2025/40'
    });
    return out;
  }

  /* ---------- render ---------- */
  function renderChecklist() {
    var host = $('checklist');
    if (!host) return;
    host.innerHTML = '';
    requirements().forEach(function (r, i) {
      var row = document.createElement('div');
      row.className = 'row' + (r.tag === 'conditional' ? ' is-cond' : '');
      var id = 'row-d' + i;
      row.innerHTML = '<span class="row-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<button class="row-btn" type="button" aria-expanded="false" aria-controls="' + id + '">' +
          '<span class="row-title">' + esc(r.title) + '</span>' +
          '<span class="row-state">' + esc(r.state || (r.tag === 'required' ? 'Required' : r.tag === 'conditional' ? 'If it applies' : 'Note')) + '</span>' +
        '</button>' +
        '<div class="row-detail" id="' + id + '" hidden><p>' + esc(r.body) + '</p><p class="why">' + esc(r.why) + '</p>' +
        '<a href="' + r.link + '" target="_blank" rel="noopener">' + esc(r.linkText) + '</a></div>';
      var btn = row.querySelector('.row-btn');
      btn.addEventListener('click', function () {
        var d = row.querySelector('.row-detail');
        var open = d.hidden;
        d.hidden = !open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      host.appendChild(row);
    });
  }

  function renderChips() {
    var host = $('markets');
    host.innerHTML = '';
    MARKETS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (S.markets.indexOf(m.code) >= 0 ? ' is-on' : '');
      b.textContent = m.code + ' ' + m.name;
      b.onclick = function () {
        var i = S.markets.indexOf(m.code);
        if (i >= 0) S.markets.splice(i, 1); else S.markets.push(m.code);
        renderChips(); renderChecklist(); renderSpecimen(); save();
      };
      host.appendChild(b);
    });
  }

  function renderWarnings() {
    var host = $('warnings');
    host.innerHTML = '';
    WARNINGS.forEach(function (w) {
      var l = document.createElement('label');
      l.className = 'opt';
      l.innerHTML = '<input type="checkbox" ' + (S.warnings.indexOf(w.id) >= 0 ? 'checked' : '') + '><span>' + esc(w.text) + '</span>';
      l.querySelector('input').onchange = function (e) {
        var i = S.warnings.indexOf(w.id);
        if (e.target.checked && i < 0) S.warnings.push(w.id);
        if (!e.target.checked && i >= 0) S.warnings.splice(i, 1);
        renderSpecimen(); save();
      };
      host.appendChild(l);
    });
  }

  function warnLines() {
    var list = S.warnings.map(function (id) { return (WARNINGS.find(function (w) { return w.id === id; }) || {}).text; }).filter(Boolean);
    if (S.warnOwn.trim()) list.push(S.warnOwn.trim());
    return list;
  }

  function renderSpecimen() {
    var host = $('spec');
    if (!host) return;
    var w = warnLines();
    host.innerHTML =
      '<div class="spec-name' + (S.product ? '' : ' is-missing') + '">' + esc(S.product || 'Product name') + '</div>' +
      '<div class="spec-code' + ((S.brand || S.model) ? '' : ' is-missing') + '">' + esc([S.brand, S.model].filter(Boolean).join(' ') || 'Brand and model') + '</div>' +
      '<div class="spec-batch' + (S.batch ? '' : ' is-missing') + '">' + esc(S.batch ? 'Batch ' + S.batch : 'Batch number') + '</div>' +
      '<div class="spec-maker' + (S.maker ? '' : ' is-missing') + '">' + escBr(S.maker || 'Manufacturer name') + (S.makerAddr ? '<br>' + escBr(S.makerAddr) : '') + '</div>' +
      '<div class="spec-rp">' +
        '<span class="rp-k">EU responsible person</span>' +
        '<span class="rp-n' + (S.rp ? '' : ' is-missing') + '">' + esc(S.rp || 'Not set') + '</span>' +
        '<span class="rp-a' + (S.rpAddr ? '' : ' is-missing') + '">' + escBr(S.rpAddr || 'Postal address') + '</span>' +
        '<span class="rp-e' + (S.rpMail ? '' : ' is-missing') + '">' + esc(S.rpMail || 'Email') + '</span>' +
      '</div>' +
      '<div class="spec-foot"><span class="ce' + (CATS[S.cat].ce ? '' : ' is-missing') + '">' + (CATS[S.cat].ce ? 'CE' : '') + '</span>' +
      '<span class="warn">' + (w.length ? esc(w.join(' ')) : '<span class="is-missing">Warnings appear here</span>') + '</span></div>';
    renderReadiness();
  }

  function renderReadiness() {
    var need = [
      ['product name', S.product],
      ['manufacturer', S.maker],
      ['responsible person', S.rp],
      ['their address', S.rpAddr],
      ['their email', S.rpMail]
    ];
    var missing = need.filter(function (n) { return !String(n[1] || '').trim(); });
    var done = need.length - missing.length;
    var label = $('readiness');
    if (label) label.textContent = done + ' of ' + need.length + ' required';
    var note = $('note');
    if (note) {
      note.className = 'note';
      note.textContent = missing.length
        ? 'Missing: ' + missing.map(function (m) { return m[0]; }).join(', ') + '.'
        : 'Ready. Print the pack, cut on the marks.';
    }
  }

  /* ---------- pack ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function escBr(s) { return esc(s).replace(/\n/g, '<br>'); }
  function dateStr() { var d = new Date(); return d.toISOString().slice(0, 10); }

  var SAMPLE_CSV = 'product,brand,model,batch,quantity\nCeramic mug 350 ml,Northline,NL-MUG-350,2026-11-A,8\nLinen tote bag,Northline,NL-TOTE-01,2026-11-B,12\nScented candle 200 g,Northline,NL-CAN-200,2026-11-C,6';

  function parseCSV(text) {
    var rows = [], row = [], cur = '', quoted = false;
    text = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else { quoted = false; } }
        else { cur += c; }
      } else if (c === '"') { quoted = true; }
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else { cur += c; }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }

  function batchItems() {
    return (S.batchRows || []).map(function (r) {
      var q = parseInt(r.quantity, 10);
      if (!q || q < 1) q = 1;
      if (q > 50) q = 50;
      return { product: r.product, brand: r.brand, model: r.model, batch: r.batch, qty: q };
    });
  }
  function totalLabels() {
    return batchItems().reduce(function (a, b) { return a + b.qty; }, 0);
  }

  function loadCSV(text, name) {
    var rows = parseCSV(text);
    if (!rows.length) { toast('That file is empty'); return; }
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var idx = { product: head.indexOf('product'), brand: head.indexOf('brand'), model: head.indexOf('model'), batch: head.indexOf('batch'), quantity: head.indexOf('quantity') };
    var body;
    if (idx.product < 0) { idx = { product: 0, brand: 1, model: 2, batch: 3, quantity: 4 }; body = rows; }
    else { body = rows.slice(1); }
    S.batchRows = body.map(function (r) {
      return {
        product: String(r[idx.product] || '').trim(),
        brand: idx.brand >= 0 ? String(r[idx.brand] || '').trim() : '',
        model: idx.model >= 0 ? String(r[idx.model] || '').trim() : '',
        batch: idx.batch >= 0 ? String(r[idx.batch] || '').trim() : '',
        quantity: idx.quantity >= 0 ? String(r[idx.quantity] || '').trim() : '1'
      };
    }).filter(function (r) { return r.product; });
    S.batchName = name || '';
    renderBatch();
    toast(S.batchRows.length ? S.batchRows.length + ' rows loaded' : 'No product column found');
  }

  function renderBatch() {
    var host = $('batchTable');
    if (!host) return;
    var items = batchItems(), total = totalLabels();
    $('batchTotal').textContent = total + ' labels';
    $('batchCount').textContent = items.length ? items.length + ' SKUs · ' + total + ' labels' : 'No file loaded';
    if (S.mode === 'batch' && $('readiness')) $('readiness').textContent = items.length ? items.length + ' SKUs · ' + total + ' labels' : 'No file yet';
    if ($('labelSize')) $('labelSize').hidden = S.mode === 'batch';
    if (!items.length) { host.innerHTML = '<div class="batch-empty">Drop a CSV or load the sample to see the table.</div>'; return; }
    var shown = items.slice(0, 40).map(function (it) {
      return '<tr><td>' + esc(it.product) + '</td><td>' + esc(it.model) + '</td><td>' + esc(it.batch) + '</td><td class="qty">' + it.qty + '</td></tr>';
    }).join('');
    host.innerHTML = '<table><thead><tr><th>Product</th><th>Model</th><th>Batch</th><th style="text-align:right">Labels</th></tr></thead><tbody>' + shown + '</tbody></table>' +
      (items.length > 40 ? '<div class="batch-empty">' + (items.length - 40) + ' more rows not shown</div>' : '');
  }

  function labelBlock(it) {
    it = it || S;
    var w = warnLines();
    return '<div class="lbl">' +
      '<div><div class="n">' + esc(it.product || 'Product') + '</div>' +
      '<div class="r">' + esc(it.brand) + (it.model ? ' · ' + esc(it.model) : '') + (it.batch ? ' · batch ' + esc(it.batch) : '') + '</div>' +
      '<div class="r">' + esc(S.maker) + '</div>' +
      '<div class="r">' + esc(S.makerAddr).replace(/\n/g, ', ') + '</div>' +
      '<div class="r"><b>EU RP:</b> ' + esc(S.rp) + ' · ' + esc(S.rpAddr).replace(/\n/g, ', ') + ' · ' + esc(S.rpMail) + '</div></div>' +
      '<div class="w">' + (CATS[S.cat].ce ? 'CE · ' : '') + (w.length ? w.map(esc).join(' ') : '') + '</div>' +
      '</div>';
  }

  function pageLabels(items) {
    var labels = [];
    if (items) { items.forEach(function (it) { for (var i = 0; i < it.qty; i++) labels.push(labelBlock(it)); }); }
    else { for (var j = 0; j < 8; j++) labels.push(labelBlock(S)); }
    var per = 8, pages = [], total = Math.ceil(labels.length / per);
    for (var k = 0; k < labels.length; k += per) {
      pages.push('<section class="page">' +
        '<h1>Product labels' + (total > 1 ? ' ' + (k / per + 1) + ' of ' + total : '') + '</h1>' +
        '<p class="meta">' + esc(S.brand || 'Untitled') + (items ? ' · batch sheet' : ' · ' + esc(S.product || 'Product')) + ' · ' + labels.length + ' labels · printed ' + dateStr() + ' · cut on the lines, 70 × 50 mm</p>' +
        '<div class="lbl-grid">' + labels.slice(k, k + per).join('') + '</div>' +
        '</section>');
    }
    return pages;
  }

  function pageMandate() {
    return '<section class="page">' +
      '<h1>Designation of an EU responsible person</h1>' +
      '<p class="meta">Under Article 16 of Regulation (EU) 2023/988 on general product safety</p>' +
      '<p>This document records that <b>' + esc(S.maker || '[manufacturer]') + '</b>, established at ' + escBr(S.makerAddr || '[address]') + ', here called the manufacturer, designates</p>' +
      '<p><b>' + esc(S.rp || '[responsible person]') + '</b><br>' + escBr(S.rpAddr || '[postal address]') + '<br>' + esc(S.rpMail || '[email]') + '</p>' +
      '<p>as its responsible person within the meaning of Article 16(1) of Regulation (EU) 2023/988 for the products listed below.</p>' +
      '<div class="rule"></div>' +
      '<table class="chk"><tr><th>Product</th><th>Model</th><th>Batch</th></tr><tr><td>' + esc(S.product) + '</td><td>' + esc(S.model) + '</td><td>' + esc(S.batch) + '</td></tr></table>' +
      '<p style="margin-top:6mm">The responsible person confirms that it will keep the technical documentation and the declaration of conformity available for the market surveillance authorities, cooperate with them on request, and inform the manufacturer without delay if a product presents a risk.</p>' +
      '<div class="sig"><div>For the manufacturer<br>' + esc(S.maker) + '<br>Name, position, date</div><div>For the responsible person<br>' + esc(S.rp) + '<br>Name, position, date</div></div>' +
      '</section>';
  }

  function pageDoc() {
    return '<section class="page">' +
      '<h1>EU declaration of conformity</h1>' +
      '<p class="meta">' + esc(S.product) + ' · ' + esc(S.model) + '</p>' +
      '<p><b>1. Product:</b> ' + esc(S.product) + ', model ' + esc(S.model) + ', batch ' + esc(S.batch) + '</p>' +
      '<p><b>2. Manufacturer:</b> ' + esc(S.maker) + ', ' + escBr(S.makerAddr) + '</p>' +
      '<p><b>3. Authorised representative in the EU:</b> ' + esc(S.rp) + ', ' + escBr(S.rpAddr) + ', ' + esc(S.rpMail) + '</p>' +
      '<p><b>4. Object of the declaration:</b> the product described above, in the version placed on the market.</p>' +
      '<p><b>5. The object of the declaration is in conformity with the relevant Union harmonisation legislation:</b> ' + esc(CATS[S.cat].docs.join('; ')) + '.</p>' +
      '<p><b>6. Harmonised standards applied:</b> ' + (S.cat === 'toys' ? 'EN 71-1, EN 71-2, EN 71-3' : S.cat === 'electronics' ? 'EN IEC 55014-1, EN IEC 61000-3-2, EN 62368-1' : 'EN 62133-2, EN IEC 63000') + '.</p>' +
      '<p><b>7. Additional information:</b> technical documentation is held by the manufacturer and is available to the market surveillance authorities.</p>' +
      '<p style="margin-top:8mm">Signed for and on behalf of: ' + esc(S.maker) + '</p>' +
      '<div class="sig"><div>Place and date</div><div>Name, position, signature</div></div>' +
      '</section>';
  }

  function listingText() {
    var w = warnLines();
    return 'EU responsible person: ' + (S.rp || '[name]') + '\n' + (S.rpAddr || '[address]') + '\n' + (S.rpMail || '[email]') + '\n\n' +
      'Product identification: ' + (S.brand || '[brand]') + ' ' + (S.model || '[model]') + ', batch ' + (S.batch || '[batch]') + '\n\n' +
      'Manufacturer: ' + (S.maker || '[manufacturer]') + ', ' + String(S.makerAddr || '').replace(/\n/g, ', ') +
      (w.length ? '\n\nWarnings:\n' + w.map(function (x) { return '- ' + x; }).join('\n') : '');
  }

  function marketRows() {
    return S.markets.map(function (code) {
      var m = MARKETS.find(function (x) { return x.code === code; });
      return '<tr><td><b>' + m.code + '</b> ' + esc(m.name) + '</td><td>' + esc(m.lang) + '</td><td>' + esc(m.epr) + '</td><td>' + esc(m.extra || '') + '</td></tr>';
    }).join('');
  }

  function pageListing() {
    return '<section class="page">' +
      '<h1>Listing block and market checklist</h1>' +
      '<p class="meta">Paste the block into the listing description. The table is what to register before the first sale.</p>' +
      '<h2>Listing text</h2>' +
      '<div class="listing">' + esc(listingText()) + '</div>' +
      '<h2 style="margin-top:8mm">Markets selected</h2>' +
      '<table class="chk"><tr><th>Market</th><th>Warnings language</th><th>Packaging EPR</th><th>Also needed</th></tr>' + marketRows() + '</table>' +
      '<p style="margin-top:6mm;font-size:9pt;color:#555">Generated by EU Label Kit on ' + dateStr() + '. Informational template, not legal advice. Verify each register before printing a production run.</p>' +
      '</section>';
  }

  function pageManifest(items) {
    var rows = items.map(function (it) {
      return '<tr><td>' + esc(it.product) + '</td><td>' + esc(it.model) + '</td><td>' + esc(it.batch) + '</td><td>' + it.qty + '</td></tr>';
    }).join('');
    return '<section class="page">' +
      '<h1>Batch manifest</h1>' +
      '<p class="meta">' + items.length + ' SKUs · ' + totalLabels() + ' labels · printed ' + dateStr() + '</p>' +
      '<table class="chk"><tr><th>Product</th><th>Model</th><th>Batch</th><th>Labels</th></tr>' + rows + '</table>' +
      '<h2 style="margin-top:8mm">Listing text</h2>' +
      '<div class="listing">' + esc(listingText().replace(/batch [^\n]*/, 'batch per SKU, see manifest')) + '</div>' +
      '<p style="margin-top:6mm;font-size:9pt;color:#555">Generated by EU Label Kit on ' + dateStr() + '. Informational template, not legal advice.</p>' +
      '</section>';
  }

  function buildPack() {
    var items = S.mode === 'batch' ? batchItems() : null;
    var pages = [];
    if (S.mode === 'batch') {
      if (!items.length) { toast('Load a CSV first'); return; }
      pages = pages.concat(pageLabels(items));
      pages.push(pageManifest(items));
    } else {
      pages = pages.concat(pageLabels(null));
      pages.push(pageMandate());
      if (CATS[S.cat].ce) pages.push(pageDoc());
      pages.push(pageListing());
    }
    var wm = S.licensed ? '' : '<div class="wm">PREVIEW</div>';
    $('pack').innerHTML = wm ? pages.map(function (p) { return p.replace('</section>', wm + '</section>'); }).join('') : pages.join('');
  }

  function printPack() {
    if (!S.licensed) { openGate(); return; }
    if (!S.rp || !S.rpAddr || !S.rpMail) { toast('Fill the responsible person and email first'); return; }
    if (S.mode === 'batch') {
      if (!batchItems().length) { toast('Load a CSV or the sample first'); return; }
      if (totalLabels() > 600) { toast('That is over 600 labels. Split the file.'); return; }
    } else if (!S.product) {
      toast('Fill the product name first');
      return;
    }
    buildPack();
    setTimeout(function () { window.print(); }, 120);
  }

  function setMode(m) {
    S.mode = m === 'batch' ? 'batch' : 'single';
    [].forEach.call(document.querySelectorAll('.switch-btn'), function (b) {
      var on = b.getAttribute('data-mode') === S.mode;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('productSet').hidden = S.mode === 'batch';
    $('batchSet').hidden = S.mode !== 'batch';
    var sheet = document.querySelector('.sheet');
    if (sheet) sheet.hidden = S.mode === 'batch';
    if ($('note')) $('note').hidden = S.mode === 'batch';
    if ($('batchPanel')) $('batchPanel').hidden = S.mode !== 'batch';
    renderBatch();
    if (S.mode === 'single') renderReadiness();
    save();
  }

  function sample() {
    S.product = 'Ceramic mug, 350 ml';
    S.brand = 'Northline';
    S.model = 'NL-MUG-350';
    S.batch = '2026-11-A';
    S.maker = 'Ningbo Homeware Co., Ltd';
    S.makerAddr = 'No. 88 Jiangnan Road\nNingbo, Zhejiang 315000, China';
    S.rp = 'Northline EU BV';
    S.rpMail = 'compliance@northline.eu';
    S.rpAddr = 'Keizersgracht 241\n1016 EA Amsterdam, Netherlands';
    S.markets = ['DE', 'FR'];
    if (!S.warnings.length) S.warnings = ['age3'];
    [['fProduct', 'product'], ['fBrand', 'brand'], ['fModel', 'model'], ['fBatch', 'batch'], ['fMaker', 'maker'], ['fMakerAddr', 'makerAddr'], ['fRp', 'rp'], ['fRpMail', 'rpMail'], ['fRpAddr', 'rpAddr']].forEach(function (p) {
      var el = $(p[0]); if (el) el.value = S[p[1]] || '';
    });
    renderChips(); renderWarnings(); renderSpecimen(); renderChecklist(); save();
    toast('Example filled in');
  }

  function keyOk(raw) {
    var k = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!/^ELK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(k)) return false;
    var parts = k.split('-');
    var sum = 0, s = parts[1] + parts[2];
    for (var i = 0; i < s.length; i++) sum = (sum * 31 + s.charCodeAt(i)) % 4096;
    var expect = sum.toString(32).toUpperCase().padStart(3, '0');
    return parts[3].slice(0, 3) === expect;
  }
  async function activate(raw) {
    var msg = $('gateMsg');
    msg.className = 'gate-msg';
    msg.textContent = 'Checking…';
    if (CONFIG.validateUrl && CONFIG.productId) {
      try {
        var body = new URLSearchParams({ license_key: raw.trim(), product_id: CONFIG.productId });
        var r = await fetch(CONFIG.validateUrl, { method: 'POST', body: body });
        var j = await r.json();
        if (j && j.valid) { grant(); msg.className = 'gate-msg good'; msg.textContent = 'Activated.'; return; }
      } catch (e) {}
    }
    if (keyOk(raw)) { grant(); msg.className = 'gate-msg good'; msg.textContent = 'Activated.'; return; }
    msg.className = 'gate-msg bad';
    msg.textContent = 'That key does not check out. Copy it from the receipt email.';
  }
  function grant() {
    S.licensed = true;
    try { localStorage.setItem('eulabelkit.license', 'ok'); } catch (e) {}
    setTimeout(function () { closeGate(); buildPack(); toast('Pack unlocked. Generate pack to print.'); }, 500);
  }
  function openGate() { $('gate').hidden = false; }
  function closeGate() { $('gate').hidden = true; }

  /* ---------- toast ---------- */
  function toast(text) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = text;
    $('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ---------- wiring ---------- */
  function wire() {
    load();
    renderChips(); renderWarnings(); renderChecklist(); renderSpecimen();

    var map = { fProduct: 'product', fBrand: 'brand', fModel: 'model', fBatch: 'batch', fCat: 'cat', fMaker: 'maker', fMakerAddr: 'makerAddr', fRp: 'rp', fRpMail: 'rpMail', fRpAddr: 'rpAddr', fWarn: 'warnOwn' };
    Object.keys(map).forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.value = S[map[id]] || '';
      el.addEventListener('input', function (e) {
        S[map[id]] = e.target.value;
        renderSpecimen(); renderChecklist(); save();
      });
    });
    $('fCat').addEventListener('change', function (e) { S.cat = e.target.value; renderChecklist(); renderSpecimen(); save(); });

    $('btnPack').addEventListener('click', printPack);
    if ($('btnPack2')) $('btnPack2').addEventListener('click', printPack);
    if ($('btnSample')) $('btnSample').addEventListener('click', sample);
    $('btnLicense').addEventListener('click', openGate);
    $('gateClose').addEventListener('click', closeGate);
    $('gate').addEventListener('click', function (e) { if (e.target === $('gate')) closeGate(); });
    $('keyApply').addEventListener('click', function () { activate($('keyInput').value); });
    $('keyInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') activate(e.target.value); });

    [].forEach.call(document.querySelectorAll('.switch-btn'), function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });
    $('pickFile').addEventListener('click', function () { $('csvFile').click(); });
    $('csvFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { loadCSV(String(r.result), f.name); };
      r.readAsText(f);
    });
    var dz = $('dropZone');
    ['dragenter', 'dragover'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-over'); });
    });
    dz.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { loadCSV(String(r.result), f.name); };
      r.readAsText(f);
    });
    $('csvPaste').addEventListener('input', function (e) {
      var v = e.target.value.trim();
      if (v) loadCSV(v, 'pasted');
    });
    $('loadSample').addEventListener('click', function () { loadCSV(SAMPLE_CSV, 'sample.csv'); });

    if (CONFIG.buyUrl) $('buyLink').href = CONFIG.buyUrl;
    else {
      $('buyLink').textContent = 'Buy for $9';
      $('buyLink').onclick = function (e) { e.preventDefault(); $('gateMsg').className = 'gate-msg'; $('gateMsg').textContent = 'Checkout opens to the first buyers this week. If you already have a code, paste it below.'; };
    }
    window.addEventListener('beforeunload', save);
    setMode(S.mode);
    if (S.licensed) buildPack();
  }

  window.EULabelKitDebug = { state: S, requirements: requirements, keyOk: keyOk, buildPack: buildPack, activate: activate, loadCSV: loadCSV, parseCSV: parseCSV, setMode: setMode, totalLabels: totalLabels };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();

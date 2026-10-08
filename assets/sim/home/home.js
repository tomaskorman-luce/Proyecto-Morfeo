/* Test 4 · "Continúa tu búsqueda". Sobre la Home capturada añade el bloque "Búsquedas recientes"
   al desplegable del campo Destino (escritorio) y a la pantalla "Elige tu origen y destino" (móvil).
   La presentación (index.html) manda el estado por postMessage; si la maqueta se abre sola, funciona por su cuenta. */
(function () {
  var doc = document, root = doc.documentElement;
  var platform = root.getAttribute('data-platform');
  var embedded = window.parent !== window;

  var RECENT = [
    { html: '<strong>Madrid</strong>, Comunidad de Madrid, España', text: 'Madrid, Comunidad de Madrid, España' },
    { html: '<strong>Hotel Riu Plaza España</strong> <span class="mf-stars">★★★★</span>, Madrid, España', text: 'Hotel Riu Plaza España, Madrid, España' }
  ];
  var POPULAR = [
    { html: '<strong>Benidorm</strong>, Comunidad Valenciana, España', text: 'Benidorm, Comunidad Valenciana, España' },
    { html: '<strong>Tenerife</strong>, Islas Canarias, España', text: 'Tenerife, Islas Canarias, España' },
    { html: '<strong>Punta Cana</strong>, República Dominicana', text: 'Punta Cana, República Dominicana' }
  ];

  /* Clases de la web real para que el bloque herede su aspecto */
  var C = platform === 'mobile'
    ? { hdr: 'HeaderSuggestionMobile-babylon-namespace__sc-4831f4d0-1 jUtDwl', ico: 'Icon-babylon-namespace__sc-64476a4f-0 IconWrapperMobile-babylon-namespace__sc-4831f4d0-2 mZxCz cynGIc', row: 'LabelSuggestionMobile-babylon-namespace__sc-4831f4d0-3 bTlkKp' }
    : { hdr: 'HeaderSuggestionDesktop-babylon-namespace__sc-3d29fa62-2 dBHsMv', ico: 'Icon-babylon-namespace__sc-64476a4f-0 IconWrapperDesktop-babylon-namespace__sc-3d29fa62-3 mZxCz irQzWj', row: 'LabelSuggestionDesktop-babylon-namespace__sc-3d29fa62-4 geA-DvC' };

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fold(s) { return s.split('').map(function (c) { return c.normalize('NFD').charAt(0).toLowerCase(); }).join(''); }
  function highlight(text, q) {
    var i = fold(text).indexOf(fold(q));
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<strong>' + esc(text.slice(i, i + q.length)) + '</strong>' + esc(text.slice(i + q.length));
  }
  function header(icon, label) { return '<div class="' + C.hdr + '"><i class="' + C.ico + ' ' + icon + '"></i>' + label + '</div>'; }
  function row(item, q) {
    return '<div class="mf-row"><div class="' + C.row + '" data-text="' + esc(item.text) + '"><span>' + (q ? highlight(item.text, q) : item.html) + '</span></div></div>';
  }
  function testOn() { return !root.classList.contains('mf-test-off'); }

  function listHtml(q) {
    /* Sin el test la web original no sugiere nada con el campo vacío */
    if (!testOn() && !q) return '';
    var fits = function (it) { return !q || fold(it.text).indexOf(fold(q)) >= 0; };
    var recent = testOn() ? RECENT.filter(fits) : [];
    var popular = POPULAR.filter(fits);
    var h = '';
    if (recent.length) {
      h += '<div class="mf-recent mf-recent__group"><span class="mf-new">Nuevo</span>' + header('nico-clock-history', 'Búsquedas recientes') +
        recent.map(function (it) { return row(it, q); }).join('') + '</div>';
    }
    if (popular.length) h += header('nico-fire', 'Destinos populares') + popular.map(function (it) { return row(it, q); }).join('');
    return h;
  }

  /* Etiqueta flotante del campo: pequeña arriba cuando tiene foco o valor */
  function floatLabel(label, on) {
    if (!label) return;
    var cls = label.className;
    label.className = on ? cls.replace(/\bhQzjmq\b/, 'cbbHdC') : cls.replace(/\bcbbHdC\b/, 'hQzjmq');
  }

  /* ---------------- Escritorio ---------------- */
  function initDesktop() {
    var block = doc.querySelector('[data-mf="dest"]');
    if (!block) return;
    var wrap = block.querySelector('[data-testid="Input"]');
    var input = block.querySelector('input');
    var label = block.querySelector('label');
    var pop = doc.createElement('div');
    pop.className = 'mf-pop'; pop.hidden = true;
    pop.innerHTML = '<div class="mf-pop__content"></div>';
    block.appendChild(pop);
    var content = pop.firstChild;

    function render() {
      var h = listHtml(input.value.trim());
      content.innerHTML = h;
      pop.hidden = !h;
      wrap.classList.toggle('has-error', !h && !input.value.trim()); /* campo vacío sin sugerencias: rojo, como en la web real */
    }
    /* En el modal de la presentación el iframe es bajo: se coloca el buscador donde el desplegable (que se abre
       hacia arriba) quepa entero, y se vuelve a colocar si el iframe cambia de tamaño antes de que el usuario toque nada. */
    var NEED = 300, touched = false;
    function align(force) {
      var vh = window.innerHeight, r = block.getBoundingClientRect();
      if (vh < 200) return;
      if (!force && r.top >= NEED && r.bottom <= vh) return;
      var target = Math.max(NEED, Math.min(vh * 0.62, vh - 90));
      window.scrollTo(0, window.scrollY + r.top - target);
    }
    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { passive: true }); });
    window.addEventListener('resize', function () { if (!touched) align(true); });
    /* La maqueta arranca con el selector ya desplegado, para que se vea el bloque sin tener que pulsar */
    window.addEventListener('load', function () { setTimeout(function () { align(true); open(); }, 60); });

    function open() { wrap.classList.add('is-focused'); floatLabel(label, true); render(); align(false); }
    function close() { wrap.classList.remove('is-focused', 'has-error'); pop.hidden = true; floatLabel(label, !!input.value); }

    input.addEventListener('focus', open);
    input.addEventListener('click', open);
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); input.blur(); } });
    content.addEventListener('click', function (e) {
      var r = e.target.closest('[data-text]');
      if (!r) return;
      input.value = r.getAttribute('data-text');
      close(); input.blur();
    });
    doc.addEventListener('click', function (e) { if (!block.contains(e.target)) close(); });
    root.addEventListener('mf-state', function () { if (!pop.hidden || wrap.classList.contains('is-focused')) render(); });
  }

  /* ---------------- Móvil ---------------- */
  function initMobile() {
    var field = doc.querySelector('[data-mf="dest-field"]');
    var modal = doc.getElementById('mf-modal');
    if (!field || !modal) return;
    var fieldLabel = field.closest('[data-testid="Input"]').querySelector('label');
    var pane = modal.querySelector('[class*="TabsContent"].is-active [data-testid="Autocomplete"]');
    var mInput = doc.getElementById('mf-dest-input');
    var list = doc.createElement('div');
    list.className = 'mf-m-list'; list.hidden = true;
    pane.appendChild(list);
    field.readOnly = true;

    function render() {
      var h = listHtml(mInput.value.trim());
      list.innerHTML = h;
      list.hidden = !h;
    }
    function open() {
      modal.hidden = false;
      mInput.value = '';
      render();
      setTimeout(function () { mInput.focus(); }, 30);
    }
    function close() { modal.hidden = true; }

    field.addEventListener('click', open);
    field.closest('[data-testid="Input"]').addEventListener('click', open);
    mInput.addEventListener('input', render);
    list.addEventListener('click', function (e) {
      var r = e.target.closest('[data-text]');
      if (!r) return;
      field.value = r.getAttribute('data-text');
      field.classList.add('mf-has-value');
      floatLabel(fieldLabel, true);
      close();
    });
    modal.querySelector('[data-mf="close"]').addEventListener('click', close);
    root.addEventListener('mf-state', function () { if (!modal.hidden) render(); });
  }

  /* ---------------- Estado compartido con la presentación ---------------- */
  doc.addEventListener('click', function (e) { if (e.target.closest('a[href]')) e.preventDefault(); });
  doc.addEventListener('submit', function (e) { e.preventDefault(); });

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.morfeo !== 'state') return;
    root.classList.toggle('mf-test-off', !d.test);
    root.dispatchEvent(new Event('mf-state'));
  });

  if (platform === 'mobile') initMobile(); else initDesktop();
  if (embedded) window.parent.postMessage({ morfeo: 'ready' }, '*');
})();

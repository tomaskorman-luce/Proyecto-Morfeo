/* Lógica del aviso del test 1. La presentación (index.html) manda el estado por postMessage;
   si la maqueta se abre sola, funciona por su cuenta. */
(function () {
  var TOTAL = (23 * 3600 + 41 * 60 + 8) * 1000;
  var box = document.getElementById('mf-cabin');
  var clock = document.getElementById('mf-clock');
  var title = document.getElementById('mf-title');
  var sub = document.getElementById('mf-sub');
  var cta = document.getElementById('mf-cta');
  var embedded = window.parent !== window;
  var TEXT = {
    on: { title: title.textContent, sub: sub.textContent, cta: cta.textContent },
    expired: { title: 'Tu cabina ha caducado', sub: 'El precio y la cabina han vuelto a quedar libres para otros viajeros.', cta: 'Cabina liberada' },
    confirmed: { title: '¡Cabina confirmada!', sub: 'Te llevamos al checkout para completar tu reserva.', cta: 'Confirmada' }
  };
  var state = { test: true, endsAt: Date.now() + TOTAL, confirmed: false };
  var timer = null;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  }
  function show(t) { title.textContent = t.title; sub.textContent = t.sub; cta.textContent = t.cta; }

  function render() {
    document.documentElement.classList.toggle('mf-test-off', !state.test);
    var left = state.endsAt - Date.now();
    var expired = !state.confirmed && left <= 0;
    clock.textContent = fmt(left);
    box.classList.toggle('is-confirmed', state.confirmed);
    box.classList.toggle('is-expired', expired);
    show(state.confirmed ? TEXT.confirmed : expired ? TEXT.expired : TEXT.on);
    cta.disabled = state.confirmed || expired;
  }
  function tick() {
    clearInterval(timer);
    render();
    if (state.test && !state.confirmed && state.endsAt > Date.now()) timer = setInterval(render, 250);
  }

  cta.addEventListener('click', function () {
    if (embedded) window.parent.postMessage({ morfeo: 'confirm' }, '*');
    else { state.confirmed = true; tick(); }
  });

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.morfeo !== 'state') return;
    state = { test: !!d.test, endsAt: +d.endsAt, confirmed: !!d.confirmed };
    tick();
  });

  tick();
  if (embedded) window.parent.postMessage({ morfeo: 'ready' }, '*');
})();

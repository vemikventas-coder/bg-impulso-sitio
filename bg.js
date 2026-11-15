/* BG v11 · núcleo: revelado al entrar, cifras que cuentan, interruptor de IVA, enlaces de WhatsApp y barra.
   Las secciones usan window.BGv11 (app, reducido, observar, alVer, wa, dinero). */
(function () {
  var app = document.getElementById('bg-app');
  if (!app) return;
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
  var BG = (window.BGv11 = { app: app, reducido: reducido });
  app.classList.add('bg-js');

  BG.dinero = function (n) { return '$' + fmt.format(n); };
  BG.wa = function (texto) { return 'https://wa.me/' + app.dataset.bgWa + '?text=' + encodeURIComponent(texto); };

  /* ── Revelado: marca .bg-visto la primera vez que el elemento entra en pantalla ── */
  var puedeObservar = 'IntersectionObserver' in window && !reducido;
  var io = puedeObservar ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('bg-visto');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }) : null;
  BG.observar = function (raiz) {
    (raiz || app).querySelectorAll('[data-bg-ver]').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('bg-visto');
    });
  };
  /* alVer(el, fn): ejecuta fn una vez cuando el elemento entra en pantalla (sin observador: de inmediato). */
  BG.alVer = function (el, fn, margen) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    var o = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { o.disconnect(); fn(el); }
    }, { rootMargin: margen || '0px 0px -10% 0px', threshold: 0.05 });
    o.observe(el);
  };
  BG.observar();

  /* ── Cifras que cuentan hasta su valor ── */
  app.querySelectorAll('[data-bg-cuenta]').forEach(function (el) {
    var meta = Number(el.dataset.bgCuenta);
    if (reducido || !isFinite(meta)) return;
    el.textContent = '0';
    BG.alVer(el, function () {
      var inicio = performance.now(), dur = 1300;
      (function paso(t) {
        var p = Math.min(1, (t - inicio) / dur), suave = 1 - Math.pow(2, -10 * p);
        el.textContent = fmt.format(p >= 1 ? meta : Math.round(meta * suave));
        if (p < 1) requestAnimationFrame(paso);
      })(inicio);
    });
  });

  /* ── Interruptor de IVA: cambia todos los precios de la página ── */
  BG.iva = function (modo) {
    app.dataset.bgIva = modo;
    app.querySelectorAll('[data-bg-precio]').forEach(function (p) {
      var base = Number(p.dataset.bgPrecio), total = Math.round(base * 116) / 100;
      var num = p.querySelector('[data-bg-precio-num]'), nota = p.querySelector('[data-bg-precio-nota]');
      if (num) num.textContent = BG.dinero(modo === 'sin' ? base : total);
      if (nota) nota.textContent = modo === 'sin' ? 'más IVA' : 'con IVA incluido';
    });
    app.querySelectorAll('button[data-bg-iva]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.bgIva === modo));
    });
    app.dispatchEvent(new CustomEvent('bg:iva', { detail: modo }));
  };
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-bg-iva]');
    if (b) BG.iva(b.dataset.bgIva);
  });

  /* ── Barra: menú en celular y lámina actual ── */
  var boton = app.querySelector('[data-bg-menu]');
  function cerrarMenu() { app.classList.remove('bg-menu-abierto'); if (boton) boton.setAttribute('aria-expanded', 'false'); }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = app.classList.toggle('bg-menu-abierto');
      boton.setAttribute('aria-expanded', String(abierto));
    });
    app.addEventListener('click', function (e) { if (e.target.closest('.bg-barra__indice a')) cerrarMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });
  }
  var enlaces = [].slice.call(app.querySelectorAll('.bg-barra__indice a[href^="#"]'));
  if (enlaces.length && 'IntersectionObserver' in window) {
    var actual = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var grupo = e.target.dataset.bgGrupo || e.target.id;
        enlaces.forEach(function (a) {
          if (a.dataset.bgGrupo === grupo) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    app.querySelectorAll('.bg-lamina').forEach(function (s) { actual.observe(s); });
  }
})();

;
/* L-01 · Índice de proyectos: las casillas marcan los renglones (casilla llena o diagonal de «anulado») y anuncian la cuenta;
   el marco de vista pasa de marco vacío a la captura del renglón que está bajo el cursor o con el foco, y una línea guía los une. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var indice = BG.app.querySelector('.bg-indice'); if (!indice) return;
  var filas = [].slice.call(indice.querySelectorAll('[data-bg-indice-fila]'));
  if (!filas.length) return;

  // ── Casillas: marcan, no esconden ──
  var cuenta = indice.querySelector('[data-bg-indice-cuenta]');
  function marcar(casilla) {
    var tipo = casilla.value, todos = tipo === 'todos', dentro = 0;
    filas.forEach(function (fila) {
      var coincide = todos || fila.dataset.bgTipo === tipo;
      if (coincide) dentro++;
      fila.classList.toggle('bg-indice__fila--fuera', !coincide);
      fila.classList.toggle('bg-indice__fila--dentro', coincide && !todos);
      var estado = fila.querySelector('[data-bg-indice-estado]');
      if (estado) estado.textContent = coincide ? '' : ' Fuera de la selección.';
    });
    if (cuenta) cuenta.textContent = todos ? filas.length + ' planos en total' : casilla.dataset.bgNombre + ': ' + dentro + ' de ' + filas.length + ' planos';
  }
  indice.addEventListener('change', function (e) {
    var casilla = e.target.closest('input[name="bg-indice-tipo"]');
    if (casilla) marcar(casilla);
  });
  // Si el navegador restaura una casilla al volver a la página, la marca se repite.
  var marcada = indice.querySelector('input[name="bg-indice-tipo"]:checked');
  if (marcada && marcada.value !== 'todos') marcar(marcada);

  // ── Marco de vista: de línea a luz ──
  var vista = indice.querySelector('[data-bg-indice-vista]'); if (!vista) return;
  var tomas = [].slice.call(vista.querySelectorAll('[data-bg-indice-toma]'));
  var ficha = vista.querySelector('[data-bg-indice-ficha]'), cota = vista.querySelector('[data-bg-indice-cota]');
  var cabeza = indice.querySelector('[data-bg-indice-cabeza]'), marco = vista.querySelector('[data-bg-indice-marco]');
  var guia = indice.querySelector('[data-bg-indice-guia]'), trazo = guia && guia.querySelector('path');
  var barra = BG.app.querySelector('.bg-barra');
  var conCursor = window.matchMedia('(hover: hover) and (min-width: 981px)');
  var actual = -1;

  // Línea guía del renglón elegido al marco: sale del renglón, baja o sube por el margen y entra al marco.
  function trazar(dibujar) {
    if (!trazo || !cabeza || !marco) return;
    if (!conCursor.matches || actual < 0) { trazo.setAttribute('d', 'M0 0'); return; }
    var c = cabeza.getBoundingClientRect(), m = marco.getBoundingClientRect(), r = filas[actual].getBoundingClientRect();
    var y = r.top + r.height / 2, techo = barra ? barra.getBoundingClientRect().bottom : 0;
    if (!m.height || y < techo + 6 || y > window.innerHeight - 6) { trazo.setAttribute('d', 'M0 0'); return; }
    var x0 = Math.round(m.right - c.left), x2 = Math.round(c.width), xm = Math.round((x0 + x2) / 2);
    var yr = Math.round(y - c.top);
    var y0 = Math.round(Math.max(m.top - c.top + 14, Math.min(m.bottom - c.top - 14, yr)));
    trazo.setAttribute('d', 'M' + x2 + ' ' + yr + 'H' + xm + 'V' + y0 + 'H' + x0);
    if (dibujar && !BG.reducido) {
      guia.classList.remove('bg-indice__guia--traza');
      void guia.getBoundingClientRect(); // la línea se vuelve a dibujar desde el renglón
      guia.classList.add('bg-indice__guia--traza');
    }
  }

  function mostrar(i) {
    if (i === actual || !tomas[i]) return;
    tomas.forEach(function (toma, k) {
      toma.classList.remove('bg-indice__toma--activa', 'bg-indice__toma--sale');
      if (k === actual) toma.classList.add('bg-indice__toma--sale');
    });
    void tomas[i].offsetWidth; // la toma que entra arranca siempre desde el marco vacío
    tomas[i].classList.add('bg-indice__toma--activa');
    filas.forEach(function (fila, k) { fila.classList.toggle('bg-indice__fila--activa', k === i); });
    var enlace = filas[i].querySelector('a');
    if (ficha) ficha.textContent = enlace.dataset.bgIndiceRotulo;
    if (cota) cota.textContent = enlace.dataset.bgIndiceDominio;
    actual = i;
    trazar(true);
  }
  filas.forEach(function (fila, i) {
    var enlace = fila.querySelector('a');
    enlace.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') mostrar(i); });
    enlace.addEventListener('focus', function () { mostrar(i); });
  });
  BG.alVer(vista, function () { if (actual < 0) mostrar(0); }, '0px 0px -18% 0px');

  // La línea sigue al renglón cuando la página se desplaza o cambia de tamaño; fuera de pantalla no se calcula nada.
  var enPantalla = !('IntersectionObserver' in window), pendiente = false;
  function alMover() {
    if (!enPantalla || pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; trazar(false); });
  }
  if (!enPantalla) new IntersectionObserver(function (es) {
    enPantalla = es[es.length - 1].isIntersecting;
    if (enPantalla) trazar(false);
  }).observe(indice);
  window.addEventListener('scroll', alMover, { passive: true });
  window.addEventListener('resize', alMover);
  window.addEventListener('load', alMover);
  if (conCursor.addEventListener) conCursor.addEventListener('change', alMover);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(alMover);
})();

;
/* L-00 · Portada: el cajetín arma el mensaje de WhatsApp según el tipo elegido; la vista explotada responde al puntero y al avance. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var portada = BG.app.querySelector('.bg-portada'); if (!portada) return;

  // Cajetín → WhatsApp
  var accion = portada.querySelector('[data-bg-cajetin-accion]');
  portada.addEventListener('change', function (e) {
    var input = e.target.closest('input[name="bg-portada-tipo"]');
    if (input && accion) accion.href = BG.wa('Hola, equipo BG. Quiero cotizar ' + input.dataset.bgFrase + '. Mi empresa es: ');
  });

  // De línea a luz: los planos se llenan en cuanto la portada está lista.
  requestAnimationFrame(function () { requestAnimationFrame(function () { portada.classList.add('bg-lista'); }); });

  if (BG.reducido) return;
  var escena = portada.querySelector('.bg-portada__escena'); if (!escena) return;
  var capas = [].slice.call(escena.querySelectorAll('.bg-portada__capa'));
  var meta = { gx: 0, gz: 0 }, actual = { gx: 0, gz: 0 }, avance = 0, enCurso = false;
  var fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function pintar() {
    actual.gx += (meta.gx - actual.gx) * 0.09;
    actual.gz += (meta.gz - actual.gz) * 0.09;
    escena.style.setProperty('--gx', actual.gx.toFixed(2) + 'deg');
    escena.style.setProperty('--gz', actual.gz.toFixed(2) + 'deg');
    if (Math.abs(meta.gx - actual.gx) + Math.abs(meta.gz - actual.gz) > 0.02) requestAnimationFrame(pintar); else enCurso = false;
  }
  function pedir() { if (!enCurso) { enCurso = true; requestAnimationFrame(pintar); } }

  if (fino) {
    portada.addEventListener('pointermove', function (e) {
      var r = portada.getBoundingClientRect();
      meta.gx = ((e.clientY - r.top) / r.height - 0.5) * -7;
      meta.gz = ((e.clientX - r.left) / r.width - 0.5) * 9;
      pedir();
    });
    portada.addEventListener('pointerleave', function () { meta.gx = 0; meta.gz = 0; pedir(); });
  }

  // Al avanzar, los planos se separan un poco más: la pieza «se abre».
  function alAvanzar() {
    var r = portada.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / (r.height * 0.7)));
    if (Math.abs(p - avance) < 0.004) return;
    avance = p;
    escena.style.setProperty('--abre-x', (1 + p * 0.55).toFixed(3));
  }
  window.addEventListener('scroll', alAvanzar, { passive: true });
})();

;
/* L-02 · Grupo VEMIK.
   1) El conteo completo: una marca por producto en un lienzo. Las marcas se dibujan en orden cuando el contador entra en pantalla
      (unos 2.6 s, con freno al final) y el contador sube con ellas. Cada celda mide un número entero de pixeles del dispositivo:
      la marca sale nítida en cualquier densidad. Fuera de pantalla no se dibuja nada. Al terminar, señalar una marca dice su número.
   2) Las medidas por familia: pasar el puntero, enfocar o tocar una familia llena sus marcas y dice cuántas son. Un clic la deja fija. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var lamina = BG.app.querySelector('#bg-vemik'); if (!lamina) return;
  var fmt = new Intl.NumberFormat('es-MX');
  var puedeVer = 'IntersectionObserver' in window;
  if (BG.reducido) lamina.classList.add('bg-vemik--quieta');

  /* ── 1 · El conteo ── */
  (function () {
    var campo = lamina.querySelector('[data-bg-vemik-campo]'); if (!campo) return;
    var lienzo = campo.querySelector('canvas'), total = Number(campo.dataset.bgVemikCampo);
    var ctx = lienzo && lienzo.getContext ? lienzo.getContext('2d') : null;
    if (!ctx || !(total > 0)) return;
    var bloque = campo.parentNode, reserva = campo.querySelector('[data-bg-vemik-reserva]') || campo;
    var cuenta = lamina.querySelector('[data-bg-vemik-cuenta]'), repetir = lamina.querySelector('[data-bg-vemik-repetir]');
    var etiqueta = campo.querySelector('[data-bg-vemik-n-marca]');
    var DUR = 2600, HOLGURA = 1.2, quieto = BG.reducido || !puedeVer;
    var g = null, hechas = quieto ? total : 0, cabeza = hechas, t = 0, previo = 0, raf = 0, espera = 0;
    var enPantalla = !puedeVer, estado = quieto ? 'fin' : 'espera', sel = -1, apagar = 0;
    var tinta = getComputedStyle(campo).color || '#101113';
    var luz = getComputedStyle(BG.app).getPropertyValue('--luz').trim() || '#fffdf7';

    function pintar(desde, hasta, color) {
      if (hasta <= desde) return;
      ctx.fillStyle = color;
      for (var i = desde; i < hasta; i++) ctx.fillRect((i % g.cols) * g.c, ((i / g.cols) | 0) * g.c, g.m, g.m);
    }

    /* Retícula con celdas de `c` pixeles del dispositivo para un lienzo de W de ancho. */
    function reticula(c, W) {
      var hueco = Math.max(1, Math.round(c * 0.36)), cols = Math.max(1, Math.floor((W + hueco) / c)), filas = Math.ceil(total / cols);
      return { c: c, m: c - hueco, cols: cols, filas: filas, w: cols * c - hueco, h: filas * c - hueco };
    }
    /* La celda entera con la que el campo queda más cerca del alto reservado (puede pasarse hasta 20 %).
       El marco toma después el alto exacto de sus renglones: el último termina donde termina la cuenta. */
    function medir() {
      var cs = getComputedStyle(campo), caja = campo.getBoundingClientRect(), dpr = Math.max(1, window.devicePixelRatio || 1);
      var bordeX = campo.offsetWidth - campo.clientWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      var bordeY = campo.offsetHeight - campo.clientHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      var ancho = Math.round((caja.width - bordeX) * 100) / 100, alto = reserva.offsetHeight - bordeY;
      if (!(ancho > 40) || !(alto > 40) || (g && g.ancho === ancho && g.alto === alto && g.dpr === dpr)) return;
      var W = Math.floor(ancho * dpr), H = Math.floor(alto * dpr);
      var r = reticula(Math.max(2, Math.floor(Math.sqrt(W * H / total))), W), mayor;
      while (r.c > 2 && r.h > H) r = reticula(r.c - 1, W);
      mayor = reticula(r.c + 1, W);
      if (mayor.h <= H * HOLGURA) r = mayor;
      r.ancho = ancho; r.alto = alto; r.dpr = dpr; g = r;
      quitar();
      lienzo.width = g.w; lienzo.height = g.h;
      lienzo.style.width = g.w / dpr + 'px'; lienzo.style.height = g.h / dpr + 'px';
      lienzo.style.marginLeft = Math.floor((W - g.w) / 2) / dpr + 'px';
      campo.style.height = g.h / dpr + bordeY + 'px';
      campo.setAttribute('data-bg-vemik-reticula', [g.cols, g.filas, g.c, g.m].join(','));
      pintar(0, hechas, tinta); cabeza = hechas;
      avanzar();
    }

    function cuadro(ahora) {
      raf = 0;
      if (!enPantalla || estado !== 'corre' || !g) return;
      t += previo ? Math.min(50, ahora - previo) : 0; previo = ahora;
      var p = Math.min(1, t / DUR), meta = p < 1 ? Math.floor(total * (1 - Math.pow(1 - p, 3))) : total;
      if (meta > hechas) {
        pintar(cabeza, hechas, tinta);   /* la cabeza anterior se asienta en tinta */
        pintar(hechas, meta, luz);       /* las marcas recién dibujadas llevan la luz */
        cabeza = hechas; hechas = meta;
        if (cuenta) cuenta.textContent = fmt.format(hechas);
      }
      if (p >= 1) { pintar(cabeza, hechas, tinta); cabeza = hechas; estado = 'fin'; lamina.classList.add('bg-vemik--contada'); return; }
      raf = requestAnimationFrame(cuadro);
    }
    function avanzar() { if (!raf && enPantalla && estado === 'corre' && g) { previo = 0; raf = requestAnimationFrame(cuadro); } }
    function empezar() {
      if (!g) return;
      quitar();
      ctx.clearRect(0, 0, g.w, g.h);
      hechas = 0; cabeza = 0; t = 0; estado = 'corre'; lamina.classList.remove('bg-vemik--contada');
      if (cuenta) cuenta.textContent = '0';
      avanzar();
    }

    /* Señalar una marca: se enciende y la etiqueta dice qué número de producto es. */
    function quitar() {
      clearTimeout(apagar);
      if (etiqueta) etiqueta.classList.remove('es-visible');
      if (sel < 0 || !g) { sel = -1; return; }
      var x = (sel % g.cols) * g.c, y = ((sel / g.cols) | 0) * g.c, h = g.c - g.m;
      ctx.clearRect(x - h, y - h, g.m + 2 * h, g.m + 2 * h);
      ctx.fillStyle = tinta; ctx.fillRect(x, y, g.m, g.m);
      sel = -1;
    }
    function senalar(e) {
      if (estado !== 'fin' || !g || !etiqueta) return;
      clearTimeout(apagar);
      var r = lienzo.getBoundingClientRect();
      var col = Math.floor((e.clientX - r.left) * g.dpr / g.c), fila = Math.floor((e.clientY - r.top) * g.dpr / g.c);
      var i = col >= 0 && col < g.cols && fila >= 0 && fila < g.filas ? fila * g.cols + col : -1;
      if (i >= total) i = -1;
      if (i === sel) return;
      quitar();
      if (i < 0) return;
      sel = i;
      var x = col * g.c, y = fila * g.c, h = g.c - g.m;
      ctx.fillStyle = luz; ctx.fillRect(x - h, y - h, g.m + 2 * h, g.m + 2 * h);
      etiqueta.textContent = (etiqueta.dataset.bgVemikAntes || '') + fmt.format(i + 1) + (etiqueta.dataset.bgVemikDespues || '');
      var px = lienzo.offsetLeft + (x + g.m / 2) / g.dpr, py = lienzo.offsetTop + y / g.dpr;
      var ew = etiqueta.offsetWidth, eh = etiqueta.offsetHeight, tope = campo.clientWidth - 2;
      var ex = px + 12, ey = py - eh - 10;
      if (ex + ew > tope) ex = px - 12 - ew;
      if (ex < 2) ex = Math.max(2, Math.min(tope - ew, px - ew / 2));
      if (ey < 2) ey = py + g.c / g.dpr + 10;
      etiqueta.style.transform = 'translate(' + Math.round(ex) + 'px,' + Math.round(ey) + 'px)';
      etiqueta.classList.add('es-visible');
    }
    function retirar(e) {
      clearTimeout(apagar);
      if (e && e.pointerType === 'touch') apagar = setTimeout(quitar, 1800); else quitar();
    }

    medir();
    if (!quieto) {
      if (cuenta) cuenta.textContent = '0';
      /* Empieza cuando el contador ya se ve: así el campo y la cifra que sube están en pantalla a la vez. */
      BG.alVer(cuenta || campo, function () { if (estado === 'espera') { estado = 'corre'; avanzar(); } }, '0px 0px -4% 0px');
      new IntersectionObserver(function (es) {
        enPantalla = es[es.length - 1].isIntersecting;
        if (enPantalla) avanzar();
      }).observe(bloque);
      if (repetir) repetir.addEventListener('click', empezar);
    }
    if (etiqueta) {
      campo.addEventListener('pointermove', senalar);
      campo.addEventListener('pointerdown', senalar);
      campo.addEventListener('pointerleave', retirar);
      campo.addEventListener('pointercancel', retirar);
    }

    function alCambiar() { if (!espera) espera = requestAnimationFrame(function () { espera = 0; medir(); }); }
    if ('ResizeObserver' in window) new ResizeObserver(alCambiar).observe(bloque);
    window.addEventListener('resize', alCambiar);
  })();

  /* ── 2 · Las medidas por familia ── */
  (function () {
    var grupos = lamina.querySelector('[data-bg-vemik-grupos]'), lectura = lamina.querySelector('[data-bg-vemik-lectura]');
    if (!grupos || !lectura) return;
    var fams = [].slice.call(grupos.querySelectorAll('.bg-vemik__fam'));
    var botones = fams.map(function (f) { return f.querySelector('[data-bg-vemik-fam]'); });
    var num = lectura.querySelector('[data-bg-vemik-num]'), nombre = lectura.querySelector('[data-bg-vemik-nombre]');
    var detalle = lectura.querySelector('[data-bg-vemik-detalle]'), voz = lectura.querySelector('[data-bg-vemik-voz]');
    if (!num || !nombre || !detalle || !fams.length || botones.some(function (b) { return !b; })) return;
    var total = Number(lectura.dataset.bgVemikTotal), todas = { nombre: nombre.textContent, detalle: detalle.innerHTML };
    var fija = -1, paso = -1, vista = -1, tactil = false, valor = total, giro = 0;

    function contar(meta) {
      cancelAnimationFrame(giro);
      if (BG.reducido || meta === valor) { valor = meta; num.textContent = fmt.format(meta); return; }
      var de = valor, inicio = 0;
      giro = requestAnimationFrame(function sube(ahora) {
        if (!inicio) inicio = ahora;
        var p = Math.min(1, (ahora - inicio) / 420);
        valor = Math.round(de + (meta - de) * (1 - Math.pow(1 - p, 3)));
        num.textContent = fmt.format(valor);
        if (p < 1) giro = requestAnimationFrame(sube);
      });
    }
    function mostrar() {
      var i = paso > -1 ? paso : fija;
      botones.forEach(function (b, k) {
        b.setAttribute('aria-pressed', String(k === fija));
        fams[k].classList.toggle('es-activa', k === i);
      });
      if (i === vista) return;
      vista = i;
      var b = i > -1 ? botones[i] : null, n = b ? Number(b.dataset.bgVemikN) : total;
      var familia = b ? b.dataset.bgVemikNombre.toLowerCase() : '';
      nombre.textContent = b ? 'medidas de ' + familia : todas.nombre;
      if (b) detalle.textContent = lectura.dataset.bgVemikNota; else detalle.innerHTML = todas.detalle;
      contar(n);
      if (voz) voz.textContent = b ? fmt.format(n) + ' de las ' + fmt.format(total) + ' medidas son de ' + familia + '.' : '';
    }

    grupos.addEventListener('pointerdown', function (e) { tactil = e.pointerType !== 'mouse'; });
    grupos.addEventListener('keydown', function () { tactil = false; });
    fams.forEach(function (f, i) {
      f.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; tactil = false; paso = i; mostrar(); });
      f.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse') return; if (paso === i) paso = -1; mostrar(); });
      botones[i].addEventListener('focus', function () { if (tactil) return; paso = i; mostrar(); });
      botones[i].addEventListener('blur', function () { if (paso === i) paso = -1; mostrar(); });
      botones[i].addEventListener('click', function () {
        fija = fija === i ? -1 : i;
        if (tactil) paso = -1;
        mostrar();
      });
    });
  })();
})();

;
/* L-03 · MACHEN: el mueble en 3D. El visor, el modelo y su luz de estudio se piden solo cuando la lámina se acerca a la pantalla.
   Mientras tanto (y si el dispositivo no muestra 3D) quedan las imágenes, que las casillas también cambian.
   De línea a luz: el modelo llega como maqueta blanca; «Aplicar materiales» devuelve los reales, «Encender espejo» prende sus luces
   y «Abrir puertas» mueve la animación que trae el propio modelo. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var lamina = BG.app.querySelector('#bg-machen'); if (!lamina) return;
  var escena = lamina.querySelector('[data-bg-machen-escena]'); if (!escena) return;
  var visor = escena.querySelector('[data-bg-machen-visor]'), pieza = escena.querySelector('[data-bg-machen-pieza]');
  var cMat = escena.querySelector('[data-bg-machen-mat]'), cLuz = escena.querySelector('[data-bg-machen-luz]'), cAbre = escena.querySelector('[data-bg-machen-abre]');
  var aviso = escena.querySelector('[data-bg-machen-aviso]'), carga = escena.querySelector('.bg-machen__carga');
  if (!visor || !pieza || !cMat || !cLuz || !cAbre) return;

  var d = escena.dataset, mv = null, listo = false, tocado = false, enPantalla = false;
  var originales = [], turnos = [], luzRef = { v: 0, id: 0 }, abreRef = { v: 0, id: 0 };
  var BLANCO = [0.93, 0.925, 0.9, 1], EXPOSICION = 1, EXPOSICION_LUZ = 0.8;

  /* fase del 3D: cargando, vivo, falla o sin (sin WebGL). El CSS la lee en data-bg-3d. */
  var fase = '';
  function marcar(v) { fase = v; escena.setAttribute('data-bg-3d', v); }
  function estado() { return (cMat.checked ? 'materiales' : 'maqueta') + (cLuz.checked ? '-luz' : '') + (cAbre.checked ? '-abierto' : ''); }
  function decir(texto) { if (aviso) aviso.textContent = texto; }
  function abs(ruta) { return new URL(ruta, document.baseURI).href; }
  function hayWebGL() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }

  /* ── Imagen de cada estado: la anterior se queda hasta que la nueva termina de llegar ── */
  var posters = {}, activo = null, ACTIVO = 'bg-machen__poster--activo';
  [].forEach.call(pieza.querySelectorAll('[data-bg-machen-poster]'), function (img) { posters[img.dataset.bgMachenPoster] = img; });
  function pintar() {
    var id = estado(), nuevo = posters[id];
    d.bgEstado = id;
    if (!nuevo || nuevo === activo) return;
    function activar() {
      if (estado() !== id) return;
      if (activo) activo.classList.remove(ACTIVO);
      nuevo.classList.add(ACTIVO); activo = nuevo;
    }
    if (!activo || fase === 'vivo' || (nuevo.complete && nuevo.naturalWidth)) { activar(); return; }
    nuevo.loading = 'eager';
    nuevo.addEventListener('load', activar, { once: true });
    nuevo.addEventListener('error', activar, { once: true });
  }

  /* ── Valores que cambian poco a poco (luz, puertas): misma curva que el resto de la página, sin rebote ── */
  function llevar(ref, meta, ms, fn) {
    cancelAnimationFrame(ref.id);
    var desde = ref.v, inicio = performance.now();
    if (!ms || BG.reducido) { ref.v = meta; fn(meta); return; }
    (function paso(t) {
      var p = Math.min(1, (t - inicio) / ms);
      ref.v = p >= 1 ? meta : desde + (meta - desde) * (1 - Math.pow(2, -10 * p));
      fn(ref.v);
      if (p < 1) ref.id = requestAnimationFrame(paso);
    })(inicio);
  }

  /* ── Materiales ── */
  function textura(info) { return info && info.texture ? info.texture : null; }
  function poner(info, t) { if (info && info.setTexture) info.setTexture(t); }
  function leer(m) {
    var pbr = m.pbrMetallicRoughness, em = m.emissiveFactor || [0, 0, 0];
    return {
      color: [].slice.call(pbr.baseColorFactor), metal: pbr.metallicFactor, rugoso: pbr.roughnessFactor,
      tColor: textura(pbr.baseColorTexture), tRugoso: textura(pbr.metallicRoughnessTexture), tRelieve: textura(m.normalTexture),
      luz: [].slice.call(em), fuerza: typeof m.emissiveStrength === 'number' ? m.emissiveStrength : 1,
      esLuz: em[0] + em[1] + em[2] > 0,
    };
  }
  /* Maqueta: todo blanco mate y sin texturas. Las sombras de contacto del modelo se conservan: dan el volumen. */
  function blanquear(m) {
    var pbr = m.pbrMetallicRoughness;
    pbr.setBaseColorFactor(BLANCO); pbr.setMetallicFactor(0); pbr.setRoughnessFactor(1);
    poner(pbr.baseColorTexture, null); poner(pbr.metallicRoughnessTexture, null); poner(m.normalTexture, null);
  }
  function restituir(m, o) {
    var pbr = m.pbrMetallicRoughness;
    pbr.setBaseColorFactor(o.color); pbr.setMetallicFactor(o.metal); pbr.setRoughnessFactor(o.rugoso);
    poner(pbr.baseColorTexture, o.tColor); poner(pbr.metallicRoughnessTexture, o.tRugoso); poner(m.normalTexture, o.tRelieve);
  }
  /* Los materiales llegan uno tras otro, como si se fueran pintando. */
  function vestir(animado) {
    turnos.forEach(clearTimeout); turnos = [];
    var real = cMat.checked;
    mv.model.materials.forEach(function (m, i) {
      var paso = function () { if (real) restituir(m, originales[i]); else blanquear(m); };
      if (animado && !BG.reducido) turnos.push(setTimeout(paso, i * 65)); else paso();
    });
  }
  /* ── Luz del espejo: arco LED, nicho y controles táctiles del botiquín ── */
  function luz(k) {
    mv.model.materials.forEach(function (m, i) {
      var o = originales[i]; if (!o.esLuz) return;
      m.setEmissiveFactor(k > 0 ? o.luz : [0, 0, 0]);
      if (m.setEmissiveStrength) m.setEmissiveStrength(o.fuerza * k);
    });
    mv.exposure = EXPOSICION + (EXPOSICION_LUZ - EXPOSICION) * k;
  }
  /* ── Puertas: se recorre a mano la animación «Apertura» del modelo (cerrado en 0, abierto al final) ── */
  function puertas(k) {
    var dur = mv.duration || 0;
    if (dur) mv.currentTime = Math.max(0, Math.min(dur - 0.002, k * dur));
  }

  /* ── Casillas: cambian la imagen siempre y el modelo cuando ya está vivo ── */
  escena.addEventListener('change', function (e) {
    var c = e.target;
    if (c !== cMat && c !== cLuz && c !== cAbre) return;
    pintar();
    if (c === cMat) { if (listo) vestir(true); decir(c.checked ? 'Materiales aplicados: plywood, cerámica y espejo.' : 'Maqueta blanca.'); }
    else if (c === cLuz) { if (listo) llevar(luzRef, c.checked ? 1 : 0, 650, luz); decir(c.checked ? 'Espejo encendido.' : 'Espejo apagado.'); }
    else { if (listo) llevar(abreRef, c.checked ? 1 : 0, 1100, puertas); decir(c.checked ? 'Puertas abiertas.' : 'Puertas cerradas.'); }
  });
  pintar();

  /* ── Giro: solo, hasta el primer toque; detenido fuera de pantalla ── */
  function girar() {
    if (!mv) return;
    if (listo && enPantalla && !tocado && !BG.reducido) mv.setAttribute('auto-rotate', ''); else mv.removeAttribute('auto-rotate');
  }
  function tocar() {
    if (tocado) return;
    tocado = true; escena.classList.add('bg-machen__escena--tocado'); girar();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      enPantalla = es[es.length - 1].isIntersecting;
      d.bgEnPantalla = enPantalla ? 'si' : 'no';
      girar();
      /* Fuera de pantalla no queda nada a medias: cada valor salta a su destino y el visor deja de dibujar. */
      if (!enPantalla && listo) { llevar(luzRef, cLuz.checked ? 1 : 0, 0, luz); llevar(abreRef, cAbre.checked ? 1 : 0, 0, puertas); }
    }, { threshold: 0.02 }).observe(visor);
  } else enPantalla = true;

  /* ── Carga diferida ── */
  function fallar() {
    if (mv && mv.parentNode) mv.parentNode.removeChild(mv);
    mv = null; listo = false; marcar('falla'); pintar();
    decir('No pudimos cargar el modelo 3D. Las casillas siguen cambiando la imagen.');
  }
  function alCargar() {
    if (listo || !mv || !mv.model) return;
    listo = true;
    originales = mv.model.materials.map(leer);
    if (mv.pause) mv.pause();
    vestir(false);
    llevar(luzRef, cLuz.checked ? 1 : 0, 0, luz);
    llevar(abreRef, cAbre.checked ? 1 : 0, 0, puertas);
    /* Dos cuadros de margen: el visor aparece cuando ya se dibujó en su estado, nunca con un parpadeo de materiales. */
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      marcar('vivo'); girar();
      decir('Modelo 3D listo. Gíralo arrastrando o con las flechas del teclado.');
    }); });
  }
  function montar(entorno) {
    mv = document.createElement('model-viewer');
    var attrs = {
      alt: d.bgAlt, 'camera-controls': '', 'disable-zoom': '', 'disable-pan': '', 'disable-tap': '', 'touch-action': 'pan-y', 'interaction-prompt': 'none',
      loading: 'eager', reveal: 'auto', 'environment-image': entorno, exposure: String(EXPOSICION), 'shadow-intensity': '0.85', 'shadow-softness': '1',
      'camera-orbit': d.bgOrbita, 'camera-target': d.bgObjetivo, 'field-of-view': d.bgCampo, 'min-field-of-view': d.bgCampo, 'max-field-of-view': d.bgCampo,
      'min-camera-orbit': 'auto ' + d.bgPolar + ' auto', 'max-camera-orbit': 'auto ' + d.bgPolar + ' auto',
      'auto-rotate-delay': '0', 'rotation-per-second': '15deg', 'interpolation-decay': '70',
      a11y: JSON.stringify({
        front: 'Vista de frente', right: 'Vista del costado derecho', back: 'Vista de atrás', left: 'Vista del costado izquierdo',
        'upper-front': 'Vista de frente', 'upper-right': 'Vista del costado derecho', 'upper-back': 'Vista de atrás', 'upper-left': 'Vista del costado izquierdo',
        'lower-front': 'Vista de frente', 'lower-right': 'Vista del costado derecho', 'lower-back': 'Vista de atrás', 'lower-left': 'Vista del costado izquierdo',
        'interaction-prompt': 'Gíralo con las flechas del teclado.',
      }),
    };
    if (d.bgApertura) attrs['animation-name'] = d.bgApertura;
    Object.keys(attrs).forEach(function (k) { mv.setAttribute(k, attrs[k]); });
    mv.addEventListener('progress', function (e) { if (carga && e.detail) carga.style.setProperty('--p', Math.max(0.04, e.detail.totalProgress || 0)); });
    mv.addEventListener('load', alCargar);
    mv.addEventListener('error', fallar);
    mv.addEventListener('camera-change', function (e) { if (e.detail && e.detail.source === 'user-interaction') tocar(); });
    mv.addEventListener('pointerdown', tocar);
    mv.addEventListener('keydown', function (e) { if (/^Arrow/.test(e.key)) tocar(); });
    pieza.appendChild(mv);
    mv.src = abs(d.bgGlb);
    /* Respaldo: en pestañas en segundo plano el evento «load» puede tardar. */
    var vigia = setInterval(function () {
      if (listo || !mv) clearInterval(vigia); else if (mv.loaded && mv.model) { clearInterval(vigia); alCargar(); }
    }, 400);
  }
  /* La luz de estudio es un archivo aparte: si no llega, el visor usa su luz pareja de fábrica. */
  function pedirEntorno() {
    if (!d.bgEntorno || !window.fetch) return Promise.resolve('neutral');
    var url = abs(d.bgEntorno);
    return fetch(url).then(function (r) { return r.ok ? url : 'neutral'; }).catch(function () { return 'neutral'; });
  }
  function cargar() {
    if (mv || fase) return;
    /* Abierta como archivo local, la página no puede pedir módulos ni modelos: se queda con las imágenes. */
    if (location.protocol === 'file:') return;
    if (!window.customElements || !window.Promise || !hayWebGL()) { marcar('sin'); return; }
    marcar('cargando');
    var modulo = customElements.get('model-viewer') ? Promise.resolve() : new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.type = 'module'; s.src = abs(d.bgVisor); s.onload = ok;
      s.onerror = function () { s.remove(); no(new Error('visor 3D no disponible')); };
      document.head.appendChild(s);
    });
    var entorno = pedirEntorno();
    modulo.then(function () { return customElements.whenDefined('model-viewer'); })
      .then(function () { return entorno; }).then(montar).catch(fallar);
  }
  BG.alVer(escena, cargar, '900px 0px 900px 0px');
})();

;
/* L-04 · LANZAMIENTO: el mini creador apila las capas reales del baño (fondo → espejo → mueble → luz en «screen»).
   Al cambiar de mueble la capa nueva entra con un barrido; la luz del cuarto y del espejo se funde.
   Más abajo, la pila de capas que el visitante separa con un deslizador. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var lamina = BG.app.querySelector('.bg-lanzamiento'); if (!lamina) return;
  var SUAVE = 'cubic-bezier(.16,1,.3,1)';
  var animar = !BG.reducido && typeof Element.prototype.animate === 'function';

  function ocioso(fn) {
    if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 }); else setTimeout(fn, 350);
  }
  function cargada(img) {
    return new Promise(function (ok) {
      function fin() { ok(img); }
      if (img.complete && img.naturalWidth) { fin(); return; }
      img.addEventListener('load', fin, { once: true });
      img.addEventListener('error', fin, { once: true });
    });
  }
  function lista(img) {
    if (!img.decode) return cargada(img);
    return img.decode().then(function () { return img; }, function () { return cargada(img); });
  }

  /* ── Mini «Diseña tu baño» ── */
  (function () {
    var pieza = lamina.querySelector('[data-bg-creador]'); if (!pieza) return;
    var datos; try { datos = JSON.parse(pieza.getAttribute('data-bg-capas')); } catch (e) { return; }
    var base = pieza.getAttribute('data-bg-base') || '';
    var marco = pieza.querySelector('[data-bg-marco]');
    var luz = pieza.querySelector('[data-bg-luz]');
    var aviso = pieza.querySelector('[data-bg-estado]');
    var radios = [].slice.call(pieza.querySelectorAll('input[name="bg-lanzamiento-mueble"]'));
    if (!marco || !luz || !radios.length || !datos.muebles || !datos.muebles.length) return;
    var barrido = marco.querySelector('.bg-lanzamiento__barrido');
    var ORDEN = ['fondo', 'espejo', 'mueble', 'luz'];
    var estado = { i: 0, luz: false }, turno = 0, abierta = false, memoria = {};
    var actual = {}, clave = { fondo: datos.fondo.dia.img, espejo: '', mueble: datos.muebles[0].img, luz: '' };
    ORDEN.forEach(function (k) { actual[k] = marco.querySelector('[data-bg-capa="' + k + '"]'); });
    if (actual.espejo && datos.espejo) clave.espejo = datos.espejo.img;
    var desde = datos.muebles[0].pos.x; // borde izquierdo (en %) del mueble que está en pantalla

    function capa(k, alt) { return { img: k.img, px: k.px, px900: k.px900, pos: k.pos || null, alt: alt || '' }; }
    function vista() {
      var m = datos.muebles[estado.i], enc = estado.luz && !!m.luz;
      return {
        fondo: capa(enc ? datos.fondo.noche : datos.fondo.dia, datos.fondo.alt),
        espejo: m.espejoPropio || !datos.espejo ? null : capa(datos.espejo, ''),
        mueble: capa(enc ? m.encendido : m, m.alt),
        luz: enc ? capa(m.luz, '') : null
      };
    }
    function imagen(s) {
      var img = new Image(), parte = s.pos ? s.pos.ancho / 100 : 1;
      img.alt = s.alt; img.decoding = 'async'; img.draggable = false;
      img.width = s.px[0]; img.height = s.px[1];
      img.sizes = Math.ceil((marco.clientWidth || 360) * parte) + 'px';
      img.srcset = base + s.img + '-900.webp ' + s.px900[0] + 'w, ' + base + s.img + '.webp ' + s.px[0] + 'w';
      img.src = base + s.img + '-900.webp';
      if (s.pos) { img.style.left = s.pos.x + '%'; img.style.top = s.pos.y + '%'; img.style.width = s.pos.ancho + '%'; img.style.height = s.pos.alto + '%'; }
      return img;
    }
    function guardar(k) { if (k && !memoria[k.img]) memoria[k.img] = imagen(capa(k, '')); }
    /* En ratos libres se traen las capas de los muebles vecinos y la otra luz del mueble actual. */
    function vecinos() {
      var n = datos.muebles.length, m = datos.muebles[estado.i];
      [datos.muebles[(estado.i + 1) % n], datos.muebles[(estado.i + n - 1) % n]].forEach(function (v) {
        var enc = estado.luz && !!v.luz;
        guardar(enc ? v.encendido : v);
        if (enc) guardar(v.luz);
        if (!v.espejoPropio) guardar(datos.espejo);
        if (estado.luz && !v.luz) guardar(datos.fondo.dia);
      });
      if (!m.luz) return;
      if (estado.luz) { guardar(datos.fondo.dia); guardar(m); }
      else { guardar(datos.fondo.noche); guardar(m.encendido); guardar(m.luz); }
    }

    function mandos() {
      var m = datos.muebles[estado.i], tiene = !!m.luz;
      luz.disabled = !tiene; luz.checked = tiene && estado.luz;
      if (tiene) pieza.removeAttribute('data-bg-sin-luz'); else pieza.setAttribute('data-bg-sin-luz', '');
      var texto = 'Mueble ' + m.n + ' de ' + datos.muebles.length + ', ' + (tiene ? (estado.luz ? 'espejo encendido' : 'espejo apagado') : 'este espejo no tiene luz');
      if (aviso && aviso.textContent !== texto) aviso.textContent = texto;
    }

    function poner(c, modo, x) {
      var vieja = actual[c.k], nueva = c.nodo;
      actual[c.k] = nueva; clave[c.k] = c.id;
      if (nueva) marco.insertBefore(nueva, barrido);
      function quitar() { if (vieja && vieja.parentNode) vieja.parentNode.removeChild(vieja); }
      if (!animar || modo === 'nada') { quitar(); return; }
      if (modo === 'barrido' && c.k !== 'fondo') {
        if (nueva) nueva.animate([{ clipPath: 'inset(0 ' + (100 - x) + '% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 760, easing: SUAVE, fill: 'backwards' });
        if (vieja) vieja.animate([{ clipPath: 'inset(0 0 0 ' + x + '%)' }, { clipPath: 'inset(0 0 0 100%)' }], { duration: 760, easing: SUAVE, fill: 'forwards' }).onfinish = quitar;
      } else if (nueva) {
        nueva.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: 'ease-out', fill: 'backwards' }).onfinish = quitar;
      } else if (vieja) {
        vieja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }).onfinish = quitar;
      }
    }
    function linea(x) {
      if (!barrido) return;
      barrido.animate([{ transform: 'translateX(' + x + '%)' }, { transform: 'translateX(100%)' }], { duration: 760, easing: SUAVE });
      barrido.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 760, easing: 'linear' });
    }

    /* modo: 'barrido' (cambio de mueble), 'fundido' (luz) o 'nada' (sin movimiento). */
    function pintar(modo) {
      var t = ++turno, v = vista(), cambios = [], esperas = [];
      ORDEN.forEach(function (k) {
        var s = v[k], id = s ? s.img : '';
        if (id === clave[k]) return;
        var nodo = null;
        if (s) {
          nodo = document.createElement('div');
          nodo.className = 'bg-lanzamiento__capa'; nodo.setAttribute('data-bg-capa', k);
          nodo.appendChild(imagen(s));
          esperas.push(lista(nodo.firstChild));
        }
        cambios.push({ k: k, nodo: nodo, id: id });
      });
      mandos();
      if (!cambios.length) { marco.removeAttribute('aria-busy'); return; }
      marco.setAttribute('aria-busy', 'true');
      var x = Math.max(0, Math.floor(Math.min(desde, datos.muebles[estado.i].pos.x)) - 3);
      Promise.all(esperas).then(function () {
        if (t !== turno) return; // llegó otro cambio mientras cargaba: este ya no se pinta
        marco.removeAttribute('aria-busy');
        cambios.forEach(function (c) { poner(c, modo, x); });
        desde = datos.muebles[estado.i].pos.x;
        if (modo === 'barrido' && animar) linea(x);
        ocioso(vecinos);
      });
    }

    /* De línea a luz: el baño entra cuando el marco se ve y sus dos primeras capas ya cargaron. */
    function abrir() {
      if (abierta) return; abierta = true;
      marco.classList.add('bg-lanzamiento--lista');
      setTimeout(function () { marco.classList.add('bg-lanzamiento--viva'); }, 1800);
      ocioso(vecinos);
    }
    pieza.addEventListener('change', function (e) {
      var el = e.target;
      if (el.name === 'bg-lanzamiento-mueble') { abrir(); estado.i = Number(el.value) || 0; pintar('barrido'); }
      else if (el === luz) { abrir(); estado.luz = luz.checked; pintar('fundido'); }
    });

    /* Si el navegador restauró otra casilla al volver a la página, se pinta sin movimiento. */
    var marcado = radios.filter(function (r) { return r.checked; })[0];
    estado.i = marcado ? Number(marcado.value) || 0 : 0;
    estado.luz = !!luz.checked && !luz.disabled;
    if (estado.i !== 0 || estado.luz) pintar('nada'); else mandos();

    if (BG.reducido) { abrir(); return; }
    BG.alVer(marco, function () {
      var primeras = [].slice.call(marco.querySelectorAll('.bg-lanzamiento__capa img'));
      var limite = new Promise(function (ok) { setTimeout(ok, 2500); });
      Promise.race([Promise.all(primeras.map(cargada)), limite]).then(abrir);
    }, '0px 0px -12% 0px');
  })();

  /* ── Pila de capas: se separa al entrar en pantalla y el visitante la junta o la abre con el deslizador ── */
  (function () {
    var pz = lamina.querySelector('[data-bg-pila]'); if (!pz) return;
    var rango = pz.querySelector('[data-bg-separa]'), zona = pz.querySelector('.bg-lanzamiento__pila');
    if (!rango || !zona) return;
    var cuadro = 0;
    function poner(v) {
      pz.style.setProperty('--lan-abre', (v / 100).toFixed(3));
      rango.setAttribute('aria-valuetext', v < 4 ? 'Capas juntas: una sola foto' : v > 96 ? 'Capas separadas' : 'Capas separadas al ' + Math.round(v) + ' por ciento');
    }
    rango.addEventListener('input', function () { cancelAnimationFrame(cuadro); cuadro = -1; poner(Number(rango.value)); });
    if (BG.reducido) { poner(Number(rango.value)); return; }
    rango.value = 0; poner(0);
    BG.alVer(zona, function () {
      var inicio = performance.now() + 350, dur = 1700;
      (function paso(t) {
        if (cuadro === -1) return; // el visitante ya tomó el deslizador
        var p = Math.min(1, Math.max(0, (t - inicio) / dur)), s = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
        rango.value = Math.round(s * 100); poner(s * 100);
        if (p < 1) cuadro = requestAnimationFrame(paso);
      })(performance.now());
    }, '0px 0px -25% 0px');
  })();
})();

;
/* L-05 · Más proyectos: la línea de corte de cada vista de escritorio. A su izquierda el sitio, a su derecha el plano.
   Con cursor sigue al puntero; con el dedo se arrastra (el desplazamiento vertical de la página queda libre); con teclado, las flechas. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var otros = BG.app.querySelector('.bg-otros'); if (!otros) return;

  [].forEach.call(otros.querySelectorAll('[data-bg-otros-marco]'), function (marco) {
    var regla = marco.querySelector('input[type="range"]'); if (!regla) return;
    var figura = marco.closest('figure');
    var aviso = figura && figura.querySelector('[data-bg-otros-cota]');
    if (aviso) aviso.textContent = aviso.dataset.bgOtrosCota;

    function poner(valor, desdeRegla) {
      valor = Math.max(0, Math.min(100, valor));
      marco.style.setProperty('--corte', valor.toFixed(1) + '%');
      if (!desdeRegla) regla.value = String(Math.round(valor));
      regla.setAttribute('aria-valuetext', Math.round(valor) + ' por ciento del sitio a la vista');
    }
    function alPuntero(e) {
      var caja = marco.getBoundingClientRect();
      poner((e.clientX - caja.left) / caja.width * 100);
    }

    regla.addEventListener('input', function () { poner(Number(regla.value), true); });

    var inicio = null, arrastra = false;
    marco.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      inicio = { x: e.clientX, id: e.pointerId };
      arrastra = e.pointerType === 'mouse';
      if (arrastra) { alPuntero(e); if (marco.setPointerCapture) marco.setPointerCapture(e.pointerId); }
    });
    marco.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') { alPuntero(e); return; }   // con cursor, la línea lo sigue sin oprimir
      if (!inicio || e.pointerId !== inicio.id) return;
      if (!arrastra && Math.abs(e.clientX - inicio.x) > 6) arrastra = true; // el dedo solo mueve la línea si avanza de lado
      if (arrastra) alPuntero(e);
    });
    marco.addEventListener('pointerup', function (e) {
      if (inicio && e.pointerId === inicio.id && e.pointerType !== 'mouse' && !arrastra) alPuntero(e); // un toque lleva la línea a ese punto
      inicio = null; arrastra = false;
    });
    marco.addEventListener('pointercancel', function () { inicio = null; arrastra = false; });

    poner(Number(regla.value), true);
  });
})();

;
/* L-06 · Servicios: la muestra de video corre solo mientras está en pantalla.
   Cada cuadro lleva su botón de reproducir o pausar y una regla de tiempo: se llena con el avance y se arrastra para recorrer la pieza. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var lamina = BG.app.querySelector('.bg-servicios'); if (!lamina) return;

  // Pesos con centavos: dos decimales también cuando el interruptor de IVA repinta los precios ($75.40).
  BG.app.addEventListener('bg:iva', function () {
    lamina.querySelectorAll('[data-bg-precio-num]').forEach(function (n) {
      if (/\.\d$/.test(n.textContent)) n.textContent += '0';
    });
  });

  var cuadros = [].slice.call(lamina.querySelectorAll('[data-bg-video]'));
  if (!cuadros.length) return;
  var aviso = lamina.querySelector('[data-bg-video-aviso]');
  // Con movimiento reducido o ahorro de datos nada arranca solo: el visitante decide con el botón.
  var arrancaSolo = !BG.reducido && !(navigator.connection && navigator.connection.saveData);

  var piezas = cuadros.map(function (cuadro) {
    var video = cuadro.querySelector('video');
    var boton = cuadro.querySelector('[data-bg-video-boton]');
    var texto = cuadro.querySelector('[data-bg-video-texto]');
    var escala = cuadro.querySelector('[data-bg-video-escala]');
    var recorrer = cuadro.querySelector('[data-bg-video-recorrer]');
    var p = { marco: cuadro.querySelector('.bg-servicios__marco'), quiere: arrancaSolo, visible: false };
    var enCurso = 0, pendiente = null, cargando = false, arrastra = false;

    // Sin JS el video conserva los controles del navegador; con JS mandan el botón y la regla dibujados.
    video.removeAttribute('controls');
    video.muted = true;
    boton.hidden = false;
    recorrer.hidden = false;

    function total() { return video.duration || Number(recorrer.max); }
    function marcar(t) { escala.style.setProperty('--p', Math.min(1, Math.max(0, t / total())).toFixed(4)); }
    // Valor que lee un lector de pantalla en el deslizador.
    function valor(t) {
      recorrer.value = t;
      recorrer.setAttribute('aria-valuetext', t.toFixed(1) + ' de ' + total().toFixed(1) + ' segundos');
    }
    function medir() {
      enCurso = 0;
      marcar(video.currentTime);
      // El deslizador sigue al video, salvo mientras se arrastra o tiene el foco (un lector de pantalla lo anunciaría sin parar).
      if (!arrastra && document.activeElement !== recorrer) recorrer.value = video.currentTime;
      if (!video.paused) enCurso = requestAnimationFrame(medir);
    }
    function pintar() {
      var activo = !video.paused;
      cuadro.classList.toggle('bg-servicios__cuadro--activo', activo);
      texto.textContent = activo ? 'Pausar' : 'Reproducir';
      if (activo && !enCurso) enCurso = requestAnimationFrame(medir);
    }
    function reproducir() {
      var intento = video.play();
      if (intento && intento.catch) intento.catch(function (e) {
        // El navegador no dejó arrancar (ahorro de batería, por ejemplo): queda en pausa hasta que se pulse el botón.
        if (e && e.name === 'NotAllowedError') { p.quiere = false; pintar(); }
      });
    }
    // Reproduce solo si el visitante no lo pausó, el cuadro está a la vista y la pestaña está activa.
    p.ajustar = function () {
      if (p.quiere && p.visible && !document.hidden) reproducir();
      else if (!video.paused) video.pause();
    };
    function alternar() {
      p.quiere = video.paused;
      if (p.quiere) reproducir(); else video.pause();
      if (aviso) aviso.textContent = (p.quiere ? 'Reproduciendo: ' : 'En pausa: ') + boton.dataset.bgNombre;
    }

    // Lleva la pieza al segundo pedido. Si el video aún no tiene datos (preload="none"), los pide y salta al llegar.
    function ir(t) {
      t = Math.min(Math.max(0, t), Math.max(0, total() - 0.05));
      marcar(t);
      if (video.readyState >= 1) { pendiente = null; video.currentTime = t; }
      else {
        pendiente = t;
        if (!cargando && video.paused) { cargando = true; video.preload = 'auto'; video.load(); }
      }
      return t;
    }
    video.addEventListener('loadedmetadata', function () {
      recorrer.max = video.duration;
      if (pendiente !== null) { valor(ir(pendiente)); p.ajustar(); }
    });
    recorrer.addEventListener('pointerdown', function () { arrastra = true; });
    ['pointerup', 'pointercancel', 'change', 'blur'].forEach(function (suceso) {
      recorrer.addEventListener(suceso, function () { arrastra = false; });
    });
    recorrer.addEventListener('input', function () { valor(ir(Number(recorrer.value))); });
    // Teclado: cada flecha avanza o regresa un segundo, como las marcas de la regla.
    recorrer.addEventListener('keydown', function (e) {
      var paso = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 3, PageDown: -3 }[e.key];
      var desde = pendiente !== null ? pendiente : video.currentTime;
      var t = e.key === 'Home' ? 0 : e.key === 'End' ? total() : paso ? desde + paso : null;
      if (t === null) return;
      e.preventDefault();
      valor(ir(t));
    });
    recorrer.addEventListener('focus', function () { valor(pendiente !== null ? pendiente : video.currentTime); });

    boton.addEventListener('click', alternar);
    video.addEventListener('click', alternar);
    video.addEventListener('play', pintar);
    video.addEventListener('pause', function () { pintar(); valor(video.currentTime); });
    return p;
  });

  if ('IntersectionObserver' in window) {
    var marcos = piezas.map(function (p) { return p.marco; });
    var vista = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var p = piezas[marcos.indexOf(e.target)];
        p.visible = e.isIntersecting && e.intersectionRatio >= 0.4;
        // Si nada arranca solo, salir de pantalla detiene la pieza y volver no la reanuda.
        if (!p.visible && !arrancaSolo) p.quiere = false;
        p.ajustar();
      });
    }, { threshold: [0, 0.4, 0.8] });
    marcos.forEach(function (m) { vista.observe(m); });
  } else {
    piezas.forEach(function (p) { p.visible = true; p.ajustar(); });
  }
  document.addEventListener('visibilitychange', function () { piezas.forEach(function (p) { p.ajustar(); }); });
})();

;
/* L-07 · Planes: la escalera funciona como pestañas. Elegir un escalón (clic, toque, flechas o deslizando sobre la escalera)
   abre su detalle; sin este programa los escalones son enlaces y los cinco detalles quedan a la vista. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var lamina = BG.app.querySelector('.bg-planes'); if (!lamina) return;
  var escalera = lamina.querySelector('[data-bg-planes-escalera]');
  var tabs = [].slice.call(lamina.querySelectorAll('[data-bg-plan]'));
  var paneles = tabs.map(function (t) { return lamina.querySelector('[data-bg-plan-panel="' + t.dataset.bgPlan + '"]'); });
  if (!escalera || !tabs.length || paneles.some(function (p) { return !p; })) return;

  var actual = -1, arrastre = null;
  function indice(id) { for (var i = 0; i < tabs.length; i++) if (tabs[i].dataset.bgPlan === id) return i; return -1; }

  escalera.setAttribute('role', 'tablist');
  escalera.setAttribute('aria-label', escalera.dataset.bgPlanesEscalera);
  tabs.forEach(function (t, i) {
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', paneles[i].id);
    paneles[i].setAttribute('role', 'tabpanel');
    paneles[i].setAttribute('aria-labelledby', t.id);
  });

  /* Acerca el encabezado del detalle (nombre, precio y botón) solo lo necesario para que quede a la vista. */
  function acercar(panel) {
    var cab = panel.querySelector('[data-bg-plan-cab]') || panel;
    var r = cab.getBoundingClientRect(), alto = window.innerHeight;
    var barra = (BG.app.querySelector('.bg-barra') || { offsetHeight: 0 }).offsetHeight + 10;
    if (r.top >= barra && r.bottom <= alto) return;
    var dy = r.bottom - alto + 14;
    if (r.top - dy < barra) dy = r.top - barra;
    window.scrollBy({ top: dy, behavior: BG.reducido ? 'auto' : 'smooth' });
  }

  function elegir(i, mostrar) {
    if (i < 0 || i >= tabs.length) return;
    var cambio = i !== actual, primera = actual < 0;
    actual = i;
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    paneles.forEach(function (p, k) { p.hidden = k !== i; });
    lamina.dataset.bgPlan = tabs[i].dataset.bgPlan;
    if (cambio && !primera && !BG.reducido) {
      var p = paneles[i];
      p.classList.remove('bg-planes__panel--entra');
      void p.offsetWidth;
      p.classList.add('bg-planes__panel--entra');
    }
    if (mostrar) acercar(paneles[i]);
  }

  escalera.addEventListener('click', function (e) {
    var t = e.target.closest('[data-bg-plan]'); if (!t) return;
    e.preventDefault();
    var deslizo = arrastre && arrastre.movio;
    arrastre = null;
    elegir(tabs.indexOf(t), !deslizo);
  });

  escalera.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(e.target.closest('[data-bg-plan]')); if (i < 0) return;
    var n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); elegir(i, true); return; }
    if (n < 0) return;
    e.preventDefault();
    elegir(n, false);
    tabs[n].focus();
  });

  /* Deslizar el dedo o el puntero sobre la escalera recorre los planes. El desplazamiento vertical sigue siendo de la página. */
  escalera.addEventListener('pointerdown', function (e) { arrastre = { x: e.clientX, movio: false }; });
  escalera.addEventListener('pointermove', function (e) {
    if (!arrastre || (e.pointerType === 'mouse' && e.buttons !== 1)) return;
    if (!arrastre.movio && Math.abs(e.clientX - arrastre.x) < 16) return;
    arrastre.movio = true;
    for (var i = 0; i < tabs.length; i++) {
      var r = tabs[i].getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX < r.right) { if (i !== actual) elegir(i, false); break; }
    }
  });
  escalera.addEventListener('pointercancel', function () { arrastre = null; });
  escalera.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') arrastre = null; });

  /* Otra lámina puede enlazar a un plan: #bg-planes-escala lo abre. */
  function desdeHash(mostrar) {
    var m = /^#bg-planes-([a-z0-9-]+)$/.exec(window.location.hash || '');
    var i = m ? indice(m[1]) : -1;
    if (i < 0) return false;
    elegir(i, mostrar);
    return true;
  }
  if (!desdeHash(false)) elegir(Math.max(0, indice(escalera.dataset.bgPlanInicial)), false);
  window.addEventListener('hashchange', function () { desdeHash(true); });

  /* El interruptor de IVA avisa en texto qué se está viendo, y las cifras a la vista cuentan hasta su nuevo valor.
     El núcleo ya dejó escrito el valor final: aquí solo se recorre el camino (mismos dígitos, sin mover nada). */
  var estado = lamina.querySelector('[data-bg-planes-estado]');
  var modo = BG.app.dataset.bgIva || 'con', cuenta = 0;
  BG.app.addEventListener('bg:iva', function (e) {
    var nuevo = e.detail === 'sin' ? 'sin' : 'con';
    if (estado) estado.textContent = nuevo === 'sin' ? estado.dataset.sin : estado.dataset.con;
    if (nuevo === modo) return;
    modo = nuevo;
    cancelAnimationFrame(cuenta);
    if (BG.reducido) return;
    var cifras = [].slice.call(lamina.querySelectorAll('[data-bg-precio]')).filter(function (p) { return p.getClientRects().length; }).map(function (p) {
      var base = Number(p.dataset.bgPrecio), total = Math.round(base * 116) / 100;
      return { num: p.querySelector('[data-bg-precio-num]'), de: nuevo === 'sin' ? total : base, a: nuevo === 'sin' ? base : total };
    }).filter(function (c) { return c.num && isFinite(c.a); });
    var inicio = performance.now(), dur = 320;
    (function paso(t) {
      var p = Math.min(1, (t - inicio) / dur), suave = 1 - Math.pow(1 - p, 3);
      cifras.forEach(function (c) { c.num.textContent = BG.dinero(p >= 1 ? c.a : Math.round(c.de + (c.a - c.de) * suave)); });
      if (p < 1) cuenta = requestAnimationFrame(paso);
    })(inicio);
  });
})();

;
/* L-08 · Cotizar: lee las casillas, sugiere un plan y arma el mensaje de WhatsApp. No guarda ni envía nada: solo cambia el enlace del botón.
   Sin este programa el botón abre WhatsApp con el mensaje general. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var hoja = BG.app.querySelector('.bg-cotizar'); if (!hoja) return;
  var raiz = hoja.querySelector('[data-bg-cotizar]'); if (!raiz) return;
  var D; try { D = JSON.parse(raiz.dataset.bgDatos); } catch (e) { return; }

  var enviar = hoja.querySelector('[data-bg-cotizar-enviar]');
  var vista = hoja.querySelector('[data-bg-cotizar-mensaje]');
  var voz = hoja.querySelector('[data-bg-cotizar-voz]');
  var pista = raiz.querySelector('[data-bg-cotizar-pista]');
  var cuantas = hoja.querySelector('[data-bg-cotizar-cuantas]');
  var pasos = {}, estados = {};
  raiz.querySelectorAll('[data-bg-paso]').forEach(function (f) { if (f.tagName === 'FIELDSET') pasos[f.dataset.bgPaso] = f; });
  hoja.querySelectorAll('[data-bg-cotizar-estado]').forEach(function (b) { estados[b.dataset.bgCotizarEstado] = b; });
  var casos = [].slice.call(hoja.querySelectorAll('[data-bg-cotizar-caso]'));
  var VARIANTES = ['productos', 'paginas', 'piezas'];

  function marcados(campo) { return campo ? [].slice.call(campo.querySelectorAll('input:checked')) : []; }
  function frases(lista) { return lista.map(function (i) { return i.dataset.bgFrase; }); }
  function enumerar(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; }
  function valor(base) { return BG.app.dataset.bgIva === 'sin' ? base : Math.round(base * 116) / 100; }
  function punto(s) { return s.replace(/\s+/g, ' ').replace(/[\s.:;,]+$/, '') + '.'; }
  /* Un importe con centavos se escribe con dos decimales ($75.40). */
  function dinero(n) {
    return n % 1 ? '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : BG.dinero(n);
  }

  /* ── El precio cuenta desde el valor que se veía hasta el nuevo ── */
  var cuenta = { cuadro: 0, el: null, meta: 0, visto: 0 };
  function fijar() {
    cancelAnimationFrame(cuenta.cuadro);
    if (cuenta.el) cuenta.el.textContent = dinero(cuenta.meta);
    cuenta.el = null;
  }
  function contar(precio, quieto) {
    var el = precio.querySelector('[data-bg-precio-num]'), meta = valor(Number(precio.dataset.bgPrecio)), desde = cuenta.visto;
    fijar();
    if (quieto || BG.reducido || desde === meta) { el.textContent = dinero(meta); cuenta.visto = meta; return; }
    cuenta.el = el; cuenta.meta = meta;
    var inicio = performance.now(), dur = 750;
    (function paso(t) {
      var p = Math.min(1, (t - inicio) / dur), suave = 1 - Math.pow(2, -10 * p);
      cuenta.visto = p >= 1 ? meta : Math.round(desde + (meta - desde) * suave);
      el.textContent = dinero(cuenta.visto);
      if (p < 1) cuenta.cuadro = requestAnimationFrame(paso); else cuenta.el = null;
    })(inicio);
  }
  function sinPrecio() { fijar(); cuenta.visto = 0; }

  /* Lo que se anuncia a quien usa lector de pantalla: el bloque visible, con el precio ya en su valor final. */
  function leerPrecio(precio) {
    var num = precio.querySelector('[data-bg-precio-num]'), nota = precio.querySelector('[data-bg-precio-nota]');
    var cola = num.nextElementSibling ? ' ' + num.nextElementSibling.textContent : '';
    return (precio.hasAttribute('data-bg-desde') ? 'Desde ' : '') + dinero(valor(Number(precio.dataset.bgPrecio))) + cola + ', ' + (nota ? nota.textContent : '');
  }
  function partes(bloque) {
    var lista = [];
    [].forEach.call(bloque.children, function (hijo) {
      if (hijo.hidden) return;
      if (hijo.classList.contains('bg-precio')) lista.push(leerPrecio(hijo));
      else if (hijo.tagName === 'DIV') lista = lista.concat(partes(hijo));
      else lista.push(hijo.textContent);
    });
    return lista;
  }
  function leer(bloque) { return partes(bloque).map(punto).join(' '); }

  function pintar(quieto) {
    var tipo = marcados(pasos.tipo)[0] || null;
    var variante = tipo ? tipo.dataset.bgPaso : 'productos';
    var creativo = variante === 'piezas';
    VARIANTES.forEach(function (k) { if (pasos[k]) pasos[k].hidden = k !== variante; });
    if (pasos.productos) pasos.productos.disabled = !tipo;
    if (pista) pista.hidden = !!tipo;
    if (pasos.extras) pasos.extras.hidden = creativo;

    var tam = tipo && !creativo ? marcados(pasos[variante])[0] || null : null;
    var piezas = creativo ? marcados(pasos.piezas) : [];
    var extras = creativo ? [] : marcados(pasos.extras);
    var regla = tipo ? D.mapa[tipo.value] : '';
    var planId = !regla ? '' : typeof regla === 'string' ? regla : tam ? regla[tam.value] || '' : '';
    var estado = !tipo ? 'inicio' : estados[planId] ? planId : 'tamano';
    var plan = estado !== 'inicio' && estado !== 'tamano' && estado !== 'cotizacion' ? estados[estado] : null;

    /* Resumen */
    Object.keys(estados).forEach(function (k) { estados[k].hidden = k !== estado; });
    if (plan) contar(plan.querySelector('.bg-precio'), quieto);
    else if (estado === 'cotizacion') {
      /* Sin piezas, con varias, o con una sola: su precio «desde» (o «según alcance»). */
      var caso = !piezas.length ? 'vacia' : piezas.length === 1 ? piezas[0].value : 'varias';
      var ancla = null;
      casos.forEach(function (k) { k.hidden = k.dataset.bgCotizarCaso !== caso; if (!k.hidden) ancla = k.querySelector('.bg-precio'); });
      estados.cotizacion.dataset.bgCaso = caso === 'vacia' ? 'vacia' : 'pieza';
      if (cuantas) cuantas.textContent = String(Math.max(2, piezas.length));
      if (ancla) contar(ancla, quieto); else sinPrecio();
    } else sinPrecio();

    /* Mensaje */
    var texto;
    if (!tipo) {
      texto = extras.length ? punto(D.general) + ' ' + D.tambien + enumerar(frases(extras)) + '. ' + D.cierre : D.general;
    } else {
      texto = creativo && piezas.length ? D.inicioPiezas + frases(piezas).join('; ') : D.inicio + tipo.dataset.bgFrase + (tam ? ', ' + tam.dataset.bgFrase : '');
      texto += '.';
      if (extras.length) texto += ' ' + D.tambien + enumerar(frases(extras)) + '.';
      if (plan) texto += ' ' + D.sugerido + plan.dataset.bgNombre + '.';
      texto += ' ' + D.cierre;
    }
    if (enviar) enviar.href = BG.wa(texto);
    if (vista) vista.textContent = texto;

    /* Anuncio: solo cuando cambia y no al cargar. */
    if (voz && quieto !== true) {
      var dicho = estado === 'inicio' ? '' : leer(estados[estado]);
      if (voz.textContent !== dicho) voz.textContent = dicho;
    }
  }

  raiz.addEventListener('change', function () { pintar(); });
  /* Si cambia el interruptor de IVA, el núcleo ya escribió los precios: aquí solo se detiene la cuenta en curso. */
  BG.app.addEventListener('bg:iva', function () { pintar(true); });
  /* Al volver con «atrás», el navegador puede restaurar casillas marcadas. */
  window.addEventListener('pageshow', function () { pintar(true); });
  pintar(true);
})();

;
/* L-09 · Cómo trabajamos: al elegir un plan, la cota total vuelve a extenderse y escribe su plazo. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var hoja = BG.app.querySelector('.bg-equipo'); if (!hoja) return;
  var total = hoja.querySelector('.bg-equipo__total');
  var txt = total && total.querySelector('.bg-cota__txt');
  if (!txt) return;

  hoja.addEventListener('change', function (e) {
    var op = e.target.closest('input[name="bg-equipo-plan"]');
    if (!op) return;
    txt.textContent = op.dataset.bgNombre + ' · ' + op.dataset.bgPlazo;
    // Reinicia el trazo: la cota se mide de nuevo desde sus topes.
    total.classList.remove('bg-equipo__total--mide');
    void total.offsetWidth;
    total.classList.add('bg-equipo__total--mide');
  });
})();

;
/* L-10 · Preguntas: cada respuesta se abre y se cierra con altura y opacidad.
   Sin JS o con movimiento reducido, <details> funciona tal cual. */
(function () {
  var BG = window.BGv11; if (!BG) return;
  var hoja = BG.app.querySelector('.bg-cierre'); if (!hoja) return;
  if (BG.reducido || !('animate' in Element.prototype)) return;
  var CURVA = 'cubic-bezier(.16,1,.3,1)';

  [].forEach.call(hoja.querySelectorAll('.bg-cierre__duda'), function (duda) {
    var resumen = duda.querySelector('summary'), panel = duda.querySelector('.bg-cierre__resp');
    if (!resumen || !panel) return;
    var anim = null;

    function animar(desde, hasta, ms, alTerminar) {
      anim = panel.animate(
        [{ height: desde.alto + 'px', opacity: desde.opacidad }, { height: hasta.alto + 'px', opacity: hasta.opacidad }],
        { duration: ms, easing: CURVA }
      );
      anim.onfinish = function () { anim = null; if (alTerminar) alTerminar(); };
    }

    resumen.addEventListener('click', function (e) {
      e.preventDefault();
      var cerrando = duda.classList.contains('bg-cierre__duda--cierra');
      // Estado actual, también a media animación: desde ahí continúa el movimiento.
      var ahora = { alto: panel.getBoundingClientRect().height, opacidad: parseFloat(getComputedStyle(panel).opacity) };
      if (anim) { anim.onfinish = null; anim.cancel(); anim = null; }
      if (duda.open && !cerrando) {
        duda.classList.add('bg-cierre__duda--cierra');     // el signo cambia de inmediato
        animar(ahora, { alto: 0, opacidad: 0 }, 300, function () {
          duda.open = false;
          duda.classList.remove('bg-cierre__duda--cierra');
        });
      } else {
        duda.classList.remove('bg-cierre__duda--cierra');
        duda.open = true;
        animar(cerrando ? ahora : { alto: 0, opacidad: 0 }, { alto: panel.scrollHeight, opacidad: 1 }, 420);
      }
    });
  });
})();

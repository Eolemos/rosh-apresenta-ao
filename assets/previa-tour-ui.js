/* Tour guiado: destaque na tela, balão de legenda, controles e lista de capítulos */
(function () {
  'use strict';

  var A = window.RoshTourAcoes;
  var caps = window.RoshTourCapitulos;
  var el = {};
  var alvo = null;
  var ultimo = '';
  var cfg = null;
  var noSeguido = null;
  var rolarAgora = false;

  var ICONES = {
    voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    avancar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
    tocar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5Z"/></svg>',
    pausar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13M16 5.5v13"/></svg>',
    lista: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/></svg>'
  };

  function criar(tag, classe, html) {
    var no = document.createElement(tag);
    no.className = classe;
    if (html) no.innerHTML = html;
    document.body.appendChild(no);
    return no;
  }

  function montar(opcoes) {
    cfg = opcoes;
    el.luz = criar('div', 'tour-luz');
    el.luz.setAttribute('aria-hidden', 'true');
    el.toque = criar('div', 'tour-toque');
    el.toque.setAttribute('aria-hidden', 'true');
    el.balao = criar('div', 'tour-balao', '<p class="tour-balao__cap"></p><p class="tour-balao__texto"></p>');
    el.balao.setAttribute('role', 'status');
    el.balao.setAttribute('aria-live', 'polite');
    el.balao.hidden = true;

    el.capitulos = criar('div', 'tour-capitulos', '<h2 class="tour-capitulos__titulo">Capítulos</h2><ol class="tour-capitulos__lista"></ol>');
    el.capitulos.id = 'tour-capitulos';
    el.capitulos.hidden = true;

    el.barra = criar('div', 'tour-barra',
      '<div class="tour-barra__botoes">' +
      '<button type="button" class="tour-botao" data-tour="voltar" aria-label="Voltar um passo">' + ICONES.voltar + '<span>Voltar</span></button>' +
      '<button type="button" class="tour-botao tour-botao--tocar" data-tour="tocar"></button>' +
      '<button type="button" class="tour-botao" data-tour="avancar" aria-label="Avançar um passo"><span>Avançar</span>' + ICONES.avancar + '</button></div>' +
      '<div class="tour-barra__meio"><p class="tour-barra__cap"></p><p class="tour-barra__passo"></p>' +
      '<div class="tour-progresso" role="img"></div></div>' +
      '<div class="tour-barra__lado"><button type="button" class="tour-botao" data-tour="capitulos" aria-expanded="false" aria-controls="tour-capitulos">' +
      ICONES.lista + '<span>Capítulos</span></button>' +
      '<a class="tour-botao tour-botao--sair" id="tour-explorar" href="previa.html">Explorar sozinho</a></div>');
    el.barra.setAttribute('role', 'region');
    el.barra.setAttribute('aria-label', 'Controles do tour');

    el.capa = criar('div', 'tour-capa',
      '<div class="tour-capa__caixa"><h1 class="tour-capa__titulo">Tour guiado</h1>' +
      '<p class="tour-capa__texto">Veja um pedido de narguilé sair do tablet do garçom, passar pela cozinha e pelo caixa e chegar ao painel do dono.</p>' +
      '<p class="tour-capa__texto">' + (cfg.reduzir
        ? 'São ' + caps.length + ' capítulos. Você avança no seu ritmo, com o botão Avançar ou as setas do teclado.'
        : 'São ' + caps.length + ' capítulos, uns sete minutos. O tour roda sozinho e as telas se mexem de verdade.') + '</p>' +
      '<div class="tour-capa__acoes"><button type="button" class="botao botao--brasa tour-capa__comecar" data-tour="comecar">Começar o tour</button>' +
      '<a class="botao" href="previa.html">Explorar sozinho</a></div>' +
      '<p class="tour-capa__dica">Espaço pausa. As setas do teclado voltam e avançam.</p></div>');
    el.capa.hidden = true;

    el.preparando = criar('div', 'tour-preparando', '<p>Preparando as telas para este ponto do tour</p>');
    el.preparando.setAttribute('role', 'status');
    el.preparando.hidden = true;

    el.barra.addEventListener('click', aoClicar);
    el.capa.addEventListener('click', aoClicar);
    el.capitulos.addEventListener('click', function (ev) {
      var botao = ev.target.closest('[data-cap]');
      if (!botao) return;
      abrirCapitulos(false);
      cfg.capitulo(Number(botao.getAttribute('data-cap')));
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') abrirCapitulos(false);
    });
    // Enquanto a página rola, destaque e balão acompanham sem atraso
    window.addEventListener('scroll', function () { semAtraso(160); }, { passive: true });
    tocando(false);
    requestAnimationFrame(acompanhar);
  }

  function aoClicar(ev) {
    var botao = ev.target.closest('[data-tour]');
    if (!botao) return;
    var acao = botao.getAttribute('data-tour');
    if (acao === 'capitulos') return abrirCapitulos(el.capitulos.hidden);
    cfg[acao]();
  }

  function abrirCapitulos(abrir) {
    el.capitulos.hidden = !abrir;
    el.barra.querySelector('[data-tour="capitulos"]').setAttribute('aria-expanded', String(abrir));
    if (abrir) {
      var atual = el.capitulos.querySelector('[aria-current="step"]') || el.capitulos.querySelector('button');
      atual.focus();
    }
  }

  // Onde fica o balão: abaixo do destaque, acima, ou dentro dele quando o destaque é a tela inteira
  function posicionar(r) {
    var b = el.balao;
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var topoLivre = 8;
    var fundoLivre = vh - el.barra.offsetHeight - 10;
    if (vw < 760) {
      b.classList.add('tour-balao--fixo');
      b.style.left = '';
      b.style.top = '';
      b.style.bottom = (el.barra.offsetHeight + 8) + 'px';
      return;
    }
    b.classList.remove('tour-balao--fixo');
    b.style.bottom = '';
    var w = b.offsetWidth;
    var h = b.offsetHeight;
    if (!r) {
      b.style.left = Math.round((vw - w) / 2) + 'px';
      b.style.top = Math.round(Math.max(topoLivre, (fundoLivre - h) / 2)) + 'px';
      return;
    }
    var x = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, vw - w - 12));
    var abaixo = r.bottom + 16;
    var acima = r.top - h - 16;
    var y;
    if (abaixo + h <= fundoLivre) y = abaixo;
    else if (acima >= topoLivre) y = acima;
    else {
      // Destaque grande demais: o balão vai para o lado com mais espaço, ou para o canto de baixo
      y = Math.max(topoLivre, fundoLivre - h - 12);
      if (vw - r.right >= w + 28) x = r.right + 16;
      else if (r.left >= w + 28) x = r.left - w - 16;
      else x = Math.max(12, Math.min(r.right - w - 16, vw - w - 12));
    }
    b.style.left = Math.round(x) + 'px';
    b.style.top = Math.round(y) + 'px';
  }

  // Parte do alvo que aparece de fato: listas que rolam cortam o que passa da borda
  function parteVisivel(no) {
    var r = no.getBoundingClientRect();
    var caixa = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    var pai = no.parentElement;
    while (pai && !pai.classList.contains('aparelho')) {
      if (getComputedStyle(pai).overflowY !== 'visible') {
        var p = pai.getBoundingClientRect();
        caixa.left = Math.max(caixa.left, p.left);
        caixa.top = Math.max(caixa.top, p.top);
        caixa.right = Math.min(caixa.right, p.right);
        caixa.bottom = Math.min(caixa.bottom, p.bottom);
      }
      pai = pai.parentElement;
    }
    caixa.width = caixa.right - caixa.left;
    caixa.height = caixa.bottom - caixa.top;
    return caixa.width > 1 && caixa.height > 1 ? caixa : null;
  }

  var pan = 0;

  function semAtraso(ms) {
    el.luz.classList.add('tour-sem-transicao');
    el.balao.classList.add('tour-sem-transicao');
    clearTimeout(semAtraso.timer);
    semAtraso.timer = setTimeout(function () {
      el.luz.classList.remove('tour-sem-transicao');
      el.balao.classList.remove('tour-sem-transicao');
    }, ms);
  }

  // Em tela estreita a tela do sistema fica maior que a janela: a vista desliza de lado até o destaque
  function enquadrar(r) {
    var palco = document.getElementById('palco');
    var vw = document.documentElement.clientWidth;
    var sobra = palco.offsetWidth + 32 - vw;
    var novo = 0;
    if (sobra > 1 && r) {
      novo = r.width > vw - 24 ? pan + (12 - r.left) : pan + (vw / 2 - (r.left + r.width / 2));
      novo = Math.max(-sobra, Math.min(0, Math.round(novo)));
    }
    if (novo === pan) return;
    pan = novo;
    palco.style.setProperty('--tour-pan', pan + 'px');
    semAtraso(520);
  }

  // A página acompanha o destaque quando ele fica fora da área livre (telas altas e celular)
  function rolarPara(r) {
    enquadrar(r);
    var suave = cfg.reduzir ? 'auto' : 'smooth';
    if (!r) {
      // Passo sem destaque: volta ao topo. Alvo que ainda não apareceu: espera, sem mexer na página
      if (!alvo) window.scrollTo({ top: 0, behavior: suave });
      return;
    }
    var topoLivre = 16;
    var fixo = el.balao.classList.contains('tour-balao--fixo') || document.documentElement.clientWidth < 760;
    var fundoLivre = window.innerHeight - el.barra.offsetHeight - 24 - (fixo ? el.balao.offsetHeight + 12 : 0);
    var folga = fundoLivre - topoLivre - r.height;
    if (r.top >= topoLivre && r.bottom <= fundoLivre) return;
    var destino = folga > 0 ? r.top - topoLivre - Math.min(folga / 2, 120) : r.top - topoLivre;
    window.scrollBy({ top: Math.round(destino), behavior: suave });
  }

  // Segue o alvo a cada quadro: as telas se redesenham e os diálogos abrem e fecham
  function acompanhar() {
    requestAnimationFrame(acompanhar);
    if (el.balao.hidden) return;
    var no = A.resolver(alvo);
    var mudou = rolarAgora || no !== noSeguido;
    // Alvo novo: primeiro a lista de dentro da tela rola até ele, depois a página
    if (mudou && no) A.mostrarDentro(no);
    var r = no && A.visivel(no) ? parteVisivel(no) : null;
    if (mudou) {
      rolarAgora = false;
      noSeguido = no;
      rolarPara(r);
      return;
    }
    var chave = r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join() : 'nada';
    chave += '|' + el.balao.offsetHeight + '|' + window.innerWidth + 'x' + window.innerHeight;
    if (chave === ultimo) return;
    ultimo = chave;
    if (r) {
      var folga = 7;
      el.luz.style.left = Math.round(r.left - folga) + 'px';
      el.luz.style.top = Math.round(r.top - folga) + 'px';
      el.luz.style.width = Math.round(r.width + folga * 2) + 'px';
      el.luz.style.height = Math.round(r.height + folga * 2) + 'px';
      el.luz.classList.add('tour-luz--ligada');
    } else {
      el.luz.classList.remove('tour-luz--ligada');
    }
    posicionar(r);
  }

  function progresso(info) {
    el.barra.querySelector('.tour-progresso').innerHTML = caps.map(function (c, i) {
      var pct = i < info.cap ? 100 : i > info.cap ? 0 : Math.round(((info.n + 1) / c.passos.length) * 100);
      return '<span class="tour-progresso__cap" style="flex-grow:' + c.passos.length + '"><span style="width:' + pct + '%"></span></span>';
    }).join('');
    el.barra.querySelector('.tour-progresso').setAttribute('aria-label', 'Capítulo ' + (info.cap + 1) + ' de ' + caps.length);
    el.capitulos.querySelector('ol').innerHTML = caps.map(function (c, i) {
      var estado = i < info.cap ? 'Visto' : i === info.cap ? 'Agora, passo ' + (info.n + 1) + ' de ' + c.passos.length : c.passos.length + ' passos';
      var pct = i < info.cap ? 100 : i > info.cap ? 0 : Math.round(((info.n + 1) / c.passos.length) * 100);
      return '<li><button type="button" class="tour-capitulo' + (i < info.cap ? ' tour-capitulo--visto' : '') + '" data-cap="' + i + '"' +
        (i === info.cap ? ' aria-current="step"' : '') + '><span class="tour-capitulo__n">' + (i + 1) + '</span>' +
        '<span class="tour-capitulo__texto"><span class="tour-capitulo__nome">' + c.titulo + '</span><span class="tour-capitulo__estado">' + estado + '</span>' +
        '<span class="tour-capitulo__barra"><span style="width:' + pct + '%"></span></span></span></button></li>';
    }).join('');
  }

  // Mostra um passo: legenda, destaque, posição no tour e o link de sair para a tela atual
  function passo(p, info) {
    alvo = p.alvo || null;
    ultimo = '';
    rolarAgora = true;
    var cap = caps[info.cap];
    el.balao.hidden = false;
    el.balao.querySelector('.tour-balao__cap').textContent = cap.titulo + ', ' + (info.n + 1) + ' de ' + cap.passos.length;
    // Valores em reais não quebram de linha no meio
    el.balao.querySelector('.tour-balao__texto').textContent = p.texto.replace(/R\$ /g, 'R$' + String.fromCharCode(160));
    el.barra.querySelector('.tour-barra__cap').textContent = (info.cap + 1) + '. ' + cap.titulo;
    el.barra.querySelector('.tour-barra__passo').textContent = 'Passo ' + (info.n + 1) + ' de ' + cap.passos.length;
    el.barra.querySelector('[data-tour="voltar"]').disabled = info.indice === 0;
    el.barra.querySelector('[data-tour="avancar"]').disabled = info.ultimo;
    document.getElementById('tour-explorar').href = 'previa.html#tela=' + info.vista;
    progresso(info);
  }

  function tocando(sim, fim) {
    var botao = el.barra.querySelector('[data-tour="tocar"]');
    botao.innerHTML = (sim ? ICONES.pausar : ICONES.tocar) + '<span>' + (sim ? 'Pausar' : fim ? 'Ver de novo' : 'Reproduzir') + '</span>';
    botao.setAttribute('aria-pressed', String(sim));
  }

  // Marca de dedo onde o tour toca na tela
  function toque(no) {
    var r = no.getBoundingClientRect();
    if (r.width < 1) return;
    el.toque.style.left = Math.round(r.left + r.width / 2) + 'px';
    el.toque.style.top = Math.round(r.top + r.height / 2) + 'px';
    el.toque.classList.remove('tour-toque--agora');
    void el.toque.offsetWidth;
    el.toque.classList.add('tour-toque--agora');
  }

  window.RoshTourUI = {
    montar: montar,
    passo: passo,
    tocando: tocando,
    toque: toque,
    capa: function (mostrar) {
      el.capa.hidden = !mostrar;
      if (mostrar) el.capa.querySelector('[data-tour="comecar"]').focus();
    },
    preparando: function (mostrar) { el.preparando.hidden = !mostrar; }
  };
})();

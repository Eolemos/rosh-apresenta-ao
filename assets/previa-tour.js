/* Tour guiado: motor que toca os passos, um por vez, e cuida de pausar, voltar, avançar e pular capítulos */
(function () {
  'use strict';

  var R = window.Rosh;
  var A = window.RoshTourAcoes;
  var UI = window.RoshTourUI;
  var App = window.RoshApp;
  var caps = window.RoshTourCapitulos;
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lista corrida de passos, cada um sabendo o capítulo e a posição dentro dele
  var passos = [];
  var inicioDoCapitulo = [];
  caps.forEach(function (cap, c) {
    inicioDoCapitulo.push(passos.length);
    cap.passos.forEach(function (p, n) {
      passos.push({ cap: c, n: n, vista: p.vista || cap.vista, foco: p.foco || '', texto: p.texto, alvo: p.alvo, faz: p.faz, tempo: p.tempo });
    });
  });

  var estado = { atual: -1, tocando: false, ocupado: null, ficha: null, timer: null, trocando: false };
  var palco = document.getElementById('palco');

  // Com movimento reduzido cada passo já mostra o resultado, sem a espera de 5 s do Desfazer
  if (reduzir) R.config.desfazerMs = 0;

  function duracao(p) {
    return p.tempo || Math.max(4000, Math.min(6500, 1800 + p.texto.length * 48));
  }

  function info(i) {
    var p = passos[i];
    return { indice: i, cap: p.cap, n: p.n, vista: p.vista, ultimo: i === passos.length - 1 };
  }

  // Roda um passo. modo: 'normal' (com ritmo), 'direto' (mostra já o resultado) ou 'mudo' (sem mostrar, para pular)
  async function rodar(i, modo) {
    var p = passos[i];
    var ficha = { rapido: modo !== 'normal' };
    estado.atual = i;
    estado.ficha = ficha;
    if (p.vista && App.vista() !== p.vista) App.selecionar(p.vista);
    if (palco.getAttribute('data-foco') !== p.foco) {
      palco.setAttribute('data-foco', p.foco);
      App.escalar();
    }
    if (modo !== 'mudo') UI.passo(p, info(i));
    if (!p.faz) return;
    var t = A.criar(ficha);
    if (modo === 'normal') await t.espera(700);
    try {
      await p.faz(t);
    } catch (erro) {
      A.falhas.push('passo ' + i + ': ' + erro.message);
    }
  }

  async function mostrar(i) {
    clearTimeout(estado.timer);
    var comeco = Date.now();
    var p = passos[i];
    estado.ocupado = rodar(i, reduzir ? 'direto' : 'normal');
    await estado.ocupado;
    estado.ocupado = null;
    if (estado.atual !== i) return;
    try {
      history.replaceState(null, '', '#passo=' + i);
    } catch (erro) { /* alguns navegadores bloqueiam em arquivo local */ }
    if (i === passos.length - 1) {
      estado.tocando = false;
      UI.tocando(false, true);
      return;
    }
    if (estado.tocando) {
      var resta = Math.max(1700, duracao(p) - (Date.now() - comeco));
      estado.timer = setTimeout(avancar, resta);
    }
  }

  // Termina na hora o que o passo atual ainda está fazendo
  async function concluirAtual() {
    clearTimeout(estado.timer);
    if (estado.ocupado) {
      estado.ficha.rapido = true;
      await estado.ocupado;
    }
  }

  async function avancar() {
    if (estado.trocando || estado.atual >= passos.length - 1) return;
    estado.trocando = true;
    await concluirAtual();
    estado.trocando = false;
    mostrar(estado.atual + 1);
  }

  // Pula para a frente rodando os passos do meio sem mostrar, para as telas chegarem no estado certo
  async function pularPara(destino) {
    if (estado.trocando) return;
    estado.trocando = true;
    await concluirAtual();
    UI.preparando(true);
    R.config.desfazerMs = 0;
    for (var i = estado.atual + 1; i < destino; i++) await rodar(i, 'mudo');
    await new Promise(function (ok) { setTimeout(ok, 160); });
    R.config.desfazerMs = reduzir ? 0 : 5000;
    UI.preparando(false);
    estado.trocando = false;
    mostrar(destino);
  }

  // Voltar exige as telas como estavam: a página recarrega e refaz o caminho até o passo pedido
  function recarregarEm(destino) {
    clearTimeout(estado.timer);
    location.hash = '#passo=' + destino + (estado.tocando ? '&tocar=1' : '');
    location.reload();
  }

  function voltar() {
    if (estado.atual > 0 && !estado.trocando) recarregarEm(estado.atual - 1);
  }

  function irCapitulo(c) {
    var destino = inicioDoCapitulo[c];
    if (destino > estado.atual) pularPara(destino);
    else recarregarEm(destino);
  }

  function alternar() {
    if (estado.atual === passos.length - 1) {
      estado.tocando = true;
      return recarregarEm(0);
    }
    estado.tocando = !estado.tocando;
    UI.tocando(estado.tocando);
    clearTimeout(estado.timer);
    if (estado.tocando && !estado.ocupado && !estado.trocando) estado.timer = setTimeout(avancar, 900);
  }

  function comecar() {
    A.ligarSom();
    UI.capa(false);
    estado.tocando = !reduzir;
    UI.tocando(estado.tocando);
    mostrar(0);
  }

  // As telas são operadas pelo tour, então o teclado é sempre dos controles, mesmo com um campo em foco
  document.addEventListener('keydown', function (ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || estado.atual < 0) return;
    var espaco = ev.key === ' ' || ev.key === 'Spacebar';
    var noControle = ev.target.closest && ev.target.closest('.tour-barra, .tour-capitulos, .tour-capa, .pv-topo');
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && !(espaco && !noControle)) return;
    ev.preventDefault();
    if (ev.key === 'ArrowRight') avancar();
    else if (ev.key === 'ArrowLeft') voltar();
    else alternar();
  });
  document.addEventListener('pointerdown', A.ligarSom);

  // O caixa do tour começa o dia sem turno aberto, para mostrar a abertura com fundo de troco
  delete window.RoshNumeros.turnos.bia;
  R.avisar({ tipo: 'turno', operador: 'bia' });

  UI.montar({ reduzir: reduzir, comecar: comecar, voltar: voltar, avancar: avancar, tocar: alternar, capitulo: irCapitulo });

  var pedido = /passo=(\d+)/.exec(location.hash);
  var inicial = pedido ? Math.min(passos.length - 1, Number(pedido[1])) : 0;
  if (inicial > 0) {
    estado.tocando = /tocar=1/.test(location.hash);
    UI.tocando(estado.tocando);
    pularPara(inicial);
  } else {
    UI.capa(true);
  }

  window.RoshTour = { passos: passos, estado: estado, avancar: avancar, voltar: voltar, alternar: alternar, irCapitulo: irCapitulo, comecar: comecar };
})();

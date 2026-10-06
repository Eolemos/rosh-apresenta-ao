/* Tour guiado: o que o roteiro consegue fazer nas telas (achar, tocar, digitar, esperar) */
(function () {
  'use strict';

  var falhas = (window.RoshTourFalhas = []);
  var audio = null;

  function q(sel, raiz) {
    return (raiz || document).querySelector(sel);
  }

  // Primeiro elemento que casa com o seletor e contém o texto
  function achar(sel, texto, raiz) {
    var lista = (raiz || document).querySelectorAll(sel);
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].textContent.indexOf(texto) !== -1) return lista[i];
    }
    return null;
  }

  function resolver(alvo) {
    if (!alvo) return null;
    return typeof alvo === 'function' ? alvo() : q(alvo);
  }

  function visivel(el) {
    return Boolean(el && el.getBoundingClientRect().width > 1);
  }

  // Rola só as listas de dentro da tela (colunas da cozinha, gavetas), nunca a página
  function mostrarDentro(el) {
    var pai = el.parentElement;
    while (pai && !pai.classList.contains('aparelho__tela')) {
      if (pai.scrollHeight > pai.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(pai).overflowY)) {
        var topo = el.getBoundingClientRect().top - pai.getBoundingClientRect().top;
        var escala = pai.getBoundingClientRect().height / pai.offsetHeight || 1;
        var relativo = topo / escala + pai.scrollTop;
        if (relativo < pai.scrollTop || relativo + el.offsetHeight > pai.scrollTop + pai.clientHeight) {
          pai.scrollTop = Math.max(0, relativo - 12);
        }
      }
      pai = pai.parentElement;
    }
  }

  function ligarSom() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx && !audio) audio = new Ctx();
      if (audio && audio.state === 'suspended') audio.resume();
    } catch (e) {
      audio = null;
    }
  }

  // Dois toques curtos, como a campainha da cozinha
  function tocarSom() {
    if (!audio || audio.state !== 'running') return;
    [[880, 0], [1175, 0.16]].forEach(function (nota) {
      var osc = audio.createOscillator();
      var ganho = audio.createGain();
      var t0 = audio.currentTime + nota[1];
      osc.type = 'sine';
      osc.frequency.value = nota[0];
      ganho.gain.setValueAtTime(0.0001, t0);
      ganho.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(ganho);
      ganho.connect(audio.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
    });
  }

  // Ferramentas de um passo; "ficha.rapido" faz tudo acontecer sem esperas
  function criar(ficha) {
    function espera(ms) {
      return new Promise(function (ok) { setTimeout(ok, ficha.rapido ? 0 : ms); });
    }

    function ate(condicao, limite) {
      var fim = Date.now() + (limite || 7000);
      return new Promise(function (ok) {
        (function tentar() {
          var valor = condicao();
          if (valor || Date.now() > fim) return ok(valor || null);
          setTimeout(tentar, 30);
        })();
      });
    }

    function alvoVisivel(alvo) {
      return ate(function () {
        var el = resolver(alvo);
        return el && (ficha.rapido || visivel(el)) ? el : null;
      }, 2500);
    }

    function nome(alvo) {
      return typeof alvo === 'string' ? alvo : String(alvo).replace(/\s+/g, ' ').slice(0, 90);
    }

    async function clicar(alvo, depois) {
      var el = await alvoVisivel(alvo);
      if (!el || el.disabled) {
        falhas.push((el ? 'desativado: ' : 'não achei: ') + nome(alvo));
        return false;
      }
      if (!ficha.rapido) {
        mostrarDentro(el);
        if (window.RoshTourUI) window.RoshTourUI.toque(el);
        await espera(280);
      }
      // A tela pode ter se redesenhado durante a espera: o toque vai no elemento que está lá agora
      if (!document.contains(el)) el = (await alvoVisivel(alvo)) || el;
      if (!document.contains(el) || el.disabled) {
        falhas.push('sumiu antes do toque: ' + nome(alvo));
        return false;
      }
      el.click();
      await espera(depois === undefined ? 520 : depois);
      return true;
    }

    // Digita letra por letra; o campo é procurado de novo a cada letra porque a tela pode se redesenhar
    async function digitar(alvo, texto, cadencia) {
      var el = await alvoVisivel(alvo);
      if (!el) {
        falhas.push('não achei o campo: ' + nome(alvo));
        return false;
      }
      var passos = ficha.rapido ? [texto] : texto.split('').map(function (_, i) { return texto.slice(0, i + 1); });
      for (var i = 0; i < passos.length; i++) {
        el = resolver(alvo) || el;
        el.value = passos[i];
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await espera(cadencia || 85);
      }
      el = resolver(alvo) || el;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      await espera(300);
      return true;
    }

    async function escolher(alvo, valor) {
      var el = await alvoVisivel(alvo);
      if (!el) {
        falhas.push('não achei a lista: ' + nome(alvo));
        return false;
      }
      el.value = valor;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      await espera(350);
      return true;
    }

    // Digita o PIN no teclado de um diálogo e confirma
    async function pin(tela, codigo, confirmar) {
      for (var i = 0; i < codigo.length; i++) {
        await clicar(tela + ' .ui-modal [data-acao="tecla"][data-valor="' + codigo.charAt(i) + '"]', 200);
      }
      await clicar(tela + ' .ui-modal [data-acao="' + confirmar + '"]');
    }

    return {
      q: q,
      achar: achar,
      espera: espera,
      ate: ate,
      clicar: clicar,
      digitar: digitar,
      escolher: escolher,
      pin: pin,
      rapido: function () { return ficha.rapido; },
      mostrar: function (alvo) {
        var no = resolver(alvo);
        if (no) mostrarDentro(no);
      },
      som: function () { if (!ficha.rapido) tocarSom(); }
    };
  }

  window.RoshTourAcoes = {
    criar: criar, q: q, achar: achar, resolver: resolver, visivel: visivel, mostrarDentro: mostrarDentro, ligarSom: ligarSom, falhas: falhas
  };
})();

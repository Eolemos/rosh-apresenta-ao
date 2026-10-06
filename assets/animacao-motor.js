/* Motor da animação: linha do tempo das cenas, interpolações e controles */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const cenas = window.RoshCenas || [];
  const consultaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduzido = () => consultaMovimento.matches;

  const $ = (id) => document.getElementById(id);
  const ui = {
    raiz: $('palco-cena'),
    narracao: $('narracao'),
    narracaoLista: $('narracao-lista'),
    contagem: $('cena-contagem'),
    titulo: $('cena-titulo'),
    texto: $('cena-texto'),
    beneficios: $('cena-beneficios'),
    lista: $('lista-cenas'),
    tocar: $('btn-tocar'),
    tocarTexto: $('btn-tocar-texto'),
    botoesCena: []
  };

  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const saida = (t) => 1 - Math.pow(1 - t, 3);

  const estado = {
    indice: 0,
    tempo: 0,
    agora: 0,
    tocando: false,
    instantaneo: false,
    terminou: false,
    eventos: [],
    proximo: 0,
    anims: [],
    narracoes: [],
    idNarracao: 0,
    ultimoQuadro: 0
  };

  // Mantém a lista ordenada; nada entra antes do próximo evento a disparar
  function agendar(at, fn) {
    let i = estado.eventos.length;
    while (i > estado.proximo && estado.eventos[i - 1].at > at) i -= 1;
    estado.eventos.splice(i, 0, { at, fn });
  }

  function narrar(texto) {
    estado.narracoes.push(texto);
    if (estado.instantaneo) return;
    const id = ++estado.idNarracao;
    ui.narracao.classList.add('trocando');
    window.setTimeout(() => {
      if (id !== estado.idNarracao) return;
      ui.narracao.textContent = texto;
      ui.narracao.classList.remove('trocando');
    }, 180);
  }

  function criarApi(raiz) {
    const api = {
      el(tag, attrs = {}, pai = raiz) {
        const no = document.createElementNS(NS, tag);
        for (const [chave, valor] of Object.entries(attrs)) {
          if (chave === 'texto') no.textContent = valor;
          else no.setAttribute(chave, valor);
        }
        pai.appendChild(no);
        return no;
      },
      em(ms, fn) {
        agendar(ms, fn);
      },
      depois(ms, fn) {
        agendar(estado.agora + ms, fn);
      },
      // Interpolação no relógio da cena: pausa junto e, sem movimento, vai direto ao fim
      anim(duracao, fn, curva = suave) {
        if (estado.instantaneo || duracao <= 0) {
          fn(1);
          return;
        }
        estado.anims.push({ inicio: estado.agora, duracao, fn, curva });
        fn(0);
      },
      narrar,
      oculto(el) {
        el.style.opacity = 0;
        return el;
      },
      aparecer(el, duracao = 500) {
        api.anim(duracao, (t) => { el.style.opacity = t; });
      },
      sumir(el, duracao = 400) {
        api.anim(duracao, (t) => { el.style.opacity = 1 - t; });
      },
      surgir(el, duracao = 600, deslocamento = -24) {
        api.anim(duracao, (t) => {
          el.style.opacity = t;
          el.style.transform = `translateY(${deslocamento * (1 - t)}px)`;
        }, saida);
      },
      classe(el, nome, ligar = true) {
        el.classList.toggle(nome, ligar);
      },
      desenhar(caminho, duracao = 900) {
        const total = caminho.getTotalLength();
        caminho.style.opacity = 1;
        caminho.style.strokeDasharray = `${total} ${total}`;
        api.anim(duracao, (t) => {
          caminho.style.strokeDashoffset = total * (1 - t);
          if (t >= 1) {
            caminho.style.strokeDasharray = '';
            caminho.style.strokeDashoffset = '';
          }
        });
      },
      mover(ponto, caminho, duracao = 1000, opcoes = {}) {
        const total = caminho.getTotalLength();
        const reverso = Boolean(opcoes.reverso);
        const manter = Boolean(opcoes.manter);
        api.anim(duracao, (t) => {
          const p = caminho.getPointAtLength(total * (reverso ? 1 - t : t));
          ponto.setAttribute('cx', p.x);
          ponto.setAttribute('cy', p.y);
          ponto.style.opacity = t >= 1 && !manter ? 0 : 1;
        });
      },
      contar(el, de, ate, duracao = 600, formato = (n) => String(Math.round(n))) {
        api.anim(duracao, (t) => { el.textContent = formato(de + (ate - de) * t); }, (t) => t);
      },
      anel(x, y, tipo = 'brasa') {
        const anel = api.el('circle', { cx: x, cy: y, r: 6, class: `s-anel s-anel--${tipo}` });
        api.anim(750, (t) => {
          anel.setAttribute('r', 6 + 34 * t);
          anel.style.opacity = 1 - t;
        }, saida);
      }
    };
    return api;
  }

  function processar() {
    while (estado.proximo < estado.eventos.length
      && estado.eventos[estado.proximo].at <= estado.tempo) {
      const evento = estado.eventos[estado.proximo];
      estado.proximo += 1;
      estado.agora = evento.at;
      evento.fn();
    }
    estado.agora = estado.tempo;
    estado.anims = estado.anims.filter((a) => {
      const p = Math.min(1, Math.max(0, (estado.tempo - a.inicio) / a.duracao));
      a.fn(a.curva(p));
      return p < 1;
    });
  }

  function barra(i) {
    return ui.botoesCena[i].querySelector('.cena-btn__barra span');
  }

  function mostrarLegenda(i) {
    const cena = cenas[i];
    ui.contagem.textContent = `Cena ${i + 1} de ${cenas.length}`;
    ui.titulo.textContent = cena.titulo;
    ui.texto.textContent = cena.texto;
    ui.beneficios.replaceChildren(...cena.beneficios.map((b) => {
      const item = document.createElement('li');
      item.textContent = b;
      return item;
    }));
    // Na primeira e na última cena não há para onde ir; o foco vai para um botão ativo
    const foco = document.activeElement;
    $('btn-anterior').disabled = i === 0;
    $('btn-proxima').disabled = i === cenas.length - 1;
    if (foco instanceof HTMLButtonElement && foco.disabled) {
      (reduzido() ? $('btn-recomecar') : ui.tocar).focus();
    }
    ui.botoesCena.forEach((botao, j) => {
      if (j === i) botao.setAttribute('aria-current', 'step');
      else botao.removeAttribute('aria-current');
      barra(j).style.width = j < i ? '100%' : '0%';
    });
  }

  function mostrarNarracoesEmLista() {
    ui.narracao.hidden = true;
    ui.narracaoLista.hidden = false;
    ui.narracaoLista.replaceChildren(...estado.narracoes.map((texto) => {
      const item = document.createElement('li');
      item.textContent = texto;
      return item;
    }));
  }

  function definirTocando(ligar) {
    estado.tocando = ligar;
    ui.tocar.classList.toggle('parado', !ligar);
    if (ligar) ui.tocarTexto.textContent = 'Pausar';
    else ui.tocarTexto.textContent = estado.terminou ? 'Ver de novo' : 'Reproduzir';
  }

  function montarCena() {
    estado.tempo = 0;
    estado.agora = 0;
    estado.eventos = [];
    estado.proximo = 0;
    estado.anims = [];
    estado.narracoes = [];
    ui.raiz.replaceChildren();
    cenas[estado.indice].montar(criarApi(ui.raiz));
  }

  function dispararAte(limite) {
    while (estado.proximo < estado.eventos.length && estado.eventos[estado.proximo].at <= limite) {
      const evento = estado.eventos[estado.proximo];
      estado.proximo += 1;
      estado.agora = evento.at;
      evento.fn();
    }
  }

  function irPara(i, tocar) {
    estado.indice = Math.max(0, Math.min(cenas.length - 1, i));
    estado.idNarracao += 1;
    estado.terminou = false;
    estado.instantaneo = reduzido();

    ui.narracao.textContent = '';
    ui.narracao.classList.remove('trocando');
    mostrarLegenda(estado.indice);
    montarCena();

    if (estado.instantaneo) {
      // Sem movimento: a cena para no seu momento-chave, mas a lista traz toda a narração
      dispararAte(Infinity);
      const momento = cenas[estado.indice].quadroEstatico;
      if (momento !== undefined) {
        const todas = estado.narracoes;
        montarCena();
        dispararAte(momento);
        estado.narracoes = todas;
      }
      mostrarNarracoesEmLista();
    } else {
      ui.narracao.hidden = false;
      ui.narracaoLista.hidden = true;
      processar();
    }
    definirTocando(Boolean(tocar) && !estado.instantaneo);
  }

  function quadro(instante) {
    const dt = estado.ultimoQuadro ? Math.min(instante - estado.ultimoQuadro, 100) : 0;
    estado.ultimoQuadro = instante;
    if (estado.tocando) {
      estado.tempo += dt;
      processar();
      const cena = cenas[estado.indice];
      barra(estado.indice).style.width = `${Math.min(100, (estado.tempo / cena.duracao) * 100)}%`;
      if (estado.tempo >= cena.duracao) {
        if (estado.indice < cenas.length - 1) {
          irPara(estado.indice + 1, true);
        } else {
          estado.terminou = true;
          ui.contagem.textContent = `Cena ${cenas.length} de ${cenas.length}: fim da apresentação`;
          definirTocando(false);
        }
      }
    }
    window.requestAnimationFrame(quadro);
  }

  function alternar() {
    if (estado.instantaneo) return;
    if (estado.terminou) {
      irPara(0, true);
      return;
    }
    definirTocando(!estado.tocando);
  }

  function montarLista() {
    cenas.forEach((cena, i) => {
      const item = document.createElement('li');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'cena-btn';
      const numero = document.createElement('span');
      numero.className = 'cena-btn__num';
      numero.textContent = String(i + 1);
      const titulo = document.createElement('span');
      titulo.textContent = cena.titulo;
      const trilho = document.createElement('span');
      trilho.className = 'cena-btn__barra';
      trilho.appendChild(document.createElement('span'));
      botao.append(numero, titulo, trilho);
      botao.addEventListener('click', () => irPara(i, true));
      item.appendChild(botao);
      ui.lista.appendChild(item);
      ui.botoesCena.push(botao);
    });
  }

  function ligarControles() {
    $('btn-anterior').addEventListener('click', () => irPara(estado.indice - 1, true));
    $('btn-proxima').addEventListener('click', () => irPara(estado.indice + 1, true));
    $('btn-recomecar').addEventListener('click', () => irPara(0, true));
    ui.tocar.addEventListener('click', alternar);

    document.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const alvo = e.target;
      const emControle = alvo instanceof HTMLButtonElement || alvo instanceof HTMLAnchorElement;
      if (e.key === ' ' && !emControle) {
        e.preventDefault();
        alternar();
      } else if (e.key === 'ArrowRight' && estado.indice < cenas.length - 1) {
        e.preventDefault();
        irPara(estado.indice + 1, true);
      } else if (e.key === 'ArrowLeft' && estado.indice > 0) {
        e.preventDefault();
        irPara(estado.indice - 1, true);
      }
    });

    consultaMovimento.addEventListener('change', () => {
      document.documentElement.classList.toggle('movimento-reduzido', reduzido());
      irPara(estado.indice, true);
    });
  }

  function iniciar() {
    if (!cenas.length || !ui.raiz) return;
    document.documentElement.classList.toggle('movimento-reduzido', reduzido());
    montarLista();
    ligarControles();
    // As medidas das pílulas dependem da fonte; espera ela carregar (no máximo 1,5 s)
    const fontes = document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise((r) => window.setTimeout(r, 1500))])
      : Promise.resolve();
    // Link direto para uma cena: animacao.html#cena-3
    const pedida = /^#cena-(\d+)$/.exec(window.location.hash);
    const inicial = pedida ? Number(pedida[1]) - 1 : 0;
    fontes.then(() => {
      irPara(inicial, true);
      window.requestAnimationFrame(quadro);
    });
  }

  iniciar();
})();

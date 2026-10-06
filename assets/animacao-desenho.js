/* Desenhos reutilizáveis do palco: aparelhos, nuvem, comanda, rótulos */
(function () {
  'use strict';

  let idRecorte = 0;

  function medir(texto) {
    try {
      return texto.getComputedTextLength();
    } catch (erro) {
      return texto.textContent.length * 8;
    }
  }

  function rotulo(api, x, y, texto, opcoes = {}) {
    const classes = ['s-rotulo'];
    if (opcoes.forte) classes.push('s-rotulo--forte');
    if (opcoes.pequeno) classes.push('s-rotulo--pequeno');
    if (opcoes.classe) classes.push(opcoes.classe);
    return api.el('text', {
      x, y, 'text-anchor': opcoes.ancora || 'middle', class: classes.join(' '), texto
    }, opcoes.pai);
  }

  // Texto pequeno dentro das telas dos aparelhos
  function textoTela(api, x, y, texto, opcoes = {}) {
    const classes = ['s-tela-texto'];
    if (opcoes.forte) classes.push('s-tela-texto--forte');
    if (opcoes.fraco) classes.push('s-tela-texto--fraco');
    if (opcoes.classe) classes.push(opcoes.classe);
    return api.el('text', {
      x, y, 'text-anchor': opcoes.ancora || 'start', class: classes.join(' '), texto
    }, opcoes.pai);
  }

  function linha(api, d, tipo = 'apagada', extra = '', pai) {
    return api.el('path', { d, class: `s-linha s-linha--${tipo} ${extra}`.trim() }, pai);
  }

  // Troca a cor de uma linha mantendo as outras classes
  function tingir(caminho, tipo) {
    for (const t of ['latao', 'brasa', 'vidro', 'falha', 'apagada']) {
      caminho.classList.remove(`s-linha--${t}`);
    }
    caminho.classList.add(`s-linha--${tipo}`);
  }

  function token(api, tipo = 'brasa', raio = 9) {
    return api.el('circle', {
      cx: -50, cy: -50, r: raio, class: `s-token s-preenche-${tipo}`, style: 'opacity:0'
    });
  }

  function tablet(api, cx, cy, nome, largura = 170, altura = 115) {
    const g = api.el('g', { class: 's-disp' });
    const mx = largura / 2;
    const my = altura / 2;
    api.el('rect', { x: cx - mx, y: cy - my, width: largura, height: altura, rx: 14, class: 's-corpo' }, g);
    api.el('rect', { x: cx - mx + 9, y: cy - my + 9, width: largura - 18, height: altura - 18, rx: 6, class: 's-tela' }, g);
    const tela = api.el('g', {}, g);
    if (nome) rotulo(api, cx, cy + my + 33, nome, { pai: g });
    return { g, tela, cx, cy, esq: cx - mx, dir: cx + mx, topo: cy - my, base: cy + my };
  }

  function monitor(api, cx, cy, nome, largura = 200, altura = 120) {
    const g = api.el('g', { class: 's-disp' });
    const mx = largura / 2;
    const my = altura / 2;
    api.el('rect', { x: cx - 6, y: cy + my - 2, width: 12, height: 20, class: 's-corpo' }, g);
    api.el('rect', { x: cx - 40, y: cy + my + 16, width: 80, height: 9, rx: 4, class: 's-corpo' }, g);
    api.el('rect', { x: cx - mx, y: cy - my, width: largura, height: altura, rx: 10, class: 's-corpo' }, g);
    api.el('rect', { x: cx - mx + 7, y: cy - my + 7, width: largura - 14, height: altura - 14, rx: 5, class: 's-tela' }, g);
    const tela = api.el('g', {}, g);
    if (nome) rotulo(api, cx, cy + my + 52, nome, { pai: g });
    return { g, tela, cx, cy, esq: cx - mx, dir: cx + mx, topo: cy - my, base: cy + my };
  }

  function caixinha(api, cx, cy, nome) {
    const g = api.el('g', { class: 's-disp' });
    api.el('rect', { x: cx - 75, y: cy - 35, width: 150, height: 70, rx: 12, class: 's-corpo' }, g);
    for (const dy of [-12, 0, 12]) {
      api.el('path', { d: `M${cx - 55} ${cy + dy}H${cx + 5}`, class: 's-detalhe' }, g);
    }
    const led = api.el('circle', { cx: cx + 48, cy, r: 7, class: 's-preenche-brasa s-token' }, g);
    if (nome) rotulo(api, cx, cy + 66, nome, { pai: g });
    return { g, led, cx, cy, esq: cx - 75, dir: cx + 75, topo: cy - 35, base: cy + 35 };
  }

  // ancoraRotulo: 'end' ou 'start' põe o nome ao lado; 'dentro' escreve no corpo
  function impressora(api, cx, cy, nome, ancoraRotulo = 'end', largura = 130) {
    const g = api.el('g', { class: 's-disp' });
    const mx = largura / 2;
    api.el('path', {
      d: `M${cx - 40} ${cy - 25}C${cx - 40} ${cy - 46} ${cx + 40} ${cy - 46} ${cx + 40} ${cy - 25}`,
      class: 's-corpo'
    }, g);
    api.el('rect', { x: cx - mx, y: cy - 25, width: largura, height: 50, rx: 10, class: 's-corpo' }, g);
    api.el('path', { d: `M${cx - mx + 13} ${cy + 17}H${cx + mx - 13}`, class: 's-detalhe' }, g);
    if (nome && ancoraRotulo === 'dentro') {
      rotulo(api, cx, cy + 4, nome, { pai: g, pequeno: true });
    } else if (nome) {
      const x = ancoraRotulo === 'end' ? cx - mx - 15 : cx + mx + 15;
      rotulo(api, x, cy + 6, nome, { pai: g, ancora: ancoraRotulo });
    }
    return { g, cx, cy, saidaY: cy + 19, esq: cx - mx, dir: cx + mx };
  }

  function nuvem(api, cx, cy, nome) {
    const g = api.el('g', { class: 's-disp' });
    api.el('path', {
      d: `M${cx - 75} ${cy + 38}C${cx - 108} ${cy + 38} ${cx - 108} ${cy - 8} ${cx - 72} ${cy - 10}`
        + `C${cx - 70} ${cy - 50} ${cx - 18} ${cy - 60} ${cx - 2} ${cy - 30}`
        + `C${cx + 16} ${cy - 60} ${cx + 72} ${cy - 50} ${cx + 68} ${cy - 8}`
        + `C${cx + 106} ${cy - 8} ${cx + 106} ${cy + 38} ${cx + 75} ${cy + 38}Z`,
      class: 's-nuvem'
    }, g);
    if (nome) rotulo(api, cx, cy + 66, nome, { pai: g });
    return { g, cx, cy, topo: cy - 50, base: cy + 38, esq: cx - 100, dir: cx + 100 };
  }

  function pessoa(api, cx, cy) {
    const g = api.el('g', { class: 's-disp' });
    api.el('circle', { cx, cy: cy - 26, r: 13, class: 's-corpo' }, g);
    api.el('path', {
      d: `M${cx - 24} ${cy + 22}C${cx - 24} ${cy - 6} ${cx + 24} ${cy - 6} ${cx + 24} ${cy + 22}Z`,
      class: 's-corpo'
    }, g);
    return { g, cx, cy };
  }

  function loja(api, cx, cy, nome) {
    const g = api.el('g', { class: 's-disp' });
    api.el('rect', { x: cx - 34, y: cy - 22, width: 68, height: 48, rx: 4, class: 's-corpo' }, g);
    api.el('rect', { x: cx - 40, y: cy - 36, width: 80, height: 15, rx: 4, class: 's-contorno-latao' }, g);
    api.el('rect', { x: cx - 9, y: cy + 4, width: 18, height: 22, rx: 2, class: 's-tela' }, g);
    if (nome) rotulo(api, cx, cy + 50, nome, { pai: g, pequeno: true });
    return { g, cx, cy, topo: cy - 36 };
  }

  function pilula(api, cx, cy, texto, tipo = 'latao', pai) {
    const g = api.el('g', {}, pai);
    const fundo = api.el('rect', { x: cx, y: cy - 15, height: 30, rx: 15, class: `s-contorno-${tipo}` }, g);
    const rotuloPilula = api.el('text', {
      x: cx, y: cy + 5, 'text-anchor': 'middle', class: 's-tela-texto', texto
    }, g);
    function ajustar() {
      const largura = Math.max(56, medir(rotuloPilula) + 30);
      fundo.setAttribute('x', cx - largura / 2);
      fundo.setAttribute('width', largura);
    }
    ajustar();
    return {
      g,
      definir(novoTexto, novoTipo) {
        rotuloPilula.textContent = novoTexto;
        if (novoTipo) fundo.setAttribute('class', `s-contorno-${novoTipo}`);
        ajustar();
      }
    };
  }

  function botaoTela(api, x, y, largura, altura, texto, tipo, pai) {
    const g = api.el('g', {}, pai);
    const cheio = tipo === 'brasa';
    api.el('rect', {
      x, y, width: largura, height: altura, rx: 6,
      class: cheio ? 's-preenche-brasa' : `s-contorno-${tipo}`
    }, g);
    api.el('text', {
      x: x + largura / 2, y: y + altura / 2 + 5, 'text-anchor': 'middle',
      class: `s-tela-texto s-tela-texto--forte ${cheio ? 's-preenche-escuro' : ''}`.trim(), texto
    }, g);
    return g;
  }

  // Comanda térmica: o papel sai da impressora de cima para baixo
  function comanda(api, x, y, largura, linhas, classe = '') {
    const id = `recorte-comanda-${++idRecorte}`;
    let altura = 18;
    for (const l of linhas) altura += l.tipo === 'mesa' ? 30 : l.tipo === 'corte' ? 12 : 16;
    altura += 14;

    const recorteDef = api.el('clipPath', { id });
    const recorte = api.el('rect', { x: x - 4, y, width: largura + 8, height: 0 }, recorteDef);
    const g = api.el('g', { 'clip-path': `url(#${id})`, class: classe });

    let serra = `M${x} ${y}H${x + largura}V${y + altura - 6}`;
    for (let px = x + largura; px > x; px -= 10) {
      serra += `L${px - 5} ${y + altura}L${Math.max(x, px - 10)} ${y + altura - 6}`;
    }
    api.el('path', { d: `${serra}Z`, class: 's-papel' }, g);

    let cursor = y + 18;
    for (const l of linhas) {
      if (l.tipo === 'corte') {
        api.el('path', {
          d: `M${x + 8} ${cursor - 2}H${x + largura - 8}`,
          style: 'stroke:#221d22;stroke-dasharray:3 3;opacity:.55;fill:none'
        }, g);
        cursor += 12;
        continue;
      }
      const mesa = l.tipo === 'mesa';
      if (mesa) cursor += 10;
      api.el('text', {
        x: mesa || l.tipo === 'centro' ? x + largura / 2 : x + 10,
        y: cursor,
        'text-anchor': mesa || l.tipo === 'centro' ? 'middle' : 'start',
        class: `s-comanda-texto ${mesa ? 's-comanda-mesa' : ''}`.trim(),
        texto: l.t
      }, g);
      cursor += mesa ? 20 : 16;
    }

    return {
      g,
      altura,
      imprimir(duracao) {
        api.anim(duracao, (t) => recorte.setAttribute('height', altura * t + 1), (t) => t);
      }
    };
  }

  function marcaX(api, cx, cy, tamanho = 14) {
    const g = api.el('g', { style: 'opacity:0' });
    linha(api, `M${cx - tamanho} ${cy - tamanho}L${cx + tamanho} ${cy + tamanho}`, 'falha', '', g);
    linha(api, `M${cx + tamanho} ${cy - tamanho}L${cx - tamanho} ${cy + tamanho}`, 'falha', '', g);
    return g;
  }

  // Marca de conferido: círculo com o sinal de certo
  function confere(api, cx, cy) {
    const g = api.el('g', { style: 'opacity:0' });
    api.el('circle', { cx, cy, r: 18, class: 's-contorno-brasa' }, g);
    linha(api, `M${cx - 8} ${cy}L${cx - 2} ${cy + 6}L${cx + 9} ${cy - 7}`, 'brasa', '', g);
    return g;
  }

  window.RoshDesenho = {
    rotulo, textoTela, linha, tingir, token, tablet, monitor, caixinha, impressora,
    nuvem, pessoa, loja, pilula, botaoTela, comanda, marcaX, confere
  };
})();

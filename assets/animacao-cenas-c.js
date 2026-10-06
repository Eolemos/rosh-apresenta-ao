/* Cenas 5 e 6: queda de internet e modo reserva (contingência) */
(function () {
  'use strict';

  const D = window.RoshDesenho;
  const cenas = (window.RoshCenas = window.RoshCenas || []);

  cenas.push({
    titulo: 'A internet caiu. A loja continua.',
    texto: 'A caixinha fica dentro da loja e não depende da internet. O que acontecer sem internet sobe para a nuvem depois, sozinho.',
    beneficios: [
      'Pedido, pagamento e comanda continuam funcionando.',
      'Nada se perde e nada sobe duas vezes.',
      'Quando a internet volta, o dono vê tudo de novo.'
    ],
    duracao: 14500,
    quadroEstatico: 8800,
    montar(api) {
      api.el('rect', {
        x: 30, y: 165, width: 670, height: 405, rx: 16,
        class: 's-linha s-linha--latao s-linha--fina s-tracejada'
      });
      D.rotulo(api, 52, 196, 'Dentro da loja', { ancora: 'start', pequeno: true, classe: 's-rotulo--latao' });

      const p1 = D.linha(api, 'M225 300H285', 'brasa', 's-linha--fina');
      const p4 = D.linha(api, 'M435 290C455 290 455 270 475 270', 'brasa', 's-linha--fina');
      const p5 = D.linha(api, 'M420 335C460 400 480 475 510 475', 'brasa', 's-linha--fina');
      const enlace = D.linha(api, 'M360 265C360 150 560 110 750 125', 'vidro');

      const tablet = D.tablet(api, 140, 300, 'Tablet do garçom');
      tablet.g.classList.add('aceso-brasa');
      const caixa = D.caixinha(api, 360, 300, 'Caixinha');
      caixa.g.classList.add('aceso-brasa');
      const narg = D.monitor(api, 575, 270, 'Cozinha');
      D.textoTela(api, 492, 238, 'Fila da cozinha', { pai: narg.tela, fraco: true });
      D.impressora(api, 575, 475);
      D.rotulo(api, 575, 535, 'Impressora');

      const nuvem = D.nuvem(api, 850, 120, 'Nuvem');
      nuvem.g.classList.add('aceso-nuvem');
      const atualizada = D.pilula(api, 850, 228, 'Nuvem atualizada', 'vidro');
      api.oculto(atualizada.g);

      const meio = enlace.getPointAtLength(enlace.getTotalLength() / 2);
      const queda = api.oculto(api.el('g'));
      D.linha(api, `M${meio.x - 10} ${meio.y - 18}L${meio.x + 4} ${meio.y - 2}L${meio.x - 4} ${meio.y + 2}L${meio.x + 10} ${meio.y + 18}`,
        'falha', '', queda);
      D.rotulo(api, meio.x, meio.y - 30, 'Sem internet', { pequeno: true, forte: true, pai: queda });

      const contador = D.rotulo(api, 360, 458, 'Esperando para subir: 0', { pequeno: true });
      const blocos = [];
      for (let i = 0; i < 9; i += 1) {
        blocos.push(api.oculto(api.el('rect', {
          x: 272 + i * 20, y: 404, width: 16, height: 16, rx: 3, class: 's-contorno-latao'
        })));
      }

      const mesas = ['Casal da janela', 'Turma do fundo', 'Aniversário da Ju'];
      const linhasFila = mesas.map((m, i) => api.oculto(D.textoTela(api, 492, 262 + i * 22, m, { pai: narg.tela, forte: true })));

      const pontos = Array.from({ length: 9 }, () => D.token(api, 'vidro', 7));
      const pedido = [D.token(api, 'brasa'), D.token(api, 'brasa'), D.token(api, 'brasa')];
      let naFila = 0;

      api.em(0, () => {
        api.narrar('Com internet, tudo o que acontece na loja sobe na hora para a nuvem.');
        api.mover(pontos[0], enlace, 1200);
      });
      api.em(700, () => api.mover(pontos[1], enlace, 1200));

      api.em(2400, () => {
        D.tingir(enlace, 'falha');
        enlace.classList.add('s-tracejada');
        api.aparecer(queda, 300);
        api.narrar('A internet caiu. A caixinha continua tocando a loja.');
      });

      [3200, 5200, 7200].forEach((inicio, n) => {
        api.em(inicio, () => {
          api.mover(pedido[0], p1, 700);
          if (n === 0) api.narrar('Pedido, pagamento e comanda continuam funcionando.');
          if (n === 1) api.narrar('O que acontece fica guardado na caixinha, esperando.');
        });
        api.em(inicio + 700, () => {
          api.mover(pedido[1], p4, 700);
          api.mover(pedido[2], p5, 700);
        });
        api.em(inicio + 1400, () => {
          api.aparecer(linhasFila[n], 300);
          api.anel(575, 475, 'brasa');
          for (let k = 0; k < 3; k += 1) {
            api.aparecer(blocos[naFila], 250);
            naFila += 1;
          }
          contador.textContent = `Esperando para subir: ${naFila}`;
        });
      });

      api.em(9400, () => {
        D.tingir(enlace, 'vidro');
        enlace.classList.remove('s-tracejada');
        api.sumir(queda, 300);
        api.narrar('A internet voltou. Tudo sobe para a nuvem, na ordem certa.');
      });
      blocos.forEach((bloco, i) => {
        api.em(9800 + i * 220, () => {
          const restante = 9 - i - 1;
          api.sumir(blocos[blocos.length - 1 - i], 200);
          api.mover(pontos[i], enlace, 600);
          contador.textContent = `Esperando para subir: ${restante}`;
        });
      });
      api.em(12200, () => {
        api.surgir(atualizada.g, 450, 10);
        api.anel(850, 120, 'vidro');
        api.narrar('O dono volta a ver tudo, sem perder nada.');
      });
    }
  });

  cenas.push({
    titulo: 'Se a caixinha parar, a nuvem assume',
    texto: 'Se o computador da loja der problema, o gerente liga o modo reserva (a contingência). A nuvem atende a loja até a caixinha voltar.',
    beneficios: [
      'A loja não para de vender.',
      'Nesse modo, o pedido aparece só na tela da cozinha, sem papel.',
      'Quando a caixinha volta, ela recebe tudo o que aconteceu.',
      'Com um 4G de reserva, funciona mesmo se a internet cair junto.'
    ],
    duracao: 16000,
    quadroEstatico: 9000,
    montar(api) {
      const l1 = D.linha(api, 'M235 330H425', 'brasa', 's-linha--fina');
      const l2 = D.linha(api, 'M575 320C640 320 680 290 730 290', 'brasa', 's-linha--fina');
      const l3 = D.linha(api, 'M560 365C640 420 700 480 765 480', 'brasa', 's-linha--fina');
      const l4 = D.linha(api, 'M500 295V140', 'vidro', 's-linha--fina');
      const c1 = api.oculto(D.linha(api, 'M175 272C200 160 320 100 398 98', 'vidro'));
      const c2 = api.oculto(D.linha(api, 'M602 98C700 100 800 160 830 228', 'vidro'));
      const locais = [l1, l2, l3];

      const nuvem = D.nuvem(api, 500, 95, 'Nuvem');
      nuvem.g.classList.add('aceso-nuvem');
      const caixa = D.caixinha(api, 500, 330, 'Caixinha da loja');
      caixa.g.classList.add('aceso-brasa');
      const tablet = D.tablet(api, 150, 330, 'Tablets dos garçons');
      tablet.g.classList.add('aceso-brasa');
      const narg = D.monitor(api, 830, 290, 'Cozinha');
      D.textoTela(api, 747, 258, 'Fila da cozinha', { pai: narg.tela, fraco: true });
      const cartao = api.oculto(api.el('g', {}, narg.tela));
      D.textoTela(api, 747, 290, 'Turma do fundo', { pai: cartao, forte: true });
      D.textoTela(api, 747, 312, 'Só na tela, sem comanda', { pai: cartao, fraco: true });
      const imp = D.impressora(api, 830, 480);
      D.rotulo(api, 830, 536, 'Impressora');
      const semImpressao = api.oculto(D.rotulo(api, 830, 562, 'Sem papel neste modo', { pequeno: true }));

      const xCaixa = D.marcaX(api, 500, 330, 20);
      const estadoCaixa = D.pilula(api, 500, 438, 'Caixinha funcionando', 'brasa');

      D.pessoa(api, 110, 520);
      D.rotulo(api, 110, 576, 'Gerente', { pequeno: true });
      const trilho = api.el('rect', { x: 160, y: 505, width: 60, height: 30, rx: 15, class: 's-contorno-linha' });
      const botao = api.el('circle', { cx: 175, cy: 520, r: 10, class: 's-preenche-texto' });
      const modo = D.rotulo(api, 234, 527, 'Modo reserva desligado', { ancora: 'start' });

      const ponto = D.token(api, 'brasa');
      const pontoNuvem = D.token(api, 'vidro');
      const sincronia = Array.from({ length: 4 }, () => D.token(api, 'vidro', 7));

      function chave(ligar) {
        api.anim(350, (t) => botao.setAttribute('cx', ligar ? 175 + 30 * t : 205 - 30 * t));
        trilho.setAttribute('class', ligar ? 's-contorno-vidro' : 's-contorno-linha');
        modo.textContent = ligar ? 'Modo reserva ligado' : 'Modo reserva desligado';
        api.anel(190, 520, ligar ? 'vidro' : 'brasa');
      }

      api.em(0, () => {
        api.narrar('No dia a dia, a caixinha toca a loja e manda uma cópia para a nuvem.');
        api.mover(ponto, l1, 900);
      });
      api.em(900, () => api.mover(ponto, l2, 800));
      api.em(1200, () => api.mover(sincronia[0], l4, 700));

      api.em(2600, () => {
        caixa.g.classList.remove('aceso-brasa');
        caixa.g.classList.add('falha');
        caixa.led.setAttribute('class', 's-preenche-falha s-token');
        api.aparecer(xCaixa, 300);
        locais.forEach((l) => {
          D.tingir(l, 'apagada');
          l.classList.add('s-tracejada');
        });
        D.tingir(l4, 'apagada');
        estadoCaixa.definir('Caixinha parou', 'falha');
        api.narrar('A caixinha parou.');
      });
      api.em(4200, () => {
        chave(true);
        api.narrar('O gerente liga o modo reserva.');
      });
      api.em(5300, () => {
        api.desenhar(c1, 900);
        api.desenhar(c2, 900);
        tablet.g.classList.replace('aceso-brasa', 'aceso-vidro');
        api.narrar('Tablets e telas passam a falar direto com a nuvem.');
      });
      api.em(6500, () => api.mover(pontoNuvem, c1, 1000));
      api.em(7500, () => api.mover(pontoNuvem, c2, 1000));
      api.em(8500, () => {
        api.surgir(cartao, 450, 8);
        api.aparecer(semImpressao, 400);
        imp.g.classList.add('apagado');
        api.narrar('O pedido aparece só na tela da cozinha, sem papel.');
      });
      api.em(10000, () => {
        caixa.g.classList.remove('falha');
        caixa.g.classList.add('bloqueado');
        caixa.led.setAttribute('class', 's-preenche-latao s-token');
        api.sumir(xCaixa, 300);
        D.tingir(l4, 'vidro');
        estadoCaixa.definir('Caixinha se atualizando', 'latao');
        api.narrar('A caixinha volta e recebe tudo o que aconteceu.');
      });
      sincronia.forEach((p, i) => {
        api.em(10300 + i * 300, () => api.mover(p, l4, 600, { reverso: true }));
      });
      api.em(12300, () => {
        chave(false);
        api.sumir(c1, 400);
        api.sumir(c2, 400);
        locais.forEach((l) => {
          D.tingir(l, 'brasa');
          l.classList.remove('s-tracejada');
        });
        caixa.g.classList.remove('bloqueado');
        caixa.g.classList.add('aceso-brasa');
        tablet.g.classList.replace('aceso-vidro', 'aceso-brasa');
        caixa.led.setAttribute('class', 's-preenche-brasa s-token');
        imp.g.classList.remove('apagado');
        api.sumir(semImpressao, 300);
        estadoCaixa.definir('Caixinha funcionando', 'brasa');
        api.narrar('O gerente devolve o comando para a loja. Só um lado manda por vez.');
      });
      api.em(13500, () => api.mover(ponto, l1, 800));
      api.em(14300, () => api.mover(ponto, l3, 800));
    }
  });
})();

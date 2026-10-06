/* Cenas 3 e 4: o pedido do tablet à mesa, o pedido no balcão e o fechamento do turno */
(function () {
  'use strict';

  const D = window.RoshDesenho;
  const cenas = (window.RoshCenas = window.RoshCenas || []);

  const comMarca = (sabor) => `${sabor.nome} (${sabor.marca})`;

  // Tela de pedido: rosh, sabores, adicional (se houver), forma de pagamento e a confirmação
  function telaPedido(api, pai, x, hy, largura, dados) {
    const g = api.el('g', {}, pai);
    D.textoTela(api, x, hy, dados.operador, { pai: g, fraco: true });
    D.textoTela(api, x + largura, hy, dados.mesa, { pai: g, ancora: 'end', classe: 's-tela-texto--negrito' });

    let y = hy + 10;
    const rosh = api.el('rect', { x, y, width: largura, height: 26, rx: 5, class: 's-contorno-linha' }, g);
    D.textoTela(api, x + 10, y + 18, dados.rosh, { pai: g, forte: true });
    const alvoRosh = { fundo: rosh, x: x + largura / 2, y: y + 13 };
    y += 34;

    // Cada chip ganha largura proporcional ao nome do sabor
    const pesos = dados.sabores.map((sabor) => sabor.nome.length + 4);
    const pesoTotal = pesos.reduce((a, b) => a + b, 0);
    let cx = x;
    const chips = dados.sabores.map((sabor, i) => {
      const larguraChip = ((largura - 8 * (pesos.length - 1)) * pesos[i]) / pesoTotal;
      const fundo = api.el('rect', { x: cx, y, width: larguraChip, height: 24, rx: 12, class: 's-contorno-linha' }, g);
      D.textoTela(api, cx + larguraChip / 2, y + 16, sabor.nome, { pai: g, ancora: 'middle', classe: 's-tela-texto--mini' });
      const alvo = { fundo, x: cx + larguraChip / 2, y: y + 12 };
      cx += larguraChip + 8;
      return alvo;
    });
    y += 32;

    let adicional = null;
    if (dados.adicional) {
      const fundo = api.el('rect', { x, y, width: largura, height: 22, rx: 11, class: 's-contorno-linha' }, g);
      D.textoTela(api, x + largura / 2, y + 15, dados.adicional, { pai: g, ancora: 'middle', classe: 's-tela-texto--mini' });
      adicional = { fundo, x: x + largura / 2, y: y + 11 };
      y += 30;
    }

    const larguraForma = (largura - 12) / 3;
    const formas = {};
    ['Dinheiro', 'Cartão', 'Pix'].forEach((forma, i) => {
      const fx = x + i * (larguraForma + 6);
      const fundo = api.el('rect', { x: fx, y, width: larguraForma, height: 24, rx: 5, class: 's-contorno-linha' }, g);
      D.textoTela(api, fx + larguraForma / 2, y + 16, forma, { pai: g, ancora: 'middle', classe: 's-tela-texto--mini' });
      formas[forma] = { fundo, x: fx + larguraForma / 2, y: y + 12 };
    });
    y += 30;

    D.botaoTela(api, x, y, largura, 22, 'Pagamento recebido', 'brasa', g);
    return { g, chips, adicional, formas, rosh: alvoRosh, confirmar: { x: x + largura / 2, y: y + 11 } };
  }

  function marcar(api, alvo) {
    alvo.fundo.setAttribute('class', 's-contorno-brasa');
    api.anel(alvo.x, alvo.y, 'brasa');
  }

  // Tela da cozinha: a fila e o cartão do pedido com o rosh, os sabores e o adicional
  function telaCozinha(api, monitor, pedido) {
    const x = monitor.esq + 15;
    const y = monitor.topo + 35;
    D.textoTela(api, x + 2, monitor.topo + 27, 'Fila da cozinha', { pai: monitor.tela, fraco: true });
    const vazia = D.textoTela(api, monitor.cx, monitor.cy + 10, 'Sem pedidos na fila', {
      pai: monitor.tela, ancora: 'middle', fraco: true
    });

    const linhas = pedido.sabores.map(comMarca);
    if (pedido.adicional) linhas.push(pedido.adicional);
    const cartao = api.oculto(api.el('g', {}, monitor.tela));
    api.el('rect', { x, y, width: 190, height: 52 + linhas.length * 16, rx: 6, class: 's-contorno-brasa' }, cartao);
    D.textoTela(api, x + 10, y + 22, pedido.mesa, { pai: cartao, forte: true });
    D.textoTela(api, x + 10, y + 41, pedido.rosh, { pai: cartao, classe: 's-tela-texto--negrito' });
    linhas.forEach((linha, i) => {
      D.textoTela(api, x + 10, y + 59 + i * 16, linha, { pai: cartao, classe: 's-tela-texto--mini' });
    });
    const estado = D.textoTela(api, x + 181, y + 21, 'Na fila', {
      pai: cartao, ancora: 'end', classe: 's-preenche-brasa2 s-tela-texto--negrito s-tela-texto--mini'
    });
    return { vazia, cartao, estado };
  }

  function linhasComanda(pedido) {
    const linhas = [
      { t: pedido.mesa.toUpperCase(), tipo: 'mesa' },
      { t: pedido.numero },
      { tipo: 'corte' },
      { t: `1x ${pedido.rosh}` },
      ...pedido.sabores.map((sabor) => ({ t: `  ${comMarca(sabor)}` }))
    ];
    if (pedido.adicional) linhas.push({ t: pedido.adicional });
    return linhas.concat([
      { tipo: 'corte' },
      { t: `Vendido por: ${pedido.vendedor}` },
      { t: `Pagamento: ${pedido.pagamento}` }
    ]);
  }

  cenas.push({
    titulo: 'Um pedido, do tablet à mesa',
    texto: 'O garçom faz o pedido no tablet. O cliente paga na hora. O pedido vai direto para a cozinha.',
    beneficios: [
      'Só existe pedido pago: dinheiro, cartão ou Pix.',
      'A cozinha recebe na tela e no papel.',
      'O garçom é avisado quando fica pronto.',
      'Cada venda leva o nome de quem vendeu.'
    ],
    duracao: 20000,
    montar(api) {
      const pedido = {
        mesa: 'Mesa 07', rosh: 'Rosh grande', adicional: '+ 1 carvão extra',
        sabores: [{ nome: 'Watermelon Mint', marca: 'Zomo' }, { nome: 'Love 66', marca: 'Adalya' }],
        numero: 'Pedido 0153  21:47', vendedor: 'Rafa (garçom)', pagamento: 'Pix'
      };
      const c1 = D.linha(api, 'M270 230C330 230 330 255 385 255', 'apagada', 's-linha--fina');
      const c4 = D.linha(api, 'M535 245C620 245 640 165 710 165', 'apagada', 's-linha--fina');
      const c5 = D.linha(api, 'M535 268C620 270 650 358 712 358', 'apagada', 's-linha--fina');
      const c7 = D.linha(api, 'M400 290C350 320 330 450 300 470', 'apagada', 's-linha--fina');

      const tab = D.tablet(api, 150, 230, 'Tablet do garçom', 240, 200);
      const t = telaPedido(api, tab.tela, 51, 160, 198, { operador: 'Garçom: Rafa', ...pedido });
      const pago = api.oculto(api.el('g', {}, tab.tela));
      D.textoTela(api, 150, 205, 'Pedido 0153', { pai: pago, ancora: 'middle', fraco: true });
      D.textoTela(api, 150, 232, 'Pagamento recebido', { pai: pago, ancora: 'middle', forte: true });
      D.textoTela(api, 150, 257, 'Pix. Pedido na cozinha.', { pai: pago, ancora: 'middle', fraco: true });
      const pronto = api.oculto(api.el('g', {}, tab.tela));
      D.textoTela(api, 150, 205, 'Mesa 07 pronta', { pai: pronto, ancora: 'middle', forte: true });
      D.textoTela(api, 150, 229, 'Levar até a mesa', { pai: pronto, ancora: 'middle', fraco: true });
      D.botaoTela(api, 90, 250, 120, 32, 'Entregue', 'brasa', pronto);
      const status = D.pilula(api, 150, 106, 'Na fila', 'brasa');
      api.oculto(status.g);

      D.caixinha(api, 460, 255, 'Caixinha da loja');
      const cozinha = D.monitor(api, 820, 165, 'Cozinha', 220, 150);
      const fila = telaCozinha(api, cozinha, pedido);
      D.impressora(api, 810, 358, 'Impressora', 'dentro', 196);
      const comanda = D.comanda(api, 717, 379, 186, linhasComanda(pedido), 's-comanda--compacta');

      api.el('rect', { x: 40, y: 390, width: 260, height: 180, rx: 10, class: 's-contorno-linha' });
      D.rotulo(api, 58, 420, 'Vendas do Rafa hoje', { ancora: 'start', forte: true });
      const contagem = {};
      [['Dinheiro', 1], ['Cartão', 1], ['Pix', 2]].forEach(([forma, n], i) => {
        D.rotulo(api, 58, 452 + i * 26, forma, { ancora: 'start', pequeno: true });
        contagem[forma] = D.rotulo(api, 282, 452 + i * 26, String(n), { ancora: 'end', pequeno: true, forte: true });
      });
      D.linha(api, 'M58 520H282', 'apagada', 's-linha--fina');
      D.rotulo(api, 58, 550, 'Total de pedidos', { ancora: 'start', pequeno: true, forte: true });
      const pedidos = D.rotulo(api, 282, 550, '4', { ancora: 'end', forte: true });

      const ponto = D.token(api, 'brasa');
      const ponto2 = D.token(api, 'brasa');

      api.em(0, () => api.narrar('O garçom Rafa faz o pedido da mesa 07 no tablet.'));
      api.em(700, () => marcar(api, t.rosh));
      t.chips.forEach((chip, i) => api.em(1300 + i * 500, () => marcar(api, chip)));
      api.em(2400, () => marcar(api, t.adicional));
      api.em(3200, () => {
        marcar(api, t.formas.Pix);
        api.narrar('O cliente paga na hora, no Pix.');
      });
      api.em(5000, () => {
        api.anel(t.confirmar.x, t.confirmar.y, 'brasa');
        D.tingir(c1, 'brasa');
        api.mover(ponto, c1, 1000);
        api.narrar('Rafa toca em "Pagamento recebido". O pedido está feito.');
      });
      api.em(6000, () => {
        api.anel(460, 255, 'brasa');
        api.sumir(t.g, 250);
        api.aparecer(pago, 400);
        api.surgir(status.g, 450, 10);
        D.tingir(c7, 'brasa');
        api.mover(ponto2, c7, 900);
      });
      api.em(6900, () => {
        api.contar(contagem.Pix, 2, 3, 400);
        api.contar(pedidos, 4, 5, 400);
        api.anel(270, 499, 'brasa');
        api.narrar('A venda fica no nome do Rafa: mais um Pix hoje.');
      });
      api.em(8600, () => {
        D.tingir(c4, 'brasa');
        D.tingir(c5, 'brasa');
        api.mover(ponto, c4, 1100);
        api.mover(ponto2, c5, 1100);
        api.narrar('O pedido aparece na tela da cozinha e a comanda sai no papel.');
      });
      api.em(9700, () => {
        api.sumir(fila.vazia, 200);
        api.surgir(fila.cartao, 500, 10);
        comanda.imprimir(1700);
      });
      api.em(11800, () => {
        fila.estado.textContent = 'Em preparo';
        status.definir('Em preparo', 'brasa');
        api.narrar('A cozinha monta o narguilé e avisa: em preparo, depois pronto.');
      });
      api.em(13600, () => {
        fila.estado.textContent = 'Pronto';
        status.definir('Pronto', 'brasa');
        api.mover(ponto, c4, 900, { reverso: true });
      });
      api.em(14500, () => api.mover(ponto, c1, 900, { reverso: true }));
      api.em(15400, () => {
        api.sumir(pago, 200);
        api.aparecer(pronto, 400);
        api.anel(150, 230, 'brasa');
        api.narrar('O tablet avisa o Rafa. Ele leva o narguilé até a mesa.');
      });
      api.em(17400, () => {
        api.anel(150, 266, 'brasa');
        fila.estado.textContent = 'Entregue';
        status.definir('Entregue', 'latao');
        api.narrar('Rafa marca como entregue. Tudo fica registrado.');
      });
    }
  });

  cenas.push({
    titulo: 'No balcão e no fim do turno',
    texto: 'O cliente também pode pedir no balcão. No fim do turno, cada pessoa fecha as próprias vendas e o gerente confere.',
    beneficios: [
      'Todo pedido já nasce pago.',
      'Cada venda tem dono: quem vendeu e como foi pago.',
      'No fechamento, dinheiro, cartão e Pix batem por pessoa.',
      'O gerente vê as vendas de cada garçom.'
    ],
    duracao: 17500,
    montar(api) {
      const pedido = {
        mesa: 'Mesa 12', rosh: 'Rosh mix',
        sabores: [{ nome: 'Banana Tropical', marca: 'Ziggy' }, { nome: 'High Mint', marca: 'Onix' }],
        numero: 'Pedido 0161  22:05', vendedor: 'Bia (caixa)', pagamento: 'cartão'
      };
      const c1 = D.linha(api, 'M360 195C410 195 410 210 455 210', 'apagada', 's-linha--fina');
      const c4 = D.linha(api, 'M605 200C680 200 690 160 740 160', 'apagada', 's-linha--fina');
      const c5 = D.linha(api, 'M605 225C680 230 700 360 752 360', 'apagada', 's-linha--fina');

      const cliente = D.pessoa(api, 55, 205);
      D.rotulo(api, 55, 258, 'Cliente', { pequeno: true, pai: cliente.g });
      const caixa = D.monitor(api, 240, 190, 'Caixa', 240, 170);
      const t = telaPedido(api, caixa.tela, 137, 132, 206, { operador: 'Caixa: Bia', ...pedido });
      const turno = api.oculto(api.el('g', {}, caixa.tela));
      D.textoTela(api, 240, 150, 'Turno da Bia', { pai: turno, ancora: 'middle', forte: true });
      D.textoTela(api, 240, 178, 'Pedidos no turno: 27', { pai: turno, ancora: 'middle', fraco: true });
      D.botaoTela(api, 160, 205, 160, 32, 'Fechar turno', 'brasa', turno);
      const status = D.pilula(api, 240, 80, 'Pago no cartão', 'brasa');
      api.oculto(status.g);

      D.caixinha(api, 530, 210, 'Caixinha da loja');
      const cozinha = D.monitor(api, 850, 160, 'Cozinha', 220, 150);
      const fila = telaCozinha(api, cozinha, pedido);
      const imp = D.impressora(api, 850, 360, 'Impressora', 'dentro', 196);
      const comanda = D.comanda(api, 757, 381, 186, linhasComanda(pedido), 's-comanda--compacta');

      // Fechamento do turno: contagem por forma de pagamento
      const painel = api.oculto(api.el('g'));
      api.el('rect', { x: 40, y: 360, width: 520, height: 215, rx: 10, class: 's-contorno-linha' }, painel);
      D.rotulo(api, 60, 392, 'Fechamento do turno', { ancora: 'start', forte: true, pai: painel });
      D.rotulo(api, 540, 392, 'Bia, caixa', { ancora: 'end', pequeno: true, pai: painel });
      const linhasTurno = [['Dinheiro', 6], ['Cartão', 9], ['Pix', 12]].map(([forma, n], i) => {
        const y = 425 + i * 32;
        D.rotulo(api, 60, y, forma, { ancora: 'start', pequeno: true, pai: painel });
        api.el('rect', { x: 160, y: y - 12, width: 260, height: 14, rx: 3, class: 's-contorno-linha' }, painel);
        const barra = api.el('rect', { x: 160, y: y - 12, width: 0, height: 14, rx: 3, class: 's-preenche-brasa' }, painel);
        const valor = D.rotulo(api, 540, y, '0 pedidos', { ancora: 'end', pequeno: true, forte: true, pai: painel });
        return { n, barra, valor };
      });
      D.linha(api, 'M60 512H540', 'apagada', 's-linha--fina', painel);
      D.rotulo(api, 60, 546, 'Total do turno', { ancora: 'start', forte: true, pai: painel });
      const total = D.rotulo(api, 540, 546, '0 pedidos', { ancora: 'end', forte: true, pai: painel });

      const gerente = D.pessoa(api, 680, 470);
      D.rotulo(api, 680, 520, 'Gerente', { pequeno: true, pai: gerente.g });
      api.oculto(gerente.g);
      const conferido = D.confere(api, 728, 438);
      const pilulaConferido = D.pilula(api, 680, 556, 'Turno conferido', 'brasa');
      api.oculto(pilulaConferido.g);

      const ponto = D.token(api, 'brasa');
      const ponto2 = D.token(api, 'brasa');
      const pedidosTexto = (n) => `${Math.round(n)} pedidos`;

      api.em(0, () => {
        api.anel(55, 205, 'brasa');
        api.narrar('No balcão, a Bia faz o pedido da mesa 12 no caixa.');
      });
      api.em(900, () => marcar(api, t.rosh));
      t.chips.forEach((chip, i) => api.em(1500 + i * 500, () => marcar(api, chip)));
      api.em(2700, () => {
        marcar(api, t.formas['Cartão']);
        api.narrar('O cliente paga no cartão, na hora.');
      });
      api.em(3700, () => {
        api.anel(t.confirmar.x, t.confirmar.y, 'brasa');
        D.tingir(c1, 'brasa');
        api.mover(ponto, c1, 900);
      });
      api.em(4600, () => {
        api.anel(530, 210, 'brasa');
        api.surgir(status.g, 450, 10);
        D.tingir(c4, 'brasa');
        D.tingir(c5, 'brasa');
        api.mover(ponto, c4, 1000);
        api.mover(ponto2, c5, 1000);
        api.narrar('Pago, o pedido vai para a cozinha e a comanda sai no papel.');
      });
      api.em(5600, () => {
        api.sumir(fila.vazia, 200);
        api.surgir(fila.cartao, 500, 10);
        comanda.imprimir(1500);
      });
      api.em(7400, () => api.narrar('A comanda mostra quem vendeu e como foi pago.'));

      api.em(9200, () => {
        api.sumir(comanda.g, 400);
        api.sumir(status.g, 300);
        [cozinha.g, imp.g].forEach((g) => api.classe(g, 'apagado'));
        [c1, c4, c5].forEach((l) => D.tingir(l, 'apagada'));
        api.sumir(t.g, 250);
        api.aparecer(turno, 400);
        api.aparecer(gerente.g, 500);
        api.narrar('No fim do turno, a Bia fecha as próprias vendas no caixa.');
      });
      api.em(10600, () => {
        api.anel(240, 221, 'brasa');
        api.surgir(painel, 600, 16);
        api.narrar('O sistema soma tudo: dinheiro, cartão e Pix.');
      });
      linhasTurno.forEach((l, i) => {
        api.em(11000 + i * 300, () => {
          api.anim(700, (p) => l.barra.setAttribute('width', (l.n / 12) * 260 * p));
          api.contar(l.valor, 0, l.n, 700, pedidosTexto);
        });
      });
      api.em(12000, () => api.contar(total, 0, 27, 800, pedidosTexto));
      api.em(13800, () => {
        api.aparecer(conferido, 400);
        api.anel(728, 438, 'brasa');
        api.surgir(pilulaConferido.g, 450, 10);
        api.narrar('O gerente confere. Cada venda tem dono.');
      });
    }
  });
})();

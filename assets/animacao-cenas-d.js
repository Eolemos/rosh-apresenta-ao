/* Cenas 7 e 8: a rede de lojas e as etapas de construção */
(function () {
  'use strict';

  const D = window.RoshDesenho;
  const cenas = (window.RoshCenas = window.RoshCenas || []);

  // Contagens ilustrativas de pedidos por unidade
  const pedidosPorUnidade = [38, 41, 29, 52, 33, 47, 26, 39, 44, 31];

  cenas.push({
    titulo: 'Pronto para crescer',
    texto: 'A primeira loja vira a unidade 1. Cada loja nova recebe uma caixinha, e o dono acompanha todas de casa.',
    beneficios: [
      'Para abrir loja nova: cadastrar a unidade e ligar a caixinha.',
      'O cardápio é feito uma vez e vale para todas, com ajustes por loja.',
      'Números por loja, por garçom e da rede inteira.',
      'As atualizações chegam sozinhas, com a loja fechada.'
    ],
    duracao: 12500,
    montar(api) {
      D.linha(api, 'M70 250H610', 'latao', 's-linha--fina');
      D.linha(api, 'M400 250V150', 'latao', 's-linha--fina');
      D.linha(api, 'M500 108C610 108 700 150 772 212', 'vidro', 's-linha--fina');

      const nuvem = D.nuvem(api, 400, 105);
      nuvem.g.classList.add('aceso-nuvem');
      D.rotulo(api, 280, 112, 'Nuvem', { ancora: 'end' });

      const posicoes = [];
      for (let i = 0; i < 5; i += 1) posicoes.push({ x: 70 + i * 120, y: 330 });
      for (let i = 0; i < 5; i += 1) posicoes.push({ x: 130 + i * 120, y: 470 });

      const unidades = posicoes.map((p, i) => {
        const descida = D.linha(api, `M${p.x} ${p.y - 38}V250`, 'vidro', 's-linha--fina');
        const loja = D.loja(api, p.x, p.y, `Unidade ${i + 1}`);
        if (i > 0) {
          api.oculto(descida);
          api.oculto(loja.g);
        } else {
          loja.g.classList.add('aceso-brasa');
        }
        return { ...p, descida, loja };
      });

      // Casa do dono com o painel da rede
      api.el('path', { d: 'M690 252L837 182L985 252', class: 's-linha s-linha--latao' });
      api.el('rect', { x: 700, y: 252, width: 275, height: 318, rx: 6, class: 's-contorno-linha' });
      D.rotulo(api, 837, 160, 'Dono, em casa', { forte: true });
      D.rotulo(api, 718, 286, 'Painel do dono', { ancora: 'start', forte: true });
      D.rotulo(api, 718, 318, 'Lojas ativas', { ancora: 'start', pequeno: true });
      const unidadesAtivas = api.el('text', { x: 718, y: 358, class: 's-numero-medio', texto: '1' });
      D.rotulo(api, 718, 392, 'Pedidos hoje na rede', { ancora: 'start', pequeno: true });
      const pedidosRede = api.el('text', { x: 718, y: 432, class: 's-numero-medio', texto: String(pedidosPorUnidade[0]) });
      D.linha(api, 'M718 548H958', 'apagada', 's-linha--fina');
      const barras = pedidosPorUnidade.map((n, i) => {
        const altura = (n / 55) * 82;
        const barra = api.el('rect', {
          x: 720 + i * 24, y: 548 - altura, width: 16, height: altura, rx: 2, class: 's-preenche-brasa'
        });
        if (i > 0) api.oculto(barra);
        return barra;
      });

      const cardapio = D.token(api, 'vidro', 8);
      const rotaCardapio = D.linha(api, `M400 150V250H${posicoes[1].x}V${posicoes[1].y - 38}`, 'vidro', 's-linha--fina');
      api.oculto(rotaCardapio);

      let ativas = 1;
      let total = pedidosPorUnidade[0];
      function acender(i, duracaoLinha) {
        const u = unidades[i];
        api.desenhar(u.descida, duracaoLinha);
        api.aparecer(u.loja.g, 400);
        u.loja.g.classList.add('aceso-brasa');
        api.aparecer(barras[i], 400);
        api.contar(unidadesAtivas, ativas, ativas + 1, 400);
        api.contar(pedidosRede, total, total + pedidosPorUnidade[i], 500);
        ativas += 1;
        total += pedidosPorUnidade[i];
      }

      api.em(0, () => {
        api.anel(70, 330, 'brasa');
        api.narrar('A primeira loja vira a unidade 1.');
      });
      api.em(1800, () => {
        api.mover(cardapio, rotaCardapio, 1000);
        api.narrar('Para abrir outra: cadastrar a unidade e ligar a caixinha.');
      });
      api.em(2800, () => {
        acender(1, 300);
        api.anel(posicoes[1].x, posicoes[1].y, 'vidro');
        api.narrar('A caixinha nova já chega com cardápio, preços e equipe.');
      });
      for (let i = 2; i < unidades.length; i += 1) {
        api.em(4400 + (i - 2) * 650, () => acender(i, 400));
      }
      api.em(9800, () => {
        api.anel(837, 400, 'vidro');
        api.narrar('O dono acompanha todas as lojas de casa.');
      });
    }
  });

  const etapas = [
    {
      cx: 180, tipo: 'brasa', titulo: ['Sistema da loja'],
      itens: ['Tablet do garçom', 'Pedido no caixa', 'Pagamento na hora', 'Tela da cozinha', 'Comanda impressa', 'Fechamento do turno'],
      entrega: 'O lounge já usa o sistema.',
      fala: 'Primeiro, o sistema da loja: pedido, pagamento na hora, cozinha e fechamento do turno.'
    },
    {
      cx: 500, tipo: 'vidro', titulo: ['Nuvem e painel', 'do dono'],
      itens: ['Cópia de tudo na nuvem', 'Painel do dono', 'Números por garçom', 'Números da rede', 'Backup todo dia'],
      entrega: 'O dono vê tudo de casa.',
      fala: 'Depois, a nuvem: cópia de tudo, painel do dono e backup todo dia.'
    },
    {
      cx: 820, tipo: 'latao', titulo: ['Modo reserva', 'e novas lojas'],
      itens: ['Modo reserva', 'Atualização à distância', 'Novas lojas'],
      entrega: 'Pronto para novas lojas.',
      fala: 'Por fim, o modo reserva e a abertura de novas lojas.'
    }
  ];

  cenas.push({
    titulo: 'Como o Rosh chega até você',
    texto: 'O Rosh chega em três etapas. Cada uma termina com algo que o lounge já pode usar.',
    beneficios: [
      'O lounge começa a usar já na primeira etapa.',
      'Cada etapa é testada na loja antes da próxima.',
      'Nada precisa ser refeito para a rede crescer.'
    ],
    duracao: 13000,
    montar(api) {
      D.linha(api, 'M180 110H820', 'apagada', 's-linha--fina');
      const trechos = [
        api.oculto(D.linha(api, 'M180 110H500', 'latao')),
        api.oculto(D.linha(api, 'M500 110H820', 'latao'))
      ];

      const grupos = etapas.map((e, i) => {
        const no = api.el('circle', { cx: e.cx, cy: 110, r: 20, class: 's-contorno-linha' });
        const numero = api.el('text', {
          x: e.cx, y: 117, 'text-anchor': 'middle', class: 's-rotulo s-rotulo--forte', texto: String(i + 1)
        });
        const x = e.cx - 140;
        const g = api.oculto(api.el('g'));
        api.el('rect', { x, y: 160, width: 280, height: 395, rx: 12, class: 's-contorno-linha' }, g);
        api.el('rect', { x, y: 160, width: 280, height: 6, rx: 3, class: `s-preenche-${e.tipo}` }, g);
        e.titulo.forEach((parte, k) => {
          D.rotulo(api, x + 24, 208 + k * 30, parte, { pai: g, ancora: 'start', forte: true, classe: 's-camada-nome' });
        });
        e.itens.forEach((item, k) => {
          const y = 288 + k * 34;
          api.el('circle', { cx: x + 30, cy: y - 6, r: 4, class: `s-preenche-${e.tipo}` }, g);
          D.rotulo(api, x + 46, y, item, { pai: g, ancora: 'start' });
        });
        D.linha(api, `M${x + 24} 500H${x + 256}`, 'apagada', 's-linha--fina', g);
        D.rotulo(api, x + 24, 530, e.entrega, { pai: g, ancora: 'start', pequeno: true, classe: 's-rotulo--latao' });
        return { no, numero, g };
      });

      function ativar(i) {
        const e = etapas[i];
        grupos[i].no.setAttribute('class', `s-contorno-${e.tipo}`);
        api.anel(e.cx, 110, e.tipo === 'vidro' ? 'vidro' : 'brasa');
        api.surgir(grupos[i].g, 650, 18);
        api.narrar(e.fala);
      }

      api.em(0, () => api.narrar('O Rosh chega em três etapas.'));
      api.em(500, () => ativar(0));
      api.em(3400, () => api.desenhar(trechos[0], 900));
      api.em(4300, () => ativar(1));
      api.em(7200, () => api.desenhar(trechos[1], 900));
      api.em(8100, () => ativar(2));
      api.em(10600, () => api.narrar('Cada etapa termina com algo que o lounge já pode usar.'));
    }
  });
})();

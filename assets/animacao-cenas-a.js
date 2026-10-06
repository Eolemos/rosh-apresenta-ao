/* Cenas 1 e 2: um sistema só e por que ele não trava */
(function () {
  'use strict';

  const D = window.RoshDesenho;
  const cenas = (window.RoshCenas = window.RoshCenas || []);

  cenas.push({
    titulo: 'Uma peça só, do tablet ao painel do dono',
    texto: 'O Rosh é um sistema só. O tablet do garçom, as telas da equipe, a caixinha da loja e a nuvem trabalham juntos.',
    beneficios: [
      'Tudo conversa entre si, sem sistemas separados.',
      'As mesmas regras valem na loja e na nuvem.',
      'Um time só cuida de tudo.'
    ],
    duracao: 13500,
    montar(api) {
      const fio = api.oculto(D.linha(api,
        'M40 330C200 250 260 410 380 330S560 250 620 330S800 410 960 330', 'latao'));
      const titulo = api.oculto(D.rotulo(api, 500, 150, 'Um sistema só', { classe: 's-titulo-palco' }));

      const aparelhos = [
        { el: D.tablet(api, 140, 330), x: 140, tipo: 'brasa', nome: 'Tablet do garçom',
          fala: 'No tablet do garçom, o pedido é feito e pago.' },
        { el: D.monitor(api, 380, 318), x: 380, tipo: 'brasa', nome: 'Telas da equipe',
          fala: 'Nas telas da equipe: caixa, cozinha e gerente.' },
        { el: D.caixinha(api, 620, 330), x: 620, tipo: 'brasa', nome: 'Caixinha da loja',
          fala: 'Na caixinha: um computador pequeno que fica dentro da loja.' },
        { el: D.nuvem(api, 860, 330), x: 860, tipo: 'vidro', nome: 'Nuvem',
          fala: 'E na nuvem, onde o dono vê tudo de casa.' }
      ];
      const momentos = [1500, 3200, 4900, 6600];

      aparelhos.forEach((a, i) => {
        a.el.g.classList.add('apagado');
        const nome = D.rotulo(api, a.x, 448, a.nome, { forte: true });
        nome.classList.add('apagado');
        api.em(momentos[i], () => {
          api.classe(a.el.g, 'apagado', false);
          api.classe(nome, 'apagado', false);
          api.classe(a.el.g, a.tipo === 'vidro' ? 'aceso-nuvem' : 'aceso-brasa');
          api.anel(a.x, 330, a.tipo);
          api.narrar(a.fala);
        });
      });

      const chave = api.oculto(D.linha(api, 'M545 478V492H945V478', 'latao', 's-linha--fina'));
      const regra = api.oculto(D.rotulo(api, 745, 526, 'As mesmas regras na loja e na nuvem', { forte: true }));
      const pulso = D.token(api, 'brasa2', 8);

      api.em(0, () => {
        api.aparecer(titulo, 800);
        api.narrar('O Rosh é um sistema só, do tablet à nuvem.');
      });
      api.em(900, () => api.desenhar(fio, 5800));
      api.em(8600, () => {
        api.desenhar(chave, 700);
        api.aparecer(regra, 600);
        api.narrar('A loja e a nuvem seguem as mesmas regras. Por isso uma cobre a outra.');
      });
      api.em(11000, () => {
        api.mover(pulso, fio, 1800);
        api.narrar('Tudo conversa entre si. Nada de sistemas separados.');
      });
    }
  });

  const partes = [
    {
      nome: 'Dinheiro bem guardado', papel: 'Cada pagamento é gravado por inteiro', tipo: 'latao',
      fala: 'Cada pagamento é gravado por inteiro, sem erro de centavo.'
    },
    {
      nome: 'Regras em um lugar só', papel: 'O preço vem do sistema, não do tablet', tipo: 'latao',
      fala: 'O preço e as permissões ficam no sistema. O tablet só mostra.'
    },
    {
      nome: 'Tudo na hora', papel: 'O pedido aparece em todas as telas no mesmo instante', tipo: 'latao',
      fala: 'O pedido aparece em todas as telas no mesmo instante.'
    },
    {
      nome: 'Abre em qualquer tablet', papel: 'Sem instalar nada, e atualiza sozinho', tipo: 'latao',
      fala: 'Não precisa instalar nada. Abre no tablet e atualiza sozinho.'
    },
    {
      nome: 'Comanda no papel', papel: 'Sai na impressora da cozinha, por cabo ou pela rede', tipo: 'brasa',
      fala: 'A comanda sai na impressora da cozinha, por cabo ou pela rede.'
    },
    {
      nome: 'Cópia na nuvem', papel: 'Backup de tudo e painel do dono', tipo: 'vidro',
      fala: 'E tudo tem uma cópia na nuvem, com o painel do dono.'
    }
  ];

  cenas.push({
    titulo: 'Feito para não travar',
    texto: 'Cada parte do Rosh tem um trabalho simples e bem definido. É isso que deixa o sistema firme no dia a dia.',
    beneficios: [
      'O dinheiro é gravado por inteiro, sem erro de centavo.',
      'Não precisa instalar nada no tablet.',
      'Funciona com as impressoras comuns de cozinha.',
      'Tudo tem cópia na nuvem.'
    ],
    duracao: 13500,
    montar(api) {
      partes.forEach((c, i) => {
        const topo = 470 - i * 72;
        const g = api.oculto(api.el('g'));
        api.el('rect', { x: 110, y: topo, width: 780, height: 62, rx: 10, class: 's-contorno-linha' }, g);
        api.el('rect', { x: 110, y: topo, width: 10, height: 62, rx: 4, class: `s-preenche-${c.tipo}` }, g);
        D.rotulo(api, 142, topo + 39, c.nome, { pai: g, ancora: 'start', forte: true, classe: 's-camada-nome' });
        D.rotulo(api, 868, topo + 38, c.papel, { pai: g, ancora: 'end' });
        api.em(400 + i * 1700, () => {
          api.surgir(g, 650, -28);
          api.narrar(c.fala);
        });
      });

      const lado = api.oculto(D.linha(api, 'M80 110V532', 'latao', 's-linha--fina'));
      const ladoTexto = api.oculto(D.rotulo(api, 66, 321, 'Um sistema só', {
        classe: 's-rotulo--latao', ancora: 'middle'
      }));
      ladoTexto.setAttribute('transform', 'rotate(-90 66 321)');

      api.em(10900, () => {
        api.desenhar(lado, 800);
        api.aparecer(ladoTexto, 600);
        api.narrar('Cada parte faz um trabalho simples. Juntas, mantêm a loja funcionando.');
      });
    }
  });
})();

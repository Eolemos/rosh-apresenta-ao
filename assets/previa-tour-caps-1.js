/* Tour guiado, capítulos 1 a 3: boas-vindas, tablet do garçom e cozinha */
(function () {
  'use strict';

  var A = window.RoshTourAcoes;
  var q = A.q;
  var achar = A.achar;
  var caps = (window.RoshTourCapitulos = window.RoshTourCapitulos || []);

  var T = '#tela-tablet';
  var Z = '#tela-cozinha';

  function aparelho(nome) {
    return '.pv-item--' + nome + ' .aparelho';
  }

  caps.push({
    titulo: 'Bem-vindo',
    vista: 'ao-vivo',
    passos: [
      { texto: 'Este é o Rosh: o sistema que cuida dos pedidos de narguilé do seu lounge, do começo ao fim.' },
      { texto: 'O garçom anota o pedido no tablet, ali na mesa do cliente.', alvo: aparelho('tablet') },
      { texto: 'A cozinha recebe na hora, na tela e no papel.', alvo: aparelho('cozinha') },
      { texto: 'O caixa atende quem pede no balcão e cuida do dinheiro.', vista: 'caixa', alvo: aparelho('caixa') },
      { texto: 'Você acompanha tudo no painel do dono, no computador.', vista: 'gestao', alvo: aparelho('gestao') },
      { texto: 'Ou no celular, de casa ou de onde estiver.', vista: 'gestao', foco: 'celular', alvo: aparelho('celular') },
      { texto: 'Se a internet cair, o lounge continua trabalhando normalmente.' },
      { texto: 'Agora veja um pedido acontecer de verdade. Os nomes e os valores são de exemplo.' }
    ]
  });

  caps.push({
    titulo: 'Tablet do garçom',
    vista: 'tablet',
    passos: [
      {
        texto: 'Cada garçom entra com a sua senha de quatro números. Assim o sistema sabe quem fez cada venda.',
        alvo: function () { return q(T + ' .ui-modal__caixa') || q(T + ' [data-acao="menu-usuario"]'); },
        faz: async function (t) {
          await t.clicar(T + ' [data-acao="menu-usuario"]');
          await t.clicar(T + ' .ui-modal [data-acao="trocar"]');
          await t.clicar(T + ' .ui-modal [data-acao="usuario"][data-valor="rafa"]');
          await t.pin(T, '1234', 'entrar');
        }
      },
      {
        texto: 'O botão Mesas mostra todas as mesas abertas, com o nome que a equipe deu e o tempo de cada narguilé.',
        alvo: function () { return q(T + ' .ui-mapa') || q(T + ' [data-acao="mesas"]'); },
        faz: async function (t) { await t.clicar(T + ' [data-acao="mesas"]'); }
      },
      {
        texto: 'O Aniversário da Ju está em laranja: o último carvão foi há mais de 30 minutos. É hora de oferecer mais.',
        alvo: T + ' .ui-mapa__mesa--carvao'
      },
      {
        texto: 'Chegou um casal. O garçom toca em Nova mesa: aqui a mesa é aberta na hora, sem precisar de número.',
        alvo: function () { return q(T + ' .ui-modal__caixa--form') || q(T + ' [data-acao="nova-mesa"]'); },
        faz: async function (t) {
          await t.clicar(T + ' .ui-modal [data-acao="fechar"]');
          await t.clicar(T + ' [data-acao="nova-mesa"]');
        }
      },
      {
        texto: 'Ele dá um nome, Casal da janela, e uma descrição para a equipe achar: perto da entrada, 2 pessoas.',
        alvo: T + ' .ui-modal__caixa--form',
        tempo: 6400,
        faz: async function (t) {
          await t.digitar(T + ' .ui-modal [data-campo="nome"]', 'Casal da janela', 70);
          await t.digitar(T + ' .ui-modal [data-campo="descricao"]', 'perto da entrada, 2 pessoas', 45);
        }
      },
      {
        texto: 'Mesa aberta. Ela entra na lista e toda a equipe passa a ver.',
        alvo: function () { return q(T + ' .ui-mesa-aberta[aria-pressed="true"]') || q(T + ' .ui-modal__caixa--form'); },
        faz: async function (t) { await t.clicar(T + ' .ui-modal [data-acao="salvar"]'); }
      },
      {
        texto: 'Sua loja numera as mesas? As mesas fixas ficam aqui como atalhos de um toque: Mesa 07, VIP 1.',
        alvo: T + ' .ui-mesas__atalhos'
      },
      {
        texto: 'Agora o pedido do casal. O garçom escolhe o tipo de rosh: um rosh grande.',
        alvo: function () { return q(T + ' .ui-passo1 .ui-pilha') || q(T + ' .ui-passos'); },
        faz: async function (t) {
          await t.espera(900);
          await t.clicar(T + ' [data-acao="rosh"][data-valor="grande"]');
        }
      },
      { texto: 'As essências aparecem por marca, cada uma com a sua cor.', alvo: T + ' .ui-marcas' },
      {
        texto: 'Não lembra a marca? É só buscar pelo sabor. Por exemplo: mentolado.',
        alvo: T + ' .ui-ess',
        faz: async function (t) {
          await t.clicar(T + ' [data-acao="buscar-por-sabor"]');
          await t.digitar(T + ' [data-entrada="busca"]', 'mentolado');
        }
      },
      {
        texto: 'Dá para misturar marcas no mesmo rosh: Watermelon Mint, da Zomo, com Love 66, da Adalya.',
        alvo: T + ' .ui-ess__escolhidos',
        faz: async function (t) {
          await t.clicar(T + ' [data-acao="sabor"][data-valor="zo-watermelon-mint"]', 800);
          await t.clicar(T + ' [data-acao="sabor"][data-valor="ad-love-66"]');
        }
      },
      {
        texto: 'A Adalya é uma marca premium e soma R$ 10,00. O sistema faz a conta sozinho.',
        alvo: T + ' .ui-conta-lista--rodape'
      },
      {
        texto: 'Adicionais: um carvão extra, cobrado à parte.',
        alvo: T + ' .ui-adicional',
        faz: async function (t) {
          await t.clicar(T + ' [data-acao="continuar"]');
          await t.clicar(T + ' [data-acao="mais"][data-valor="carvao"]');
        }
      },
      {
        texto: 'É happy hour: o desconto de 20% entra sozinho. O garçom não precisa lembrar.',
        alvo: T + ' .ui-promo-auto',
        faz: async function (t) { await t.clicar(T + ' [data-acao="continuar"]'); }
      },
      {
        texto: 'A conta vem explicada: rosh, acréscimo, adicionais, desconto e o total.',
        alvo: T + ' .ui-conta-lista--passo'
      },
      {
        texto: 'O cliente paga no Pix. O botão mostra o valor e a forma de pagamento, para ninguém errar.',
        alvo: T + ' [data-acao="finalizar"]',
        faz: async function (t) { await t.clicar(T + ' [data-acao="pagamento"][data-valor="pix"]'); }
      },
      {
        texto: 'Pagamento recebido! Errou alguma coisa? Dá para desfazer em até 5 segundos.',
        alvo: function () { return q(T + ' .ui-aviso') || q(T + ' .ui-lateral'); },
        tempo: 5600,
        faz: async function (t) { await t.clicar(T + ' [data-acao="finalizar"]'); }
      }
    ]
  });

  var CASAL = 'Casal da janela';

  function cartaoCasal() {
    return achar(Z + ' .ui-card', CASAL);
  }

  function botaoDoCartao() {
    var cartao = cartaoCasal();
    return cartao && cartao.querySelector('[data-acao="avancar"]');
  }

  function linhaEstoque(id) {
    return function () {
      var botao = q(Z + ' .ui-modal [data-valor="' + id + '"]');
      return botao && botao.closest('.ui-est__linha');
    };
  }

  caps.push({
    titulo: 'Cozinha',
    vista: 'cozinha',
    passos: [
      {
        texto: 'Na cozinha, o pedido do Casal da janela aparece na hora, com um aviso sonoro. A descrição ajuda a achar a mesa.',
        alvo: cartaoCasal,
        faz: async function (t) {
          await t.ate(cartaoCasal, 8000);
          t.som();
        }
      },
      {
        texto: 'A comanda sai impressa com o nome da mesa em letras grandes, os sabores, os adicionais e quem vendeu.',
        alvo: '#impressora .pv-impressora__saida',
        tempo: 5600,
        faz: async function (t) {
          var pedido = window.Rosh.pedidos.filter(function (p) { return p.mesa === A.idMesa(CASAL) && p.tipo === 'rosh'; })[0];
          if (pedido && !t.rapido()) window.RoshApp.imprimir(pedido);
        }
      },
      {
        texto: 'As cores mostram a espera: laranja passou de 10 minutos, vermelho passou de 15.',
        alvo: Z + ' .ui-coluna--preparo'
      },
      {
        texto: 'A cozinha toca em Começar preparo quando pega o pedido.',
        alvo: cartaoCasal,
        faz: async function (t) { await t.clicar(botaoDoCartao); }
      },
      {
        texto: 'E em Marcar pronto quando o narguilé está montado. O garçom é avisado no tablet dele.',
        alvo: cartaoCasal,
        faz: async function (t) { await t.clicar(botaoDoCartao); }
      },
      {
        texto: 'O estoque de essências fica a um toque, contado em pacotes.',
        alvo: function () { return q(Z + ' .ui-gaveta') || q(Z + ' [data-acao="estoque"]'); },
        faz: async function (t) { await t.clicar(Z + ' [data-acao="estoque"]'); }
      },
      {
        texto: 'Acabou o pacote aberto? A cozinha toca em Abrir pacote. Sobraram só 2: o dono já recebe um aviso.',
        alvo: linhaEstoque('zo-pink-berries'),
        faz: async function (t) {
          await t.digitar(Z + ' [data-entrada="busca-estoque"]', 'pink');
          await t.clicar(Z + ' .ui-modal [data-acao="abrir"][data-valor="zo-pink-berries"]');
        }
      },
      {
        texto: 'Este é o último pacote de Hapocalyx Mint. A cozinha abre e continua vendendo.',
        alvo: linhaEstoque('zi-hapocalyx-mint'),
        faz: async function (t) {
          await t.digitar(Z + ' [data-entrada="busca-estoque"]', 'hapocalyx');
          await t.clicar(Z + ' .ui-modal [data-acao="abrir"][data-valor="zi-hapocalyx-mint"]');
        }
      },
      {
        texto: 'Quando esse também acabar, é só marcar Em falta. O sabor some do tablet na hora.',
        alvo: function () { return linhaEstoque('zi-hapocalyx-mint')() || q(Z + ' .ui-quadro'); },
        tempo: 6200,
        faz: async function (t) {
          await t.clicar(Z + ' .ui-modal [data-acao="falta"][data-valor="zi-hapocalyx-mint"]');
          await t.espera(2600);
          await t.clicar(Z + ' .ui-modal [data-acao="fechar"]');
        }
      }
    ]
  });
})();

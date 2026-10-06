/* Tour guiado, capítulos 6 a 8: painel do dono, configuração e encerramento */
(function () {
  'use strict';

  var A = window.RoshTourAcoes;
  var q = A.q;
  var achar = A.achar;
  var caps = window.RoshTourCapitulos;

  var T = '#tela-tablet';
  var G = '#tela-gestao';
  var F = '#tela-config';
  var M = '#tela-celular';

  function painel(raiz, titulo) {
    return function () { return achar(raiz + ' .ui-painel', titulo); };
  }

  function aviso(tipo, texto) {
    return function () {
      return texto ? achar(G + ' .ui-aviso-item--' + tipo, texto) : q(G + ' .ui-aviso-item--' + tipo);
    };
  }

  function dentro(alvo, sel) {
    return function () {
      var no = alvo();
      return no && no.querySelector(sel);
    };
  }

  function aparelho(nome) {
    return '.pv-item--' + nome + ' .aparelho';
  }

  caps.push({
    titulo: 'Painel do dono',
    vista: 'gestao',
    passos: [
      {
        texto: 'Este é o painel do dono. No alto, os números do dia: pedidos, faturamento, mesas atendidas e valor médio por pedido.',
        alvo: G + ' .ui-kpis'
      },
      { texto: 'Pedidos por hora: dá para ver os horários de mais movimento.', alvo: painel(G, 'Pedidos por hora') },
      { texto: 'Vendas por pessoa: quanto cada um vendeu e como os clientes pagaram.', alvo: painel(G, 'Vendas por pessoa') },
      { texto: 'Promoções: quantos pedidos usaram cada uma e quanto foi dado de desconto.', alvo: painel(G, 'Promoções') },
      {
        texto: 'O sininho junta tudo o que precisa de você.',
        alvo: function () { return q(G + ' .ui-modal__caixa--avisos') || q(G + ' [data-acao="avisos"]'); },
        faz: async function (t) { await t.clicar(G + ' [data-acao="avisos"]'); }
      },
      {
        texto: 'O Rafa pediu para cancelar o carvão do Aniversário da Ju. Você aprova: o pedido sai da cozinha e o valor volta para o cliente.',
        alvo: aviso('cancelamento'),
        tempo: 6500,
        faz: async function (t) {
          await t.espera(1800);
          await t.clicar(dentro(aviso('cancelamento'), '[data-acao="aprovar"]'));
          t.mostrar(aviso('cancelamento'));
        }
      },
      {
        texto: 'A essência Hapocalyx Mint acabou. Chegou reposição? Lance a entrada direto do aviso.',
        alvo: function () { return aviso('falta', 'Hapocalyx')() || q(G + ' .ui-modal__caixa'); },
        tempo: 6200,
        faz: async function (t) {
          await t.espera(1800);
          await t.clicar(dentro(aviso('falta', 'Hapocalyx'), '[data-acao="entrada"]'));
        }
      },
      {
        texto: 'Seis pacotes. O sabor volta para o tablet do garçom sozinho.',
        alvo: function () { return q(G + ' .ui-modal__caixa') || q(G + ' .ui-aviso') || painel(G, 'Estoque')(); },
        faz: async function (t) {
          await t.espera(900);
          await t.clicar(G + ' .ui-modal [data-acao="salvar"]');
        }
      },
      {
        texto: 'A Bia fechou o caixa. Você confere o turno com um toque.',
        alvo: function () { return aviso('turno')() || q(G + ' .ui-modal__caixa--avisos'); },
        tempo: 6200,
        faz: async function (t) {
          await t.clicar(G + ' [data-acao="avisos"]', 1500);
          await t.clicar(dentro(aviso('turno'), '[data-acao="conferir"]'));
          t.mostrar(aviso('turno'));
        }
      },
      {
        texto: 'Tem mais de uma loja? Em Todas as unidades, os números somam a rede inteira.',
        alvo: function () { return q(G + ' .ui-modal') ? null : q(G + ' .ui-kpis'); },
        faz: async function (t) {
          await t.clicar(G + ' .ui-modal [data-acao="fechar"]');
          await t.clicar(G + ' [data-acao="vista"][data-valor="todas"]');
        }
      },
      {
        texto: 'E tudo isso também no celular: números, avisos e aprovações, de onde você estiver.',
        foco: 'celular',
        alvo: aparelho('celular'),
        faz: async function (t) {
          await t.espera(1500);
          await t.clicar(M + ' [data-acao="aba"][data-valor="avisos"]');
        }
      }
    ]
  });

  function modal(sel) {
    return F + ' .ui-modal ' + sel;
  }

  async function modoTreino(t) {
    await t.clicar(T + ' [data-acao="menu-usuario"]');
    await t.clicar(T + ' .ui-modal [data-acao="treino"]');
    await t.pin(T, '1234', 'ok');
  }

  caps.push({
    titulo: 'Configuração',
    vista: 'config',
    passos: [
      {
        texto: 'Na configuração, você e o gerente cuidam do cardápio, dos preços, das promoções e das mesas fixas.',
        alvo: F + ' .ui-segmento--abas'
      },
      {
        texto: 'Marca nova: o nome, uma cor e se é premium.',
        alvo: function () { return q(F + ' .ui-modal__caixa') || q(F + ' [data-acao="nova-marca"]'); },
        tempo: 6400,
        faz: async function (t) {
          await t.clicar(F + ' [data-acao="nova-marca"]');
          await t.digitar(modal('[data-campo="nome"]'), 'Haze', 150);
          await t.clicar(modal('[data-acao="alternar"][data-valor="#3f8f9f"]'), 400);
          await t.clicar(modal('[data-acao="alternar"][data-valor="premium"]'), 400);
          await t.digitar(modal('[data-campo="acrescimo"]'), '8', 150);
        }
      },
      {
        texto: 'Salvou, apareceu: a Haze já está no tablet do garçom.',
        alvo: function () { return achar(F + ' .ui-cfg-marca', 'Haze'); },
        faz: async function (t) { await t.clicar(modal('[data-acao="salvar"]')); }
      },
      {
        texto: 'Agora uma essência da Haze: o nome, o tipo de sabor e quantos pacotes chegaram.',
        alvo: function () { return q(F + ' .ui-modal__caixa') || q(F + ' [data-acao="novo-sabor"]'); },
        tempo: 6500,
        faz: async function (t) {
          await t.clicar(F + ' [data-acao="novo-sabor"]');
          await t.digitar(modal('[data-campo="nome"]'), 'What a Mint', 80);
          await t.escolher(modal('[data-campo="categoria"]'), 'mentolados');
          await t.clicar(modal('[data-acao="alternar"][data-valor="ice"]'), 300);
          await t.clicar(modal('[data-acao="alternar"][data-valor="menta"]'), 300);
          await t.digitar(modal('[data-campo="nota"]'), 'menta bem gelada', 50);
        }
      },
      {
        texto: 'Pronto. Ela entra no cardápio com 4 pacotes no estoque.',
        alvo: function () { return achar(F + ' .ui-tabela--cfg tr', 'What a Mint'); },
        faz: async function (t) { await t.clicar(modal('[data-acao="salvar"]')); }
      },
      {
        texto: 'Na aba Estoque, a lista de compras sugere quanto comprar de cada sabor.',
        alvo: painel(F, 'Lista de compras'),
        faz: async function (t) { await t.clicar(F + ' [data-acao="aba"][data-valor="estoque"]'); }
      },
      {
        texto: 'Chegou mercadoria? É só lançar a entrada e o estoque sobe.',
        alvo: function () { return q(F + ' .ui-modal__caixa') || q(F + ' .ui-aviso') || painel(F, 'Lista de compras')(); },
        tempo: 6000,
        faz: async function (t) {
          await t.clicar(F + ' .ui-compras [data-acao="entrada"][data-valor="zo-swiss-alps"]', 1700);
          await t.clicar(modal('[data-acao="salvar"]'));
        }
      },
      {
        texto: 'Adicional novo: piteira descartável, R$ 2,00. Já aparece no pedido do garçom.',
        alvo: function () { return q(F + ' .ui-modal__caixa') || painel(F, 'Adicionais')(); },
        tempo: 6500,
        faz: async function (t) {
          await t.clicar(F + ' [data-acao="aba"][data-valor="precos"]');
          await t.clicar(F + ' [data-acao="novo-adicional"]');
          await t.digitar(modal('[data-campo="nome"]'), 'Piteira descartável', 60);
          await t.digitar(modal('[data-campo="preco"]'), '2', 150);
          await t.clicar(modal('[data-acao="salvar"]'));
        }
      },
      {
        texto: 'Mudar uma promoção: o happy hour passa de 20% para 25%.',
        alvo: F + ' .ui-form',
        tempo: 6200,
        faz: async function (t) {
          await t.clicar(F + ' [data-acao="aba"][data-valor="promocoes"]');
          await t.clicar(F + ' [data-acao="editar-promo"][data-valor="happy"]');
          await t.digitar(F + ' [data-entrada="nome"]', 'Happy hour 25%', 70);
          await t.digitar(F + ' [data-entrada="pct"]', '25', 200);
        }
      },
      {
        texto: 'Salvo. Vale para os próximos pedidos; os que já foram feitos não mudam.',
        alvo: function () { return achar(F + ' .ui-cfg-promo', 'Happy hour 25%'); },
        faz: async function (t) { await t.clicar(F + ' [data-acao="salvar-promo"]'); }
      },
      {
        texto: 'Sua loja numera as mesas? Em Mesas fixas você cadastra as que quiser. É opcional: abrir mesa na hora sempre funciona.',
        alvo: painel(F, 'Mesas fixas desta loja'),
        faz: async function (t) { await t.clicar(F + ' [data-acao="aba"][data-valor="mesas"]'); }
      },
      {
        texto: 'Mesa 08 cadastrada. Ela já aparece como atalho no tablet e no caixa, ao lado de Nova mesa.',
        alvo: function () { return q(F + ' .ui-modal__caixa') || achar(F + ' .ui-tabela--cfg tr', 'Mesa 08'); },
        tempo: 6200,
        faz: async function (t) {
          await t.clicar(F + ' [data-acao="nova-fixa"]');
          await t.digitar(modal('[data-campo="nome"]'), 'Mesa 08', 110);
          await t.clicar(modal('[data-acao="salvar"]'));
        }
      },
      {
        texto: 'Funcionário novo? No modo treino ele pratica à vontade: nada conta no caixa nem no estoque.',
        vista: 'tablet',
        alvo: function () { return q(T + ' .ui-modal__caixa') || q(T + ' .ui-faixa-treino') || q(T + ' [data-acao="menu-usuario"]'); },
        tempo: 6500,
        faz: modoTreino
      },
      {
        texto: 'Para desligar, o gerente digita a senha dele de novo.',
        vista: 'tablet',
        alvo: function () { return q(T + ' .ui-modal__caixa') || q(T + ' .ui-barra'); },
        tempo: 6000,
        faz: modoTreino
      }
    ]
  });

  caps.push({
    titulo: 'Encerramento',
    vista: 'ao-vivo',
    passos: [
      { texto: 'É isso: do pedido na mesa ao painel do dono, tudo conversa.' },
      { texto: 'No tablet, o garçom lança o pedido em poucos toques e recebe na hora.', alvo: aparelho('tablet') },
      { texto: 'Na cozinha, fila clara, comanda impressa e estoque sob controle.', alvo: aparelho('cozinha') },
      { texto: 'No caixa, troco calculado e fechamento conferido.', vista: 'caixa', alvo: aparelho('caixa') },
      { texto: 'No painel do dono, números, avisos e aprovações, no computador e no celular.', vista: 'gestao', alvo: aparelho('gestao') },
      { texto: 'Funciona sem internet e guarda uma cópia de tudo fora do lounge.' },
      { texto: 'Começa com um lounge e cresce para quantos você abrir.' },
      { texto: 'Agora é com você. Toque em Explorar sozinho e use as telas à vontade.', alvo: '#tour-explorar' }
    ]
  });
})();

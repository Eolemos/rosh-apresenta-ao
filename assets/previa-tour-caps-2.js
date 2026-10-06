/* Tour guiado, capítulos 4 e 5: entregar e carvão, e o caixa */
(function () {
  'use strict';

  var A = window.RoshTourAcoes;
  var q = A.q;
  var achar = A.achar;
  var caps = window.RoshTourCapitulos;

  var T = '#tela-tablet';
  var X = '#tela-caixa';

  var JU = 'Aniversário da Ju';
  var FERNANDA = 'Fernanda e amigas';

  function prontoCasal() {
    return achar(T + ' .ui-pronto', 'Casal da janela');
  }

  function naReposicao(nome) {
    return function () { return q(T + ' .ui-modal [data-acao="mesa"][data-valor="' + A.idMesa(nome) + '"]'); };
  }

  // Verdadeiro quando nenhum pedido está mais nos 5 segundos do Desfazer
  function tudoNaCozinha() {
    return !window.Rosh.pedidos.some(function (p) { return window.Rosh.podeDesfazer(p); });
  }

  function fernandaNasMesas() {
    return achar(T + ' .ui-mapa__mesa', FERNANDA);
  }

  caps.push({
    titulo: 'Entregar e carvão',
    vista: 'tablet',
    passos: [
      {
        texto: 'De volta ao tablet. A lista Prontos para entregar mostra o que saiu da cozinha, de toda a equipe.',
        alvo: T + ' .ui-lateral'
      },
      {
        texto: 'O do Casal da janela é do Rafa. Ele leva o narguilé e marca como entregue.',
        alvo: function () { return prontoCasal() || q(T + ' .ui-lateral'); },
        faz: async function (t) {
          await t.espera(900);
          await t.clicar(function () { return prontoCasal() && prontoCasal().querySelector('[data-acao="entregar"]'); });
        }
      },
      {
        texto: 'Mais carvão: um pedido rápido, só de carvão, para quem já está fumando.',
        alvo: function () { return q(T + ' .ui-modal__caixa') || q(T + ' [data-acao="reposicao"]'); },
        faz: async function (t) { await t.clicar(T + ' [data-acao="reposicao"]'); }
      },
      {
        texto: 'A lista traz as mesas abertas. O Aniversário da Ju, em laranja, é a que mais espera. Dois carvões, pagos no Pix.',
        alvo: T + ' .ui-modal__caixa',
        tempo: 6400,
        faz: async function (t) {
          await t.clicar(naReposicao(JU), 700);
          await t.clicar(T + ' .ui-modal [data-acao="mais"]', 700);
          await t.clicar(T + ' .ui-modal [data-acao="pagamento"][data-valor="pix"]');
        }
      },
      {
        texto: 'Confirmado. A cozinha recebe o pedido de carvão separado dos narguilés.',
        alvo: function () { return q(T + ' .ui-aviso') || q(T + ' .ui-lateral'); },
        faz: async function (t) { await t.clicar(T + ' .ui-modal [data-acao="finalizar"]'); }
      },
      {
        texto: 'O cliente desistiu? O garçom abre Ações no pedido e pede o cancelamento.',
        alvo: function () { return q(T + ' .ui-modal__caixa') || q(T + ' .ui-pedidos__item'); },
        faz: async function (t) {
          await t.ate(tudoNaCozinha, 6500);
          await t.espera(700);
          await t.clicar(T + ' .ui-pedidos [data-acao="acoes"]');
        }
      },
      {
        texto: 'Quem aprova é o gerente ou o dono. O garçom só escolhe o motivo e envia.',
        alvo: function () { return q(T + ' .ui-modal__caixa') || q(T + ' .ui-aviso'); },
        faz: async function (t) {
          await t.clicar(T + ' .ui-modal [data-acao="cancelamento"]', 1500);
          await t.clicar(T + ' .ui-modal [data-acao="enviar"]');
        }
      },
      {
        texto: 'Promoção rosh duplo: o cliente paga um e ganha o segundo, para pedir depois na mesma mesa.',
        alvo: T + ' .ui-credito'
      },
      {
        texto: 'A Turma do Pedro pediu o segundo. O garçom toca em Lançar 2º rosh: a mesa e o tipo já vêm prontos.',
        alvo: function () { return q(T + ' .ui-passos'); },
        faz: async function (t) { await t.clicar(T + ' .ui-credito [data-acao="segundo"]'); }
      },
      {
        texto: 'Só falta escolher a essência. O segundo rosh sai sem cobrança.',
        alvo: T + ' [data-acao="finalizar"]',
        faz: async function (t) {
          await t.clicar(T + ' [data-acao="marca"][data-valor="nay"]', 700);
          await t.clicar(T + ' [data-acao="sabor"][data-valor="na-moon"]', 700);
          await t.clicar(T + ' [data-acao="passo"][data-valor="4"]');
        }
      },
      {
        texto: 'Enviado para a cozinha. O rosh grátis da mesa foi usado e some da lista.',
        alvo: function () { return q(T + ' .ui-aviso') || q(T + ' .ui-lateral'); },
        faz: async function (t) { await t.clicar(T + ' [data-acao="finalizar"]'); }
      },
      {
        texto: 'A Fernanda e as amigas foram embora. Liberar mesa fecha o atendimento. Mesa esquecida aberta fecha sozinha na virada do dia.',
        alvo: function () { return fernandaNasMesas() || q(T + ' .ui-modal .ui-form__nota') || q(T + ' .ui-aviso') || q(T + ' .ui-mesas__lista'); },
        tempo: 7600,
        faz: async function (t) {
          await t.clicar(T + ' [data-acao="mesas"]', 1600);
          await t.clicar(function () { return q(T + ' .ui-modal [data-acao="liberar"][data-valor="' + A.idMesa(FERNANDA) + '"]'); }, 2600);
          await t.clicar(T + ' .ui-modal [data-acao="fechar"]');
        }
      }
    ]
  });

  function turno(acao) {
    return X + ' [data-parte="turno"] [data-acao="' + acao + '"]';
  }

  caps.push({
    titulo: 'Caixa',
    vista: 'caixa',
    passos: [
      {
        texto: 'No caixa, o turno começa contando o dinheiro que fica na gaveta para dar troco.',
        alvo: function () { return q(X + ' .ui-modal__caixa') || q(X + ' [data-parte="turno"]'); },
        faz: async function (t) { await t.clicar(turno('abrir')); }
      },
      {
        texto: 'R$ 150,00 de troco. Turno aberto no nome da Bia.',
        alvo: X + ' .ui-gaveta-resumo',
        faz: async function (t) { await t.clicar(X + ' .ui-modal [data-acao="salvar"]'); }
      },
      {
        texto: 'Um cliente pede no balcão. A Bia escolhe Balcão e o tipo de rosh.',
        alvo: function () { return q(X + ' .ui-passo1') || q(X + ' .ui-passos'); },
        faz: async function (t) {
          await t.clicar(X + ' [data-acao="mesa"][data-valor="Balcão"]', 800);
          await t.clicar(X + ' [data-acao="rosh"][data-valor="mix"]');
        }
      },
      {
        texto: 'As essências são escolhidas do mesmo jeito que no tablet.',
        alvo: X + ' .ui-ess__escolhidos',
        faz: async function (t) {
          await t.clicar(X + ' [data-acao="marca"][data-valor="ziggy"]', 700);
          await t.clicar(X + ' [data-acao="sabor"][data-valor="zi-happy-berry"]', 700);
          await t.clicar(X + ' [data-acao="sabor"][data-valor="zi-fresh-lemon"]');
        }
      },
      {
        texto: 'O cliente paga em dinheiro. A Bia digita quanto recebeu: R$ 100,00.',
        alvo: X + ' .ui-campo--recebido',
        faz: async function (t) {
          await t.clicar(X + ' [data-acao="passo"][data-valor="4"]');
          await t.clicar(X + ' [data-acao="pagamento"][data-valor="dinheiro"]');
          await t.digitar(X + ' [data-entrada="recebido"]', '100', 220);
        }
      },
      { texto: 'O troco aparece sozinho. Sem conta de cabeça.', alvo: X + ' .ui-troco' },
      {
        texto: 'Confirmado. Sai o comprovante para o cliente, com a conta explicada.',
        alvo: function () { return q(X + ' .ui-modal__comanda') || q(X + ' [data-acao="finalizar"]'); },
        faz: async function (t) { await t.clicar(X + ' [data-acao="finalizar"]'); }
      },
      {
        texto: 'Muito dinheiro na gaveta? A Bia faz uma retirada. O valor e o motivo ficam registrados.',
        alvo: function () { return q(X + ' .ui-modal__caixa') || q(turno('sangria')); },
        faz: async function (t) {
          await t.clicar(X + ' .ui-modal [data-acao="ok"]');
          await t.clicar(turno('sangria'));
          await t.digitar(X + ' .ui-modal [data-campo="valor"]', '50', 220);
        }
      },
      {
        texto: 'Retirada de R$ 50,00 anotada. O sistema já sabe quanto deve ter na gaveta.',
        alvo: X + ' .ui-gaveta-resumo',
        faz: async function (t) { await t.clicar(X + ' .ui-modal [data-acao="salvar"]'); }
      },
      {
        texto: 'No fim do turno, a Bia conta o dinheiro da gaveta e digita o valor.',
        alvo: function () { return q(X + ' .ui-gaveta-dinheiro') || q(turno('fechar')); },
        faz: async function (t) {
          await t.clicar(turno('fechar'));
          var esperado = window.RoshNumeros.dinheiroEsperado('bia').esperado;
          await t.digitar(X + ' [data-entrada="contado"]', (esperado / 100).toFixed(2).replace('.', ','), 200);
        }
      },
      {
        texto: 'Bateu com o esperado. Ela fecha, imprime, e o dono recebe o aviso para conferir.',
        alvo: function () { return q(X + ' .ui-aviso') || q(X + ' [data-parte="turno"]'); },
        faz: async function (t) { await t.clicar(X + ' .ui-modal [data-acao="confirmar"]'); }
      }
    ]
  });
})();

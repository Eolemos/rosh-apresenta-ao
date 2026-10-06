/* Prévia das telas: dicas de primeiro uso, três por tela, apontando para a parte certa */
(function () {
  'use strict';

  var TELAS = { tablet: 'tela-tablet', caixa: 'tela-caixa', cozinha: 'tela-cozinha', gestao: 'tela-gestao', config: 'tela-config' };

  var DICAS = {
    tablet: [
      ['.ui-passos', 'O pedido sai em quatro passos. Toque num passo para voltar a ele; no último você confere a conta e confirma o pagamento.'],
      ['[data-acao="mesas"]', 'Mapa de mesas: veja há quanto tempo cada mesa está sem carvão e libere a mesa quando o cliente for embora.'],
      ['.ui-lateral', 'Aqui ficam os prontos para entregar de toda a equipe, o rosh grátis das mesas e os seus pedidos, com Ações para trocar mesa ou pedir cancelamento.']
    ],
    caixa: [
      ['.ui-grade--caixa', 'Pedido no balcão: escolha Balcão ou a mesa do cliente e siga os passos como no tablet.'],
      ['[data-parte="turno"]', 'Seu turno: o dinheiro esperado na gaveta, as retiradas e o fechamento com a contagem.'],
      ['[data-acao="menu-usuario"]', 'Toque no seu nome para trocar de usuário, ligar o modo treino ou ver estas dicas de novo.']
    ],
    cozinha: [
      ['.ui-coluna--fila', 'Os pedidos chegam aqui. O tempo fica laranja depois de 10 min e vermelho depois de 15 min.'],
      ['[data-acao="estoque"]', 'Estoque: abra um pacote quando o aberto acabar. Só marque em falta quando não houver pacote fechado.'],
      ['.ui-coluna--pronto', 'Pronto avisa o garçom no tablet. Se você mesmo levar, toque em Marcar entregue.']
    ],
    gestao: [
      ['.ui-segmento', 'Escolha a loja ou a rede inteira: todos os cartões acompanham a escolha.'],
      ['[data-acao="avisos"]', 'Avisos com ação: aprovar cancelamento, lançar entrada de estoque e conferir turno, sem procurar a tela.'],
      ['.ui-estoque-resumo, .ui-painel:last-child', 'Estoque da loja e a lista de compras sugerida, com a quantidade para voltar ao dobro do mínimo.']
    ],
    config: [
      ['[data-parte="papel"]', 'Veja a tela como gerente ou como master. Só o master muda o que vale para todas as lojas.'],
      ['.ui-config .ui-segmento', 'Marcas e essências, estoque, preços e promoções ficam em abas.'],
      ['[data-acao="nova-marca"], [data-acao="aba"]', 'O que você cadastra aparece no tablet, no caixa e na cozinha na hora.']
    ]
  };

  var vistas = {};
  var aberta = null;

  function fechar() {
    if (!aberta) return;
    aberta.bolha.remove();
    if (aberta.alvo) aberta.alvo.classList.remove('ui-dica-alvo');
    aberta = null;
  }

  function posicionar(raiz, bolha, alvo) {
    var base = raiz.getBoundingClientRect();
    var escala = base.width / raiz.offsetWidth || 1;
    var r = alvo.getBoundingClientRect();
    var largura = bolha.offsetWidth;
    var altura = bolha.offsetHeight;
    var x = (r.left - base.left) / escala;
    var embaixo = (r.bottom - base.top) / escala + 12;
    var acima = (r.top - base.top) / escala - altura - 12;
    var topo = embaixo + altura < raiz.offsetHeight - 8 ? embaixo : Math.max(8, acima);
    bolha.classList.toggle('ui-dica--acima', topo !== embaixo);
    bolha.style.left = Math.max(10, Math.min(x, raiz.offsetWidth - largura - 10)) + 'px';
    bolha.style.top = topo + 'px';
  }

  function passo(id, i) {
    fechar();
    var tela = document.getElementById(TELAS[id]);
    var raiz = tela && tela.querySelector('.ui');
    if (!raiz || !raiz.offsetWidth || !raiz.getBoundingClientRect().width) return false;
    var lista = DICAS[id];
    var alvo = raiz.querySelector(lista[i][0]);
    var bolha = document.createElement('div');
    bolha.className = 'ui-dica';
    bolha.setAttribute('role', 'dialog');
    bolha.setAttribute('aria-label', 'Dica ' + (i + 1) + ' de ' + lista.length);
    bolha.innerHTML = '<p class="ui-dica__passo">Dica ' + (i + 1) + ' de ' + lista.length + '</p><p class="ui-dica__texto">' + lista[i][1] + '</p>' +
      '<div class="ui-dica__acoes"><button type="button" class="ui-link" data-dica="pular">Pular dicas</button>' +
      '<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-dica="proxima">' + (i < lista.length - 1 ? 'Próxima' : 'Entendi') + '</button></div>';
    raiz.appendChild(bolha);
    if (alvo) {
      alvo.classList.add('ui-dica-alvo');
      posicionar(raiz, bolha, alvo);
    }
    aberta = { bolha: bolha, alvo: alvo };
    bolha.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-dica]');
      if (!b) return;
      if (b.getAttribute('data-dica') === 'proxima' && i < lista.length - 1) passo(id, i + 1);
      else fechar();
    });
    bolha.querySelector('[data-dica="proxima"]').focus({ preventScroll: true });
    return true;
  }

  // Mostra na primeira vez que a tela é aberta, ou sempre que pedirem pelo botão "?"
  function mostrar(id, forcar) {
    if (!DICAS[id] || (vistas[id] && !forcar)) return;
    if (passo(id, 0)) vistas[id] = true;
  }

  window.RoshDicas = { mostrar: mostrar, fechar: fechar };
})();

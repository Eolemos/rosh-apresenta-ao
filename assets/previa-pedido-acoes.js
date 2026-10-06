/* Prévia das telas: o que dá para fazer depois de enviar um pedido (trocar mesa, trocar sabores, pedir cancelamento) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var E = window.RoshEssencias;
  var M = window.RoshMesas;

  var MOTIVOS = ['Cliente desistiu', 'Pedido lançado errado', 'Cobrança errada', 'Sabor errado e a cozinha já começou'];

  function situacao(p) {
    if (p.estado === 'cancelado') return '<span class="ui-estado ui-estado--cancelado">Cancelado</span>';
    if (p.cancelamento && p.cancelamento.estado === 'pendente') return '<span class="ui-estado ui-estado--fila">Cancelamento com o gerente</span>';
    if (R.podeDesfazer(p)) return '<span class="ui-estado ui-estado--fila">Enviando</span>';
    return U.chipEstado(p.estado);
  }

  function trocarMesa(tela, p, opId) {
    var modal = U.abrirModal(tela, '<h2 class="ui-modal__titulo">Trocar a mesa do pedido 0' + p.numero + '</h2>' +
      '<p class="ui-modal__texto">Hoje está em ' + R.esc(R.nomeMesa(p.mesa)) + '. Escolha outra mesa aberta: o preço não muda e a troca fica registrada.</p>' +
      window.RoshMesaEscolha.linhas(null, p.mesa) +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button></div>', function (alvo, fechar) {
      if (alvo.getAttribute('data-acao') === 'mesa') {
        var nova = alvo.getAttribute('data-valor');
        M.trocarMesa(p.id, nova, opId);
        U.aviso(tela, 'Pedido 0' + p.numero + ' passou para ' + R.nomeMesa(nova) + '. A cozinha já vê a troca');
      }
      fechar();
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--largo');
  }

  // Troca de sabores e gelo enquanto o pedido está na fila; o preço precisa ficar igual
  function trocarSabores(tela, p, opId) {
    var itens = JSON.parse(JSON.stringify(p.itens));
    var atual = 0;
    var ui = { modo: 'marcas', marcaId: null, categoria: null, busca: '' };
    var erro = '';
    function corpo() {
      var it = itens[atual];
      return '<h2 class="ui-modal__titulo">Trocar sabores do pedido 0' + p.numero + '</h2>' +
        '<p class="ui-modal__texto">Só enquanto está na fila e sem mudar o preço. A cozinha recebe a comanda nova.</p>' +
        (itens.length > 1 ? '<div class="ui-linha">' + itens.map(function (x, i) {
          return '<button type="button" class="ui-filtro" data-acao="item" data-valor="' + i + '" aria-pressed="' + (i === atual) + '">Narguilé ' + (i + 1) + '</button>';
        }).join('') + '</div>' : '') +
        '<div class="ui-troca">' + E.html(it, ui) + '</div>' +
        '<button type="button" class="ui-alternar" data-acao="gelo" aria-pressed="' + it.gelo + '"><span class="ui-alternar__trilho" aria-hidden="true"></span>Gelo no vaso</button>' +
        (erro ? '<p class="ui-form__erro" role="alert">' + erro + '</p>' : '') +
        '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button>' +
        '<button type="button" class="ui-botao ui-botao--primario" data-acao="salvar">Salvar troca</button></div>';
    }
    var modal = U.abrirModal(tela, corpo(), function (alvo, fechar, fundo) {
      var nome = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor');
      if (nome === 'cancelar') return fechar();
      if (nome === 'salvar') {
        if (itens.some(function (i) { return !i.sabores.length; })) erro = 'Cada narguilé precisa de pelo menos um sabor.';
        else {
          erro = M.trocarItens(p.id, itens, opId);
          if (!erro) {
            fechar();
            return U.aviso(tela, 'Sabores trocados. A cozinha recebeu a comanda nova');
          }
        }
      } else if (nome === 'item') {
        atual = Number(valor);
        ui.modo = 'marcas';
      } else if (nome === 'gelo') {
        itens[atual].gelo = !itens[atual].gelo;
      } else {
        E.acao(itens[atual], ui, nome, valor);
      }
      U.desenhar(fundo.querySelector('.ui-modal__caixa'), corpo());
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--troca');
    modal.el.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('data-entrada') !== 'busca') return;
      E.digitar(ui, ev.target.value);
      U.desenhar(modal.el.querySelector('.ui-modal__caixa'), corpo());
    });
  }

  function pedirCancelamento(tela, p, opId) {
    var motivo = MOTIVOS[0];
    function corpo() {
      return '<h2 class="ui-modal__titulo">Pedir cancelamento do pedido 0' + p.numero + '</h2>' +
        '<p class="ui-modal__texto">O gerente recebe o pedido e aprova ou recusa. Se aprovar, o pedido sai da cozinha e o valor de ' + R.reais(p.total) +
        ' é estornado ' + (p.pagamento ? 'no ' + R.pagamento(p.pagamento).nome.toLowerCase() : '') + '.</p>' +
        '<div class="ui-chips">' + MOTIVOS.map(function (m) {
          return '<button type="button" class="ui-filtro" data-acao="motivo" data-valor="' + R.esc(m) + '" aria-pressed="' + (m === motivo) + '">' + R.esc(m) + '</button>';
        }).join('') + '</div>' +
        '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Voltar</button>' +
        '<button type="button" class="ui-botao ui-botao--primario" data-acao="enviar">Enviar ao gerente</button></div>';
    }
    U.abrirModal(tela, corpo(), function (alvo, fechar, fundo) {
      var nome = alvo.getAttribute('data-acao');
      if (nome === 'cancelar') return fechar();
      if (nome === 'enviar') {
        M.pedirCancelamento(p.id, motivo, opId);
        fechar();
        return U.aviso(tela, 'Pedido de cancelamento enviado. A resposta aparece aqui');
      }
      motivo = alvo.getAttribute('data-valor');
      fundo.querySelector('.ui-modal__caixa').innerHTML = corpo();
    });
  }

  // Menu de ações de um pedido já enviado
  function abrir(tela, p, opId) {
    var naFila = p.estado === 'fila' && p.tipo === 'rosh';
    var pendente = p.cancelamento && p.cancelamento.estado === 'pendente';
    var podeCancelar = p.estado !== 'cancelado' && !pendente;
    U.abrirModal(tela, '<h2 class="ui-modal__titulo">Pedido 0' + p.numero + ', ' + R.esc(R.nomeMesa(p.mesa)) + '</h2>' +
      '<p class="ui-modal__texto">' + R.esc(R.descricao(p)) + ', ' + R.reais(p.total) + (p.pagamento ? ' ' + R.pagamento(p.pagamento).nome.toLowerCase() : '') + '. ' +
      (p.historico.length ? 'Última mudança: ' + R.esc(p.historico[p.historico.length - 1].texto) + '.' : '') + '</p><div class="ui-menu-lista">' +
      (R.podeDesfazer(p) ? '<button type="button" class="ui-botao ui-botao--primario" data-acao="desfazer">Desfazer o envio</button>' : '') +
      '<button type="button" class="ui-botao" data-acao="mesa"' + (p.estado === 'cancelado' ? ' disabled' : '') + '>Trocar mesa</button>' +
      '<button type="button" class="ui-botao" data-acao="sabores"' + (naFila ? '' : ' disabled') + '>Trocar sabores ou observação' + (naFila ? '' : ' (só na fila)') + '</button>' +
      '<button type="button" class="ui-botao ui-botao--perigo" data-acao="cancelamento"' + (podeCancelar ? '' : ' disabled') + '>' +
      (pendente ? 'Cancelamento já está com o gerente' : 'Pedir correção ou cancelamento') + '</button></div>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="fechar">Fechar</button></div>', function (alvo, fechar) {
      var nome = alvo.getAttribute('data-acao');
      fechar();
      if (nome === 'desfazer') U.aviso(tela, R.desfazer(p.id) ? 'Pedido desfeito: a cozinha não recebeu nada' : 'A cozinha já recebeu. Peça cancelamento.');
      if (nome === 'mesa') trocarMesa(tela, p, opId);
      if (nome === 'sabores') trocarSabores(tela, p, opId);
      if (nome === 'cancelamento') pedirCancelamento(tela, p, opId);
    });
  }

  window.RoshPosVenda = { abrir: abrir, situacao: situacao };
})();

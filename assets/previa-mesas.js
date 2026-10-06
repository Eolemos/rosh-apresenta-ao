/* Prévia das telas: mapa de mesas, rosh grátis da mesa, trocas depois do envio e pedidos de cancelamento */
(function () {
  'use strict';

  var C = window.RoshCatalogo;
  var R = window.Rosh;
  var E = window.RoshEstoque;

  var LIMITE_CARVAO = 30;
  var mesas = {};
  var creditos = [];
  var proximoCredito = 1;

  function quem(id) {
    var op = C.OPERADORES[id];
    return op.nome + ' (' + op.cargo + ')';
  }

  function pedidosDaMesa(m) {
    var liberada = (mesas[m] || {}).liberadaEm || 0;
    return R.pedidos.filter(function (p) {
      return p.mesa === m && R.conta(p) && p.criadoEm > liberada;
    });
  }

  // Ocupada desde o primeiro pedido; o último carvão conta o narguilé e as reposições
  function infoMesa(m) {
    var lista = pedidosDaMesa(m);
    if (!lista.length) return { ocupada: false, credito: creditoDaMesa(m) };
    var narguileEm = 0;
    var carvaoEm = 0;
    lista.forEach(function (p) {
      if (p.tipo === 'rosh') narguileEm = Math.max(narguileEm, p.criadoEm);
      if (p.tipo === 'reposicao' || R.carvoesDe(p)) carvaoEm = Math.max(carvaoEm, p.criadoEm);
    });
    var ultimo = Math.max(narguileEm, carvaoEm);
    return {
      ocupada: true, narguileEm: narguileEm, ultimoCarvaoEm: ultimo,
      carvaoAtrasado: R.minutos(ultimo) > LIMITE_CARVAO, credito: creditoDaMesa(m)
    };
  }

  function valido(c) {
    return !c.usado && !c.encerrado && R.agora() < c.validoAte;
  }

  function creditoDaMesa(m) {
    var lista = creditos.filter(function (c) { return c.mesa === m && valido(c); });
    return lista.length ? lista[0] : null;
  }

  function creditosDisponiveis() {
    return creditos.filter(valido);
  }

  // Rosh duplo: o 2º rosh vale por algumas horas e nunca passa da virada do dia operacional
  function criarCredito(p) {
    var promo = R.promocao('duplo');
    var horas = (promo && promo.validadeHoras) || 3;
    creditos.push({
      id: 'c' + proximoCredito++, mesa: p.mesa, roshId: p.itens[0].roshId, origem: p.numero, pedidoId: p.id,
      criadoEm: p.criadoEm, vendedorId: p.vendedorId, validoAte: Math.min(p.criadoEm + horas * 3600000, R.fimDoDia(p.criadoEm)),
      usado: null, encerrado: null
    });
  }

  R.pedidos.forEach(function (p) {
    if (p.promoId === 'duplo' && !p.segundo) criarCredito(p);
  });

  R.ao(function (ev) {
    var p = ev.pedido;
    if (!p) return;
    if (ev.tipo === 'novo' && p.promoId === 'duplo' && !p.segundo && !p.treino) criarCredito(p);
    if (ev.tipo === 'novo' && p.segundo && p.creditoId) C.porId(creditos, p.creditoId).usado = p.numero;
    if (ev.tipo === 'desfeito' || (ev.tipo === 'estado' && p.estado === 'cancelado')) {
      creditos.forEach(function (c) {
        if (c.pedidoId === p.id) c.encerrado = 'pedido desfeito';
        if (p.segundo && c.id === p.creditoId) c.usado = null;
      });
    }
  });

  function liberarMesa(m, opId) {
    mesas[m] = { liberadaEm: R.agora(), por: opId };
    creditos.forEach(function (c) {
      if (c.mesa === m && valido(c)) c.encerrado = 'mesa liberada';
    });
    R.avisar({ tipo: 'mesa', mesa: m });
  }

  function anotar(p, texto, opId) {
    p.historico.push({ ts: R.agora(), texto: texto, quem: opId });
    p.alteradoEm = R.agora();
  }

  function trocarMesa(id, mesa, opId) {
    var p = C.porId(R.pedidos, id);
    var antes = p.mesa;
    p.mesa = mesa;
    creditos.forEach(function (c) {
      if (c.pedidoId === p.id && valido(c)) c.mesa = mesa;
    });
    anotar(p, 'Mesa trocada de ' + R.nomeMesa(antes) + ' para ' + R.nomeMesa(mesa), opId);
    R.avisar({ tipo: 'alterado', pedido: p, reimprimir: p.estado === 'fila' || p.estado === 'preparo' });
  }

  // Troca de sabores e observação: só na fila e sem mudar o preço
  function trocarItens(id, itens, opId) {
    var p = C.porId(R.pedidos, id);
    if (p.estado !== 'fila') return 'A cozinha já começou este pedido. Peça a correção ao gerente.';
    var novo = R.calcular({ itens: itens, segundo: p.segundo });
    if (novo.subtotal !== p.subtotal) return 'Essa troca muda o preço (acréscimo premium ou adicional). Peça a correção ao gerente.';
    p.itens = JSON.parse(JSON.stringify(itens));
    anotar(p, 'Sabores ou observação trocados', opId);
    R.avisar({ tipo: 'alterado', pedido: p, reimprimir: true });
    return '';
  }

  function pedirCancelamento(id, motivo, opId) {
    var p = C.porId(R.pedidos, id);
    p.cancelamento = { estado: 'pendente', motivo: motivo, quem: opId, ts: R.agora() };
    E.notificar({
      tipo: 'cancelamento', titulo: 'Pedido 0' + p.numero + ', ' + R.nomeMesa(p.mesa) + ', ' + R.reais(p.total),
      detalhe: quem(opId) + ' pediu: ' + motivo + '.', ref: { pedidoId: p.id }
    });
    R.avisar({ tipo: 'alterado', pedido: p });
  }

  function resolverAviso(p, texto) {
    E.avisos.forEach(function (a) {
      if (a.ref && a.ref.pedidoId === p.id && a.tipo === 'cancelamento') {
        a.lida = true;
        a.resolvido = texto;
      }
    });
  }

  // Aprovar cancela o pedido e registra o estorno na forma de pagamento usada
  function aprovarCancelamento(id, opId) {
    var p = C.porId(R.pedidos, id);
    p.cancelamento.estado = 'aprovado';
    p.cancelamento.aprovadoPor = opId;
    p.estorno = p.total;
    resolverAviso(p, 'Aprovado por ' + quem(opId) + ': cancelado e ' + (p.pagamento ? 'estorno de ' + R.reais(p.total) + ' no ' + R.pagamento(p.pagamento).nome.toLowerCase() : 'sem cobrança') + '.');
    R.mudarEstado(id, 'cancelado');
  }

  function recusarCancelamento(id, opId) {
    var p = C.porId(R.pedidos, id);
    p.cancelamento.estado = 'recusado';
    resolverAviso(p, 'Recusado por ' + quem(opId) + '. O pedido segue normal.');
    R.avisar({ tipo: 'alterado', pedido: p });
    R.avisar({ tipo: 'aviso' });
  }

  window.RoshMesas = {
    LIMITE_CARVAO: LIMITE_CARVAO,
    creditos: creditos,
    infoMesa: infoMesa,
    creditoDaMesa: creditoDaMesa,
    creditosDisponiveis: creditosDisponiveis,
    liberarMesa: liberarMesa,
    trocarMesa: trocarMesa,
    trocarItens: trocarItens,
    pedirCancelamento: pedirCancelamento,
    aprovarCancelamento: aprovarCancelamento,
    recusarCancelamento: recusarCancelamento
  };
})();

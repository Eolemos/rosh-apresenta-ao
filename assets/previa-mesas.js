/* Prévia das telas: mesas abertas na hora, rosh grátis da mesa, trocas depois do envio e pedidos de cancelamento */
(function () {
  'use strict';

  var C = window.RoshCatalogo;
  var R = window.Rosh;
  var E = window.RoshEstoque;

  var LIMITE_CARVAO = 30;
  var BASE_ATENDIDAS = 18;
  var creditos = [];
  var proximoCredito = 1;
  var proximaFixa = 1;

  function quem(id) {
    var op = C.OPERADORES[id];
    return op.nome + ' (' + op.cargo + ')';
  }

  function igual(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  // Todo mundo da equipe vê todas as mesas abertas, da mais antiga para a mais nova
  function abertas() {
    return R.mesas.filter(function (m) { return !m.fechadaEm; });
  }

  // Duas mesas abertas não podem ter o mesmo nome: a comanda sai só com o nome
  function validarNome(nome, ignorarId) {
    var limpo = (nome || '').trim();
    if (!limpo) return 'Dê um nome para a mesa, por exemplo Casal da janela.';
    if (limpo.length > C.LIMITE_MESA.nome) return 'O nome pode ter até ' + C.LIMITE_MESA.nome + ' letras.';
    if (igual(limpo, 'Balcão')) return 'Balcão é o atendimento do caixa. Escolha outro nome para a mesa.';
    var repetida = abertas().filter(function (m) { return m.id !== ignorarId && igual(m.nome, limpo); })[0];
    if (repetida) return 'Já existe uma mesa aberta chamada ' + repetida.nome + '. Mude um pouco para diferenciar, por exemplo ' + repetida.nome + ' 2.';
    return '';
  }

  function validarDescricao(descricao) {
    return (descricao || '').trim().length > C.LIMITE_MESA.descricao ? 'A descrição pode ter até ' + C.LIMITE_MESA.descricao + ' letras.' : '';
  }

  function abrir(nome, descricao, opId, fixaId) {
    var m = R.abrirMesa({ nome: nome.trim(), descricao: (descricao || '').trim(), abertaPor: opId, fixaId: fixaId });
    R.avisar({ tipo: 'mesa', mesa: m });
    return m;
  }

  function fixaAberta(fixaId) {
    var fixa = C.porId(C.MESAS_FIXAS, fixaId);
    return abertas().filter(function (m) { return m.fixaId === fixaId || igual(m.nome, fixa.nome); })[0] || null;
  }

  // Atalho de mesa fixa: abre com um toque, ou devolve a que já está aberta com esse nome
  function abrirFixa(fixaId, opId) {
    return fixaAberta(fixaId) || abrir(C.porId(C.MESAS_FIXAS, fixaId).nome, '', opId, fixaId);
  }

  // Mesas fixas da loja (opcionais): viram atalhos de um toque ao lado de Nova mesa
  function validarFixa(nome, ignorarId) {
    var limpo = (nome || '').trim();
    if (!limpo) return 'Dê um nome para a mesa fixa, por exemplo Mesa 07 ou VIP 1.';
    if (limpo.length > C.LIMITE_MESA.nome) return 'O nome pode ter até ' + C.LIMITE_MESA.nome + ' letras.';
    if (igual(limpo, 'Balcão')) return 'Balcão é o atendimento do caixa. Escolha outro nome.';
    if (C.MESAS_FIXAS.some(function (f) { return f.id !== ignorarId && igual(f.nome, limpo); })) return 'Já existe uma mesa fixa chamada ' + limpo + '.';
    return '';
  }

  function salvarFixa(nome, id) {
    var fixa = id ? C.porId(C.MESAS_FIXAS, id) : { id: 'fx-' + proximaFixa++ };
    fixa.nome = nome.trim();
    if (!id) C.MESAS_FIXAS.push(fixa);
    R.avisar({ tipo: 'mesa' });
    return fixa;
  }

  // Remover tira só o atalho: a mesa que estiver aberta com esse nome continua aberta
  function removerFixa(id) {
    var i = C.MESAS_FIXAS.indexOf(C.porId(C.MESAS_FIXAS, id));
    var fixa = C.MESAS_FIXAS.splice(i, 1)[0];
    R.avisar({ tipo: 'mesa' });
    return fixa;
  }

  function editar(id, nome, descricao) {
    var m = R.mesa(id);
    m.nome = nome.trim();
    m.descricao = (descricao || '').trim();
    R.avisar({ tipo: 'mesa', mesa: m });
    return m;
  }

  function pedidosDaMesa(id) {
    return R.pedidos.filter(function (p) { return p.mesa === id && R.conta(p); });
  }

  function valido(c) {
    var m = R.mesa(c.mesa);
    return !c.usado && !c.encerrado && R.agora() < c.validoAte && m && !m.fechadaEm;
  }

  function creditoDaMesa(id) {
    var lista = creditos.filter(function (c) { return c.mesa === id && valido(c); });
    return lista.length ? lista[0] : null;
  }

  function creditosDisponiveis() {
    return creditos.filter(valido);
  }

  // Há quanto tempo a mesa está com narguilé e quando foi o último carvão (narguilé novo ou reposição)
  function infoMesa(id) {
    var narguileEm = 0;
    var carvaoEm = 0;
    pedidosDaMesa(id).forEach(function (p) {
      if (p.tipo === 'rosh') narguileEm = Math.max(narguileEm, p.criadoEm);
      if (p.tipo === 'reposicao' || R.carvoesDe(p)) carvaoEm = Math.max(carvaoEm, p.criadoEm);
    });
    var ultimo = Math.max(narguileEm, carvaoEm);
    return {
      narguileEm: narguileEm, ultimoCarvaoEm: ultimo, carvaoAtrasado: ultimo > 0 && R.minutos(ultimo) > LIMITE_CARVAO,
      credito: creditoDaMesa(id)
    };
  }

  // Frase curta para listas: "narguilé há 40 min, último carvão há 25 min"
  function linhaStatus(id) {
    var info = infoMesa(id);
    if (!info.narguileEm) return 'Sem pedido ainda';
    return 'Narguilé há ' + R.minutos(info.narguileEm) + ' min, último carvão há ' + R.minutos(info.ultimoCarvaoEm) + ' min';
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

  // Pedidos da mesa que ainda não chegaram ao cliente (na fila, em preparo ou prontos)
  function pendentes(id) {
    return R.pedidos.filter(function (p) {
      return p.mesa === id && p.estado !== 'entregue' && p.estado !== 'cancelado' && p.estado !== 'desfeito';
    }).length;
  }

  // Liberar fecha a mesa: ela sai da lista e o rosh grátis que sobrou é encerrado
  function liberarMesa(id, opId) {
    var m = R.mesa(id);
    creditos.forEach(function (c) {
      if (c.mesa === id && valido(c)) c.encerrado = 'mesa liberada';
    });
    m.fechadaEm = R.agora();
    m.fechadaPor = opId;
    R.avisar({ tipo: 'mesa', mesa: m });
  }

  function atendidasHoje() {
    return BASE_ATENDIDAS + R.mesas.length;
  }

  function anotar(p, texto, opId) {
    p.historico.push({ ts: R.agora(), texto: texto, quem: opId });
    p.alteradoEm = R.agora();
  }

  function trocarMesa(id, mesaId, opId) {
    var p = C.porId(R.pedidos, id);
    var antes = p.mesa;
    p.mesa = mesaId;
    creditos.forEach(function (c) {
      if (c.pedidoId === p.id && !c.usado && !c.encerrado) c.mesa = mesaId;
    });
    anotar(p, 'Mesa trocada de ' + R.nomeMesa(antes) + ' para ' + R.nomeMesa(mesaId), opId);
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
    abertas: abertas,
    validarNome: validarNome,
    validarDescricao: validarDescricao,
    abrir: abrir,
    abrirFixa: abrirFixa,
    fixaAberta: fixaAberta,
    validarFixa: validarFixa,
    salvarFixa: salvarFixa,
    removerFixa: removerFixa,
    editar: editar,
    infoMesa: infoMesa,
    linhaStatus: linhaStatus,
    creditoDaMesa: creditoDaMesa,
    creditosDisponiveis: creditosDisponiveis,
    liberarMesa: liberarMesa,
    pendentes: pendentes,
    atendidasHoje: atendidasHoje,
    quem: quem,
    trocarMesa: trocarMesa,
    trocarItens: trocarItens,
    pedirCancelamento: pedirCancelamento,
    aprovarCancelamento: aprovarCancelamento,
    recusarCancelamento: recusarCancelamento
  };
})();

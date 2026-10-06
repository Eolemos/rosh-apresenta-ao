/* Prévia das telas: estoque de essências em pacotes, movimentos e avisos da rede */
(function () {
  'use strict';

  var C = window.RoshCatalogo;
  var R = window.Rosh;

  var movimentos = [];
  var avisos = [];
  var proximoAviso = 1;
  var escopo = { valor: 'u1' };

  function minutosAtras(m) {
    return R.agora() - m * 60000;
  }

  function pacotes(n) {
    return n + (n === 1 ? ' pacote' : ' pacotes');
  }

  function status(sabor) {
    if (sabor.emFalta) return 'falta';
    if (sabor.estoque <= sabor.minimo) return 'baixo';
    return 'ok';
  }

  function registrar(saborId, tipo, texto, quem, ts) {
    movimentos.unshift({ ts: ts || R.agora(), saborId: saborId, tipo: tipo, texto: texto, quem: quem, depois: R.sabor(saborId).estoque });
  }

  function notificar(dados, ts, lida) {
    avisos.unshift({
      id: 'a' + proximoAviso++, tipo: dados.tipo, unidade: dados.unidade || 'u1', titulo: dados.titulo,
      detalhe: dados.detalhe, ref: dados.ref || null, ts: ts || R.agora(), lida: Boolean(lida)
    });
    if (!ts) R.avisar({ tipo: 'aviso' });
  }

  function avisoFalta(sabor, quem, ts, lida) {
    notificar({ tipo: 'falta', titulo: C.rotuloSabor(sabor), detalhe: 'Marcado em falta por ' + C.OPERADORES[quem].nome + ' (' + C.OPERADORES[quem].cargo + ').',
      ref: { saborId: sabor.id } }, ts, lida);
  }

  function avisoBaixo(sabor, ts, lida) {
    var resta = sabor.estoque === 1 ? 'Resta 1 pacote fechado' : 'Restam ' + sabor.estoque + ' pacotes fechados';
    notificar({ tipo: 'baixo', titulo: C.rotuloSabor(sabor), detalhe: resta + '; o mínimo é ' + sabor.minimo + '.', ref: { saborId: sabor.id } }, ts, lida);
  }

  function cruzouMinimo(sabor, antes) {
    return antes > sabor.minimo && sabor.estoque <= sabor.minimo;
  }

  // Gerente registra os pacotes que chegaram; se a essência estava em falta, ela volta sozinha
  function entrada(saborId, n, quem) {
    var sabor = R.sabor(saborId);
    var voltou = sabor.emFalta;
    sabor.estoque += n;
    sabor.emFalta = false;
    registrar(saborId, 'entrada', 'Entrada de ' + pacotes(n) + (voltou ? '; chegou de novo ao cardápio' : ''), quem);
    R.avisar({ tipo: voltou ? 'cardapio' : 'estoque', sabor: sabor });
    return voltou;
  }

  // Sugestão de compra: tudo que está no mínimo ou abaixo, para voltar ao dobro do mínimo
  function listaCompras() {
    return C.SABORES.filter(C.saborVisivel).filter(function (s) { return s.estoque <= s.minimo; })
      .map(function (s) { return { sabor: s, sugestao: Math.max(1, s.minimo * 2 - s.estoque) }; })
      .sort(function (a, b) { return a.sabor.estoque - b.sabor.estoque; });
  }

  // Cozinha abre um pacote novo quando o aberto acaba
  function abrirPacote(saborId, quem) {
    var sabor = R.sabor(saborId);
    if (sabor.estoque <= 0) return;
    var antes = sabor.estoque;
    var voltou = sabor.emFalta;
    sabor.estoque -= 1;
    sabor.emFalta = false;
    registrar(saborId, 'abrir', 'Abriu 1 pacote' + (voltou ? ' e chegou de novo ao cardápio' : ''), quem);
    if (cruzouMinimo(sabor, antes)) avisoBaixo(sabor);
    R.avisar({ tipo: 'cardapio', sabor: sabor });
  }

  // Gerente corrige o número com a contagem física
  function contagem(saborId, n, motivo, quem) {
    var sabor = R.sabor(saborId);
    var antes = sabor.estoque;
    sabor.estoque = n;
    registrar(saborId, 'contagem', 'Contagem: ' + pacotes(n) + ' (antes ' + antes + '). ' + motivo, quem);
    if (cruzouMinimo(sabor, antes)) avisoBaixo(sabor);
    R.avisar({ tipo: 'estoque', sabor: sabor });
  }

  function alternarFalta(saborId, quem) {
    var sabor = R.sabor(saborId);
    sabor.emFalta = !sabor.emFalta;
    registrar(saborId, sabor.emFalta ? 'falta' : 'volta', sabor.emFalta ? 'Marcou em falta' : 'Chegou de novo ao cardápio', quem);
    if (sabor.emFalta) avisoFalta(sabor, quem);
    R.avisar({ tipo: 'cardapio', sabor: sabor });
  }

  function avisoTurno(opId) {
    var op = C.OPERADORES[opId];
    notificar({ tipo: 'turno', titulo: op.nome + ' (' + op.cargo + ')', detalhe: 'Fechou o turno às ' + R.hora(R.agora()) + '. Confira o fechamento.', ref: { opId: opId } });
  }

  function doEscopo(valor) {
    var alvo = valor || escopo.valor;
    return avisos.filter(function (a) { return alvo === 'todas' || a.unidade === alvo; });
  }

  function naoLidos(valor) {
    return doEscopo(valor).filter(function (a) { return !a.lida; }).length;
  }

  function marcarLido(id, silencioso) {
    var aviso = C.porId(avisos, id);
    if (aviso) aviso.lida = true;
    if (!silencioso) R.avisar({ tipo: 'aviso' });
  }

  // Estoque das outras lojas, para a visão da rede
  var OUTRAS = { u2: { falta: 1, baixo: 3, compras: 4 }, u3: { falta: 0, baixo: 2, compras: 2 } };

  function marcarTodos(valor) {
    doEscopo(valor).forEach(function (a) { a.lida = true; });
    R.avisar({ tipo: 'aviso' });
  }

  function definirEscopo(valor) {
    escopo.valor = valor;
    R.avisar({ tipo: 'escopo' });
  }

  function contarStatus() {
    var res = { falta: 0, baixo: 0, ok: 0 };
    C.SABORES.filter(C.saborVisivel).forEach(function (s) { res[status(s)] += 1; });
    return res;
  }

  // Histórico e avisos que já existiam quando a prévia abriu
  registrar('na-menta', 'entrada', 'Entrada de 6 pacotes', 'ana', minutosAtras(185));
  registrar('zo-strong-mint', 'entrada', 'Entrada de 4 pacotes', 'ana', minutosAtras(184));
  registrar('ad-ice-bonbon', 'falta', 'Marcou em falta', 'caio', minutosAtras(120));
  registrar('zo-swiss-alps', 'falta', 'Marcou em falta', 'caio', minutosAtras(50));
  registrar('zi-hapocalyx-mint', 'abrir', 'Abriu 1 pacote', 'caio', minutosAtras(35));
  registrar('zi-cafe-macchiato', 'falta', 'Marcou em falta', 'caio', minutosAtras(25));
  registrar('on-high-mint', 'contagem', 'Contagem: 4 pacotes (antes 5). Pacote danificado', 'ana', minutosAtras(18));
  registrar('ad-love-66', 'abrir', 'Abriu 1 pacote', 'caio', minutosAtras(12));
  movimentos.sort(function (a, b) { return b.ts - a.ts; });

  notificar({ tipo: 'baixo', unidade: 'u2', titulo: 'Watermelon Mint (Zomo)', detalhe: 'Resta 1 pacote fechado; o mínimo é 2.' }, minutosAtras(64), true);
  avisoFalta(R.sabor('ad-ice-bonbon'), 'caio', minutosAtras(120), true);
  avisoFalta(R.sabor('zo-swiss-alps'), 'caio', minutosAtras(50), true);
  avisoBaixo(R.sabor('zi-hapocalyx-mint'), minutosAtras(35));
  avisoFalta(R.sabor('zi-cafe-macchiato'), 'caio', minutosAtras(25));
  avisoBaixo(R.sabor('ad-love-66'), minutosAtras(12));
  notificar({ tipo: 'falta', unidade: 'u2', titulo: 'Strong Mint (Zomo)', detalhe: 'Marcado em falta por Nina (cozinha).' }, minutosAtras(8));
  notificar({ tipo: 'impressora', unidade: 'u2', titulo: 'Impressora da cozinha', detalhe: 'Sem papel. 2 comandas aguardando para imprimir.' }, minutosAtras(4));
  avisos.sort(function (a, b) { return b.ts - a.ts; });

  window.RoshEstoque = {
    movimentos: movimentos,
    avisos: avisos,
    escopo: escopo,
    status: status,
    pacotes: pacotes,
    entrada: entrada,
    abrirPacote: abrirPacote,
    contagem: contagem,
    alternarFalta: alternarFalta,
    registrar: registrar,
    notificar: notificar,
    listaCompras: listaCompras,
    OUTRAS: OUTRAS,
    avisoTurno: avisoTurno,
    doEscopo: doEscopo,
    naoLidos: naoLidos,
    marcarLido: marcarLido,
    marcarTodos: marcarTodos,
    definirEscopo: definirEscopo,
    contarStatus: contarStatus
  };
})();

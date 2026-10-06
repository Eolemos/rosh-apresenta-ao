/* Prévia das telas: estado compartilhado (relógio, preços e pedidos com um ou mais narguilés) */
(function () {
  'use strict';

  var C = window.RoshCatalogo;

  // Relógio simulado: a prévia acontece numa noite de movimento, durante o happy hour
  var inicioReal = Date.now();
  var base = new Date();
  base.setHours(21, 5, 0, 0);
  var inicioSimulado = base.getTime();
  var VIRADA = 6;
  var config = { desfazerMs: 5000 };

  function agora() {
    return inicioSimulado + (Date.now() - inicioReal);
  }

  // Dia operacional: a madrugada ainda conta como a noite anterior; o dia vira às 6h
  function inicioDoDia(ts) {
    var d = new Date(ts - VIRADA * 3600000);
    d.setHours(VIRADA, 0, 0, 0);
    return d.getTime();
  }

  function fimDoDia(ts) {
    return inicioDoDia(ts) + 24 * 3600000;
  }

  function rotuloDia() {
    var d = new Date(inicioDoDia(agora()));
    return 'Dia operacional ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' (vira às ' + VIRADA + 'h)';
  }

  var ouvintes = [];

  function ao(fn) {
    ouvintes.push(fn);
  }

  function avisar(evento) {
    ouvintes.forEach(function (fn) { fn(evento); });
  }

  function sabor(id) { return C.porId(C.SABORES, id); }
  function marca(id) { return C.porId(C.MARCAS, id); }
  function rosh(id) { return C.porId(C.ROSH, id); }
  function promocao(id) { return C.porId(C.PROMOCOES, id); }

  function promoAutomatica() {
    var lista = C.PROMOCOES.filter(function (p) { return p.modo === 'automatica' && C.promoAtiva(p, agora()); });
    return lista.length ? lista[0] : null;
  }

  // Preço de um narguilé: rosh + maior acréscimo premium entre as marcas + adicionais
  function precoItem(item, segundo) {
    var r = item.roshId ? rosh(item.roshId) : null;
    var premium = 0;
    var marcaPremium = '';
    if (!segundo) {
      (item.sabores || []).forEach(function (id) {
        var m = marca(sabor(id).marcaId);
        if (m.sobretaxa > premium) {
          premium = m.sobretaxa;
          marcaPremium = m.nome;
        }
      });
    }
    var adicionais = 0;
    C.ADICIONAIS.forEach(function (a) { adicionais += ((item.adicionais || {})[a.id] || 0) * C.preco(a); });
    var valorRosh = r && !segundo ? C.preco(r) : 0;
    return { rosh: valorRosh, premium: premium, marcaPremium: marcaPremium, adicionais: adicionais, total: valorRosh + premium + adicionais };
  }

  // Conta do pedido inteiro, com o nome de cada parte (rosh, acréscimo premium, adicionais, desconto)
  function calcular(sel) {
    var itens = (sel.itens || []).map(function (item) { return precoItem(item, sel.segundo); });
    var conta = { itens: itens, rosh: 0, premium: 0, marcasPremium: [], adicionais: 0 };
    itens.forEach(function (i) {
      conta.rosh += i.rosh;
      conta.premium += i.premium;
      conta.adicionais += i.adicionais;
      if (i.marcaPremium && conta.marcasPremium.indexOf(i.marcaPremium) === -1) conta.marcasPremium.push(i.marcaPremium);
    });
    conta.subtotal = conta.rosh + conta.premium + conta.adicionais;
    conta.desconto = 0;
    conta.rotulo = '';
    conta.promoId = null;
    conta.automatica = false;
    var promo = null;
    if (sel.avulsoPct) {
      conta.desconto = Math.round(conta.subtotal * sel.avulsoPct / 100);
      conta.rotulo = 'Desconto avulso ' + sel.avulsoPct + '%';
    } else if (!sel.segundo) {
      promo = sel.promoId ? promocao(sel.promoId) : sel.semAutomatica ? null : promoAutomatica();
      conta.automatica = Boolean(promo && !sel.promoId);
    }
    if (promo) {
      conta.promoId = promo.id;
      conta.rotulo = promo.nome;
      if (promo.tipo === 'percentual') {
        var base = promo.vale === 'rosh' ? conta.rosh + conta.premium : promo.vale === 'adicionais' ? conta.adicionais : conta.subtotal;
        conta.desconto = Math.round(base * promo.pct / 100);
      }
    }
    conta.total = conta.subtotal - conta.desconto;
    return conta;
  }

  var pedidos = [];
  var recentes = [];
  var proximoNumero = 140;

  function saboresDe(p) {
    var lista = [];
    (p.itens || []).forEach(function (i) { lista = lista.concat(i.sabores); });
    return lista;
  }

  function carvoesDe(p) {
    if (p.tipo === 'reposicao') return p.carvoes;
    return (p.itens || []).reduce(function (soma, i) { return soma + ((i.adicionais || {}).carvao || 0); }, 0);
  }

  // Conta nas vendas, no caixa e nos relatórios: não é treino, não foi desfeito nem cancelado
  function conta(p) {
    return !p.treino && p.estado !== 'desfeito' && p.estado !== 'cancelado';
  }

  function naCozinha(p) {
    return p.estado !== 'desfeito' && p.estado !== 'cancelado' && !(p.liberaEm && agora() < p.liberaEm);
  }

  function registrar(dados, minutosAtras) {
    var preco = dados.tipo === 'reposicao'
      ? { subtotal: dados.carvoes * C.preco(C.porId(C.ADICIONAIS, 'carvao')), desconto: 0, rotulo: '', promoId: null, automatica: false, itens: [] }
      : calcular(dados);
    var p = {
      id: 'p' + proximoNumero,
      numero: proximoNumero++,
      tipo: dados.tipo || 'rosh',
      mesa: dados.mesa,
      itens: JSON.parse(JSON.stringify(dados.itens || [])),
      carvoes: dados.carvoes || 0,
      promoId: preco.promoId,
      promoAutomatica: preco.automatica,
      avulsoPct: dados.avulsoPct || 0,
      rotuloDesconto: preco.rotulo,
      conta: preco,
      segundo: Boolean(dados.segundo),
      creditoId: dados.creditoId || null,
      pagamento: preco.subtotal - preco.desconto > 0 ? dados.pagamento : null,
      recebido: dados.recebido || 0,
      subtotal: preco.subtotal,
      desconto: preco.desconto,
      total: preco.subtotal - preco.desconto,
      vendedorId: dados.vendedorId,
      treino: Boolean(dados.treino),
      estado: dados.estado || 'fila',
      historico: [],
      criadoEm: agora() - (minutosAtras || 0) * 60000,
      mudouEm: agora()
    };
    pedidos.push(p);
    saboresDe(p).forEach(function (id) {
      var i = recentes.indexOf(id);
      if (i !== -1) recentes.splice(i, 1);
      recentes.unshift(id);
    });
    recentes.length = Math.min(recentes.length, 6);
    return p;
  }

  function item(roshId, sabores, adicionais, gelo) {
    return { roshId: roshId, sabores: sabores, adicionais: adicionais || {}, gelo: Boolean(gelo) };
  }

  // Pedidos que já estavam acontecendo quando a prévia abriu
  registrar({ mesa: '11', itens: [item('simples', ['zo-strong-mint'])], pagamento: 'pix', vendedorId: 'leo', estado: 'entregue' }, 38);
  registrar({ mesa: '02', itens: [item('grande', ['zo-watermelon-mint', 'ad-love-66', 'zo-gum-mint'])], pagamento: 'cartao', vendedorId: 'rafa', estado: 'entregue' }, 48);
  registrar({ tipo: 'reposicao', mesa: '02', carvoes: 1, pagamento: 'pix', vendedorId: 'rafa', estado: 'entregue' }, 35);
  registrar({ mesa: '06', itens: [item('mix', ['zi-hapocalyx-mint', 'zi-happy-berry'])], pagamento: 'dinheiro', recebido: 6000, vendedorId: 'duda', estado: 'entregue' }, 25);
  registrar({ tipo: 'reposicao', mesa: '11', carvoes: 2, pagamento: 'pix', vendedorId: 'leo' }, 1);
  registrar({ mesa: '03', itens: [item('mix', ['ad-love-66', 'na-menta'])], pagamento: 'cartao', vendedorId: 'leo', estado: 'preparo' }, 12);
  registrar({ mesa: '09', itens: [item('simples', ['zo-watermelon-mint'], {}, true)], pagamento: 'pix', vendedorId: 'rafa' }, 4);
  registrar({ mesa: 'Balcão', itens: [item('grande', ['zi-happy-berry', 'zo-strong-mint', 'zi-fresh-lemon'], { carvao: 1 })], pagamento: 'dinheiro', recebido: 10000, vendedorId: 'bia', estado: 'preparo' }, 16);
  registrar({ mesa: '05', itens: [item('mix', ['on-high-lemon', 'on-high-mint'])], pagamento: 'dinheiro', recebido: 6000, promoId: 'duplo', vendedorId: 'rafa', estado: 'pronto' }, 10);
  recentes.splice(0, recentes.length, 'zo-watermelon-mint', 'ad-love-66', 'zo-strong-mint', 'on-high-mint', 'zi-happy-berry');

  // Pedido novo fica 5 s com "Desfazer" antes de chegar na cozinha
  function criarPedido(dados) {
    var p = registrar(dados, 0);
    p.liberaEm = agora() + config.desfazerMs;
    avisar({ tipo: 'novo', pedido: p });
    setTimeout(function () {
      if (p.estado === 'desfeito') return;
      p.liberaEm = 0;
      avisar({ tipo: 'liberado', pedido: p });
    }, config.desfazerMs + 50);
    return p;
  }

  function podeDesfazer(p) {
    return p.liberaEm && agora() < p.liberaEm && p.estado !== 'desfeito';
  }

  function desfazer(id) {
    var p = C.porId(pedidos, id);
    if (!p || !podeDesfazer(p)) return false;
    p.estado = 'desfeito';
    avisar({ tipo: 'desfeito', pedido: p });
    return true;
  }

  function mudarEstado(id, estado) {
    var p = C.porId(pedidos, id);
    if (!p) return;
    p.estado = estado;
    p.mudouEm = agora();
    avisar({ tipo: 'estado', pedido: p });
  }

  function avancar(id) {
    var p = C.porId(pedidos, id);
    if (!p) return;
    if (p.estado === 'fila') mudarEstado(id, p.tipo === 'reposicao' ? 'pronto' : 'preparo');
    else if (p.estado === 'preparo') mudarEstado(id, 'pronto');
  }

  function entregar(id) {
    mudarEstado(id, 'entregue');
  }

  function reimprimir(id) {
    var p = C.porId(pedidos, id);
    if (p) avisar({ tipo: 'imprimir', pedido: p });
  }

  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function reais(centavos) {
    return moeda.format(centavos / 100);
  }

  function hora(ts) {
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function minutos(ts) {
    return Math.max(0, Math.floor((agora() - ts) / 60000));
  }

  function tempoDecorrido(ts) {
    var m = minutos(ts);
    if (m < 1) return 'agora';
    if (m < 60) return 'há ' + m + ' min';
    return 'há ' + Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
  }

  function esc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function nomeMesa(mesa) {
    return mesa === 'Balcão' ? 'Balcão' : 'Mesa ' + mesa;
  }

  function descricao(p) {
    if (p.tipo === 'reposicao') return 'Reposição de ' + p.carvoes + (p.carvoes === 1 ? ' carvão' : ' carvões');
    if (p.itens.length === 1) return rosh(p.itens[0].roshId).nome + (p.segundo ? ' (2º rosh)' : '');
    return p.itens.length + ' narguilés';
  }

  window.Rosh = {
    config: config,
    pedidos: pedidos,
    recentes: recentes,
    ao: ao,
    avisar: avisar,
    agora: agora,
    inicioDoDia: inicioDoDia,
    fimDoDia: fimDoDia,
    rotuloDia: rotuloDia,
    sabor: sabor,
    marca: marca,
    rosh: rosh,
    promocao: promocao,
    promoAutomatica: promoAutomatica,
    pagamento: function (id) { return C.porId(C.PAGAMENTOS, id); },
    calcular: calcular,
    precoItem: precoItem,
    saboresDe: saboresDe,
    carvoesDe: carvoesDe,
    conta: conta,
    naCozinha: naCozinha,
    criarPedido: criarPedido,
    podeDesfazer: podeDesfazer,
    desfazer: desfazer,
    mudarEstado: mudarEstado,
    avancar: avancar,
    entregar: entregar,
    reimprimir: reimprimir,
    reais: reais,
    hora: hora,
    minutos: minutos,
    tempoDecorrido: tempoDecorrido,
    esc: esc,
    nomeMesa: nomeMesa,
    descricao: descricao
  };
})();

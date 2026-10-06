/* Prévia das telas: vendas do dia operacional, turnos, caixa e números da gestão */
(function () {
  'use strict';

  var C = window.RoshCatalogo;
  var R = window.Rosh;

  function f(n, bruto, desc) { return { n: n, bruto: bruto, desc: desc }; }

  // Movimento do dia operacional antes da prévia abrir, por pessoa
  var BASE = {
    duda: { formas: { dinheiro: f(2, 12500, 0), cartao: f(3, 20000, 0), pix: f(2, 13500, 0) }, carvoes: 2, comPromo: 0, semCobranca: 0 },
    rafa: { formas: { dinheiro: f(3, 21000, 1500), cartao: f(4, 29000, 3000), pix: f(5, 36500, 4500) }, carvoes: 4, comPromo: 5, semCobranca: 1 },
    bia: { formas: { dinheiro: f(4, 27000, 2000), cartao: f(6, 43500, 4000), pix: f(5, 33500, 2500) }, carvoes: 6, comPromo: 6, semCobranca: 0 },
    leo: { formas: { dinheiro: f(2, 14000, 0), cartao: f(5, 36000, 4500), pix: f(4, 26000, 1500) }, carvoes: 3, comPromo: 4, semCobranca: 1 }
  };

  var EQUIPE = ['rafa', 'bia', 'leo', 'duda'];
  var HORAS = ['13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h'];
  var BASE_HORAS = [1, 2, 2, 3, 4, 7, 10, 12, 4];

  var BASE_MARCAS = { zomo: 34, ziggy: 28, adalya: 19, nay: 15, onix: 12, smyrna: 4 };
  var BASE_SABORES = {
    'zo-watermelon-mint': 12, 'ad-love-66': 10, 'zo-strong-mint': 9, 'zi-hapocalyx-mint': 8,
    'zi-happy-berry': 7, 'na-menta': 6, 'on-high-mint': 5, 'ad-hawaii': 5, 'na-vision': 3
  };
  var BASE_PROMOS = { happy: { n: 14, desc: 19600 }, aniversario: { n: 3, desc: 2100 }, duplo: { n: 5, gratis: 3 }, terca: { n: 0, desc: 0 }, avulso: { n: 2, desc: 1500 } };

  // As outras lojas da rede, para a visão "Todas as unidades"
  var OUTRAS_UNIDADES = [
    { id: 'u2', nome: C.UNIDADES.u2, pedidos: 31, valor: 196500, carvoes: 9, mesas: 19, horas: [0, 1, 2, 2, 3, 5, 8, 6, 4],
      marcas: { zomo: 14, ziggy: 9, adalya: 4, nay: 3, onix: 1 }, sabores: { 'zo-watermelon-mint': 6, 'zo-strong-mint': 5, 'ad-love-66': 3 },
      promos: { happy: { n: 9, desc: 11800 }, aniversario: { n: 1, desc: 700 }, duplo: { n: 2, gratis: 1 } },
      turnos: { abertos: 3, aguardando: 1, conferidos: 1 } },
    { id: 'u3', nome: C.UNIDADES.u3, pedidos: 27, valor: 168000, carvoes: 7, mesas: 16, horas: [0, 0, 1, 2, 3, 4, 7, 6, 4],
      marcas: { zomo: 10, ziggy: 8, adalya: 6, nay: 2, onix: 1 }, sabores: { 'ad-love-66': 5, 'zo-watermelon-mint': 4, 'zi-happy-berry': 3 },
      promos: { happy: { n: 7, desc: 9100 }, duplo: { n: 1, gratis: 1 } },
      turnos: { abertos: 2, aguardando: 0, conferidos: 2 } }
  ];

  var turnos = {
    duda: { estado: 'conferido', horario: '14:00 a 18:00', conferidoPor: 'Ana' },
    rafa: { estado: 'aberto', horario: '18:00 a agora' },
    leo: { estado: 'aberto', horario: '18:00 a agora' },
    bia: { estado: 'aberto', horario: '18:00 a agora', fundo: 15000,
      sangrias: [{ valor: 20000, motivo: 'Depósito no cofre', quem: 'ana', ts: R.agora() - 85 * 60000 }] }
  };

  function vazio() {
    return { formas: { dinheiro: f(0, 0, 0), cartao: f(0, 0, 0), pix: f(0, 0, 0) }, carvoes: 0, comPromo: 0, semCobranca: 0, estornos: { n: 0, valor: 0 } };
  }

  function somar(lista, alvo) {
    alvo.estornos = alvo.estornos || { n: 0, valor: 0 };
    lista.forEach(function (p) {
      if (p.treino || p.estado === 'desfeito') return;
      if (p.estado === 'cancelado') {
        alvo.estornos.n += 1;
        alvo.estornos.valor += p.total;
        return;
      }
      if (p.pagamento) {
        var forma = alvo.formas[p.pagamento];
        forma.n += 1;
        forma.bruto += p.subtotal;
        forma.desc += p.desconto;
      } else {
        alvo.semCobranca += 1;
      }
      alvo.carvoes += R.carvoesDe(p);
      if (p.promoId || p.avulsoPct || p.segundo) alvo.comPromo += 1;
    });
    return alvo;
  }

  function vendasDoDia(opId) {
    var resumo = BASE[opId] ? JSON.parse(JSON.stringify(BASE[opId])) : vazio();
    return somar(R.pedidos.filter(function (p) { return p.vendedorId === opId; }), resumo);
  }

  function vendasDoTurno(opId) {
    var t = turnos[opId];
    if (t && t.desde) {
      return somar(R.pedidos.filter(function (p) { return p.vendedorId === opId && p.criadoEm >= t.desde; }), vazio());
    }
    return vendasDoDia(opId);
  }

  function totais(resumo) {
    var n = resumo.semCobranca;
    var bruto = 0;
    var desc = 0;
    C.PAGAMENTOS.forEach(function (pg) {
      n += resumo.formas[pg.id].n;
      bruto += resumo.formas[pg.id].bruto;
      desc += resumo.formas[pg.id].desc;
    });
    return { n: n, bruto: bruto, desc: desc, liq: bruto - desc };
  }

  // Dinheiro que deveria estar na gaveta: fundo de troco + vendas em dinheiro - retiradas
  function dinheiroEsperado(opId) {
    var t = turnos[opId];
    var dinheiro = vendasDoTurno(opId).formas.dinheiro;
    var retiradas = (t.sangrias || []).reduce(function (soma, s) { return soma + s.valor; }, 0);
    return { fundo: t.fundo || 0, vendas: dinheiro.bruto - dinheiro.desc, retiradas: retiradas, esperado: (t.fundo || 0) + dinheiro.bruto - dinheiro.desc - retiradas };
  }

  function sangria(opId, valor, motivo, quem) {
    turnos[opId].sangrias.push({ valor: valor, motivo: motivo, quem: quem, ts: R.agora() });
    R.avisar({ tipo: 'turno', operador: opId });
  }

  function fecharTurno(opId, contado) {
    var t = turnos[opId];
    if (typeof contado === 'number') {
      var calc = dinheiroEsperado(opId);
      t.esperado = calc.esperado;
      t.contado = contado;
      t.diferenca = contado - calc.esperado;
    }
    t.estado = 'aguardando';
    t.fechadoEm = R.agora();
    t.horario = (t.desde ? R.hora(t.desde) : '18:00') + ' a ' + R.hora(R.agora());
    window.RoshEstoque.avisoTurno(opId);
    R.avisar({ tipo: 'turno', operador: opId });
  }

  function conferirTurno(opId) {
    turnos[opId].estado = 'conferido';
    turnos[opId].conferidoPor = 'Ana';
    window.RoshEstoque.avisos.forEach(function (a) {
      if (a.tipo === 'turno' && a.ref && a.ref.opId === opId) a.lida = true;
    });
    R.avisar({ tipo: 'turno', operador: opId });
  }

  function abrirTurno(opId, fundo) {
    turnos[opId + '-anterior'] = turnos[opId];
    C.OPERADORES[opId + '-anterior'] = C.OPERADORES[opId];
    turnos[opId] = { estado: 'aberto', horario: R.hora(R.agora()) + ' a agora', desde: R.agora(), fundo: fundo || 0, sangrias: [] };
    R.avisar({ tipo: 'turno', operador: opId });
  }

  function lista(contagem) {
    return Object.keys(contagem).map(function (k) { return { id: k, n: contagem[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }

  function contar(baseContagem, chave, outras, todas) {
    var contagem = {};
    Object.keys(baseContagem).forEach(function (k) { contagem[k] = baseContagem[k]; });
    R.pedidos.filter(R.conta).forEach(function (p) {
      R.saboresDe(p).forEach(function (id) {
        var k = chave(id);
        contagem[k] = (contagem[k] || 0) + 1;
      });
    });
    if (todas) {
      OUTRAS_UNIDADES.forEach(function (u) {
        Object.keys(u[outras]).forEach(function (k) { contagem[k] = (contagem[k] || 0) + u[outras][k]; });
      });
    }
    return lista(contagem);
  }

  function marcasMaisVendidas(todas) {
    return contar(BASE_MARCAS, function (id) { return R.sabor(id).marcaId; }, 'marcas', todas);
  }

  function saboresMaisVendidos(todas) {
    return contar(BASE_SABORES, function (id) { return id; }, 'sabores', todas);
  }

  // Resultado de cada promoção no dia: pedidos e desconto dado
  function resultadoPromocoes(todas) {
    var linhas = C.PROMOCOES.map(function (p) {
      var b = BASE_PROMOS[p.id] || {};
      var linha = { id: p.id, nome: p.nome, tipo: p.tipo, n: b.n || 0, desc: b.desc || 0, gratis: b.gratis || 0 };
      if (todas) {
        OUTRAS_UNIDADES.forEach(function (u) {
          var o = u.promos[p.id] || {};
          linha.n += o.n || 0;
          linha.desc += o.desc || 0;
          linha.gratis += o.gratis || 0;
        });
      }
      return linha;
    });
    var avulso = { id: 'avulso', nome: 'Desconto avulso', tipo: 'avulso', n: BASE_PROMOS.avulso.n, desc: BASE_PROMOS.avulso.desc, gratis: 0 };
    R.pedidos.filter(R.conta).forEach(function (p) {
      if (p.avulsoPct) {
        avulso.n += 1;
        avulso.desc += p.desconto;
        return;
      }
      var linha = C.porId(linhas, p.segundo ? 'duplo' : p.promoId);
      if (!linha) return;
      if (p.segundo) linha.gratis += 1;
      else linha.n += 1;
      linha.desc += p.desconto;
    });
    return linhas.concat([avulso]);
  }

  function resumoUnidade1() {
    var porOperador = EQUIPE.map(function (id) {
      var r = vendasDoDia(id);
      return { id: id, resumo: r, total: totais(r) };
    });
    var res = { porOperador: porOperador, pedidos: 0, valor: 0, carvoes: 0 };
    porOperador.forEach(function (o) {
      res.pedidos += o.total.n;
      res.valor += o.total.liq;
      res.carvoes += o.resumo.carvoes;
    });
    res.horas = BASE_HORAS.slice();
    res.horas[res.horas.length - 1] += R.pedidos.filter(R.conta).length;
    return res;
  }

  // Números de uma loja ou da rede inteira, no mesmo formato
  function resumoEscopo(escopo) {
    var u1 = resumoUnidade1();
    var res = { pedidos: u1.pedidos, valor: u1.valor, carvoes: u1.carvoes, mesas: window.RoshMesas.atendidasHoje(), horas: u1.horas.slice(), u1: u1 };
    if (escopo === 'u1') return res;
    if (escopo !== 'todas') {
      var u = C.porId(OUTRAS_UNIDADES, escopo);
      return { pedidos: u.pedidos, valor: u.valor, carvoes: u.carvoes, mesas: u.mesas, horas: u.horas.slice(), u1: u1 };
    }
    OUTRAS_UNIDADES.forEach(function (o) {
      res.pedidos += o.pedidos;
      res.valor += o.valor;
      res.carvoes += o.carvoes;
      res.mesas += o.mesas;
      o.horas.forEach(function (n, i) { res.horas[i] += n; });
    });
    return res;
  }

  window.RoshNumeros = {
    EQUIPE: EQUIPE,
    HORAS: HORAS,
    OUTRAS_UNIDADES: OUTRAS_UNIDADES,
    turnos: turnos,
    vendasDoDia: vendasDoDia,
    vendasDoTurno: vendasDoTurno,
    totais: totais,
    dinheiroEsperado: dinheiroEsperado,
    sangria: sangria,
    fecharTurno: fecharTurno,
    conferirTurno: conferirTurno,
    abrirTurno: abrirTurno,
    marcasMaisVendidas: marcasMaisVendidas,
    saboresMaisVendidos: saboresMaisVendidos,
    resultadoPromocoes: resultadoPromocoes,
    resumoUnidade1: resumoUnidade1,
    resumoEscopo: resumoEscopo
  };
})();

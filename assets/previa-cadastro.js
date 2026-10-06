/* Prévia das telas: cadastro do cardápio (marcas, essências, adicionais, tipos de rosh, promoções) */
(function () {
  'use strict';

  var C = window.RoshCatalogo;
  var R = window.Rosh;
  var E = window.RoshEstoque;

  var contador = 1;

  function novoId(prefixo, nome) {
    var base = String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return prefixo + '-' + (base || 'item') + '-' + contador++;
  }

  function mudou() {
    R.avisar({ tipo: 'cardapio' });
  }

  // Quem cria: o master cria para a rede; o gerente cria só para a loja dele
  function escopoDe(papel) {
    return papel === 'gerente' ? 'unidade' : 'rede';
  }

  // Ajuste que vale só nesta unidade: ocultar, preço local, estoque mínimo
  function ajustarUnidade(lista, id, campos) {
    var item = C.porId(lista, id);
    Object.keys(campos).forEach(function (k) {
      if (campos[k] === null) delete item[k];
      else item[k] = campos[k];
    });
    mudou();
    return item;
  }

  function salvarMarca(dados, id, papel) {
    var marca = id ? R.marca(id) : null;
    var valores = {
      nome: dados.nome, cor: dados.cor, texto: C.corTexto(dados.cor), tier: dados.tier,
      sobretaxa: dados.tier === 'premium' ? Math.round(dados.acrescimo * 100) : 0
    };
    if (marca) Object.assign(marca, valores);
    else {
      marca = Object.assign({ id: novoId('m', dados.nome), ativo: true, escopo: escopoDe(papel) }, valores);
      C.MARCAS.push(marca);
    }
    mudou();
    return marca;
  }

  function salvarSabor(dados, id, papel) {
    var sabor = id ? R.sabor(id) : null;
    var valores = {
      marcaId: dados.marcaId, linha: dados.linha || null, nome: dados.nome, categoria: dados.categoria,
      tags: dados.tags.slice(), nota: dados.nota, minimo: dados.minimo
    };
    if (sabor) Object.assign(sabor, valores);
    else {
      sabor = Object.assign({ id: novoId('s', dados.nome), emFalta: false, ativo: true, estoque: dados.inicial, escopo: escopoDe(papel) }, valores);
      C.SABORES.push(sabor);
      E.registrar(sabor.id, 'entrada', 'Cadastro com ' + E.pacotes(dados.inicial), papel === 'gerente' ? 'ana' : 'marcos');
    }
    mudou();
    return sabor;
  }

  function salvarAdicional(dados, id, papel) {
    var item = id ? C.porId(C.ADICIONAIS, id) : null;
    if (item) {
      item.nome = dados.nome;
      item.preco = Math.round(dados.preco * 100);
    } else {
      item = { id: novoId('ad', dados.nome), nome: dados.nome, preco: Math.round(dados.preco * 100), ativo: true, escopo: escopoDe(papel) };
      C.ADICIONAIS.push(item);
    }
    mudou();
    return item;
  }

  function salvarRosh(dados, id, papel) {
    var item = id ? R.rosh(id) : null;
    var valores = { nome: dados.nome, preco: Math.round(dados.preco * 100), max: dados.max };
    if (item) Object.assign(item, valores);
    else {
      item = Object.assign({ id: novoId('r', dados.nome), ativo: true, escopo: escopoDe(papel) }, valores);
      C.ROSH.push(item);
    }
    mudou();
    return item;
  }

  // Ativar e desativar marcas, essências e adicionais; o que está inativo some do tablet e do caixa
  function alternarAtivo(lista, id) {
    var item = C.porId(lista, id);
    item.ativo = item.ativo === false;
    mudou();
    return item;
  }

  // Editar uma promoção vale para os próximos pedidos; os pedidos já feitos guardam nome e desconto
  function salvarPromocao(dados, id) {
    var promo = id ? R.promocao(id) : null;
    var valores = {
      nome: dados.nome, dias: dados.dias.slice(), inicio: dados.inicio, fim: dados.fim, alcance: dados.alcance
    };
    if (!promo || promo.tipo === 'percentual') valores.modo = dados.modo || 'opcional';
    if (promo && promo.tipo === 'duplo') valores.validadeHoras = Number(dados.validadeHoras) || 3;
    if (!promo || promo.tipo === 'percentual') {
      valores.pct = dados.pct;
      valores.vale = dados.vale;
    }
    if (promo) Object.assign(promo, valores);
    else {
      promo = Object.assign({ id: novoId('p', dados.nome), tipo: 'percentual', nova: true }, valores);
      C.PROMOCOES.push(promo);
    }
    R.avisar({ tipo: 'promocao', promo: promo });
    return promo;
  }

  function pausarPromocao(id) {
    var promo = R.promocao(id);
    promo.pausada = !promo.pausada;
    R.avisar({ tipo: 'promocao', promo: promo });
  }

  function encerrarPromocao(id) {
    var promo = R.promocao(id);
    promo.encerrada = true;
    R.avisar({ tipo: 'promocao', promo: promo });
  }

  window.RoshCadastro = {
    salvarMarca: salvarMarca,
    salvarSabor: salvarSabor,
    salvarAdicional: salvarAdicional,
    salvarRosh: salvarRosh,
    alternarAtivo: alternarAtivo,
    ajustarUnidade: ajustarUnidade,
    salvarPromocao: salvarPromocao,
    pausarPromocao: pausarPromocao,
    encerrarPromocao: encerrarPromocao
  };
})();

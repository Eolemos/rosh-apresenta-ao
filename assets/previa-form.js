/* Prévia das telas: campos de formulário e diálogo de cadastro usados na configuração */
(function () {
  'use strict';

  var R = window.Rosh;
  var U = window.RoshUI;

  function texto(campo, rotulo, valor, dica) {
    return '<label class="ui-campo"><span>' + rotulo + '</span><input type="text" data-campo="' + campo + '" value="' + R.esc(valor || '') + '"' +
      (dica ? ' placeholder="' + R.esc(dica) + '"' : '') + '></label>';
  }

  function numero(campo, rotulo, valor, opcoes) {
    var o = opcoes || {};
    return '<label class="ui-campo' + (o.curto ? ' ui-campo--curto' : '') + '"><span>' + rotulo + '</span><input type="number" data-campo="' + campo + '" value="' + valor + '"' +
      (o.min !== undefined ? ' min="' + o.min + '"' : '') + (o.max !== undefined ? ' max="' + o.max + '"' : '') + (o.passo ? ' step="' + o.passo + '"' : '') + '></label>';
  }

  function dinheiro(campo, rotulo, centavos) {
    return numero(campo, rotulo + ' (R$)', (centavos / 100).toFixed(2), { min: 0, passo: '0.5', curto: true });
  }

  function selecao(campo, rotulo, opcoes, atual) {
    return '<label class="ui-campo"><span>' + rotulo + '</span><select data-campo="' + campo + '">' + opcoes.map(function (o) {
      return '<option value="' + R.esc(o[0]) + '"' + (o[0] === atual ? ' selected' : '') + '>' + R.esc(o[1]) + '</option>';
    }).join('') + '</select></label>';
  }

  // Grupo de pílulas: uma escolha (unico) ou várias
  function chips(campo, rotulo, opcoes, selecionados, unico) {
    return '<div class="ui-campo"><span>' + rotulo + '</span><div class="ui-chips" data-grupo="' + campo + '"' + (unico ? ' data-unico="1"' : '') + '>' +
      opcoes.map(function (o) {
        return '<button type="button" class="ui-filtro" data-acao="alternar" data-valor="' + R.esc(o[0]) + '" aria-pressed="' + (selecionados.indexOf(o[0]) !== -1) + '">' + R.esc(o[1]) + '</button>';
      }).join('') + '</div></div>';
  }

  function cores(campo, rotulo, lista, atual) {
    return '<div class="ui-campo"><span>' + rotulo + '</span><div class="ui-chips" data-grupo="' + campo + '" data-unico="1">' +
      lista.map(function (cor) {
        return '<button type="button" class="ui-cor" data-acao="alternar" data-valor="' + cor + '" aria-pressed="' + (cor === atual) + '" style="background:' + cor +
          '" aria-label="Cor ' + cor + '"></button>';
      }).join('') + '</div></div>';
  }

  function ler(raiz) {
    var dados = {};
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-campo]'), function (el) {
      dados[el.getAttribute('data-campo')] = el.type === 'number' ? (el.value === '' ? NaN : Number(el.value)) : el.value.trim();
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-grupo]'), function (grupo) {
      var marcados = Array.prototype.filter.call(grupo.querySelectorAll('[aria-pressed="true"]'), function () { return true; })
        .map(function (b) { return b.getAttribute('data-valor'); });
      dados[grupo.getAttribute('data-grupo')] = grupo.hasAttribute('data-unico') ? marcados[0] || '' : marcados;
    });
    return dados;
  }

  // Diálogo de cadastro: valida, salva e fecha; ações extras (desativar, encerrar) vão em cfg.aoAcao
  function modal(tela, cfg) {
    var html = '<h2 class="ui-modal__titulo">' + cfg.titulo + '</h2>' +
      (cfg.texto ? '<p class="ui-modal__texto">' + cfg.texto + '</p>' : '') +
      '<div class="ui-form ui-form--modal">' + cfg.campos + '</div>' +
      '<p class="ui-form__erro" role="alert" data-erro hidden></p>' +
      '<div class="ui-modal__acoes">' + (cfg.extra || '') +
      '<button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button>' +
      '<button type="button" class="ui-botao ui-botao--primario" data-acao="salvar">' + (cfg.salvar || 'Salvar') + '</button></div>';
    var aberto = U.abrirModal(tela, html, function (alvo, fechar, fundo) {
      var nome = alvo.getAttribute('data-acao');
      if (nome === 'alternar') {
        var grupo = alvo.closest('[data-grupo]');
        if (grupo.hasAttribute('data-unico')) {
          Array.prototype.forEach.call(grupo.querySelectorAll('[aria-pressed]'), function (b) { b.setAttribute('aria-pressed', 'false'); });
          alvo.setAttribute('aria-pressed', 'true');
        } else {
          alvo.setAttribute('aria-pressed', String(alvo.getAttribute('aria-pressed') !== 'true'));
        }
        if (cfg.aoMudar) cfg.aoMudar(ler(fundo), fundo);
        return;
      }
      if (nome === 'cancelar') return fechar();
      if (nome === 'salvar') {
        var erro = cfg.aoSalvar(ler(fundo));
        var campoErro = fundo.querySelector('[data-erro]');
        if (erro) {
          campoErro.textContent = erro;
          campoErro.hidden = false;
          return;
        }
        return fechar();
      }
      if (cfg.aoAcao) cfg.aoAcao(nome, alvo.getAttribute('data-valor'), fechar);
    });
    aberto.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--form');
    aberto.el.addEventListener('input', function () { aberto.el.querySelector('[data-erro]').hidden = true; });
    var primeiro = aberto.el.querySelector('input, select');
    if (primeiro) primeiro.focus({ preventScroll: true });
    return aberto;
  }

  window.RoshForm = { texto: texto, numero: numero, dinheiro: dinheiro, selecao: selecao, chips: chips, cores: cores, ler: ler, modal: modal };
})();

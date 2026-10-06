/* Prévia das telas: quem está usando cada aparelho (PIN, troca de usuário e modo treino) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;

  var PIN_TESTE = '1234';
  var LIMITE = 5;

  var aparelhos = {
    tablet: { operador: 'rafa', treino: false, erros: 0, bloqueadoAte: 0, usuarios: ['rafa', 'leo', 'duda'] },
    caixa: { operador: 'bia', treino: false, erros: 0, bloqueadoAte: 0, usuarios: ['bia', 'ana'] },
    cozinha: { operador: 'caio', treino: false, erros: 0, bloqueadoAte: 0, usuarios: ['caio', 'teo'] }
  };

  function operador(id) { return aparelhos[id].operador; }
  function emTreino(id) { return aparelhos[id].treino; }

  function nome(opId) {
    var op = C.OPERADORES[opId];
    return op.nome + ' (' + op.cargo + ')';
  }

  function teclado(pin) {
    return '<div class="ui-pin" aria-label="PIN com ' + pin.length + ' de 4 dígitos">' + [0, 1, 2, 3].map(function (i) {
      return '<span class="ui-pin__ponto' + (i < pin.length ? ' ui-pin__ponto--cheio' : '') + '"></span>';
    }).join('') + '</div><div class="ui-teclado">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'limpar', '0', 'apagar'].map(function (t) {
      return '<button type="button" class="ui-tecla' + (t.length > 1 ? ' ui-tecla--texto' : '') + '" data-acao="tecla" data-valor="' + t + '">' +
        (t === 'limpar' ? 'Limpar' : t === 'apagar' ? 'Apagar' : t) + '</button>';
    }).join('') + '</div>';
  }

  function digitar(pin, tecla) {
    if (tecla === 'limpar') return '';
    if (tecla === 'apagar') return pin.slice(0, -1);
    return pin.length < 4 ? pin + tecla : pin;
  }

  // Tela de bloqueio: escolhe a pessoa e digita o PIN; 5 erros bloqueiam por 5 minutos
  function trocarUsuario(tela, id, cfg) {
    var ap = aparelhos[id];
    var escolhido = null;
    var pin = '';
    var msg = '';
    function corpo() {
      if (ap.bloqueadoAte > R.agora()) {
        return '<h2 class="ui-modal__titulo">Bloqueado por 5 min</h2><p class="ui-bloqueio__texto">Foram 5 PINs errados seguidos. Chame o gerente para liberar o aparelho.</p>' +
          '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Fechar</button>' +
          '<button type="button" class="ui-botao ui-botao--primario" data-acao="liberar">Ana (gerente) libera agora</button></div>';
      }
      if (!escolhido) {
        return '<h2 class="ui-modal__titulo">Quem vai usar este aparelho?</h2><p class="ui-modal__texto">Cada venda fica no nome de quem entrou.</p>' +
          '<div class="ui-usuarios">' + ap.usuarios.map(function (u) {
            return '<button type="button" class="ui-usuario-botao" data-acao="usuario" data-valor="' + u + '" aria-pressed="' + (u === ap.operador) + '">' +
              '<span class="ui-usuario__avatar ui-usuario__avatar--grande" aria-hidden="true">' + C.OPERADORES[u].nome.charAt(0) + '</span>' + nome(u) + '</button>';
          }).join('') + '</div><div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button></div>';
      }
      return '<h2 class="ui-modal__titulo">PIN de ' + C.OPERADORES[escolhido].nome + '</h2>' +
        '<p class="ui-modal__texto">Na prévia, o PIN de todo mundo é 1234.</p>' + teclado(pin) +
        (msg ? '<p class="ui-form__erro" role="alert">' + msg + '</p>' : '') +
        '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="voltar">Voltar</button>' +
        '<button type="button" class="ui-botao ui-botao--primario" data-acao="entrar"' + (pin.length < 4 ? ' disabled' : '') + '>Entrar</button></div>';
    }
    var modal = U.abrirModal(tela, corpo(), function (alvo, fechar, fundo) {
      var acao = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor');
      if (acao === 'cancelar') return fechar();
      if (acao === 'liberar') {
        ap.bloqueadoAte = 0;
        ap.erros = 0;
        escolhido = null;
        pin = '';
        msg = '';
      }
      if (acao === 'usuario') {
        var erro = cfg && cfg.validar ? cfg.validar(valor) : '';
        if (erro) msg = erro;
        else {
          escolhido = valor;
          msg = '';
        }
      }
      if (acao === 'voltar') {
        escolhido = null;
        pin = '';
      }
      if (acao === 'tecla') pin = digitar(pin, valor);
      if (acao === 'entrar') {
        if (pin === PIN_TESTE) {
          ap.operador = escolhido;
          ap.erros = 0;
          fechar();
          R.avisar({ tipo: 'usuario', aparelho: id });
          U.aviso(tela, C.OPERADORES[escolhido].nome + ' entrou neste aparelho');
          return;
        }
        ap.erros += 1;
        pin = '';
        if (ap.erros >= LIMITE) ap.bloqueadoAte = R.agora() + 5 * 60000;
        else msg = 'PIN errado. Restam ' + (LIMITE - ap.erros) + (LIMITE - ap.erros === 1 ? ' tentativa' : ' tentativas') + ' antes de bloquear.';
      }
      var caixa = fundo.querySelector('.ui-modal__caixa');
      caixa.innerHTML = corpo();
      if (!escolhido && msg && acao === 'usuario') caixa.insertAdjacentHTML('beforeend', '<p class="ui-form__erro" role="alert">' + msg + '</p>');
    });
    modal.el.classList.add('ui-modal--bloqueio');
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--pin');
  }

  // PIN do gerente para ações sensíveis (modo treino)
  function pinGerente(tela, titulo, aoConfirmar) {
    var pin = '';
    var msg = '';
    function corpo() {
      return '<h2 class="ui-modal__titulo">' + titulo + '</h2><p class="ui-modal__texto">Peça ao gerente para digitar o PIN dele. Na prévia é 1234.</p>' +
        teclado(pin) + (msg ? '<p class="ui-form__erro" role="alert">' + msg + '</p>' : '') +
        '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button>' +
        '<button type="button" class="ui-botao ui-botao--primario" data-acao="ok"' + (pin.length < 4 ? ' disabled' : '') + '>Confirmar</button></div>';
    }
    var modal = U.abrirModal(tela, corpo(), function (alvo, fechar, fundo) {
      var acao = alvo.getAttribute('data-acao');
      if (acao === 'cancelar') return fechar();
      if (acao === 'tecla') pin = digitar(pin, alvo.getAttribute('data-valor'));
      if (acao === 'ok') {
        if (pin === PIN_TESTE) {
          fechar();
          return aoConfirmar();
        }
        pin = '';
        msg = 'PIN do gerente errado. Tente de novo.';
      }
      fundo.querySelector('.ui-modal__caixa').innerHTML = corpo();
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--pin');
  }

  function alternarTreino(tela, id) {
    var ap = aparelhos[id];
    pinGerente(tela, ap.treino ? 'Desligar o modo treino' : 'Ligar o modo treino', function () {
      ap.treino = !ap.treino;
      R.avisar({ tipo: 'treino', aparelho: id });
      U.aviso(tela, ap.treino ? 'Modo treino ligado: pedidos não contam no estoque, no caixa nem nos relatórios' : 'Modo treino desligado');
    });
  }

  // Menu da pessoa logada: trocar usuário, modo treino e dicas
  function menu(tela, id, cfg) {
    var ap = aparelhos[id];
    U.abrirModal(tela, '<h2 class="ui-modal__titulo">' + nome(ap.operador) + '</h2><div class="ui-menu-lista">' +
      '<button type="button" class="ui-botao" data-acao="trocar">Trocar usuário</button>' +
      (id === 'cozinha' ? '' : '<button type="button" class="ui-botao" data-acao="treino">' + (ap.treino ? 'Desligar modo treino' : 'Ligar modo treino (PIN do gerente)') + '</button>') +
      '<button type="button" class="ui-botao" data-acao="dicas">Ver dicas de novo</button></div>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="fechar">Fechar</button></div>', function (alvo, fechar) {
      var acao = alvo.getAttribute('data-acao');
      fechar();
      if (acao === 'trocar') trocarUsuario(tela, id, cfg);
      if (acao === 'treino') alternarTreino(tela, id);
      if (acao === 'dicas' && window.RoshDicas) window.RoshDicas.mostrar(id, true);
    });
  }

  function chipUsuario(id) {
    var op = C.OPERADORES[aparelhos[id].operador];
    return '<button type="button" class="ui-usuario ui-usuario--botao" data-acao="menu-usuario" data-foco="menu-usuario" aria-label="' + op.nome + ', abrir menu">' +
      '<span class="ui-usuario__avatar" aria-hidden="true">' + op.nome.charAt(0) + '</span>' + op.nome + ' (' + op.cargo + ')</button>';
  }

  // Faixa laranja "TREINO" na tela do aparelho
  function marcarTreino(tela, id) {
    var raiz = tela.querySelector('.ui');
    raiz.classList.toggle('ui--treino', emTreino(id));
    var faixa = raiz.querySelector('.ui-faixa-treino');
    if (emTreino(id) && !faixa) {
      raiz.insertAdjacentHTML('afterbegin', '<div class="ui-faixa-treino" role="status"><strong>TREINO</strong> Pedidos deste aparelho não contam no estoque, no caixa nem nos relatórios.</div>');
    }
    if (!emTreino(id) && faixa) faixa.remove();
  }

  window.RoshAcesso = {
    aparelhos: aparelhos,
    operador: operador,
    emTreino: emTreino,
    trocarUsuario: trocarUsuario,
    pinGerente: pinGerente,
    menu: menu,
    chipUsuario: chipUsuario,
    marcarTreino: marcarTreino
  };
})();

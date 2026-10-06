/* Prévia das telas: gaveta de estoque da cozinha (abrir pacote e marcar em falta) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var E = window.RoshEstoque;
  var A = window.RoshAcesso;

  var STATUS = { ok: 'Ok', baixo: 'Estoque baixo', falta: 'Em falta' };

  // Marcar em falta com pacote fechado no estoque: primeiro oferece abrir um pacote
  function confirmarFalta(tela, id, depois) {
    var s = R.sabor(id);
    U.abrirModal(tela, '<h2 class="ui-modal__titulo">Ainda há ' + E.pacotes(s.estoque) + ' de ' + R.esc(s.nome) + '</h2>' +
      '<p class="ui-modal__texto">Se o pacote aberto acabou, abra um pacote fechado em vez de marcar em falta. Assim o sabor continua no cardápio.</p>' +
      '<div class="ui-menu-lista"><button type="button" class="ui-botao ui-botao--primario" data-acao="abrir">Abrir um pacote</button>' +
      '<button type="button" class="ui-botao ui-botao--perigo" data-acao="falta">Marcar em falta mesmo assim</button></div>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button></div>', function (alvo, fechar) {
      var nome = alvo.getAttribute('data-acao');
      fechar();
      if (nome === 'abrir') {
        E.abrirPacote(id, A.operador('cozinha'));
        U.aviso(tela, 'Pacote de ' + s.nome + ' aberto. Restam ' + E.pacotes(s.estoque) + ' fechados');
      }
      if (nome === 'falta') E.alternarFalta(id, A.operador('cozinha'));
      if (depois) depois();
    });
  }

  function abrir(tela) {
    var busca = '';
    var filtro = '';
    function corpo() {
      var ordem = { falta: 0, baixo: 1, ok: 2 };
      var lista = C.SABORES.filter(C.saborVisivel).filter(function (s) {
        return C.busca(s, busca) && (!filtro || E.status(s) === filtro);
      }).sort(function (a, b) { return ordem[E.status(a)] - ordem[E.status(b)]; });
      return '<header class="ui-gaveta__topo"><h2 class="ui-modal__titulo">Estoque de essências</h2>' +
        '<button type="button" class="ui-icone ui-icone--grande" data-acao="fechar" aria-label="Fechar estoque">' + U.ICONES.fechar + '</button></header>' +
        '<p class="ui-modal__texto">Quando o pacote aberto acabar, toque em Abrir pacote. Só marque em falta quando não houver pacote fechado.</p>' +
        '<label class="ui-busca">' + U.ICONES.busca + '<span class="ui-oculto">Buscar essência</span><input type="search" data-entrada="busca-estoque" data-foco="busca-estoque" ' +
        'autocomplete="off" placeholder="Buscar essência ou marca" value="' + R.esc(busca) + '"></label>' +
        '<div class="ui-linha" role="group" aria-label="Filtro">' + [['', 'Todas'], ['baixo', 'Estoque baixo'], ['falta', 'Em falta']].map(function (f) {
          return '<button type="button" class="ui-filtro" data-acao="filtro" data-valor="' + f[0] + '" data-foco="filtro-' + (f[0] || 'todas') + '" aria-pressed="' + (filtro === f[0]) + '">' + f[1] + '</button>';
        }).join('') + '</div>' +
        '<ul class="ui-est">' + (lista.length ? lista.map(function (s) {
          var st = E.status(s);
          return '<li class="ui-est__linha"><div class="ui-est__info"><p class="ui-est__nome">' + R.esc(C.rotuloSabor(s)) + '</p>' +
            '<p class="ui-est__qtd">' + E.pacotes(s.estoque) + ' fechados <span class="ui-estoque-chip ui-estoque-chip--' + st + '">' + STATUS[st] + '</span></p></div>' +
            '<button type="button" class="ui-botao ui-botao--pequeno ui-botao--brasa" data-acao="abrir" data-valor="' + s.id + '" data-foco="abrir-' + s.id + '"' +
            (s.estoque ? '' : ' disabled') + '>' + (s.estoque ? 'Abrir pacote' : 'Sem pacote') + '</button>' +
            '<button type="button" class="ui-botao ui-botao--pequeno" data-acao="falta" data-valor="' + s.id + '" data-foco="falta-' + s.id + '" aria-pressed="' + s.emFalta + '">' +
            (s.emFalta ? 'Chegou de novo' : 'Em falta') + '</button></li>';
        }).join('') : '<li class="ui-vazio">Nenhuma essência com esse nome. Confira a grafia ou limpe a busca.</li>') + '</ul>';
    }
    var caixa;
    function redesenhar() { if (document.contains(caixa)) U.desenhar(caixa, corpo()); }
    var modal = U.abrirModal(tela, corpo(), function (alvo, fechar) {
      var nome = alvo.getAttribute('data-acao');
      var id = alvo.getAttribute('data-valor');
      if (nome === 'fechar') return fechar();
      if (nome === 'filtro') filtro = id;
      if (nome === 'abrir') {
        E.abrirPacote(id, A.operador('cozinha'));
        U.aviso(tela, 'Pacote de ' + R.sabor(id).nome + ' aberto. Restam ' + E.pacotes(R.sabor(id).estoque) + ' fechados');
      }
      if (nome === 'falta') {
        var s = R.sabor(id);
        if (!s.emFalta && s.estoque > 0) return confirmarFalta(tela, id, redesenhar);
        E.alternarFalta(id, A.operador('cozinha'));
      }
      redesenhar();
    });
    modal.el.classList.add('ui-modal--gaveta');
    caixa = modal.el.querySelector('.ui-modal__caixa');
    caixa.classList.add('ui-gaveta');
    modal.el.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('data-entrada') !== 'busca-estoque') return;
      busca = ev.target.value;
      redesenhar();
    });
    R.ao(function (ev) {
      if (ev.tipo === 'cardapio' || ev.tipo === 'estoque') redesenhar();
    });
  }

  window.RoshCozinhaEstoque = { abrir: abrir, confirmarFalta: confirmarFalta };
})();

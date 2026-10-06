/* Prévia das telas: configuração da unidade (moldura, abas e sino de avisos) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var A = window.RoshAvisos;

  var ABAS = [
    { id: 'marcas', nome: 'Marcas e essências', modulo: 'RoshCfgCardapio' },
    { id: 'estoque', nome: 'Estoque', modulo: 'RoshCfgEstoque' },
    { id: 'precos', nome: 'Adicionais e preços', modulo: 'RoshCfgPrecos' },
    { id: 'promocoes', nome: 'Promoções', modulo: 'RoshCfgPromos' }
  ];

  function montarConfig(tela) {
    tela.innerHTML = '<div class="ui ui--gestao">' + window.RoshGestao.menu('Configuração') + '<main class="ui-gestao ui-config" data-parte="config"></main></div>';
    var area = tela.querySelector('[data-parte="config"]');

    // Estado compartilhado pelas seções da configuração
    var ctx = {
      tela: tela,
      aba: 'marcas',
      marcaId: 'zomo',
      filtroEstoque: '',
      promoEditando: null,
      rascunho: null,
      erro: '',
      papel: 'master',
      desenhar: desenhar
    };

    function modulo() {
      return window[C.porId(ABAS, ctx.aba).modulo];
    }

    function desenhar() {
      var gerente = ctx.papel === 'gerente';
      U.desenhar(area, '<header class="ui-gestao__topo"><div><h2 class="ui-gestao__titulo">Configuração</h2>' +
        '<p class="ui-gestao__data">' + C.UNIDADES.u1 + (gerente ? ', vendo como Ana (gerente): mudanças valem só nesta loja' : ', vendo como Marcos (master): mudanças valem para a rede') + '</p></div>' +
        '<div class="ui-gestao__acoes"><div class="ui-segmento ui-segmento--papel" role="group" aria-label="Ver como" data-parte="papel">' +
        [['gerente', 'Gerente'], ['master', 'Master']].map(function (p) {
          return '<button type="button" data-acao="papel" data-valor="' + p[0] + '" data-foco="papel-' + p[0] + '" aria-pressed="' + (ctx.papel === p[0]) + '">' + p[1] + '</button>';
        }).join('') + '</div><button type="button" class="ui-ajuda-botao" data-acao="dicas" aria-label="Ver dicas desta tela">?</button>' + A.sino() + '</div></header>' +
        '<div class="ui-segmento ui-segmento--abas" role="group" aria-label="Seção">' + ABAS.map(function (a) {
          return '<button type="button" data-acao="aba" data-valor="' + a.id + '" data-foco="aba-' + a.id + '" aria-pressed="' + (ctx.aba === a.id) + '">' + a.nome + '</button>';
        }).join('') + '</div>' + modulo().html(ctx));
    }

    area.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo || alvo.disabled) return;
      var nome = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor');
      if (nome === 'aba') {
        ctx.aba = valor;
        ctx.erro = '';
        return desenhar();
      }
      if (nome === 'avisos') return A.abrir(tela);
      if (nome === 'dicas' && window.RoshDicas) return window.RoshDicas.mostrar('config', true);
      if (nome === 'papel') {
        ctx.papel = valor;
        ctx.promoEditando = null;
        ctx.rascunho = null;
        ctx.erro = '';
        U.aviso(tela, valor === 'gerente' ? 'Vendo como gerente: o que vale para a rede fica travado' : 'Vendo como master: pode mudar a rede inteira');
        return desenhar();
      }
      if (modulo().acao(nome, valor, alvo, ctx)) desenhar();
    });

    function lerCampo(ev) {
      if (modulo().digitar) modulo().digitar(ev.target, ctx);
    }
    area.addEventListener('input', lerCampo);
    area.addEventListener('change', lerCampo);

    tela.querySelector('.ui-menu').addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao="menu"]');
      if (alvo) R.avisar({ tipo: 'navegar', vista: alvo.getAttribute('data-valor') });
    });

    R.ao(function (ev) {
      if (ev.tipo === 'navegar' && ev.secao) ctx.aba = ev.secao;
      desenhar();
    });
    desenhar();
  }

  window.RoshConfig = { montar: montarConfig };
})();

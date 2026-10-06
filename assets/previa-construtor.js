/* Prévia das telas: montagem do pedido em passos, com um ou mais narguilés (tablet do garçom e caixa) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var E = window.RoshEssencias;
  var M = window.RoshMesas;
  var A = window.RoshAcesso;
  var ME = window.RoshMesaEscolha;

  var PASSOS = ['Mesa e rosh', 'Essências', 'Adicionais', 'Conta e pagamento'];

  function novoItem() {
    return { roshId: null, sabores: [], adicionais: {}, gelo: false };
  }

  function novo() {
    return { mesa: null, itens: [novoItem()], atual: 0, promoId: null, semAutomatica: false, avulsoPct: 0,
      pagamento: null, recebido: 0, segundo: false, creditoId: null };
  }

  function Construtor(raiz, cfg) {
    var sel = novo();
    var ui = { passo: 1, modo: 'marcas', marcaId: null, categoria: null, busca: '', buscaMesa: '', focarBusca: false };
    var ctx = { cfg: cfg, ui: ui, desenhar: desenhar, reiniciar: reiniciar };
    Object.defineProperty(ctx, 'sel', { get: function () { return sel; } });

    function item() { return sel.itens[sel.atual]; }

    function itensProntos() {
      return sel.itens.filter(function (i) { return i.roshId && i.sabores.length; });
    }

    function resumoPasso(n) {
      var it = item();
      if (n === 1) return sel.mesa ? R.nomeMesa(sel.mesa) + (it.roshId ? ', ' + R.rosh(it.roshId).nome : '') : 'A escolher';
      if (n === 2) return it.roshId ? it.sabores.length + ' de ' + R.rosh(it.roshId).max : 'A escolher';
      if (n === 3) return U.rotuloAdicionais(it.adicionais) || (it.gelo ? 'Gelo no vaso' : 'Nenhum');
      var n2 = itensProntos().length;
      return n2 + (n2 === 1 ? ' narguilé' : ' narguilés') + (sel.pagamento ? ', ' + R.pagamento(sel.pagamento).nome : '');
    }

    function completo(n) {
      var it = item();
      if (n === 1) return Boolean(sel.mesa && it.roshId);
      if (n === 2) return it.sabores.length > 0;
      if (n === 3) return it.gelo || Object.keys(it.adicionais).some(function (k) { return it.adicionais[k]; });
      return Boolean(sel.pagamento);
    }

    function htmlPassos() {
      return '<nav class="ui-passos" aria-label="Passos do pedido">' + PASSOS.map(function (nome, i) {
        var n = i + 1;
        var feito = completo(n) && n !== ui.passo;
        return '<button type="button" class="ui-passo' + (feito ? ' ui-passo--feito' : '') + '" data-acao="passo" data-valor="' + n + '" data-foco="passo-' + n + '"' +
          (ui.passo === n ? ' aria-current="step"' : '') + '><span class="ui-passo__numero">' + (feito ? U.ICONES.check : n) + '</span>' +
          '<span class="ui-passo__texto"><span class="ui-passo__nome">' + nome + '</span><span class="ui-passo__resumo">' + R.esc(resumoPasso(n)) + '</span></span></button>';
      }).join('') + '</nav>';
    }

    function htmlMesaERosh() {
      var it = item();
      var aviso = '';
      if (sel.segundo) {
        var c = C.porId(M.creditos, sel.creditoId);
        aviso = '<div class="ui-faixa ui-faixa--vidro">' + U.ICONES.presente + '<p><strong>2º rosh da promoção rosh duplo</strong> (pedido 0' + c.origem + ' de ' +
          R.hora(c.criadoEm) + ', ' + C.OPERADORES[c.vendedorId].nome + '). Mesa e tipo ficam fixos; só os adicionais são cobrados. Vale até ' + R.hora(c.validoAte) + '.</p>' +
          '<button type="button" class="ui-link" data-acao="cancelar-segundo" data-foco="cancelar-segundo">Cancelar 2º rosh</button></div>';
      } else if (sel.itens.length > 1) {
        aviso = '<div class="ui-faixa ui-faixa--latao"><p>Montando o <strong>narguilé ' + (sel.atual + 1) + ' de ' + sel.itens.length + '</strong> deste pedido. A mesa vale para todos.</p></div>';
      }
      return aviso + '<div class="ui-passo1">' + ME.html(sel, ui, cfg) + '<section class="ui-secao"><h3 class="ui-rotulo">Tipo de rosh' + (sel.itens.length > 1 ? ' do narguilé ' + (sel.atual + 1) : '') + '</h3><div class="ui-pilha">' +
        C.ativos(C.ROSH).map(function (r) {
          return '<button type="button" class="ui-opcao ui-opcao--rosh" data-acao="rosh" data-valor="' + r.id + '" data-foco="rosh-' + r.id +
            '" aria-pressed="' + (it.roshId === r.id) + '"' + (sel.segundo ? ' disabled' : '') + '><span class="ui-opcao__nome">' + R.esc(r.nome) + '</span>' +
            '<span class="ui-opcao__detalhe">' + (r.max === 1 ? '1 sabor' : 'até ' + r.max + ' sabores') + '</span>' +
            '<span class="ui-opcao__preco">' + (sel.segundo && it.roshId === r.id ? 'R$ 0,00' : R.reais(C.preco(r))) + '</span></button>';
        }).join('') + '</div><p class="ui-ajuda">Essências premium somam um acréscimo; numa mistura de marcas vale o maior.</p></section></div>';
    }

    function htmlAdicionais() {
      var it = item();
      return '<div class="ui-passo3">' + C.ativos(C.ADICIONAIS).map(function (a) {
        return '<div class="ui-adicional"><div><p class="ui-adicional__nome">' + R.esc(a.nome) + '</p><p class="ui-adicional__preco">' + R.reais(C.preco(a)) + ' cada</p></div>' +
          U.contador(a.id, it.adicionais[a.id] || 0, a.nome) + '</div>';
      }).join('') +
        '<div class="ui-adicional"><div><p class="ui-adicional__nome">' + C.OBS_GELO + '</p><p class="ui-adicional__preco">Grátis, vai como observação na comanda</p></div>' +
        '<button type="button" class="ui-alternar" data-acao="gelo" data-foco="gelo" aria-pressed="' + it.gelo + '"><span class="ui-alternar__trilho" aria-hidden="true"></span>' +
        (it.gelo ? 'Com gelo' : 'Sem gelo') + '</button></div></div>';
    }

    function desenhar() {
      var P = window.RoshPagamento;
      var conteudo = [htmlMesaERosh, function () { return E.html(item(), ui); }, htmlAdicionais, function () { return P.html(ctx); }][ui.passo - 1]();
      U.desenhar(raiz, '<div class="ui-construtor">' + htmlPassos() + '<div class="ui-passo-conteudo">' + conteudo + '</div>' + P.rodape(ctx) + '</div>');
      if (ui.focarBusca) {
        ui.focarBusca = false;
        var campo = raiz.querySelector('[data-entrada="busca"]');
        if (campo) campo.focus({ preventScroll: true });
      }
    }

    function reiniciar() {
      sel = novo();
      ui.passo = 1;
      ui.modo = 'marcas';
      ui.busca = '';
      ui.categoria = null;
      desenhar();
    }

    function escolherMesa(id) {
      sel.mesa = id;
      ui.buscaMesa = '';
      if (id === 'Balcão' && sel.promoId === 'duplo') sel.promoId = null;
      if (id && item().roshId && sel.itens.length === 1) ui.passo = 2;
    }

    // Passa para o narguilé seguinte ou volta para editar um da lista
    function irParaItem(i, passo) {
      sel.atual = i;
      ui.passo = passo;
      ui.modo = 'marcas';
      ui.busca = '';
    }

    raiz.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo || alvo.disabled) return;
      var nome = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor');
      var it = item();
      if (E.acao(it, ui, nome, valor)) return desenhar();
      if (window.RoshPagamento.acao(ctx, nome, valor, alvo)) return;
      switch (nome) {
        case 'passo': ui.passo = Number(valor); break;
        case 'continuar': ui.passo = Math.min(4, ui.passo + 1); break;
        case 'mesa': escolherMesa(sel.mesa === valor ? null : valor); break;
        case 'mesa-fixa': escolherMesa(M.abrirFixa(valor, A.operador(cfg.aparelho)).id); break;
        case 'nova-mesa':
          ME.nova(cfg.tela, A.operador(cfg.aparelho), function (m) {
            escolherMesa(m.id);
            desenhar();
          });
          return;
        case 'rosh':
          it.roshId = valor;
          it.sabores = it.sabores.slice(0, R.rosh(valor).max);
          if (sel.mesa) ui.passo = 2;
          break;
        case 'menos': it.adicionais[valor] = Math.max(0, (it.adicionais[valor] || 0) - 1); break;
        case 'mais': it.adicionais[valor] = Math.min(9, (it.adicionais[valor] || 0) + 1); break;
        case 'gelo': it.gelo = !it.gelo; break;
        case 'outro-narguile':
          sel.itens.push(novoItem());
          if (sel.promoId === 'duplo') sel.promoId = null;
          irParaItem(sel.itens.length - 1, 1);
          break;
        case 'editar-item': irParaItem(Number(valor), 2); break;
        case 'remover-item':
          sel.itens.splice(Number(valor), 1);
          if (!sel.itens.length) sel.itens.push(novoItem());
          sel.atual = Math.min(sel.atual, sel.itens.length - 1);
          break;
        case 'cancelar-segundo': sel = novo(); ui.passo = 1; break;
        default: return;
      }
      desenhar();
    });

    raiz.addEventListener('input', function (ev) {
      var campo = ev.target.getAttribute('data-entrada');
      if (campo === 'busca') {
        E.digitar(ui, ev.target.value);
        desenhar();
      }
      if (campo === 'busca-mesa') {
        ui.buscaMesa = ev.target.value;
        desenhar();
      }
      if (campo === 'recebido') {
        sel.recebido = Math.round((parseFloat(ev.target.value.replace(',', '.')) || 0) * 100);
        window.RoshPagamento.atualizarTroco(ctx, raiz);
      }
    });

    R.ao(function () {
      // O que saiu do cardápio ou ficou em falta sai do pedido em montagem
      sel.itens.forEach(function (i) {
        i.sabores = i.sabores.filter(function (id) { var s = R.sabor(id); return C.saborVisivel(s) && !s.emFalta; });
        if (i.roshId && R.rosh(i.roshId).max < i.sabores.length) i.sabores = i.sabores.slice(0, R.rosh(i.roshId).max);
      });
      if (sel.promoId && !C.promoAtiva(R.promocao(sel.promoId), R.agora())) sel.promoId = null;
      if (sel.creditoId && !M.creditoDaMesa(sel.mesa)) sel = novo();
      // Mesa liberada por outra pessoa sai do pedido em montagem
      if (sel.mesa && sel.mesa !== 'Balcão' && R.mesa(sel.mesa).fechadaEm) sel.mesa = null;
      desenhar();
    });

    desenhar();

    return {
      desenhar: desenhar,
      iniciarSegundo: function (credito) {
        sel = novo();
        sel.mesa = credito.mesa;
        sel.itens[0].roshId = credito.roshId;
        sel.segundo = true;
        sel.creditoId = credito.id;
        ui.passo = 2;
        ui.modo = 'marcas';
        ui.busca = '';
        desenhar();
      },
      operador: function () { return A.operador(cfg.aparelho); }
    };
  }

  window.RoshConstrutor = Construtor;
})();

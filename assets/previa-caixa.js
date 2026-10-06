/* Prévia das telas: tela do caixa (pedido no balcão, fundo de troco, retiradas e fechamento conferido) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var N = window.RoshNumeros;
  var U = window.RoshUI;
  var A = window.RoshAcesso;

  var MOTIVOS_RETIRADA = ['Depósito no cofre', 'Pagamento de fornecedor', 'Troco para outro caixa', 'Outro motivo'];

  function centavos(texto) {
    return Math.round((parseFloat(String(texto).replace(/\./g, '').replace(',', '.')) || 0) * 100);
  }

  function montarCaixa(tela) {
    tela.innerHTML = '<div class="ui"><div data-parte="barra"></div>' +
      '<div class="ui-corpo"><div data-parte="construtor"></div><aside class="ui-lateral" data-parte="turno" aria-label="Turno"></aside></div></div>';

    var barraEl = tela.querySelector('[data-parte="barra"]');
    var painel = tela.querySelector('[data-parte="turno"]');
    var cfgAcesso = {
      validar: function (id) {
        var dono = A.operador('caixa');
        return N.turnos[dono] && N.turnos[dono].estado === 'aberto' && id !== dono
          ? 'O turno do caixa está aberto no nome de ' + C.OPERADORES[dono].nome + '. Feche o turno antes de trocar de usuário.' : '';
      }
    };
    window.RoshConstrutor(tela.querySelector('[data-parte="construtor"]'), { modo: 'caixa', aparelho: 'caixa', tela: tela });
    window.RoshTablet.ligarBarra(tela, barraEl, 'caixa', cfgAcesso);

    function op() { return A.operador('caixa'); }

    function linhaForma(pg, fm) {
      return '<div class="ui-forma"><span class="ui-forma__icone">' + U.ICONES[pg.id] + '</span><span class="ui-forma__nome">' + pg.nome + '</span>' +
        '<span class="ui-forma__qtd">' + fm.n + ' pedidos</span><span class="ui-forma__valor">' + R.reais(fm.bruto - fm.desc) + '</span></div>';
    }

    function desenharPainel() {
      var turno = N.turnos[op()] || { estado: 'sem' };
      U.desenhar(barraEl, window.RoshTablet.barra('Caixa', 'caixa',
        '<button type="button" class="ui-botao ui-botao--pequeno" data-acao="mesas" data-foco="mesas">' + window.RoshTablet.ICONE_MESAS + 'Mesas</button>' +
        '<span class="ui-chip">' + R.rotuloDia() + '</span>' +
        '<span class="ui-chip' + (turno.estado === 'aberto' ? ' ui-chip--aberto' : '') + '">' + (turno.estado === 'aberto' ? 'Turno aberto' : 'Turno fechado') + '</span>'));
      A.marcarTreino(tela, 'caixa');
      var nome = C.OPERADORES[op()].nome;

      if (turno.estado !== 'aberto') {
        U.desenhar(painel, '<h2 class="ui-lateral__titulo">Turno de ' + nome + '</h2>' +
          '<div class="ui-fechado"><p class="ui-fechado__titulo">' + (turno.fechadoEm ? 'Turno fechado às ' + R.hora(turno.fechadoEm) : 'Nenhum turno aberto') + '</p>' +
          '<p class="ui-fechado__texto">' + (turno.estado === 'conferido' ? 'Conferido por ' + turno.conferidoPor + ' (gerente).' : turno.fechadoEm ? 'Aguardando a conferência do gerente.' : 'Abra o turno com o fundo de troco.') + '</p></div>' +
          '<button type="button" class="ui-botao ui-botao--primario" data-acao="abrir" data-foco="abrir">Abrir turno</button>');
        return;
      }
      var resumo = N.vendasDoTurno(op());
      var total = N.totais(resumo);
      var gaveta = N.dinheiroEsperado(op());
      var ultimos = R.pedidos.filter(function (p) { return p.vendedorId === op() && p.estado !== 'desfeito'; }).slice(-3).reverse();
      U.desenhar(painel, '<h2 class="ui-lateral__titulo">Turno de ' + nome + '</h2><p class="ui-lateral__sub">' + R.esc(turno.horario) + '</p>' +
        '<div class="ui-formas">' + C.PAGAMENTOS.map(function (pg) { return linhaForma(pg, resumo.formas[pg.id]); }).join('') + '</div>' +
        '<div class="ui-forma ui-forma--total"><span class="ui-forma__nome">Líquido</span><span class="ui-forma__qtd">' + total.n + ' pedidos</span>' +
        '<span class="ui-forma__valor">' + R.reais(total.liq) + '</span></div>' +
        '<div class="ui-gaveta-resumo"><p>Dinheiro na gaveta, esperado</p><strong>' + R.reais(gaveta.esperado) + '</strong>' +
        '<span>Fundo ' + R.reais(gaveta.fundo) + ', retiradas ' + R.reais(gaveta.retiradas) + '</span></div>' +
        '<div class="ui-linha"><button type="button" class="ui-botao ui-botao--pequeno" data-acao="sangria" data-foco="sangria">Retirada (sangria)</button>' +
        '<button type="button" class="ui-botao ui-botao--pequeno" data-acao="fechar" data-foco="fechar">Fechar turno</button></div>' +
        (ultimos.length ? '<h2 class="ui-lateral__titulo">Últimos pedidos</h2><ul class="ui-pedidos">' + ultimos.map(function (p) {
          return '<li class="ui-pedidos__item"><div class="ui-pedidos__texto"><p class="ui-pedidos__mesa">' + R.esc(R.nomeMesa(p.mesa)) + ' <span class="ui-pedidos__num">0' + p.numero + '</span></p>' +
            window.RoshPosVenda.situacao(p) + '</div><button type="button" class="ui-botao ui-botao--mini" data-acao="acoes" data-id="' + p.id + '">Ações</button></li>';
        }).join('') + '</ul>' : ''));
    }

    function abrirTurno() {
      window.RoshForm.modal(tela, {
        titulo: 'Abrir turno de ' + C.OPERADORES[op()].nome, salvar: 'Abrir turno',
        texto: 'Conte o dinheiro que fica na gaveta para dar troco. Ele entra no esperado do fechamento.',
        campos: window.RoshForm.numero('fundo', 'Fundo de troco (R$)', '150.00', { min: 0, passo: '0.5', curto: true }),
        aoSalvar: function (d) {
          if (!(d.fundo >= 0)) return 'Digite o valor do fundo de troco. Pode ser zero.';
          N.abrirTurno(op(), Math.round(d.fundo * 100));
          U.aviso(tela, 'Turno aberto com ' + R.reais(Math.round(d.fundo * 100)) + ' de fundo de troco');
        }
      });
    }

    function retirada() {
      var F = window.RoshForm;
      F.modal(tela, {
        titulo: 'Retirada de dinheiro (sangria)', salvar: 'Registrar retirada',
        texto: 'O valor sai do esperado na gaveta e fica registrado com o motivo.',
        campos: F.numero('valor', 'Valor retirado (R$)', '', { min: 1, passo: '0.5', curto: true }) +
          F.selecao('motivo', 'Motivo', MOTIVOS_RETIRADA.map(function (m) { return [m, m]; }), MOTIVOS_RETIRADA[0]),
        aoSalvar: function (d) {
          var gaveta = N.dinheiroEsperado(op()).esperado;
          if (!(d.valor > 0)) return 'Digite quanto dinheiro foi retirado.';
          if (Math.round(d.valor * 100) > gaveta) return 'A gaveta deveria ter só ' + R.reais(gaveta) + '. Confira o valor.';
          N.sangria(op(), Math.round(d.valor * 100), d.motivo, op());
          U.aviso(tela, 'Retirada de ' + R.reais(Math.round(d.valor * 100)) + ' registrada');
        }
      });
    }

    function fechamento() {
      var contadoTexto = '';
      function corpo() {
        var resumo = N.vendasDoTurno(op());
        var total = N.totais(resumo);
        var g = N.dinheiroEsperado(op());
        var contado = centavos(contadoTexto);
        var dif = contado - g.esperado;
        return '<h2 class="ui-modal__titulo">Fechar o turno de ' + C.OPERADORES[op()].nome + '</h2>' +
          '<p class="ui-modal__texto">Conte o dinheiro da gaveta. O fechamento é impresso e vai para a conferência do gerente.</p><div class="ui-fechamento"><div>' +
          '<table class="ui-tabela"><thead><tr><th scope="col">Forma</th><th scope="col">Pedidos</th><th scope="col">Bruto</th><th scope="col">Descontos</th><th scope="col">Líquido</th></tr></thead><tbody>' +
          C.PAGAMENTOS.map(function (pg) {
            var fm = resumo.formas[pg.id];
            return '<tr><th scope="row">' + pg.nome + '</th><td>' + fm.n + '</td><td>' + R.reais(fm.bruto) + '</td><td>' + (fm.desc ? '−' : '') + R.reais(fm.desc) + '</td><td>' + R.reais(fm.bruto - fm.desc) + '</td></tr>';
          }).join('') + '</tbody><tfoot><tr><th scope="row">Total</th><td>' + total.n + '</td><td>' + R.reais(total.bruto) + '</td><td>' + (total.desc ? '−' : '') + R.reais(total.desc) +
          '</td><td>' + R.reais(total.liq) + '</td></tr></tfoot></table>' +
          '<ul class="ui-miudos"><li><span>Carvões extra vendidos</span><strong>' + resumo.carvoes + '</strong></li>' +
          '<li><span>Pedidos com promoção ou desconto</span><strong>' + resumo.comPromo + '</strong></li>' +
          '<li><span>Cancelados com estorno</span><strong>' + resumo.estornos.n + (resumo.estornos.n ? ', ' + R.reais(resumo.estornos.valor) : '') + '</strong></li></ul></div>' +
          '<div class="ui-gaveta-dinheiro"><h3 class="ui-rotulo">Dinheiro na gaveta</h3><ul class="ui-miudos"><li><span>Fundo de troco</span><strong>' + R.reais(g.fundo) + '</strong></li>' +
          '<li><span>Vendas em dinheiro</span><strong>' + R.reais(g.vendas) + '</strong></li><li><span>Retiradas</span><strong>−' + R.reais(g.retiradas) + '</strong></li>' +
          '<li class="ui-miudos__total"><span>Esperado</span><strong>' + R.reais(g.esperado) + '</strong></li></ul>' +
          '<label class="ui-campo"><span>Contado na gaveta (R$)</span><input type="text" inputmode="decimal" data-entrada="contado" data-foco="contado" value="' + R.esc(contadoTexto) + '" placeholder="Ex.: 431,00"></label>' +
          '<p class="ui-diferenca' + (contadoTexto && dif !== 0 ? ' ui-diferenca--alerta' : '') + '">' + (!contadoTexto ? 'Digite o valor contado para ver a diferença.' :
            dif === 0 ? 'Bateu: sem diferença.' : 'Diferença: ' + (dif > 0 ? 'sobra de ' : 'falta de ') + R.reais(Math.abs(dif)) + '. Ela vai para o gerente conferir.') + '</p></div></div>' +
          '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button>' +
          '<button type="button" class="ui-botao ui-botao--primario" data-acao="confirmar"' + (contadoTexto ? '' : ' disabled') + '>Fechar e imprimir</button></div>';
      }
      var modal = U.abrirModal(tela, corpo(), function (botao, fechar) {
        if (botao.getAttribute('data-acao') === 'confirmar') {
          N.fecharTurno(op(), centavos(contadoTexto));
          U.aviso(tela, 'Turno fechado e impresso. O gerente recebeu o aviso para conferir');
        }
        fechar();
      });
      modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--fechamento');
      modal.el.addEventListener('input', function (ev) {
        if (ev.target.getAttribute('data-entrada') !== 'contado') return;
        contadoTexto = ev.target.value;
        U.desenhar(modal.el.querySelector('.ui-modal__caixa'), corpo());
      });
    }

    painel.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      var acao = alvo.getAttribute('data-acao');
      if (acao === 'abrir') abrirTurno();
      if (acao === 'sangria') retirada();
      if (acao === 'fechar') fechamento();
      if (acao === 'acoes') window.RoshPosVenda.abrir(tela, C.porId(R.pedidos, alvo.getAttribute('data-id')), op());
    });

    R.ao(desenharPainel);
    desenharPainel();
  }

  window.RoshCaixa = { montar: montarCaixa };
})();

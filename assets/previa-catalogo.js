/* Prévia das telas: cardápio de exemplo (rosh, marcas, essências, adicionais, promoções) */
(function () {
  'use strict';

  var ROSH = [
    { id: 'simples', nome: 'Rosh simples', max: 1, preco: 4500, ativo: true },
    { id: 'mix', nome: 'Rosh mix', max: 2, preco: 6000, ativo: true },
    { id: 'grande', nome: 'Rosh grande', max: 3, preco: 7500, ativo: true }
  ];

  // Nomes de marca escritos sobre um bloco de cor; nada de logotipos
  var MARCAS = [
    { id: 'zomo', nome: 'Zomo', cor: '#1f7a5c', texto: '#ffffff', tier: 'tradicional', sobretaxa: 0, ativo: true },
    { id: 'ziggy', nome: 'Ziggy', cor: '#e2a33b', texto: '#2a1a05', tier: 'tradicional', sobretaxa: 0, ativo: true },
    { id: 'nay', nome: 'Nay', cor: '#6c55c9', texto: '#ffffff', tier: 'tradicional', sobretaxa: 0, ativo: true },
    { id: 'onix', nome: 'Onix', cor: '#3b3842', texto: '#ffffff', tier: 'tradicional', sobretaxa: 0, ativo: true },
    { id: 'adalya', nome: 'Adalya', cor: '#b8334a', texto: '#ffffff', tier: 'premium', sobretaxa: 1000, ativo: true },
    { id: 'smyrna', nome: 'Smyrna', cor: '#2f6fb3', texto: '#ffffff', tier: 'premium', sobretaxa: 500, ativo: true }
  ];

  var CATEGORIAS = [
    { id: 'frutas', nome: 'Frutas' },
    { id: 'citricos', nome: 'Cítricos' },
    { id: 'mentolados', nome: 'Mentolados/Ice' },
    { id: 'doces', nome: 'Doces e sobremesas' },
    { id: 'bebidas', nome: 'Bebidas' },
    { id: 'mixes', nome: 'Mixes' }
  ];

  function s(marca, id, nome, categoria, tags, nota, extra) {
    var sabor = { id: id, marcaId: marca, nome: nome, categoria: categoria, tags: tags, nota: nota, emFalta: false, linha: null,
      estoque: 5, minimo: 2, ativo: true };
    if (extra) Object.keys(extra).forEach(function (k) { sabor[k] = extra[k]; });
    return sabor;
  }

  // Seleção da pesquisa de marcas (docs/research/hookah-essence-brands-brazil.md, seção 3)
  var SABORES = [
    s('zomo', 'zo-strong-mint', 'Strong Mint', 'mentolados', ['ice', 'menta', 'forte'], 'menta forte e gelada', { linha: 'Strong' }),
    s('zomo', 'zo-watermelon-mint', 'Watermelon Mint', 'frutas', ['menta', 'ice'], 'melancia com menta'),
    s('zomo', 'zo-blueberry-mint', 'Blueberry Mint', 'frutas', ['menta', 'frutas vermelhas'], 'mirtilo com menta'),
    s('zomo', 'zo-swiss-alps', 'Swiss Alps', 'mentolados', ['ice'], 'gelado intenso', { emFalta: true }),
    s('zomo', 'zo-passion-lemonade', 'Passion Lemonade', 'citricos', [], 'maracujá com limonada'),
    s('zomo', 'zo-pink-berries', 'Pink Berries', 'frutas', ['frutas vermelhas'], 'frutas vermelhas'),
    s('zomo', 'zo-two-apple', 'Two Apple Bahraini', 'frutas', [], 'maçã dupla'),
    s('zomo', 'zo-acai-cream', 'Açaí Cream', 'doces', ['cremoso'], 'açaí cremoso'),
    s('zomo', 'zo-gum-mint', 'Gum Mint', 'doces', ['chiclete', 'menta'], 'chiclete de menta'),
    s('ziggy', 'zi-banana-tropical', 'Banana Tropical', 'frutas', ['tropical'], 'banana'),
    s('ziggy', 'zi-hapocalyx-mint', 'Hapocalyx Mint', 'mentolados', ['ice', 'menta'], 'menta gelada'),
    s('ziggy', 'zi-fresh-lemon', 'Fresh Lemon', 'citricos', [], 'limão'),
    s('ziggy', 'zi-tanger-bomb', 'Tanger Bomb', 'citricos', [], 'tangerina'),
    s('ziggy', 'zi-happy-berry', 'Happy Berry', 'mixes', ['frutas vermelhas'], 'mix de frutas vermelhas'),
    s('ziggy', 'zi-happy-frutti', 'Happy Frutti', 'mixes', ['chiclete'], 'tutti-frutti'),
    s('ziggy', 'zi-cafe-macchiato', 'Café Macchiato', 'doces', ['café', 'cremoso'], 'café com leite', { emFalta: true }),
    s('ziggy', 'zi-sorvete-pistache', 'Sorvete de Pistache', 'doces', ['cremoso'], 'pistache cremoso'),
    s('ziggy', 'zi-duas-goiabas', 'Duas Goiabas', 'mixes', [], 'goiaba vermelha e branca', { linha: 'Mix' }),
    s('nay', 'na-bubble-grape', 'Bubble Grape', 'doces', ['chiclete'], 'chiclete de uva'),
    s('nay', 'na-maracuja', 'Maracujá', 'frutas', ['tropical'], 'maracujá'),
    s('nay', 'na-menta', 'Menta', 'mentolados', ['menta', 'ice'], 'menta'),
    s('nay', 'na-menthol', 'Menthol', 'mentolados', ['ice'], 'mentol puro'),
    s('nay', 'na-moon', 'Moon', 'mixes', ['chiclete'], 'tutti-frutti'),
    s('nay', 'na-vision', 'Vision', 'bebidas', [], 'cola com limão'),
    s('nay', 'na-strawberry-blend', 'Strawberry Blend', 'frutas', [], 'morango'),
    s('nay', 'na-cinnamon-blend', 'Cinnamon Blend', 'doces', ['canela'], 'canela'),
    s('onix', 'on-high-mint', 'High Mint', 'mentolados', ['ice', 'menta'], 'menta gelada'),
    s('onix', 'on-high-lemon', 'High Lemon', 'citricos', [], 'limão'),
    s('onix', 'on-high-passion', 'High Passion', 'frutas', ['tropical'], 'maracujá'),
    s('onix', 'on-chiclete-canela', 'Chiclete de Canela', 'doces', ['chiclete', 'canela'], 'chiclete de canela'),
    s('onix', 'on-goiaba-morango', 'Goiaba e Morango', 'mixes', [], 'goiaba com morango'),
    s('onix', 'on-banana-acai', 'Banana e Açaí', 'mixes', [], 'banana com açaí'),
    s('onix', 'on-red-drops', 'Red Drops', 'frutas', ['frutas vermelhas'], 'frutas vermelhas'),
    s('onix', 'on-starcoffee', 'StarCoffee', 'doces', ['café'], 'café'),
    s('adalya', 'ad-love-66', 'Love 66', 'mixes', ['menta', 'ice'], 'melão, melancia e menta'),
    s('adalya', 'ad-hawaii', 'Hawaii', 'mixes', ['menta', 'tropical'], 'manga, abacaxi e menta'),
    s('adalya', 'ad-double-melon-ice', 'Double Melon Ice', 'frutas', ['ice'], 'melão gelado'),
    s('adalya', 'ad-ice-bonbon', 'Ice Bonbon', 'doces', ['ice'], 'bombom gelado', { emFalta: true }),
    s('adalya', 'ad-mango-tango', 'Mango Tango', 'frutas', ['tropical'], 'manga'),
    s('adalya', 'ad-banana-milk', 'Banana Milk', 'doces', ['cremoso'], 'vitamina de banana'),
    s('adalya', 'ad-maracuja-cream', 'Maracujá Cream', 'doces', ['cremoso'], 'maracujá cremoso'),
    s('adalya', 'ad-picole-groselha', 'Picolé de Groselha', 'frutas', [], 'groselha'),
    s('smyrna', 'sm-hades', 'Hades', 'mentolados', ['ice', 'menta', 'forte'], 'menta forte'),
    s('smyrna', 'sm-hera', 'Hera', 'mixes', [], 'cereja com limão'),
    s('smyrna', 'sm-banana-doce-leite', 'Banana com doce de leite', 'doces', ['cremoso'], 'banana e doce de leite')
  ];

  // Pacotes fechados no estoque da unidade (o padrão é 5)
  var ESTOQUE = {
    'zo-strong-mint': 7, 'zo-watermelon-mint': 4, 'zo-swiss-alps': 0, 'zo-pink-berries': 3, 'zo-gum-mint': 3,
    'zi-hapocalyx-mint': 1, 'zi-cafe-macchiato': 0, 'zi-happy-berry': 6, 'na-menta': 8, 'na-vision': 3,
    'on-high-mint': 4, 'ad-love-66': 2, 'ad-ice-bonbon': 0, 'ad-hawaii': 3, 'sm-hera': 3
  };
  SABORES.forEach(function (sabor) {
    if (sabor.id in ESTOQUE) sabor.estoque = ESTOQUE[sabor.id];
  });

  var ADICIONAIS = [
    { id: 'carvao', nome: 'Carvão extra', plural: 'carvões extra', preco: 500, ativo: true, fixo: true },
    { id: 'mangueira', nome: 'Mangueira extra', plural: 'mangueiras extra', preco: 800, ativo: true }
  ];

  var ETIQUETAS = ['ice', 'menta', 'forte', 'chiclete', 'cremoso', 'tropical', 'frutas vermelhas', 'café', 'canela'];
  var CORES_MARCA = ['#1f7a5c', '#e2a33b', '#6c55c9', '#3b3842', '#b8334a', '#2f6fb3', '#d0643a', '#3f8f9f', '#8a4fa3', '#6f8a2b'];

  var UNIDADES = { u1: 'Unidade 1 Centro', u2: 'Unidade 2 Asa Sul', u3: 'Unidade 3 Lago Sul' };

  var OBS_GELO = 'Gelo no vaso';

  var PAGAMENTOS = [
    { id: 'dinheiro', nome: 'Dinheiro' },
    { id: 'cartao', nome: 'Cartão' },
    { id: 'pix', nome: 'Pix' }
  ];

  var MESAS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  var OPERADORES = {
    rafa: { id: 'rafa', nome: 'Rafa', cargo: 'garçom' },
    leo: { id: 'leo', nome: 'Leo', cargo: 'garçom' },
    bia: { id: 'bia', nome: 'Bia', cargo: 'caixa' },
    duda: { id: 'duda', nome: 'Duda', cargo: 'garçom' },
    caio: { id: 'caio', nome: 'Caio', cargo: 'cozinha' },
    teo: { id: 'teo', nome: 'Téo', cargo: 'cozinha' },
    ana: { id: 'ana', nome: 'Ana', cargo: 'gerente' },
    marcos: { id: 'marcos', nome: 'Marcos', cargo: 'master' }
  };

  var TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];

  // Promoções criadas pelo gerente; o garçom só escolhe entre as ativas agora
  var PROMOCOES = [
    { id: 'happy', nome: 'Happy hour 20%', tipo: 'percentual', modo: 'automatica', pct: 20, vale: 'rosh', dias: TODOS_OS_DIAS, inicio: '18:00', fim: '22:00', alcance: 'rede' },
    { id: 'aniversario', nome: 'Aniversariante 10%', tipo: 'percentual', modo: 'opcional', pct: 10, vale: 'pedido', dias: TODOS_OS_DIAS, inicio: '14:00', fim: '04:00', alcance: 'rede' },
    { id: 'duplo', nome: 'Rosh duplo', tipo: 'duplo', modo: 'opcional', pct: 0, vale: 'rosh', validadeHoras: 3, dias: TODOS_OS_DIAS, inicio: '18:00', fim: '02:00', alcance: 'unidade' },
    { id: 'terca', nome: 'Terça 15%', tipo: 'percentual', modo: 'automatica', pct: 15, vale: 'pedido', dias: [2], inicio: '18:00', fim: '02:00', alcance: 'rede' }
  ];

  var MODOS = { automatica: 'Automática: entra sozinha', opcional: 'Opcional: a equipe escolhe' };

  var VALE = { pedido: 'Pedido inteiro', rosh: 'Só o rosh', adicionais: 'Só adicionais' };
  var DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function porId(lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function semAcento(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // Ativo na rede e não oculto nesta unidade
  function ativos(lista) {
    return lista.filter(function (item) { return item.ativo !== false && !item.ocultoUnidade; });
  }

  // Preço que vale nesta unidade (o gerente pode ajustar só para a loja dele)
  function preco(item) {
    return typeof item.precoLocal === 'number' ? item.precoLocal : item.preco;
  }

  // Sabor aparece no tablet e no caixa se ele e a marca estão ativos
  function saborVisivel(sabor) {
    var marca = porId(MARCAS, sabor.marcaId);
    return sabor.ativo !== false && !sabor.ocultoUnidade && marca.ativo !== false && !marca.ocultoUnidade;
  }

  // Texto escuro sobre cores claras, claro sobre cores escuras
  function corTexto(hex) {
    var n = parseInt(hex.slice(1), 16);
    var luz = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return luz > 160 ? '#2a1a05' : '#ffffff';
  }

  function mentolado(sabor) {
    return sabor.categoria === 'mentolados' || sabor.tags.indexOf('ice') !== -1 || sabor.tags.indexOf('menta') !== -1;
  }

  // Sabor de fruta com menta aparece em Frutas e também em Mentolados/Ice
  function naCategoria(sabor, categoria) {
    if (!categoria) return true;
    if (categoria === 'mentolados') return mentolado(sabor);
    return sabor.categoria === categoria;
  }

  function busca(sabor, termo) {
    if (!termo) return true;
    var marca = porId(MARCAS, sabor.marcaId);
    var texto = [sabor.nome, sabor.nota, marca.nome, sabor.linha || '', porId(CATEGORIAS, sabor.categoria).nome]
      .concat(sabor.tags).join(' ');
    if (mentolado(sabor)) texto += ' mentolado gelado menta ice';
    var alvo = semAcento(texto);
    return semAcento(termo).split(/\s+/).filter(Boolean).every(function (parte) { return alvo.indexOf(parte) !== -1; });
  }

  function rotuloSabor(sabor) {
    return sabor.nome + ' (' + porId(MARCAS, sabor.marcaId).nome + ')';
  }

  function minutos(hhmm) {
    var p = hhmm.split(':');
    return Number(p[0]) * 60 + Number(p[1]);
  }

  // Ativa se o dia e o horário batem; horários que passam da meia-noite contam no dia em que começaram
  function promoAtiva(promo, ts) {
    if (promo.pausada || promo.encerrada) return false;
    var d = new Date(ts);
    var agoraMin = d.getHours() * 60 + d.getMinutes();
    var ini = minutos(promo.inicio);
    var fim = minutos(promo.fim);
    if (ini < fim) return promo.dias.indexOf(d.getDay()) !== -1 && agoraMin >= ini && agoraMin < fim;
    if (agoraMin >= ini) return promo.dias.indexOf(d.getDay()) !== -1;
    if (agoraMin < fim) return promo.dias.indexOf((d.getDay() + 6) % 7) !== -1;
    return false;
  }

  function horaCurta(hhmm) {
    var p = hhmm.split(':');
    return Number(p[0]) + 'h' + (p[1] === '00' ? '' : p[1]);
  }

  function rotuloDias(dias) {
    if (dias.length === 7) return 'Todos os dias';
    if (dias.length === 1) return ['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados'][dias[0]];
    return dias.slice().sort().map(function (d) { return DIAS_CURTOS[d]; }).join(', ');
  }

  function rotuloHorario(promo) {
    return horaCurta(promo.inicio) + ' às ' + horaCurta(promo.fim);
  }

  function rotuloRegra(promo) {
    if (promo.tipo === 'duplo') return 'Paga 1, ganha 2: o 2º rosh fica para a mesa por ' + (promo.validadeHoras || 3) + ' h';
    return VALE[promo.vale] + ', ' + promo.pct + '% de desconto';
  }

  window.RoshCatalogo = {
    ROSH: ROSH,
    MARCAS: MARCAS,
    CATEGORIAS: CATEGORIAS,
    SABORES: SABORES,
    ADICIONAIS: ADICIONAIS,
    ETIQUETAS: ETIQUETAS,
    CORES_MARCA: CORES_MARCA,
    UNIDADES: UNIDADES,
    OBS_GELO: OBS_GELO,
    PAGAMENTOS: PAGAMENTOS,
    MESAS: MESAS,
    OPERADORES: OPERADORES,
    PROMOCOES: PROMOCOES,
    VALE: VALE,
    DIAS_CURTOS: DIAS_CURTOS,
    porId: porId,
    ativos: ativos,
    preco: preco,
    MODOS: MODOS,
    saborVisivel: saborVisivel,
    corTexto: corTexto,
    naCategoria: naCategoria,
    busca: busca,
    rotuloSabor: rotuloSabor,
    promoAtiva: promoAtiva,
    rotuloDias: rotuloDias,
    rotuloHorario: rotuloHorario,
    rotuloRegra: rotuloRegra
  };
})();

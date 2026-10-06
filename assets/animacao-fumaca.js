/* Fumaça ambiente atrás do palco: discreta e parada quando o movimento é reduzido */
(function () {
  'use strict';

  const tela = document.querySelector('.palco__fumaca');
  if (!tela || !tela.getContext) return;

  const ctx = tela.getContext('2d');
  const consultaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const QUANTIDADE = 26;
  let largura = 0;
  let altura = 0;
  let particulas = [];
  let ultimo = 0;
  let laco = 0;

  function redimensionar() {
    const caixa = tela.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = caixa.width;
    altura = caixa.height;
    tela.width = Math.round(largura * dpr);
    tela.height = Math.round(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nova(espalhada) {
    return {
      x: Math.random() * largura,
      y: espalhada ? Math.random() * altura : altura + 60,
      raio: 40 + Math.random() * 70,
      subida: 8 + Math.random() * 14,
      crescimento: 3 + Math.random() * 5,
      fase: Math.random() * Math.PI * 2,
      alfa: 0.035 + Math.random() * 0.035,
      quente: Math.random() < 0.3
    };
  }

  function desenhar(instante) {
    ctx.clearRect(0, 0, largura, altura);
    for (const p of particulas) {
      const x = p.x + Math.sin(p.fase + instante / 3200) * 26;
      const vida = Math.max(0, Math.min(1, p.y / altura));
      const cor = p.quente ? '255, 150, 90' : '236, 226, 240';
      const gradiente = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.raio);
      gradiente.addColorStop(0, `rgba(${cor}, ${p.alfa * vida})`);
      gradiente.addColorStop(1, `rgba(${cor}, 0)`);
      ctx.fillStyle = gradiente;
      ctx.beginPath();
      ctx.arc(x, p.y, p.raio, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function quadro(instante) {
    const dt = ultimo ? Math.min(instante - ultimo, 100) / 1000 : 0;
    ultimo = instante;
    for (let i = 0; i < particulas.length; i += 1) {
      const p = particulas[i];
      p.y -= p.subida * dt;
      p.raio += p.crescimento * dt;
      if (p.y + p.raio < 0) particulas[i] = nova(false);
    }
    desenhar(instante);
    laco = window.requestAnimationFrame(quadro);
  }

  function iniciar() {
    window.cancelAnimationFrame(laco);
    redimensionar();
    particulas = Array.from({ length: QUANTIDADE }, () => nova(true));
    ultimo = 0;
    if (consultaMovimento.matches) desenhar(0);
    else laco = window.requestAnimationFrame(quadro);
  }

  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      redimensionar();
      if (consultaMovimento.matches) desenhar(0);
    }).observe(tela);
  }
  consultaMovimento.addEventListener('change', iniciar);
  iniciar();
})();

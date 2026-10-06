(function () {
  "use strict";

  // Índice: aberto e fixo no desktop, recolhido no celular
  var indice = document.querySelector(".indice");
  var desktop = window.matchMedia("(min-width: 1081px)");

  function ajustarIndice() {
    if (!indice) return;
    indice.open = desktop.matches;
  }

  ajustarIndice();
  if (desktop.addEventListener) {
    desktop.addEventListener("change", ajustarIndice);
  }

  // No celular, escolher um item fecha o índice
  if (indice) {
    indice.addEventListener("click", function (evento) {
      if (evento.target.closest("a") && !desktop.matches) {
        indice.open = false;
      }
    });
  }

  // Destaca no índice a seção que está sendo lida
  var links = Array.prototype.slice.call(document.querySelectorAll(".indice__lista a"));
  var porId = {};
  links.forEach(function (link) {
    porId[link.getAttribute("href").slice(1)] = link;
  });

  var secoes = links
    .map(function (link) {
      return document.getElementById(link.getAttribute("href").slice(1));
    })
    .filter(Boolean);

  function marcar(id) {
    links.forEach(function (link) {
      link.removeAttribute("aria-current");
    });
    if (porId[id]) {
      porId[id].setAttribute("aria-current", "true");
    }
  }

  if ("IntersectionObserver" in window && secoes.length) {
    var visiveis = {};
    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          visiveis[entrada.target.id] = entrada.isIntersecting;
        });
        for (var i = 0; i < secoes.length; i++) {
          if (visiveis[secoes[i].id]) {
            marcar(secoes[i].id);
            return;
          }
        }
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    secoes.forEach(function (secao) {
      observador.observe(secao);
    });
  }

  // No celular as tabelas empilham; cada célula leva o nome da sua coluna
  Array.prototype.forEach.call(document.querySelectorAll(".tabela"), function (tabela) {
    var rotulos = Array.prototype.map.call(tabela.querySelectorAll("thead th"), function (th) {
      return th.textContent.trim();
    });
    Array.prototype.forEach.call(tabela.querySelectorAll("tbody tr"), function (linha) {
      Array.prototype.forEach.call(linha.children, function (celula, i) {
        if (celula.tagName === "TD" && rotulos[i]) {
          celula.setAttribute("data-rotulo", rotulos[i]);
        }
      });
    });
  });

  // A prévia embutida informa a própria altura; a moldura acompanha, sem rolagem interna
  var moldura = document.querySelector(".previa-moldura");
  if (moldura) {
    window.addEventListener("message", function (evento) {
      var dados = evento.data;
      if (evento.source !== moldura.contentWindow || !dados || typeof dados.roshPreviaAltura !== "number") return;
      // +2 compensa a borda de 1px da moldura
      moldura.style.height = Math.max(400, Math.min(dados.roshPreviaAltura + 2, 2400)) + "px";
    });
  }

  // Reimprime a comanda da abertura
  var botao = document.getElementById("repetir-impressao");
  var comanda = document.getElementById("comanda-abertura");
  if (botao && comanda) {
    botao.addEventListener("click", function () {
      comanda.style.animation = "none";
      void comanda.offsetHeight;
      comanda.style.animation = "";
    });
  }
})();

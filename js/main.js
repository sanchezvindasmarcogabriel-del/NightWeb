/* ==========================================================
   NIGHTWEB - main.js
   Filtro de publicaciones por categoría
   ========================================================== */
console.log("main.js cargado");

// Espera a que toda la página esté lista antes de buscar elementos
document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("listaPublicaciones");
  const contador = document.getElementById("contador");

  console.log("Lista:", lista, "| Contador:", contador,
              "| Publicaciones:", document.querySelectorAll(".tarjeta").length,
              "| Botones:", document.querySelectorAll(".filtro").length);

  if (!lista) { console.error("No existe #listaPublicaciones en el HTML"); return; }

  // Mensaje para categorías sin publicaciones
  const mensajeVacio = document.createElement("p");
  mensajeVacio.className = "vacio";
  mensajeVacio.textContent = "Todavía no hay relatos en esta categoría.";
  mensajeVacio.style.display = "none";
  lista.appendChild(mensajeVacio);

  /* Quita tildes, espacios y mayúsculas para comparar textos */
  function normalizar(texto) {
    return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* Muestra solo las publicaciones de la categoría indicada */
  function filtrarPublicaciones(categoria) {
    let visibles = 0;

    lista.querySelectorAll(".tarjeta").forEach((tarjeta) => {
      const sello = tarjeta.querySelector(".insignia");
      const categoriaTarjeta = sello ? normalizar(sello.textContent) : "";
      const coincide = normalizar(categoria) === "todas" || categoriaTarjeta === normalizar(categoria);

      tarjeta.style.display = coincide ? "" : "none";
      if (coincide) visibles++;
    });

    if (contador) contador.textContent = visibles + (visibles === 1 ? " registro" : " registros");
    mensajeVacio.style.display = visibles === 0 ? "block" : "none";
    console.log("Filtro:", categoria, "| visibles:", visibles);
  }

  /* Un solo evento click para todos los botones de categoría */
  document.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".filtro");
    if (!boton) return;

    document.querySelectorAll(".filtro").forEach((b) => b.classList.remove("filtro--activo"));
    boton.classList.add("filtro--activo");

    filtrarPublicaciones(boton.dataset.cat || boton.textContent);
  });
});

/* ==========================================================
   LIKES: contador y fantasma rojo
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const LLAVE_LIKES = "nw_likes";   // publicaciones con like, guardadas en el navegador

  /* Lee la lista de publicaciones con like */
  function leerLikes() {
    try { return JSON.parse(localStorage.getItem(LLAVE_LIKES)) || []; }
    catch (e) { return []; }
  }

  /* Guarda la lista de publicaciones con like */
  function guardarLikes(lista) {
    try { localStorage.setItem(LLAVE_LIKES, JSON.stringify(lista)); }
    catch (e) { /* si el navegador no deja guardar, el like funciona igual */ }
  }

  /* Prepara el botón de "Me gusta" de una publicación */
  function prepararLike(tarjeta) {
    const boton = tarjeta.querySelector(".tarjeta__likes");
    const titulo = tarjeta.querySelector(".tarjeta__titulo");
    if (!boton || !titulo || boton.dataset.listo) return;

    const idPublicacion = titulo.textContent.trim();                 // identifica la publicación
    const base = parseInt((boton.textContent.match(/\d+/) || [0])[0], 10);  // likes iniciales del HTML

    // Reconstruye el contenido: fantasma + número + texto
    const icono = boton.querySelector("svg");
    const numero = document.createElement("span");
    const texto = document.createElement("span");
    numero.className = "like__num";
    texto.textContent = "Me gusta";
    boton.innerHTML = "";
    if (icono) boton.appendChild(icono);
    boton.append(numero, texto);

    // Para que funcione también con el teclado
    boton.setAttribute("role", "button");
    boton.setAttribute("tabindex", "0");

    /* Muestra el número y el color según haya like o no */
    function mostrar(tieneLike) {
      numero.textContent = base + (tieneLike ? 1 : 0);
      boton.classList.toggle("tarjeta__likes--activo", tieneLike);
      boton.setAttribute("aria-pressed", tieneLike);
    }

    /* Da o quita el like */
    function alternarLike() {
      let lista = leerLikes();
      const yaTeniaLike = lista.includes(idPublicacion);
      lista = yaTeniaLike ? lista.filter((id) => id !== idPublicacion) : [...lista, idPublicacion];
      guardarLikes(lista);
      mostrar(!yaTeniaLike);
    }

    mostrar(leerLikes().includes(idPublicacion));   // estado inicial (recuerda likes anteriores)
    boton.addEventListener("click", alternarLike);
    boton.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        alternarLike();
      }
    });
    boton.dataset.listo = "si";
  }

  document.querySelectorAll(".tarjeta").forEach(prepararLike);
});
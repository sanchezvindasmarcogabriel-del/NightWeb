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


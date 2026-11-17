/* ==========================================================
   NIGHTWEB - main.js
   - Todas las publicaciones viven en un arreglo (publicaciones)
   - Se recorren para mostrarlas dinámicamente en la página
   - Crear, eliminar, dar "Me gusta", filtrar por categoría,
     validar el formulario, buscar, ordenar y ver el perfil
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  /* ==========================================================
     1. CONSTANTES Y DATOS
     ========================================================== */
  const LLAVE = "nw_v2_publicaciones";   // donde se guardan en el navegador
  const USUARIO = "NightUser";           // usuario fijo de la página
  const MINIMO_TITULO = 3;
  const MINIMO_CONTENIDO = 50;
  const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

  // Icono de fantasma para los "Me gusta"
  const ICONO_FANTASMA = `<svg class="like__icono" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 21V10a8 8 0 0 1 16 0v11l-2.67-2.5L14.67 21 12 18.5 9.33 21l-2.66-2.5z"/>
    <circle class="like__ojo" cx="9" cy="10" r="2"/>
    <circle class="like__ojo" cx="15" cy="10" r="2"/>
  </svg>`;

  // Publicaciones de ejemplo (id más alto = más reciente).
  // Cada una guarda: usuario, contenido, categoría y cantidad de "Me gusta".
  const PUBLICACIONES_INICIALES = [
    {
      id: 3, usuario: "NocturnaCR", categoria: "Ultrapesadilla", fecha: "2026-11-10",
      titulo: "Alguien se sentó conmigo en mi cama",
      contenido: "Durante siete noches soñé con la misma habitación y la misma silla vacía. A la sétima noche noté una presión el pecho y a mi izquierda también\nlo noté, cuando abrí los ojos vi una figura oscura, pesada, que me estaba vigilando detenidamente, yo solo me quedé completamente paralizado y no me podía mover...",
      imagen: "img/paralisis.png", likes: 136, meGusta: false, propia: false
    },
    {
      id: 2, usuario: "LunaNegra", categoria: "Misterio", fecha: "2026-11-10",
      titulo: "La ventana del cuarto piso",
      contenido: "Entramos a la fábrica cuando empezó a llover. El edificio no tenía cuarto piso. Sin embargo, desde la parte trasera de\nesta fabrica (que fue por dónde entramos) vimos que claramente está fábrica abandonada tenía un cuarto piso, una ventana gigante con una luz tenué, la unica que existía en esa lugubre fábrica,\nlo peor de la situación fue que fuimos hacía allá, creimos que alguien nos podría ayudar para dejar de estar perdidos. Pero, cuando llegamos a las escaleras vimos que solo existía hasta el piso 3,\ny que está habitación tenue, nunca existió.",
      imagen: "", likes: 80, meGusta: false, propia: false
    },
    {
      id: 1, usuario: "VelaApagada", categoria: "Manifestación", fecha: "2026-11-09",
      titulo: "Pasos en mi puerta cada noche.",
      contenido: "Cada noche, cada madrugada a las 3am se escuchan pasos frente a mi puerta y vivo completamente solo...",
      imagen: "img/puerta.jpg", likes: 167, meGusta: false, propia: false
    }
  ];

  /* Arreglo principal: lo guardado en el navegador o, la primera vez, los ejemplos */
  let publicaciones = cargarPublicaciones();

  // Estado de los controles
  let categoriaActual = "todas";
  let textoBusqueda = "";
  let ordenActual = "recientes";

  /* ==========================================================
     2. ELEMENTOS DE LA PÁGINA
     ========================================================== */
  const lista = document.getElementById("listaPublicaciones");
  const contador = document.getElementById("contador");
  const buscador = document.getElementById("buscador");
  const selectorOrden = document.getElementById("ordenPub");

  const formulario = document.getElementById("formPublicacion");
  const campoTitulo = document.getElementById("tituloPub");
  const campoContenido = document.getElementById("contenidoPub");
  const contadorTexto = document.getElementById("contadorTexto");
  const campoImagen = document.getElementById("imagenPub");
  const vistaPrevia = document.getElementById("vistaPrevia");
  const imagenPrevia = document.getElementById("imagenPrevia");
  const botonQuitarImagen = document.getElementById("btnQuitarImagen");
  const mensajeError = document.getElementById("errorPub");

  const statPublicaciones = document.getElementById("statPublicaciones");
  const statLikes = document.getElementById("statLikes");
  const statCategoria = document.getElementById("statCategoria");
  const misPublicaciones = document.getElementById("misPublicaciones");

  /* ==========================================================
     3. FUNCIONES DE APOYO
     ========================================================== */

  /* Lee el arreglo guardado; si no hay, devuelve una copia de los ejemplos */
  function cargarPublicaciones() {
    try {
      const guardadas = JSON.parse(localStorage.getItem(LLAVE));
      if (Array.isArray(guardadas) && guardadas.length > 0) return guardadas;
    } catch (e) { /* si falla, se usan los ejemplos */ }
    return JSON.parse(JSON.stringify(PUBLICACIONES_INICIALES));
  }

  /* Guarda el arreglo; devuelve false si el navegador no tiene espacio */
  function guardarPublicaciones() {
    try { localStorage.setItem(LLAVE, JSON.stringify(publicaciones)); return true; }
    catch (e) { return false; }
  }

  /* Fecha de hoy según la computadora: 2026-11-15 */
  function fechaDeHoy() {
    const hoy = new Date();
    return hoy.getFullYear() + "-" +
           String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
           String(hoy.getDate()).padStart(2, "0");
  }

  /* Convierte 2026-11-15 en "15 NOV 2026" */
  function formatearFecha(iso) {
    const [anio, mes, dia] = iso.split("-").map(Number);
    return dia + " " + MESES[mes - 1] + " " + anio;
  }

  /* Quita tildes, espacios y mayúsculas para comparar textos */
  function normalizar(texto) {
    return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* Reduce la imagen para que quepa en el navegador y la devuelve como texto */
  function leerImagen(archivo) {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => {
        const img = new Image();
        img.onload = () => {
          const escala = Math.min(1, 900 / img.width);
          const lienzo = document.createElement("canvas");
          lienzo.width = img.width * escala;
          lienzo.height = img.height * escala;
          const contexto = lienzo.getContext("2d");
          contexto.fillStyle = "#000";                       // fondo para PNG transparentes
          contexto.fillRect(0, 0, lienzo.width, lienzo.height);
          contexto.drawImage(img, 0, 0, lienzo.width, lienzo.height);
          resolver(lienzo.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = rechazar;
        img.src = lector.result;
      };
      lector.onerror = rechazar;
      lector.readAsDataURL(archivo);
    });
  }

  /* ==========================================================
     4. MOSTRAR PUBLICACIONES (recorre el arreglo)
     ========================================================== */

  /* Devuelve las publicaciones que cumplen filtro y búsqueda, ya ordenadas */
  function obtenerVisibles() {
    const texto = normalizar(textoBusqueda);

    const visibles = publicaciones.filter((pub) => {
      const coincideCategoria = categoriaActual === "todas" ||
                                normalizar(pub.categoria) === normalizar(categoriaActual);
      const coincideBusqueda = texto === "" ||
        normalizar(pub.titulo + " " + pub.contenido + " " + pub.usuario + " " + pub.categoria).includes(texto);
      return coincideCategoria && coincideBusqueda;
    });

    if (ordenActual === "gustadas") visibles.sort((a, b) => b.likes - a.likes || b.id - a.id);
    else if (ordenActual === "antiguas") visibles.sort((a, b) => a.id - b.id);
    else visibles.sort((a, b) => b.id - a.id);                // más recientes primero

    return visibles;
  }

  /* Dibuja la lista completa en la página */
  function mostrarPublicaciones() {
    const visibles = obtenerVisibles();
    lista.innerHTML = "";

    if (visibles.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "vacio";
      vacio.textContent = textoBusqueda.trim()
        ? "No se encontraron relatos con esa búsqueda."
        : "Todavía no hay relatos en esta categoría.";
      lista.appendChild(vacio);
    } else {
      visibles.forEach((pub) => lista.appendChild(crearTarjeta(pub)));
    }

    contador.textContent = visibles.length + (visibles.length === 1 ? " registro" : " registros");
  }

  /* Construye la tarjeta de una publicación */
  function crearTarjeta(pub) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    tarjeta.dataset.id = pub.id;

    tarjeta.innerHTML = `
      <div class="tarjeta__cabecera">
        <span class="avatar"></span>
        <div>
          <p class="tarjeta__usuario"></p>
          <p class="tarjeta__fecha"></p>
        </div>
        <span class="insignia"></span>
      </div>
      <div class="tarjeta__cuerpo">
        <h3 class="tarjeta__titulo"></h3>
        <p class="tarjeta__texto"></p>
      </div>
      <div class="tarjeta__pie">
        <span class="tarjeta__likes" role="button" tabindex="0">${ICONO_FANTASMA}<span class="like__num"></span><span>Me gusta</span></span>
        ${pub.propia ? '<button type="button" class="eliminar">Eliminar</button>' : ""}
      </div>`;

    // Todo el texto del usuario entra con textContent (nunca se interpreta como código)
    const avatar = tarjeta.querySelector(".avatar");
    if (pub.propia) {                                     // NightUser usa la carita del perfil
      avatar.textContent = "\u263A";
      avatar.classList.add("avatar--perfil");
    } else {
      avatar.textContent = pub.usuario.slice(0, 2).toUpperCase();
    }
    tarjeta.querySelector(".tarjeta__usuario").textContent = "@" + pub.usuario;
    tarjeta.querySelector(".tarjeta__fecha").textContent = formatearFecha(pub.fecha);
    tarjeta.querySelector(".insignia").textContent = pub.categoria;
    tarjeta.querySelector(".tarjeta__titulo").textContent = pub.titulo;
    tarjeta.querySelector(".tarjeta__texto").textContent = pub.contenido;

    // Imagen opcional
    if (pub.imagen) {
      const img = document.createElement("img");
      img.className = "tarjeta__imagen";
      img.src = pub.imagen;
      img.alt = "Evidencia de la publicación: " + pub.titulo;
      tarjeta.querySelector(".tarjeta__cuerpo").appendChild(img);
    }

    pintarLike(tarjeta, pub);
    return tarjeta;
  }

  /* ==========================================================
     5. LIKES
     ========================================================== */

  /* Muestra el número de likes y el color del fantasma */
  function pintarLike(tarjeta, pub) {
    const boton = tarjeta.querySelector(".tarjeta__likes");
    boton.querySelector(".like__num").textContent = pub.likes;
    boton.classList.toggle("tarjeta__likes--activo", pub.meGusta);
    boton.setAttribute("aria-pressed", pub.meGusta);
  }

  /* Da o quita el like de una publicación */
  function alternarLike(id) {
    const pub = publicaciones.find((p) => p.id === id);
    if (!pub) return;

    pub.meGusta = !pub.meGusta;
    pub.likes += pub.meGusta ? 1 : -1;                    // suma o resta un dígito
    guardarPublicaciones();

    if (ordenActual === "gustadas") {
      mostrarPublicaciones();                             // el orden puede cambiar
    } else {
      pintarLike(lista.querySelector('[data-id="' + id + '"]'), pub);
    }
    actualizarPerfil();
  }

  /* ==========================================================
     6. ELIMINAR
     ========================================================== */
  function eliminarPublicacion(id) {
    const pub = publicaciones.find((p) => p.id === id);
    if (!pub || !pub.propia) return;                      // solo se borran las propias
    if (!confirm("¿Eliminar esta publicación? No se puede deshacer.")) return;

    publicaciones = publicaciones.filter((p) => p.id !== id);
    guardarPublicaciones();
    mostrarPublicaciones();
    actualizarPerfil();
  }

  /* Eventos de la lista (click y teclado) */
  lista.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest(".tarjeta");
    if (!tarjeta) return;
    const id = Number(tarjeta.dataset.id);

    if (evento.target.closest(".eliminar")) eliminarPublicacion(id);
    else if (evento.target.closest(".tarjeta__likes")) alternarLike(id);
  });

  lista.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    const boton = evento.target.closest(".tarjeta__likes");
    if (!boton) return;
    evento.preventDefault();
    alternarLike(Number(boton.closest(".tarjeta").dataset.id));
  });

  /* ==========================================================
     7. FILTRO, BUSCADOR Y ORDEN
     ========================================================== */

  /* Marca el botón de la categoría elegida */
  function marcarFiltro(categoria) {
    document.querySelectorAll(".filtro").forEach((boton) => {
      boton.classList.toggle("filtro--activo", boton.dataset.cat === categoria);
    });
  }

  /* Click en un botón de categoría */
  document.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".filtro");
    if (!boton) return;
    categoriaActual = boton.dataset.cat || boton.textContent;
    marcarFiltro(categoriaActual);
    mostrarPublicaciones();
  });

  /* Buscador: filtra mientras se escribe */
  if (buscador) {
    buscador.addEventListener("input", () => {
      textoBusqueda = buscador.value;
      mostrarPublicaciones();
    });
  }

  /* Selector de orden */
  if (selectorOrden) {
    selectorOrden.addEventListener("change", () => {
      ordenActual = selectorOrden.value;
      mostrarPublicaciones();
    });
  }

  /* ==========================================================
     8. PERFIL
     ========================================================== */
  function actualizarPerfil() {
    if (!statPublicaciones) return;

    const mias = publicaciones.filter((p) => p.propia);

    statPublicaciones.textContent = mias.length;
    statLikes.textContent = mias.reduce((suma, p) => suma + p.likes, 0);

    // Categoría que más usa el usuario
    const conteo = {};
    mias.forEach((p) => { conteo[p.categoria] = (conteo[p.categoria] || 0) + 1; });
    const favorita = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])[0];
    statCategoria.textContent = favorita || "—";

    // Lista "Mis publicaciones"
    misPublicaciones.innerHTML = "";
    if (mias.length === 0) {
      const vacio = document.createElement("li");
      vacio.className = "vacio";
      vacio.textContent = "Todavía no has publicado ningún relato.";
      misPublicaciones.appendChild(vacio);
      return;
    }

    mias.slice().sort((a, b) => b.id - a.id).forEach((pub) => {
      const item = document.createElement("li");
      item.className = "mis-publicaciones__item";
      const titulo = document.createElement("strong");
      titulo.textContent = pub.titulo;
      const datos = document.createElement("span");
      datos.textContent = pub.categoria + " · " + formatearFecha(pub.fecha) + " · " + pub.likes + " Me gusta";
      item.append(titulo, datos);
      misPublicaciones.appendChild(item);
    });
  }

  // El botón de arriba a la derecha lleva al perfil
  const botonCuenta = document.getElementById("btnCuenta");
  const seccionPerfil = document.getElementById("perfil");
  if (botonCuenta && seccionPerfil) {
    botonCuenta.addEventListener("click", () => seccionPerfil.scrollIntoView({ behavior: "smooth" }));
  }

  /* ==========================================================
     9. FORMULARIO: validar y publicar
     ========================================================== */

  /* Contador de caracteres del relato */
  function actualizarContadorTexto() {
    const cantidad = campoContenido.value.trim().length;
    contadorTexto.textContent = cantidad + " / 2000 (mínimo " + MINIMO_CONTENIDO + ")";
  }
  campoContenido.addEventListener("input", actualizarContadorTexto);

  /* Quita la imagen elegida y oculta la vista previa */
  function limpiarImagen() {
    campoImagen.value = "";
    imagenPrevia.removeAttribute("src");
    vistaPrevia.hidden = true;
  }

  /* Vista previa al elegir una imagen */
  campoImagen.addEventListener("change", () => {
    const archivo = campoImagen.files[0];
    if (!archivo) { limpiarImagen(); return; }

    if (!archivo.type.startsWith("image/")) {
      limpiarImagen();
      mensajeError.textContent = "Solo se pueden adjuntar imágenes.";
      return;
    }
    mensajeError.textContent = "";
    imagenPrevia.src = URL.createObjectURL(archivo);
    vistaPrevia.hidden = false;
  });
  botonQuitarImagen.addEventListener("click", limpiarImagen);

  /* Publicar (evento submit) */
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const titulo = campoTitulo.value.trim();
    const contenido = campoContenido.value.trim();
    const categoriaElegida = formulario.querySelector('input[name="categoria"]:checked');
    const archivo = campoImagen.files[0];

    // Validaciones
    if (titulo.length < MINIMO_TITULO) {
      mensajeError.textContent = "El título es obligatorio (mínimo " + MINIMO_TITULO + " caracteres).";
      return;
    }
    if (contenido.length < MINIMO_CONTENIDO) {
      mensajeError.textContent = "El relato debe tener al menos " + MINIMO_CONTENIDO +
                                 " caracteres (llevas " + contenido.length + ").";
      return;
    }
    if (!categoriaElegida) {
      mensajeError.textContent = "Elige una categoría antes de publicar.";
      return;
    }
    if (archivo && !archivo.type.startsWith("image/")) {
      mensajeError.textContent = "Solo se pueden adjuntar imágenes.";
      return;
    }

    // La imagen es opcional
    let imagen = "";
    if (archivo) {
      try { imagen = await leerImagen(archivo); }
      catch (e) { mensajeError.textContent = "No se pudo leer la imagen."; return; }
    }

    // Nueva publicación: empieza con cero likes
    const nueva = {
      id: Date.now(),
      usuario: USUARIO,
      titulo: titulo,
      contenido: contenido,
      categoria: categoriaElegida.value,
      imagen: imagen,
      fecha: fechaDeHoy(),
      likes: 0,
      meGusta: false,
      propia: true
    };

    publicaciones.push(nueva);
    if (!guardarPublicaciones()) {
      publicaciones.pop();                                // se deshace si no hubo espacio
      mensajeError.textContent = "No hay espacio para guardar. Prueba con una imagen más pequeña o sin imagen.";
      return;
    }

    // Se limpia el formulario y se muestra la publicación nueva arriba
    formulario.reset();
    actualizarContadorTexto();
    limpiarImagen();
    mensajeError.textContent = "";

    categoriaActual = "todas";
    textoBusqueda = "";
    ordenActual = "recientes";
    if (buscador) buscador.value = "";
    if (selectorOrden) selectorOrden.value = "recientes";
    marcarFiltro("todas");

    mostrarPublicaciones();
    actualizarPerfil();
    document.getElementById("publicaciones").scrollIntoView({ behavior: "smooth" });
  });

  /* ==========================================================
     10. BARRA LATERAL: resalta la sección que se está viendo
     ========================================================== */
  const enlaces = document.querySelectorAll(".lateral__enlace");
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      enlaces.forEach((enlace) => {
        enlace.classList.toggle("lateral__enlace--activo", enlace.getAttribute("href") === "#" + entrada.target.id);
      });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  ["inicio", "publicaciones", "crear", "perfil", "investigacion", "acerca"].forEach((id) => {
    const seccion = document.getElementById(id);
    if (seccion) observador.observe(seccion);
  });

  /* ==========================================================
     11. INICIO
     ========================================================== */
  actualizarContadorTexto();
  mostrarPublicaciones();
  actualizarPerfil();
});
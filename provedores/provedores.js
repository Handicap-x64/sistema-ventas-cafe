const PROVEEDORES_API = "../controllers/proveedores.php";
const tbodyProveedores = document.querySelector("#tablaProvedores tbody");
const mensajeProveedores = document.querySelector("#mensajeProveedores");
const formAgregarProveedor = document.querySelector("#formAgregar");
const formModificarProveedor = document.querySelector("#formModificar");
const selectProveedor = formModificarProveedor.elements.idEntidad;

let proveedores = [];

document.querySelectorAll(".tab").forEach(boton => {
    boton.addEventListener("click", () => {
        const destino = document.getElementById(boton.dataset.tab);
        if (!destino) return;

        document.querySelectorAll(".tab").forEach(tab => {
            tab.classList.toggle("activo", tab === boton);
        });
        document.querySelectorAll(".tab-contenido").forEach(contenido => {
            contenido.classList.toggle("activo", contenido === destino);
        });
    });
});

function mostrarMensaje(mensaje, esError = false) {
    mensajeProveedores.textContent = mensaje;
    mensajeProveedores.setAttribute("role", esError ? "alert" : "status");
}

async function leerRespuesta(response) {
    const texto = (await response.text()).replace(/^Conexion establecida\s*/, "").trim();
    let resultado;

    try {
        resultado = JSON.parse(texto);
    } catch {
        const inicioLista = texto.indexOf("[");
        if (inicioLista === -1) {
            throw new Error(response.ok
                ? "El servidor devolvió una respuesta que no es JSON válido."
                : `Error HTTP ${response.status}`);
        }
        try {
            resultado = JSON.parse(texto.slice(inicioLista));
        } catch {
            throw new Error(response.ok
                ? "El servidor devolvió una respuesta que no es JSON válido."
                : `Error HTTP ${response.status}`);
        }
    }

    if (!response.ok) {
        throw new Error(resultado.error || resultado.warning || `Error HTTP ${response.status}`);
    }

    return resultado;
}

async function solicitarProveedores({ method = "GET", id, data } = {}) {
    const url = new URL(PROVEEDORES_API, window.location.href);
    if (id !== undefined) url.searchParams.set("id", id);

    const opciones = {
        method,
        headers: { Accept: "application/json" }
    };
    if (data !== undefined) {
        opciones.headers["Content-Type"] = "application/json";
        opciones.body = JSON.stringify(data);
    }

    const response = await fetch(url, opciones);
    return leerRespuesta(response);
}

function proveedorParaApi(proveedor) {
    return {
        nombre: proveedor.nombre,
        rif: proveedor.rif,
        nombre_con: proveedor.nombre_con,
        cedula_con: proveedor.cedula_con,
        telefono_con: proveedor.telefono_con,
        email_con: proveedor.email_con,
        activo: proveedor.activo ? 1 : 0
    };
}

function actualizarSelector() {
    const seleccionado = selectProveedor.value;
    selectProveedor.replaceChildren(new Option("Seleccione un proveedor", ""));

    for (const proveedor of proveedores) {
        selectProveedor.add(new Option(`${proveedor.id} - ${proveedor.nombre}`, proveedor.id));
    }

    if (proveedores.some(proveedor => String(proveedor.id) === seleccionado)) {
        selectProveedor.value = seleccionado;
    }
}

function cargarDatosContacto(proveedor) {
    formModificarProveedor.elements.nombre_con.value = proveedor?.nombre_con ?? "";
    formModificarProveedor.elements.cedula_con.value = proveedor?.cedula_con ?? "";
    formModificarProveedor.elements.telefono_con.value = proveedor?.telefono_con ?? "";
    formModificarProveedor.elements.email_con.value = proveedor?.email_con ?? "";
}

function renderizarProveedores() {
    tbodyProveedores.replaceChildren();

    for (const proveedor of proveedores) {
        const fila = tbodyProveedores.insertRow();
        fila.classList.add(proveedor.activo ? "activo" : "inactivo");

        for (const valor of [
            proveedor.id,
            proveedor.rif,
            proveedor.nombre,
            proveedor.nombre_con,
            proveedor.cedula_con,
            proveedor.telefono_con,
            proveedor.email_con
        ]) {
            fila.insertCell().textContent = valor ?? "";
        }

        const celdaAccion = fila.insertCell();
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = proveedor.activo ? "Desactivar" : "Activar";
        boton.addEventListener("click", async () => {
            boton.disabled = true;
            try {
                await solicitarProveedores({
                    method: "PUT",
                    id: proveedor.id,
                    data: { ...proveedorParaApi(proveedor), activo: proveedor.activo ? 0 : 1 }
                });
                proveedor.activo = !proveedor.activo;
                renderizarProveedores();
                mostrarMensaje(`Proveedor ${proveedor.activo ? "activado" : "desactivado"}.`);
            } catch (error) {
                boton.disabled = false;
                mostrarMensaje(error.message, true);
            }
        });
        celdaAccion.append(boton);
    }

    actualizarSelector();
    cargarDatosContacto(proveedores.find(proveedor => String(proveedor.id) === selectProveedor.value));
}

async function cargarProveedores() {
    try {
        const resultado = await solicitarProveedores();
        proveedores = Array.isArray(resultado)
            ? resultado.map(proveedor => ({
                ...proveedor,
                id: Number(proveedor.id),
                activo: proveedor.activo === true || proveedor.activo === 1 || proveedor.activo === "1"
            }))
            : [];
        renderizarProveedores();
        mostrarMensaje(proveedores.length ? "" : "No hay proveedores registrados.");
    } catch (error) {
        mostrarMensaje(`No se pudieron cargar los proveedores: ${error.message}`, true);
    }
}

formAgregarProveedor.addEventListener("submit", async event => {
    event.preventDefault();
    const datos = Object.fromEntries(new FormData(formAgregarProveedor));
    for (const campo of ["nombre", "rif", "nombre_con", "cedula_con", "telefono_con", "email_con"]) {
        datos[campo] = datos[campo].trim();
    }
    datos.activo = 1;

    const boton = formAgregarProveedor.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        await solicitarProveedores({ method: "POST", data: datos });
        formAgregarProveedor.reset();
        await cargarProveedores();
        mostrarMensaje("Proveedor creado correctamente.");
    } catch (error) {
        mostrarMensaje(error.message, true);
    } finally {
        boton.disabled = false;
    }
});

selectProveedor.addEventListener("change", () => {
    const proveedor = proveedores.find(item => String(item.id) === selectProveedor.value);
    cargarDatosContacto(proveedor);
});

formModificarProveedor.addEventListener("submit", async event => {
    event.preventDefault();
    const proveedor = proveedores.find(item => String(item.id) === selectProveedor.value);
    if (!proveedor) {
        mostrarMensaje("Selecciona un proveedor válido.", true);
        return;
    }

    const contacto = Object.fromEntries(new FormData(formModificarProveedor));
    const datos = proveedorParaApi(proveedor);
    for (const campo of ["nombre_con", "cedula_con", "telefono_con", "email_con"]) {
        datos[campo] = contacto[campo].trim();
    }

    const boton = formModificarProveedor.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        await solicitarProveedores({ method: "PUT", id: proveedor.id, data: datos });
        await cargarProveedores();
        selectProveedor.value = String(proveedor.id);
        cargarDatosContacto(proveedores.find(item => item.id === proveedor.id));
        mostrarMensaje("Datos del proveedor actualizados correctamente.");
    } catch (error) {
        mostrarMensaje(error.message, true);
    } finally {
        boton.disabled = false;
    }
});

cargarProveedores();

const CLIENTES_API = "../controllers/clientes.php";
const tbodyClientes = document.querySelector("#tablaClientes tbody");
const mensajeClientes = document.querySelector("#mensajeClientes");
const formAgregarCliente = document.querySelector("#formAgregar");
const formModificarCliente = document.querySelector("#formModificar");
const selectCliente = formModificarCliente.elements.idEntidad;

let clientes = [];

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
    mensajeClientes.textContent = mensaje;
    mensajeClientes.setAttribute("role", esError ? "alert" : "status");
}

async function leerRespuesta(response) {
    const texto = (await response.text()).replace(/^Conexion establecida\s*/, "").trim();
    let resultado;

    try {
        resultado = JSON.parse(texto);
    } catch {
        const inicioLista = texto.indexOf("[");
        if (inicioLista === -1) {
            throw new Error("El servidor devolvió una respuesta que no es JSON válido.");
        }
        try {
            resultado = JSON.parse(texto.slice(inicioLista));
        } catch {
            throw new Error("El servidor devolvió una respuesta que no es JSON válido.");
        }
    }

    if (!response.ok) {
        throw new Error(resultado.error || resultado.warning || `Error HTTP ${response.status}`);
    }

    return resultado;
}

async function solicitarClientes({ method = "GET", id, data } = {}) {
    const url = new URL(CLIENTES_API, window.location.href);
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

function clienteParaApi(cliente) {
    return {
        nombre: cliente.nombre,
        rif: cliente.rif,
        nombre_con: cliente.nombre_con,
        cedula_con: cliente.cedula_con,
        telefono_con: cliente.telefono_con,
        email_con: cliente.email_con,
        activo: cliente.activo ? 1 : 0
    };
}

function actualizarSelector() {
    const seleccionado = selectCliente.value;
    selectCliente.replaceChildren(new Option("Seleccione un cliente", ""));

    for (const cliente of clientes) {
        selectCliente.add(new Option(`${cliente.id} - ${cliente.nombre}`, cliente.id));
    }

    if (clientes.some(cliente => String(cliente.id) === seleccionado)) {
        selectCliente.value = seleccionado;
    }
}

function cargarDatosContacto(cliente) {
    formModificarCliente.elements.nombre_con.value = cliente?.nombre_con ?? "";
    formModificarCliente.elements.cedula_con.value = cliente?.cedula_con ?? "";
    formModificarCliente.elements.telefono_con.value = cliente?.telefono_con ?? "";
    formModificarCliente.elements.email_con.value = cliente?.email_con ?? "";
}

function renderizarClientes() {
    tbodyClientes.replaceChildren();

    for (const cliente of clientes) {
        const fila = tbodyClientes.insertRow();
        fila.classList.add(cliente.activo ? "activo" : "inactivo");

        for (const valor of [
            cliente.id,
            cliente.rif,
            cliente.nombre,
            cliente.nombre_con,
            cliente.cedula_con,
            cliente.telefono_con,
            cliente.email_con
        ]) {
            fila.insertCell().textContent = valor ?? "";
        }

        const celdaAccion = fila.insertCell();
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = cliente.activo ? "Desactivar" : "Activar";
        boton.addEventListener("click", async () => {
            boton.disabled = true;
            try {
                await solicitarClientes({
                    method: "PUT",
                    id: cliente.id,
                    data: { ...clienteParaApi(cliente), activo: cliente.activo ? 0 : 1 }
                });
                cliente.activo = !cliente.activo;
                renderizarClientes();
                mostrarMensaje(`Cliente ${cliente.activo ? "activado" : "desactivado"}.`);
            } catch (error) {
                boton.disabled = false;
                mostrarMensaje(error.message, true);
            }
        });
        celdaAccion.append(boton);
    }

    actualizarSelector();
    cargarDatosContacto(clientes.find(cliente => String(cliente.id) === selectCliente.value));
}

async function cargarClientes() {
    try {
        const resultado = await solicitarClientes();
        clientes = Array.isArray(resultado)
            ? resultado.map(cliente => ({
                ...cliente,
                id: Number(cliente.id),
                activo: cliente.activo === true || cliente.activo === 1 || cliente.activo === "1"
            }))
            : [];
        renderizarClientes();
        mostrarMensaje(clientes.length ? "" : "No hay clientes registrados.");
    } catch (error) {
        mostrarMensaje(`No se pudieron cargar los clientes: ${error.message}`, true);
    }
}

formAgregarCliente.addEventListener("submit", async event => {
    event.preventDefault();
    const datos = Object.fromEntries(new FormData(formAgregarCliente));
    for (const campo of ["nombre", "rif", "nombre_con", "cedula_con", "telefono_con", "email_con"]) {
        datos[campo] = datos[campo].trim();
    }
    datos.activo = 1;

    const boton = formAgregarCliente.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        await solicitarClientes({ method: "POST", data: datos });
        formAgregarCliente.reset();
        await cargarClientes();
        mostrarMensaje("Cliente creado correctamente.");
    } catch (error) {
        mostrarMensaje(error.message, true);
    } finally {
        boton.disabled = false;
    }
});

selectCliente.addEventListener("change", () => {
    const cliente = clientes.find(item => String(item.id) === selectCliente.value);
    cargarDatosContacto(cliente);
});

formModificarCliente.addEventListener("submit", async event => {
    event.preventDefault();
    const cliente = clientes.find(item => String(item.id) === selectCliente.value);
    if (!cliente) {
        mostrarMensaje("Selecciona un cliente válido.", true);
        return;
    }

    const contacto = Object.fromEntries(new FormData(formModificarCliente));
    const datos = clienteParaApi(cliente);
    for (const campo of ["nombre_con", "cedula_con", "telefono_con", "email_con"]) {
        datos[campo] = contacto[campo].trim();
    }

    const boton = formModificarCliente.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        await solicitarClientes({ method: "PUT", id: cliente.id, data: datos });
        await cargarClientes();
        selectCliente.value = String(cliente.id);
        cargarDatosContacto(clientes.find(item => item.id === cliente.id));
        mostrarMensaje("Datos del cliente actualizados correctamente.");
    } catch (error) {
        mostrarMensaje(error.message, true);
    } finally {
        boton.disabled = false;
    }
});

cargarClientes();

const VENTAS_API = "../controllers/ventas.php";
const COMPRAS_API = "../controllers/compras.php";
const CLIENTES_API = "../controllers/clientes.php";
const PROVEEDORES_API = "../controllers/proveedores.php";
let clientesActivos = [];
let ventasRegistradas = [];
let proveedoresActivos = [];
let comprasRegistradas = [];

async function solicitarApi(url, opciones = {}) {
    const response = await fetch(url, {
        ...opciones,
        headers: { Accept: "application/json", ...(opciones.headers || {}) }
    });
    const texto = (await response.text()).replace(/^Conexion establecida\s*/, "").trim();
    let resultado;

    try {
        resultado = JSON.parse(texto);
    } catch {
        throw new Error(response.ok
            ? "El servidor devolvió una respuesta que no es JSON válido."
            : `Error HTTP ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(resultado.error || `Error HTTP ${response.status}`);
    }

    return resultado;
}

function mostrarMensajeVenta(mensaje, esError = false) {
    const elemento = document.getElementById("mensajeVenta");
    elemento.textContent = mensaje;
    elemento.setAttribute("role", esError ? "alert" : "status");
}

function mostrarMensajeCompra(mensaje, esError = false) {
    const elemento = document.getElementById("mensajeCompra");
    elemento.textContent = mensaje;
    elemento.setAttribute("role", esError ? "alert" : "status");
}

function llenarSelectClientes() {
        const select = document.querySelector('#venta select[name="idEntidad"]');
        select.replaceChildren(new Option("Seleccione un cliente", ""));

        for (const cliente of clientesActivos) {
            select.add(new Option(`${cliente.id} - ${cliente.nombre}`, cliente.id));
        }
    }

    function llenarSelectProveedores() {
        const select = document.querySelector('#compra select[name="idEntidad"]');
        select.replaceChildren(new Option("Seleccione un proveedor", ""));

        for (const proveedor of proveedoresActivos) {
            select.add(new Option(`${proveedor.id} - ${proveedor.nombre}`, proveedor.id));
        }
    }

    async function cargarClientesActivos() {
        const resultado = await solicitarApi(CLIENTES_API);
        clientesActivos = Array.isArray(resultado)
            ? resultado.filter(cliente => cliente.activo === true || cliente.activo === 1 || cliente.activo === "1")
            : [];
        llenarSelectClientes();
    }

    async function cargarProveedoresActivos() {
        const resultado = await solicitarApi(PROVEEDORES_API);
        proveedoresActivos = Array.isArray(resultado)
            ? resultado.filter(proveedor => proveedor.activo === true || proveedor.activo === 1 || proveedor.activo === "1")
            : [];
        llenarSelectProveedores();
    }

    function normalizarCompra(compra) {
        let detalles = compra.detalles;
        if (typeof detalles === "string") {
            try {
                detalles = JSON.parse(detalles);
            } catch {
                throw new Error(`No se pudieron leer los detalles de la compra ${compra.compra_id}.`);
            }
        }

        detalles = Array.isArray(detalles) ? detalles : [];
        const total = detalles.reduce((suma, detalle) => {
            const subtotal = Number(detalle.subtotal);
            return suma + (Number.isFinite(subtotal)
                ? subtotal
                : Number(detalle.cantidad_kg) * Number(detalle.precio));
        }, 0);

        return {
            id: Number(compra.compra_id),
            tipo: "compra",
            nombreEntidad: compra.proveedor || "",
            fecha: compra.fecha,
            items: detalles.map(detalle => ({
                nombre: detalle.producto,
                kg: Number(detalle.cantidad_kg)
            })),
            totalCompra: total,
            pagada: compra.pagado === true || compra.pagado === 1 || compra.pagado === "1",
            tasaBs: null
        };
    }

    function normalizarVenta(venta) {
        let detalles = venta.detalles;
        if (typeof detalles === "string") {
            try {
                detalles = JSON.parse(detalles);
            } catch {
                throw new Error(`No se pudieron leer los detalles de la venta ${venta.venta_id}.`);
            }
        }

        detalles = Array.isArray(detalles) ? detalles : [];
        const total = detalles.reduce((suma, detalle) => {
            const subtotal = Number(detalle.subtotal);
            return suma + (Number.isFinite(subtotal)
                ? subtotal
                : Number(detalle.cantidad_kg) * Number(detalle.precio_bs));
        }, 0);

        return {
            id: Number(venta.venta_id),
            tipo: "venta",
            nombreEntidad: venta.cliente || "",
            fecha: venta.fecha,
            items: detalles.map(detalle => ({
                nombre: detalle.producto,
                kg: Number(detalle.cantidad_kg)
            })),
            totalBs: total,
            pagada: venta.pagado === true || venta.pagado === 1 || venta.pagado === "1",
            tasaBs: null
        };
    }

    async function cargarCompras() {
        const resultado = await solicitarApi(COMPRAS_API);
        comprasRegistradas = Array.isArray(resultado) ? resultado.map(normalizarCompra) : [];
        renderizarHistorial(document.getElementById("filtroTipo").value);
    }

    async function cargarVentas() {
        const resultado = await solicitarApi(VENTAS_API);
        ventasRegistradas = Array.isArray(resultado) ? resultado.map(normalizarVenta) : [];
        renderizarHistorial(document.getElementById("filtroTipo").value);
}

// Agrega otro item de cafe para las ventas o compras
function agregarItem(contenedorId) {
    // Obtiene la referencia del contenedor
    const contenedor = document.getElementById(contenedorId);

    // Determina si es venta o compra
    const esVenta = contenedorId === "itemsVenta";
    const moneda = esVenta ? "Bs" : "$";

    const div = document.createElement("div");
    div.className = "item-fila";

    // Crea im desplegable para seleccionar el tipo de cafe
    const selectCafe = document.createElement("select");
    selectCafe.innerHTML = '<option value="">Seleccione</option>';
    for (const c of App.cafes) {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nombre;
        selectCafe.appendChild(opt);
    }

    // Crea el input de la cantidad en kg
    const inputKg = document.createElement("input");
    inputKg.type = "number";
    inputKg.min = "0";
    inputKg.step = "0.1";
    inputKg.placeholder = "kg";

    // Crea el input del precio
    const inputPrecio = document.createElement("input");
    inputPrecio.type = "number";
    inputPrecio.min = "0";
    inputPrecio.step = "0.01";
    inputPrecio.placeholder = "precio/kg";

    // Crea el subtotal
    const spanSubtotal = document.createElement("span");
    spanSubtotal.className = "subtotal";
    spanSubtotal.textContent = `${moneda} 0.00`;

    // Crea el boton de quitar cafe
    const btnQuitar = document.createElement("button");
    btnQuitar.type = "button";
    btnQuitar.textContent = "X";
    btnQuitar.className = "btn-quitar";
    btnQuitar.addEventListener("click", () => {
        div.remove();
        calcularTotal(contenedorId);
    });

    // Calcula el total de cada producto conjunto de tipos de cafes comprados
    function calcSub() {
        // Obtiene los kilos y el precio
        const kg = parseFloat(inputKg.value) || 0;
        const precio = parseFloat(inputPrecio.value) || 0;
        
        const sub = kg * precio;
        spanSubtotal.textContent = `${moneda} ${sub.toFixed(2)}`;

        // Al final calcula el total hasta ahora
        calcularTotal(contenedorId);
    }

    // Se calcula cuando se hace la entrada de los kilos y el input
    inputKg.addEventListener("input", calcSub);
    inputPrecio.addEventListener("input", calcSub);

    div.appendChild(selectCafe);
    div.appendChild(inputKg);
    div.appendChild(inputPrecio);
    div.appendChild(spanSubtotal);
    div.appendChild(btnQuitar);
    contenedor.appendChild(div);
}

// Hace lo que dice le nombre xd
function calcularTotal(contenedorId) {
    const esVenta = contenedorId === "itemsVenta";
    const totalSpan = esVenta
        ? document.getElementById("totalVenta")
        : document.getElementById("totalCompra");
    const filas = document.querySelectorAll(`#${contenedorId} .item-fila`);
    let total = 0;
    for (const f of filas) {
        const sub = f.querySelector(".subtotal");
        if (sub) total += parseFloat(sub.textContent.replace(/[^0-9.-]/g, "")) || 0;
    }
    totalSpan.textContent = total.toFixed(2);
}

// Renderiza el formulario de compra o venta
async function registrarTransaccion(tipo, formId, contenedorId) {
    if (tipo === "venta") {
        await registrarVenta(formId, contenedorId);
        return;
    }
    if (tipo === "compra") {
        await registrarCompra(formId, contenedorId);
        return;
    }

    // Obtiene y guarda informacion del formulario
    const form = document.getElementById(formId);
    const data = Object.fromEntries(new FormData(form));

    // Validacion
    if (!data.idEntidad) { alert("Seleccione un negocio"); return; }
    if (!data.fecha) { alert("Seleccione una fecha"); return; }

    const filas = document.querySelectorAll(`#${contenedorId} .item-fila`);
    if (filas.length === 0) { alert("Agregue al menos un producto"); return; }

    const items = []; // Arreglo de los items de cafe seleccionados para su venta o compra
    for (const f of filas) {
        // Obtiene referencia al boton 
        const selects = f.querySelectorAll("select");
        // Obtenemos  referencia de los inputs del formulario
        const inputs = f.querySelectorAll("input[type=number]");
        const cafeId = parseInt(selects[0].value);

        // Valida que se haya ingresado un tipo de cafe
        if (!cafeId) { alert("Seleccione un tipo de cafe en todas las filas"); return; }
        const cafe = App.cafes.find(c => c.id === cafeId); // Almacena el tipo de cafe seleccionado

        // Guardamo tantolos kilos como el precio
        const kg = parseFloat(inputs[0].value) || 0;
        const precio = parseFloat(inputs[1].value) || 0;
        if (kg <= 0 || precio <= 0) { alert("Cantidad y precio deben ser mayores a 0"); return; }

        // Se pushea todo al arrelgo items
        items.push({ idCafe: cafeId, nombre: cafe.nombre, kg, precioKg: precio, subtotal: kg * precio });
    }

    const total = items.reduce((s, i) => s + i.subtotal, 0);

    // Guardara el id de el provedor o el cliente seleccionado
    const entidad = tipo === "compra"
        ? App.provedores.find(p => p.id === Number(data.idEntidad))
        : App.clientes.find(c => c.id === Number(data.idEntidad));

    // Valida que se haya seleccionado uno de estos dos
    if (!entidad || !entidad.activo) {
        alert(`El ${tipo === "compra" ? "proveedor" : "cliente"} seleccionado esta desactivado`);
        return;
    }

    // Obtiene el nombre de la entidad
    const nombreEntidad = tipo === "compra" ? entidad.nombreProvedor : entidad.nombreCliente;

    // Se guarda toda la informacion de la trasaccion en un objeto
    const transaccion = {
        id: App.transacciones.length + 1,
        tipo,
        idEntidad: Number(data.idEntidad),
        nombreEntidad,
        fecha: data.fecha,
        items,
        total,
        pagada: form.querySelector("[name=pagada]").checked
    };

    // Si es una venta tambien se guarda la tasa
    if (tipo === "venta") {
        transaccion.tasaBs = parseFloat(data.tasaBs) || 0;
        transaccion.totalBs = total;
        transaccion.total = transaccion.tasaBs > 0 ? total / transaccion.tasaBs : 0;
    }

    // Se pushea la nueva transaccion
    App.transacciones.push(transaccion);
    App.guardar();

    alert(`${tipo === "compra" ? "Compra" : "Venta"} registrada con exito`);
    
    // Se reinicia el formulario 
    form.reset();
    document.getElementById(contenedorId).innerHTML = "";
    const totalSpan = document.getElementById(contenedorId === "itemsCompra" ? "totalCompra" : "totalVenta");
    totalSpan.textContent = "0.00";
    form.querySelector("input[type=date]").value = new Date().toISOString().split("T")[0];
    document.querySelector(`#${contenedorId === "itemsCompra" ? "compra" : "venta"} [name=pagada]`).checked = true;
    if (tipo === "venta") document.querySelector("#venta [name=tasaBs]").value = "";
}

async function registrarCompra(formId, contenedorId) {
    const form = document.getElementById(formId);
    const datosFormulario = Object.fromEntries(new FormData(form));

    if (!datosFormulario.idEntidad) {
        mostrarMensajeCompra("Selecciona un proveedor activo.", true);
        return;
    }
    if (!datosFormulario.fecha) {
        mostrarMensajeCompra("Selecciona la fecha de la compra.", true);
        return;
    }

    const filas = document.querySelectorAll(`#${contenedorId} .item-fila`);
    if (filas.length === 0) {
        mostrarMensajeCompra("Agrega al menos un producto.", true);
        return;
    }

    const detalles = [];
    for (const fila of filas) {
        const productoId = Number(fila.querySelector("select").value);
        const cafe = App.cafes.find(item => item.id === productoId);
        const [inputKg, inputPrecio] = fila.querySelectorAll('input[type="number"]');
        const cantidadKg = Number(inputKg.value);
        const precio = Number(inputPrecio.value);

        if (!cafe) {
            mostrarMensajeCompra("Selecciona un tipo de café en cada fila.", true);
            return;
        }
        if (!Number.isFinite(cantidadKg) || cantidadKg <= 0 ||
            !Number.isFinite(precio) || precio <= 0) {
            mostrarMensajeCompra("Cantidad y precio deben ser mayores que cero.", true);
            return;
        }

        detalles.push({
            producto: cafe.nombre.toUpperCase(),
            cantidad_kg: cantidadKg,
            precio
        });
    }

    const proveedor = proveedoresActivos.find(item => Number(item.id) === Number(datosFormulario.idEntidad));
    if (!proveedor) {
        mostrarMensajeCompra("El proveedor seleccionado no está activo o ya no existe.", true);
        return;
    }

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        await solicitarApi(COMPRAS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                compra: {
                    id_prov: Number(proveedor.id),
                    fecha: datosFormulario.fecha,
                    pagado: form.querySelector('[name="pagada"]').checked ? 1 : 0
                },
                detalles
            })
        });

        form.reset();
        document.getElementById(contenedorId).replaceChildren();
        document.getElementById("totalCompra").textContent = "0.00";
        form.querySelector('input[type="date"]').value = new Date().toISOString().split("T")[0];
        form.querySelector('[name="pagada"]').checked = true;
        mostrarMensajeCompra("Compra registrada correctamente.");
        await cargarCompras();
    } catch (error) {
        mostrarMensajeCompra(error.message, true);
    } finally {
        boton.disabled = false;
    }
}

async function registrarVenta(formId, contenedorId) {
    const form = document.getElementById(formId);
    const datosFormulario = Object.fromEntries(new FormData(form));
    const tasa = Number(datosFormulario.tasaBs);

    if (!datosFormulario.idEntidad) {
        mostrarMensajeVenta("Selecciona un cliente activo.", true);
        return;
    }
    if (!datosFormulario.fecha) {
        mostrarMensajeVenta("Selecciona la fecha de la venta.", true);
        return;
    }
    if (!Number.isFinite(tasa) || tasa <= 0) {
        mostrarMensajeVenta("La tasa BCV debe ser mayor que cero.", true);
        return;
    }

    const filas = document.querySelectorAll(`#${contenedorId} .item-fila`);
    if (filas.length === 0) {
        mostrarMensajeVenta("Agrega al menos un producto.", true);
        return;
    }

    const detalles = [];
    for (const fila of filas) {
        const productoId = Number(fila.querySelector("select").value);
        const cafe = App.cafes.find(item => item.id === productoId);
        const [inputKg, inputPrecio] = fila.querySelectorAll('input[type="number"]');
        const cantidadKg = Number(inputKg.value);
        const precioBs = Number(inputPrecio.value);

        if (!cafe) {
            mostrarMensajeVenta("Selecciona un tipo de café en cada fila.", true);
            return;
        }
        if (!Number.isFinite(cantidadKg) || cantidadKg <= 0 ||
            !Number.isFinite(precioBs) || precioBs <= 0) {
            mostrarMensajeVenta("Cantidad y precio deben ser mayores que cero.", true);
            return;
        }

        detalles.push({
            producto: cafe.nombre.toUpperCase(),
            cantidad_kg: cantidadKg,
            precio_bs: precioBs
        });
    }

    const cliente = clientesActivos.find(item => Number(item.id) === Number(datosFormulario.idEntidad));
    if (!cliente) {
        mostrarMensajeVenta("El cliente seleccionado no está activo o ya no existe.", true);
        return;
    }

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
        await solicitarApi(VENTAS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                venta: {
                    id_cli: Number(cliente.id),
                    fecha: datosFormulario.fecha,
                    tasa_bcv: tasa,
                    pagado: form.querySelector('[name="pagada"]').checked ? 1 : 0
                },
                detalles
            })
        });

        form.reset();
        document.getElementById(contenedorId).replaceChildren();
        document.getElementById("totalVenta").textContent = "0.00";
        form.querySelector('input[type="date"]').value = new Date().toISOString().split("T")[0];
        form.querySelector('[name="pagada"]').checked = true;
        mostrarMensajeVenta("Venta registrada correctamente.");
        await cargarVentas();
    } catch (error) {
        mostrarMensajeVenta(error.message, true);
    } finally {
        boton.disabled = false;
    }
}

// Renderiza la tabla del historial de compras y ventas
function renderizarHistorial(filtro) {
    const tbody = document.querySelector("#tablaHistorial");
    tbody.innerHTML = "";
    const comprasLocales = App.transacciones.filter(t => t.tipo === "compra").map(t => ({
        ...t,
        id: `LOCAL-C-${t.id}`,
        tipo: "compra",
        totalCompra: t.total
    }));
    let datos = [...ventasRegistradas, ...comprasRegistradas, ...comprasLocales].sort((a, b) => {
        const porFecha = String(b.fecha).localeCompare(String(a.fecha));
        return porFecha || String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
    });
    if (filtro && filtro !== "todas") datos = datos.filter(t => t.tipo === filtro);

    if (datos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='8'>No hay transacciones registradas</td></tr>";
        return;
    }

    for (const t of datos) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = t.id;
        fila.insertCell().textContent = t.tipo === "compra" ? "Compra" : "Venta";
        fila.insertCell().textContent = t.nombreEntidad;
        fila.insertCell().textContent = t.fecha;
        fila.insertCell().textContent = (t.items || []).map(i => `${i.kg}kg ${i.nombre}`).join(", ");
        if (t.tipo === "venta") {
            fila.insertCell().textContent = `Bs ${Number(t.totalBs).toFixed(2)}`;
        } else {
            fila.insertCell().textContent = `$${Number(t.totalCompra ?? t.total).toFixed(2)}`;
        }
        fila.insertCell().textContent = t.pagada ? "Si" : "No";
        fila.insertCell().textContent = t.tasaBs === null || t.tasaBs === undefined
            ? "—"
            : Number(t.tasaBs).toFixed(2);
    }
}

// Main
document.addEventListener("DOMContentLoaded", () => {

    document.querySelector("#compra input[type=date]").value = new Date().toISOString().split("T")[0];
    document.querySelector("#venta input[type=date]").value = new Date().toISOString().split("T")[0];

    configurarTabs((tab) => {
        if (tab === "historial") renderizarHistorial(document.getElementById("filtroTipo").value);
    });

    // Obtienen la informacion de cualquiera de los dos formularios y los guarda en sus respectivos arreglo
    document.getElementById("formCompra").addEventListener("submit", (e) => {
        e.preventDefault();
        registrarTransaccion("compra", "formCompra", "itemsCompra").catch(error => {
            mostrarMensajeCompra(error.message, true);
        });
    });

    document.getElementById("formVenta").addEventListener("submit", (e) => {
        e.preventDefault();
        registrarTransaccion("venta", "formVenta", "itemsVenta").catch(error => {
            mostrarMensajeVenta(error.message, true);
        });
    });

    // Renderiza nuevamente la tabla segun el filtro
    document.getElementById("filtroTipo").addEventListener("change", () => {
        renderizarHistorial(document.getElementById("filtroTipo").value);
    });

    cargarClientesActivos().catch(error => {
        mostrarMensajeVenta(`No se pudieron cargar los clientes: ${error.message}`, true);
    });
    cargarProveedoresActivos().catch(error => {
        mostrarMensajeCompra(`No se pudieron cargar los proveedores: ${error.message}`, true);
    });
    cargarCompras().catch(error => {
        document.getElementById("mensajeHistorial").textContent =
            `No se pudieron cargar las compras: ${error.message}`;
        document.getElementById("mensajeHistorial").setAttribute("role", "alert");
    });
    cargarVentas().catch(error => {
        document.getElementById("mensajeHistorial").textContent =
            `No se pudieron cargar las ventas: ${error.message}`;
        document.getElementById("mensajeHistorial").setAttribute("role", "alert");
    });
});

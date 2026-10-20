const REPORTES_API = "../controllers/reportes.php";
const formatoNumero = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatearNumero(valor) {
    const numero = Number(valor);
    return formatoNumero.format(Number.isFinite(numero) ? numero : 0);
}

function agregarFilaVacia(tbody, columnas, mensaje) {
    const fila = tbody.insertRow();
    const celda = fila.insertCell();
    celda.colSpan = columnas;
    celda.textContent = mensaje;
}

function estaPagado(valor) {
    return valor === true || valor === 1 || valor === "1";
}

function renderizarCtasCobrar(cuentas) {
    const tbody = document.getElementById("tablaCtasCobrar");
    tbody.replaceChildren();

    const totalPendienteBs = cuentas.reduce((total, cuenta) => total + Number(cuenta.total_bs || 0), 0);
    const totalPendienteUsd = cuentas.reduce((total, cuenta) => total + Number(cuenta.total_usd || 0), 0);
    document.getElementById("resumenCtasCobrar").textContent =
        `Cuentas pendientes: ${cuentas.length} · Total: Bs ${formatearNumero(totalPendienteBs)} ` +
        `($${formatearNumero(totalPendienteUsd)})`;

    if (cuentas.length === 0) {
        agregarFilaVacia(tbody, 5, "No hay cuentas por cobrar");
        return;
    }

    for (const cuenta of cuentas) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = cuenta.venta_id;
        fila.insertCell().textContent = cuenta.cliente || "Sin cliente";
        fila.insertCell().textContent = cuenta.fecha;
        fila.insertCell().textContent = (Array.isArray(cuenta.detalles) ? cuenta.detalles : [])
            .map(detalle => `${detalle.producto} (${formatearNumero(detalle.cantidad_kg)} kg)`)
            .join(", ");
        fila.insertCell().textContent = `Bs ${formatearNumero(cuenta.total_bs)}`;
    }
}

function renderizarTopCafes(cafes) {
    const tbody = document.getElementById("tablaTopCafes");
    tbody.replaceChildren();

    if (cafes.length === 0) {
        agregarFilaVacia(tbody, 5, "No hay datos de cafés");
        return;
    }

    cafes.forEach((cafe, indice) => {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = indice + 1;
        fila.insertCell().textContent = cafe.producto;
        fila.insertCell().textContent = `${formatearNumero(cafe.kg_comprados)} kg`;
        fila.insertCell().textContent = `${formatearNumero(cafe.kg_vendidos)} kg`;
        fila.insertCell().textContent =
            `${formatearNumero(Number(cafe.kg_comprados) + Number(cafe.kg_vendidos))} kg`;
    });
}

function renderizarUltimosMov(movimientos) {
    const tbody = document.getElementById("tablaUltimosMov");
    tbody.replaceChildren();

    if (movimientos.length === 0) {
        agregarFilaVacia(tbody, 6, "No hay movimientos");
        return;
    }

    for (const movimiento of movimientos) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = movimiento.id;
        fila.insertCell().textContent = movimiento.tipo === "compra" ? "Compra" : "Venta";
        fila.insertCell().textContent = movimiento.negocio || "Sin negocio";
        fila.insertCell().textContent = movimiento.fecha;
        fila.insertCell().textContent = movimiento.tipo === "venta"
            ? `Bs ${formatearNumero(movimiento.total_bs)}`
            : `$${formatearNumero(movimiento.total)}`;
        fila.insertCell().textContent = estaPagado(movimiento.pagado) ? "Sí" : "No";
    }
}

async function cargarReportes() {
    const mensaje = document.getElementById("mensajeReportes");
    mensaje.textContent = "Cargando reportes...";
    mensaje.setAttribute("role", "status");

    try {
        const respuesta = await fetch(REPORTES_API, {
            headers: { Accept: "application/json" }
        });
        const texto = await respuesta.text();
        let reportes;

        try {
            reportes = JSON.parse(texto);
        } catch {
            throw new Error(respuesta.ok
                ? "El servidor devolvió una respuesta no válida."
                : `Error HTTP ${respuesta.status}`);
        }

        if (!respuesta.ok) {
            throw new Error(reportes.error || `Error HTTP ${respuesta.status}`);
        }

        renderizarCtasCobrar(Array.isArray(reportes.cuentas_por_cobrar)
            ? reportes.cuentas_por_cobrar
            : []);
        renderizarTopCafes(Array.isArray(reportes.top_cafes) ? reportes.top_cafes : []);
        renderizarUltimosMov(Array.isArray(reportes.ultimos_movimientos)
            ? reportes.ultimos_movimientos
            : []);
        mensaje.textContent = "";
    } catch (error) {
        mensaje.textContent = `No se pudieron cargar los reportes: ${error.message}`;
        mensaje.setAttribute("role", "alert");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    configurarTabs((tab) => {
        if (tab === "ctasCobrar") cargarReportes();
    });

    cargarReportes();
});

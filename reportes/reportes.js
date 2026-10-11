// Filtra segun un periodo de tiempo
function filtrarPorPeriodo(transacciones, periodo) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return transacciones.filter(t => {
        // Consigue la fecha de hoy
        const fecha = new Date(t.fecha + "T00:00:00");

        // Hoy
        if (periodo === "hoy") return fecha >= hoy;

        // La ultima semana
        if (periodo === "semana") {
            const semanaAtras = new Date(hoy);
            semanaAtras.setDate(semanaAtras.getDate() - 7);
            return fecha >= semanaAtras;
        }

        // Mes
        if (periodo === "mes") {
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        }

        return true; // todas
    });
}

// Renderiza el tab de las ganancias
function renderizarGanancias() {

    // Obtenemos referencia del periodo y el filtro por negocio
    const periodo = document.getElementById("filtroPeriodo").value;
    const filtroNegocio = document.getElementById("filtroNegocioGanancias").value;

    // Filtra los negocios segun el periodo
    let datos = filtrarPorPeriodo(App.transacciones, periodo);

    // Filtra los negocios segun el filtro de negocio
    if (filtroNegocio !== "todas") {
        datos = datos.filter(t => t.idEntidad === Number(filtroNegocio));
    }

    // Filtra y divide las compras y ventas
    const compras = datos.filter(t => t.tipo === "compra");
    const ventas = datos.filter(t => t.tipo === "venta");

    // Calcula el total de las compras y las ventas
    const totalCompras = compras.reduce((s, t) => s + t.total, 0);
    const totalVentas = ventas.reduce((s, t) => s + t.total, 0);

    // Calcula las ganancias
    const ganancia = totalVentas - totalCompras;
    let totalVentasBs = 0;

    // Inserta la informacion de las ganancias
    document.getElementById("resumenGanancias").innerHTML = `
        <div class="resumen-card">
            <span>Total Compras: <strong>$${totalCompras.toFixed(2)}</strong></span>
            <span>Total Ventas: <strong>$${totalVentas.toFixed(2)}</strong></span>
x            <span>Ventas (Bs): <strong>Bs ${totalVentasBs.toFixed(2)}</strong></span>
            <span>Ganancia: <strong style="color:${ganancia >= 0 ? "green" : "red"}">$${ganancia.toFixed(2)}</strong></span>
        </div>
    `;

    // Obtiene la referencia de la tabla de ganancias
    const tbody = document.getElementById("tablaGanancias");
    tbody.innerHTML = "";

    const negocios = {};

    // Recorre el array de datos filtrados
    for (const t of datos) {

        // Si el negocio no existe en el arreglo negocios aun lo crea compra con compras  y ventas a 0
        if (!negocios[t.idEntidad]) negocios[t.idEntidad] = { nombre: t.nombreEntidad, compras: 0, ventas: 0 };

        // Si es un compra lo suma al total de compras si no al total de ventas
        if (t.tipo === "compra") negocios[t.idEntidad].compras += t.total;
        else {
            negocios[t.idEntidad].ventas += t.total;
            if (t.totalBs) totalVentasBs += t.totalBs;
        }
    }

    // Se inserta el negocio en la tabla
    for (const n of Object.values(negocios)) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = n.nombre;
        fila.insertCell().textContent = `$${n.compras.toFixed(2)}`;
        fila.insertCell().textContent = `$${n.ventas.toFixed(2)}`;
        const g = n.ventas - n.compras;
        const celda = fila.insertCell();
        celda.textContent = `$${g.toFixed(2)}`;
        celda.style.color = g >= 0 ? "green" : "red";
    }

    if (Object.keys(negocios).length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No hay datos en este periodo</td></tr>";
    }
}

function renderizarCtasCobrar() {
    const tbody = document.getElementById("tablaCtasCobrar");
    tbody.innerHTML = "";

    const pendientes = App.transacciones.filter(t => t.tipo === "venta" && !t.pagada);
    const totalPendiente = pendientes.reduce((s, t) => s + t.total, 0);
    const totalPendienteBs = pendientes.reduce((s, t) => s + (t.totalBs || 0), 0);

    document.getElementById("resumenCtasCobrar").innerHTML = `
        <div class="resumen-card">
            <span>Total por cobrar: <strong>Bs ${totalPendienteBs.toFixed(2)}</strong></span>
            <span>$${totalPendiente.toFixed(2)}</span>
            <span>Clientes con deuda: <strong>${pendientes.length}</strong></span>
        </div>
    `;

    if (pendientes.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>No hay cuentas por cobrar</td></tr>";
        return;
    }

    for (const t of pendientes) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = t.id;
        fila.insertCell().textContent = t.nombreEntidad;
        fila.insertCell().textContent = t.fecha;
        fila.insertCell().textContent = t.items.map(i => `${i.kg}kg ${i.nombre}`).join(", ");
        fila.insertCell().textContent = `Bs ${(t.totalBs || 0).toFixed(2)}`;
    }
}

function renderizarTopCafes() {
    const tbody = document.getElementById("tablaTopCafes");
    tbody.innerHTML = "";

    const stats = {};
    for (const c of App.cafes) stats[c.id] = { nombre: c.nombre, compras: 0, ventas: 0 };

    for (const t of App.transacciones) {
        for (const item of t.items) {
            if (!stats[item.idCafe]) continue;
            if (t.tipo === "compra") stats[item.idCafe].compras += item.kg;
            else stats[item.idCafe].ventas += item.kg;
        }
    }

    const ordenado = Object.values(stats).sort((a, b) => (b.compras + b.ventas) - (a.compras + a.ventas));

    if (ordenado.every(s => s.compras === 0 && s.ventas === 0)) {
        tbody.innerHTML = "<tr><td colspan='5'>No hay datos de cafes</td></tr>";
        return;
    }

    let i = 1;
    for (const s of ordenado) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = i++;
        fila.insertCell().textContent = s.nombre;
        fila.insertCell().textContent = `${s.compras.toFixed(1)} kg`;
        fila.insertCell().textContent = `${s.ventas.toFixed(1)} kg`;
        fila.insertCell().textContent = `${(s.compras + s.ventas).toFixed(1)} kg`;
    }
}

function renderizarUltimosMov() {
    const tbody = document.getElementById("tablaUltimosMov");
    tbody.innerHTML = "";

    const recientes = [...App.transacciones].reverse().slice(0, 10);

    if (recientes.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>No hay movimientos</td></tr>";
        return;
    }

    for (const t of recientes) {
        const fila = tbody.insertRow();
        fila.insertCell().textContent = t.id;
        fila.insertCell().textContent = t.tipo === "compra" ? "Compra" : "Venta";
        fila.insertCell().textContent = t.nombreEntidad;
        fila.insertCell().textContent = t.fecha;
        if (t.tipo === "venta") {
            fila.insertCell().textContent = `Bs ${(t.totalBs || 0).toFixed(2)}`;
        } else {
            fila.insertCell().textContent = `$${t.total.toFixed(2)}`;
        }
        fila.insertCell().textContent = t.pagada ? "Si" : "No";
    }
}

function llenarSelectNegocios() {
    const select = document.getElementById("filtroNegocioGanancias");
    select.innerHTML = '<option value="todas">Todos</option>';
    const vistos = new Set();
    for (const t of App.transacciones) {
        if (!vistos.has(t.idEntidad)) {
            vistos.add(t.idEntidad);
            const opt = document.createElement("option");
            opt.value = t.idEntidad;
            opt.textContent = t.nombreEntidad;
            select.appendChild(opt);
        }
    }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
    // Renderiza la pestaña pertinente
    configurarTabs((tab) => {
        if (tab === "ganancias") {
            llenarSelectNegocios();
            renderizarGanancias();
        }
        if (tab === "ctasCobrar") renderizarCtasCobrar();
        if (tab === "topCafes") renderizarTopCafes();
        if (tab === "ultimosMov") renderizarUltimosMov();
    });

    // Obtiene referencia del filtro por periodo y por ganancia
    document.getElementById("filtroPeriodo").addEventListener("change", renderizarGanancias);
    document.getElementById("filtroNegocioGanancias").addEventListener("change", renderizarGanancias);

    // Renderiza el primer tab
    renderizarGanancias();
});

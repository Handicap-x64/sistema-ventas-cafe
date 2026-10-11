// Renderiza el boton de select segun el nombre singular
function llenarSelect(idContenedor, datos, nombreSingular, campoNombre) { 
    // Obtiene referencia del objeto seleccionado (provedores o clientes)
    const select = document.querySelector(`#${idContenedor} select[name="idEntidad"]`);

    const activos = datos.filter(d => d.activo); // Filtra solo los activos
    
    // Inserta 
    select.innerHTML = `<option value="">Seleccione un ${nombreSingular}</option>`;
    for (const d of activos) {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.id} - ${d[campoNombre]}`;
        select.appendChild(opt);
    }
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
function registrarTransaccion(tipo, formId, contenedorId) {

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

// Renderiza la tabla del historial de compras y ventas
function renderizarHistorial(filtro) {
    const tbody = document.querySelector("#tablaHistorial");
    tbody.innerHTML = "";
    let datos = [...App.transacciones].reverse();
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
        fila.insertCell().textContent = t.items.map(i => `${i.kg}kg ${i.nombre}`).join(", ");
        if (t.tipo === "venta") {
            fila.insertCell().textContent = `Bs ${t.totalBs.toFixed(2)}`;
        } else {
            fila.insertCell().textContent = `$${t.total.toFixed(2)}`;
        }
        fila.insertCell().textContent = t.pagada ? "Si" : "No";
        if (t.tipo === "venta") {
            fila.insertCell().textContent = `${t.tasaBs.toFixed(2)}`;
        }
    }
}

// Main
document.addEventListener("DOMContentLoaded", () => {

    // Se crean las tabs de compras y ventas
    llenarSelect("compra", App.provedores, "proveedor", "nombreProvedor");
    llenarSelect("venta", App.clientes, "cliente", "nombreCliente");

    document.querySelector("#compra input[type=date]").value = new Date().toISOString().split("T")[0];
    document.querySelector("#venta input[type=date]").value = new Date().toISOString().split("T")[0];

    configurarTabs((tab) => {
        if (tab === "historial") renderizarHistorial(document.getElementById("filtroTipo").value);
    });

    // Obtienen la informacion de cualquiera de los dos formularios y los guarda en sus respectivos arreglo
    document.getElementById("formCompra").addEventListener("submit", (e) => {
        e.preventDefault();
        registrarTransaccion("compra", "formCompra", "itemsCompra");
    });

    document.getElementById("formVenta").addEventListener("submit", (e) => {
        e.preventDefault();
        registrarTransaccion("venta", "formVenta", "itemsVenta");
    });

    // Renderiza nuevamente la tabla segun el filtro
    document.getElementById("filtroTipo").addEventListener("change", () => {
        renderizarHistorial(document.getElementById("filtroTipo").value);
    });
});

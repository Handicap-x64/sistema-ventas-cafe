// Recibe el arreglo con todos los datos (proveedores o cliente) y le suma 1 al ID mas alto
function proximoId(datos) {
    return datos.length ? Math.max(...datos.map(d => d.id)) + 1 : 1;
}

// Renderica los provedores o clientes en su filas de una tabla
function renderizarTabla(tbody, datos) {
    tbody.innerHTML = "";

    for (const d of datos) {
        const fila = tbody.insertRow();
        
        // Le añade la clase inactivo o activo segun el booleno "activo" 
        fila.classList.add(d.activo ? "activo" : "inactivo"); 

        for (const [key, valor] of Object.entries(d)) {
            if (key === "activo") continue; // Se salte la key activo porque no queremos mostrar su valor
            fila.insertCell().textContent = valor;
        }

        // Se inserta el boton de activar y desactivar
        const celdaBoton = fila.insertCell();
        const bt = document.createElement("button");
        bt.textContent = d.activo ? "Desactivar" : "Activar";

        // Cambia entre activo e inactivo cuando se presiona el botob
        bt.addEventListener("click", () => {
            d.activo = !d.activo;
            fila.classList.toggle("activo");
            fila.classList.toggle("inactivo");
            bt.textContent = d.activo ? "Desactivar" : "Activar";
            App.guardar();
        });
        // Se anexa el boton a la celda creada
        celdaBoton.appendChild(bt);
    }
}

// Resalta el tab elegido y ejecuta el metodo que se le pase
function configurarTabs(alActivar) {

    // Selecciona todos los elementos tab y los recorre
    document.querySelectorAll(".tab").forEach(btn => {

        btn.addEventListener("click", () => {

            // Le quita clase
            document.querySelectorAll(".tab").forEach(b => b.classList.remove("activo"));
            document.querySelectorAll(".tab-contenido").forEach(c => c.classList.remove("activo"));
            btn.classList.add("activo");
            document.getElementById(btn.dataset.tab).classList.add("activo");

            // Si se paso una funcion se ejecutara teniendo como argumento el tabActivo
            // Luego cada pagina hace lo que quiere con esta funcion
            if (alActivar) alActivar(btn.dataset.tab);
        });
    });
}

// Renderiza y obtiene la informacion de el formulario para agregar provedores o clientes
function configurarFormAgregar(formId, datos, tbody, nombreSingular, campoNombre) {
    document.getElementById(formId).addEventListener("submit", (e) => {
        e.preventDefault();

        // Obtenemos la informacion ingresada
        const data = Object.fromEntries(new FormData(e.target));
        data.rif = data.rif.trim();

        // Validamos que RIF cumpla con el formato solicitado
        const rifRegex = /^[JGVEP]-\d{8,9}-\d$/;
        if (!rifRegex.test(data.rif)) {
            alert("Formato de RIF inválido. Ej: J-12345678-0");
            return;
        }

        // Validamos que no hayan  RIF's repetidos
        if (datos.some(d => d.rif === data.rif)) {
            alert(`Ya existe un ${nombreSingular} con ese RIF`);
            return;
        }

        if (datos.some(d => d.correo === data.correo)) {
            alert(`Ya existe un ${nombreSingular} con ese correo`);
            return;
        }

        if (datos.some(d => d.telefonoContacto === data.telefonoContacto)) {
            alert(`Ya existe un ${nombreSingular} con ese telefono`);
            return;
        }

        if (datos.some(d => d.cedulaContacto === data.cedulaContacto)) {
            alert(`Ya existe un ${nombreSingular} con ese telefono`);
            return;
        }

        // Pusheamos todo a su respectivo arreglo (provedores o clientes)
        datos.push({
            id: proximoId(datos),
            rif: data.rif,
            [campoNombre]: data[campoNombre].toUpperCase(),
            nombreContacto: data.nombreContacto.toUpperCase(),
            cedulaContacto: data.cedulaContacto,
            telefonoContacto: data.telefonoContacto,
            correo: data.correo,
            activo: true
        });

        // Rengeriza nuevamente la tabla
        renderizarTabla(tbody, datos);
        App.guardar();
        e.target.reset(); // Reincia el formulario
    });
}

// MODIFICAR PROVEDORES O CLIENTES
// Renderiza y obtiene la informacion del formulario para modificar clientes o usuarios
function configurarFormModificar(formId, datos, tbody) {
    document.getElementById(formId).addEventListener("submit", (e) => {
        e.preventDefault();

        // Obtenemos el input
        const data = Object.fromEntries(new FormData(e.target));
        const p = datos.find(d => d.id === Number(data.idEntidad));

        
        if (p) {
            p.nombreContacto = data.nombreContacto;
            p.cedulaContacto = data.cedulaContacto;
            p.telefonoContacto = data.t
            p.correo = data.correo;

            renderizarTabla(tbody, datos); // Renderiza nuevamente la tabla
            App.guardar();
        }
    }); 
}

// Renderiza un desplegable para seleccionar provedores o clientes segun lo ameritado
function actualizarSelect(selectName, datos, nombreSingular, campoNombre) {
    const select = document.querySelector(`[name="${selectName}"]`);
    select.innerHTML = `<option value="">Seleccione un ${nombreSingular}</option>`;
    for (const d of datos) {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.id} - ${d[campoNombre]}`;
        select.appendChild(opt);
    }
}

const tbody = document.querySelector("#tablaClientes tbody");

renderizarTabla(tbody, App.clientes);
configurarTabs((tab) => {
    if (tab === "modificar") actualizarSelect("idEntidad", App.clientes, "cliente", "nombreCliente");
});
configurarFormAgregar("formAgregar", App.clientes, tbody, "cliente", "nombreCliente");
configurarFormModificar("formModificar", App.clientes, tbody);

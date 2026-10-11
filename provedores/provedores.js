const tbody = document.querySelector("#tablaProvedores tbody");

renderizarTabla(tbody, App.provedores);
configurarTabs((tab) => { // btn.dataset.tab
    // Si esta en la tabla modificar renderiza el desplegable de seleccionar un provedor
    if (tab === "modificar") actualizarSelect("idEntidad", App.provedores, "proveedor", "nombreProvedor");
});
configurarFormAgregar("formAgregar", App.provedores, tbody, "proveedor", "nombreProvedor");
configurarFormModificar("formModificar", App.provedores, tbody);

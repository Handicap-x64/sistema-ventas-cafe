// Mediante el objeto App se puede acceder a todos los objetos que almacenan la informacion en la pagina
const App = (() => {
  const cafes = [
    { id: 1, nombre: "Suave" },
    { id: 2, nombre: "Normal" },
    { id: 3, nombre: "Fuerte" },
  ];

  const provedores = [
    {
      id: 1, rif: "3434123234",
      nombreProvedor: "CAFE ARAUCA",
      nombreContacto: "RAUL MACHETE", cedulaContacto: "8565481",
      telefonoContacto: "04145565655", correo: "cafe.arauca@correo.com", activo: true
    },
    {
      id: 2, rif: "12123232",
      nombreProvedor: "CAFE MADRID",
      nombreContacto: "JUANITO ALCAHOFA", cedulaContacto: "32433453",
      telefonoContacto: "041234243", correo: "cafe.madrid@correo.com", activo: true
    }
  ];

  const clientes = [
    {
      id: 1, rif: "J-12345678-5",
      nombreCliente: "CAFE EL PROGRESO",
      nombreContacto: "MARIA LOPEZ", cedulaContacto: "12345678",
      telefonoContacto: "04161234567", correo: "progreso@correo.com", activo: true
    },
    {
      id: 2, rif: "J-87654321-0",
      nombreCliente: "PANADERIA CENTRAL",
      nombreContacto: "CARLOS PEREZ", cedulaContacto: "87654321",
      telefonoContacto: "04169876543", correo: "central@correo.com", activo: true
    }
  ];

  const transacciones = [];

  // Se guarda informacion en el localStorage

  // Carga la info
  function cargar() {
    // Se obtiene la informacion guar
    const guardado = localStorage.getItem("paradigma"); // Paradigma es el sitio en el se guardara la informacion
    if (!guardado) return;
    const datos = JSON.parse(guardado); 

    // Se guarda la informacion de los provedores, clientes y transacciones en sus respectivos arreglos
    provedores.length = 0; 
    provedores.push(...datos.provedores);
    clientes.length = 0;
    clientes.push(...datos.clientes);
    transacciones.length = 0;
    transacciones.push(...datos.transacciones);
  }

  // Guarda linfo
  function guardar() {
    localStorage.setItem("paradigma", JSON.stringify({
      provedores, clientes, transacciones
    }));
  }

  cargar();

  return { cafes, provedores, clientes, transacciones, guardar };
})();

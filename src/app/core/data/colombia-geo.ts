export interface Ciudad {
    nombre: string;
}

export interface Departamento {
    nombre: string;
    ciudades: Ciudad[];
}

export const COLOMBIA_DEPARTAMENTOS: Departamento[] = [
    { nombre: 'Amazonas', ciudades: [{ nombre: 'Leticia' }, { nombre: 'Puerto Amazonas' }, { nombre: 'Tarapacá' }] },
    { nombre: 'Antioquia', ciudades: [{ nombre: 'Medellín' }, { nombre: 'Bello' }, { nombre: 'Itagüí' }] },
    { nombre: 'Arauca', ciudades: [{ nombre: 'Arauca' }, { nombre: 'Saravena' }, { nombre: 'Tame' }] },
    { nombre: 'Atlántico', ciudades: [{ nombre: 'Barranquilla' }, { nombre: ' Soledad' }, { nombre: 'Malambo' }] },
    { nombre: 'Bogotá D.C.', ciudades: [{ nombre: 'Bogotá' }, { nombre: 'Cundinamarca' }, { nombre: 'Soacha' }] },
    { nombre: 'Bolívar', ciudades: [{ nombre: 'Cartagena' }, { nombre: 'Barrancabermeja' }, { nombre: 'Magangué' }] },
    { nombre: 'Boyacá', ciudades: [{ nombre: 'Tunja' }, { nombre: 'Duitama' }, { nombre: 'Sogamoso' }] },
    { nombre: 'Caldas', ciudades: [{ nombre: 'Manizales' }, { nombre: 'La Dorada' }, { nombre: 'Chinchiná' }] },
    { nombre: 'Caquetá', ciudades: [{ nombre: 'Florencia' }, { nombre: 'San Vicente del Caguán' }, { nombre: 'Cartagena del Chairá' }] },
    { nombre: 'Casanare', ciudades: [{ nombre: 'Yopal' }, { nombre: 'Aguazul' }, { nombre: 'Villanueva' }] },
    { nombre: 'Cauca', ciudades: [{ nombre: 'Popayán' }, { nombre: 'Santander de Quilichao' }, { nombre: 'Puerto Tejada' }] },
    { nombre: 'Cesar', ciudades: [{ nombre: 'Valledupar' }, { nombre: 'Aguachica' }, { nombre: 'La Jagua de Ibirico' }] },
    { nombre: 'Chocó', ciudades: [{ nombre: 'Quibdó' }, { nombre: 'Istmina' }, { nombre: 'Carmen del Darién' }] },
    { nombre: 'Córdoba', ciudades: [{ nombre: 'Montería' }, { nombre: 'Lorica' }, { nombre: 'Cereté' }] },
    { nombre: 'Cundinamarca', ciudades: [{ nombre: 'Zipaquirá' }, { nombre: 'Facatativá' }, { nombre: 'Girardot' }] },
    { nombre: 'Guainía', ciudades: [{ nombre: 'Inírida' }, { nombre: 'Puerto Colombia' }, { nombre: 'San Felipe' }] },
    { nombre: 'Guaviare', ciudades: [{ nombre: 'San José del Guaviare' }, { nombre: 'Miraflores' }, { nombre: 'Calamar' }] },
    { nombre: 'Huila', ciudades: [{ nombre: 'Neiva' }, { nombre: 'Pitalito' }, { nombre: 'Garzón' }] },
    { nombre: 'La Guajira', ciudades: [{ nombre: 'Riohacha' }, { nombre: 'Maicao' }, { nombre: 'Uribia' }] },
    { nombre: 'Magdalena', ciudades: [{ nombre: 'Santa Marta' }, { nombre: 'Ciénaga' }, { nombre: 'El Banco' }] },
    { nombre: 'Meta', ciudades: [{ nombre: 'Villavicencio' }, { nombre: 'Acacías' }, { nombre: 'Granada' }] },
    { nombre: 'Nariño', ciudades: [{ nombre: 'Pasto' }, { nombre: 'Ipiales' }, { nombre: 'Tumaco' }] },
    { nombre: 'Norte de Santander', ciudades: [{ nombre: 'Cúcuta' }, { nombre: 'Ocaña' }, { nombre: 'Pamplona' }] },
    { nombre: 'Putumayo', ciudades: [{ nombre: 'Mocoa' }, { nombre: 'Puerto Asís' }, { nombre: 'Sibundoy' }] },
    { nombre: 'Quindío', ciudades: [{ nombre: 'Armenia' }, { nombre: 'Calarcá' }, { nombre: 'Montenegro' }] },
    { nombre: 'Risaralda', ciudades: [{ nombre: 'Pereira' }, { nombre: 'Dosquebradas' }, { nombre: 'Santa Rosa de Cabal' }] },
    { nombre: 'San Andrés y Providencia', ciudades: [{ nombre: 'San Andrés' }, { nombre: 'Providencia' }, { nombre: 'Santa Catalina' }] },
    { nombre: 'Santander', ciudades: [{ nombre: 'Bucaramanga' }, { nombre: 'Floridablanca' }, { nombre: 'Girón' }] },
    { nombre: 'Sucre', ciudades: [{ nombre: 'Sincelejo' }, { nombre: 'Corozal' }, { nombre: 'San Marcos' }] },
    { nombre: 'Tolima', ciudades: [{ nombre: 'Ibagué' }, { nombre: 'Espinal' }, { nombre: 'Honda' }] },
    { nombre: 'Valle del Cauca', ciudades: [{ nombre: 'Cali' }, { nombre: 'Buenaventura' }, { nombre: 'Palmira' }] },
    { nombre: 'Vaupés', ciudades: [{ nombre: 'Mitú' }, { nombre: 'Carurú' }, { nombre: 'Pacoa' }] },
    { nombre: 'Vichada', ciudades: [{ nombre: 'Puerto Carreño' }, { nombre: 'La Primavera' }, { nombre: 'Santa Rosalía' }] },
];

export const DEPARTAMENTO_OPTIONS = COLOMBIA_DEPARTAMENTOS.map(d => ({
    label: d.nombre,
    value: d.nombre
}));

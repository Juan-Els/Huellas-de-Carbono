// Constantes para los cálculos
const CONSUMO_PROMEDIO = {
    'Automóvil pequeño': 12,
    'SUV/Crossover': 10,
    'Camioneta': 8,
    'Pickup': 7,
    'Moto': 30
};

const FACTOR_EMISION = {
    'Gasolina': 2.31,
    'Diésel': 2.68,
    'Híbrido': 1.50,
    'Eléctrico': 0
};

// Variable para almacenar los datos
let excelData = null;

// Información para los modales
const INFO_TEXTS = {
    'huella-total': {
        title: 'Huella de Carbono Total',
        content: 'Este indicador muestra la cantidad total de CO₂ emitida por todos los vehículos registrados. Se calcula en base al consumo de combustible y el factor de emisión correspondiente a cada tipo de vehículo y combustible.'
    },
    'nivel-co2-mensual': {
        title: 'Nivel de CO₂ Mensual',
        content: 'Muestra el promedio mensual de emisiones de CO₂ generadas por todos los vehículos registrados. Este valor ayuda a entender el impacto ambiental mensual de la flota vehicular.'
    },
    'nivel-co2-diario': {
        title: 'Nivel de CO₂ Diario',
        content: 'Indica el promedio diario de emisiones de CO₂ generadas por todos los vehículos. Se calcula dividiendo el total mensual entre los días del mes para obtener una estimación del impacto diario.'
    },
    'vehiculos': {
        title: 'Total de Vehículos',
        content: 'Muestra el número total de vehículos registrados en el sistema. Incluye todos los tipos: automóviles pequeños (12 km/L), SUV/Crossover (10 km/L), camionetas (8 km/L), pickup (7 km/L) y motos (30 km/L). Los factores de emisión varían según el tipo de combustible: Gasolina (2.31 kg CO₂/L), Diésel (2.68 kg CO₂/L), Híbrido (1.50 kg CO₂/L), y Eléctrico (0 kg CO₂/L).'
    },
    'distancia': {
        title: 'Distancia Total',
        content: 'Representa la suma total de kilómetros recorridos por mes por todos los vehículos registrados. Este dato es importante para calcular el impacto ambiental total.'
    }
};

// Función para parsear CSV
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Saltar líneas vacías
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        result.push(row);
    }
    
    return result;
}

// Función para cargar datos desde Google Sheets
async function loadGoogleSheetsData() {
    try {
        const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVYwJN-6wLczy2UWwjl36rdY6Ky8e-xVeFvkWZqNHF5xCLyxc0s5BBNhtyB_TzNIFienDrvlZ_WuyL/pub?output=csv';
        const response = await fetch(url);
        const csvText = await response.text();
        const data = parseCSV(csvText);
        
        // Procesar los datos
        if (data && data.length > 0) {
            excelData = data;
            updateDashboard(data);
        } else {
            console.error('No se encontraron datos en la hoja de cálculo');
        }
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        alert('Error al cargar los datos de Google Sheets. Por favor, verifica la conexión.');
    }
}

// Configurar la actualización automática y manual de Google Sheets
function setupGoogleSheetsRefresh() {
    const refreshButton = document.getElementById('refreshGoogleSheets');
    let lastUpdateTime = new Date();
    const updateInterval = 5 * 60 * 1000; // 5 minutos en milisegundos
    
    // Función para actualizar el texto del botón con el tiempo desde la última actualización
    function updateLastUpdateText() {
        const timeDiff = Math.floor((new Date() - lastUpdateTime) / 1000); // diferencia en segundos
        const minutes = Math.floor(timeDiff / 60);
        const seconds = timeDiff % 60;
        const timeText = `Última actualización: hace ${minutes}m ${seconds}s`;
        refreshButton.querySelector('.update-time').textContent = timeText;
    }

    // Actualizar el contador cada segundo
    setInterval(updateLastUpdateText, 1000);

    // Función de actualización
    async function refreshData(showAlert = false) {
        refreshButton.disabled = true;
        const iconSpan = refreshButton.querySelector('.icon-container');
        const originalContent = iconSpan.innerHTML;
        iconSpan.innerHTML = '<i class="material-icons animate-spin">refresh</i>';
        
        try {
            await loadGoogleSheetsData();
            lastUpdateTime = new Date();
            if (showAlert) {
                alert('Datos actualizados correctamente');
            }
        } catch (error) {
            console.error('Error al actualizar:', error);
            if (showAlert) {
                alert('Error al actualizar los datos: ' + error.message);
            }
        } finally {
            refreshButton.disabled = false;
            iconSpan.innerHTML = originalContent;
        }
    }

    // Configurar actualización automática
    setInterval(() => refreshData(false), updateInterval);

    // Configurar el botón de actualización manual
    if (refreshButton) {
        // Actualizar el HTML del botón para incluir el tiempo desde la última actualización
        refreshButton.innerHTML = `
            <span class="icon-container"><i class="material-icons">refresh</i></span>
            <div class="update-info">
                <span>Actualizar datos</span>
                <span class="update-time"></span>
            </div>
        `;

        refreshButton.addEventListener('click', () => refreshData(true));
    }
}

// Inicializar la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload();
    setupNavigation();
    setupSearch();
    setupModal();
    setupGoogleSheetsRefresh();
    loadGoogleSheetsData(); // Cargar datos automáticamente al iniciar
});

// Inicialización de gráficos
function initializeCharts() {
    // Gráfico de Huella de Carbono por Tipo de Vehículo
    const vehicleCtx = document.getElementById('monthlyChart').getContext('2d');
    vehicleTypeChart = new Chart(vehicleCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Huella de Carbono por Tipo de Vehículo',
                data: [],
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Huella de Carbono por Tipo de Vehículo'
                }
            }
        }
    });

    // Gráfico de Emisiones por Tipo de Combustible
    const fuelCtx = document.getElementById('sourcesChart').getContext('2d');
    fuelTypeChart = new Chart(fuelCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#2ecc71',
                    '#e74c3c',
                    '#3498db',
                    '#f1c40f'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Emisiones por Tipo de Combustible'
                }
            }
        }
    });
}

// Configuración del manejo de archivos Excel
function setupFileUpload() {
    const fileInput = document.getElementById('excelFile');
    fileInput.addEventListener('change', handleFileUpload);
}

// Manejo de la carga de archivos Excel
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar el tipo de archivo
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'xlsx' && fileType !== 'xls') {
        alert('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
    }

    try {
        const data = await readExcelFile(file);
        if (data && data.length > 0) {
            console.log('Datos cargados:', data); // Para depuración
            updateDashboard(data);
        } else {
            throw new Error('No se encontraron datos en el archivo');
        }
    } catch (error) {
        console.error('Error al procesar el archivo:', error);
        alert('Error al procesar el archivo Excel. Asegúrate de que:\n' +
              '1. El archivo no esté dañado\n' +
              '2. Contenga las columnas correctas\n' +
              '3. La hoja de cálculo tenga datos');
    }
}

// Lectura del archivo Excel
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}

// Actualización del dashboard con los datos
function updateDashboard(data) {
    // Procesar datos del Excel
    const processedData = procesarDatosExcel(data);
    
    // Actualizar totales
    updateTotalFootprint(processedData);
    updateVehicleStats(processedData);
    updateEnvironmentalAwareness(processedData);

    // Actualizar tabla del dashboard
    updateDashboardTable(processedData);
}

// Función para actualizar la tabla del dashboard
function updateDashboardTable(data) {
    const tableBody = document.getElementById('dashboardTableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No hay datos disponibles</td></tr>';
        return;
    }

    data.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.marca || '-'}</td>
            <td>${vehicle.tipoVehiculo || '-'}</td>
            <td>${vehicle.tipoCombustible || '-'}</td>
            <td>${vehicle.kilometrosMes} km</td>
            <td>${vehicle.huellaCarbono.toFixed(2)} kg CO₂</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateVehicleStats(data) {
    const totalVehiculos = data.length;
    const totalKilometros = data.reduce((sum, vehicle) => sum + vehicle.kilometrosMes, 0);
    const totalLitros = data.reduce((sum, vehicle) => sum + vehicle.litrosMes, 0);
    
    // Calcular huella total, mensual y diaria
    const totalHuella = data.reduce((sum, vehicle) => sum + vehicle.huellaCarbono, 0);
    const totalHuellaMensual = data.reduce((sum, vehicle) => sum + vehicle.huellaCarbonoMensual, 0);
    const totalHuellaDiaria = data.reduce((sum, vehicle) => sum + vehicle.huellaCarbonoDiaria, 0);
    
    // Actualizar huella total
    document.getElementById('totalFootprint').textContent = totalHuella.toFixed(2);
    
    // Actualizar nivel mensual de CO2 (promedio por vehículo)
    document.getElementById('monthlyFootprint').textContent = (totalHuellaMensual / totalVehiculos).toFixed(2);
    
    // Actualizar nivel diario de CO2 (promedio por vehículo)
    document.getElementById('dailyFootprint').textContent = (totalHuellaDiaria / totalVehiculos).toFixed(2);
    
    // Actualizar estadísticas de vehículos y distancia
    document.getElementById('reduction').textContent = `${totalVehiculos} vehículos`;
    document.getElementById('sources').textContent = `${totalKilometros.toFixed(0)} km/mes`;
}

function updateEnvironmentalAwareness(data) {
    const conCharlas = data.filter(v => v.charlaAmbiental === 'Sí').length;
    const porcentajeCharlas = ((conCharlas / data.length) * 100).toFixed(1);
    // Aquí podrías agregar un elemento en el HTML para mostrar este porcentaje
}

function updateVehicleTypeChart(data) {
    const vehicleTypes = {};
    data.forEach(vehicle => {
        if (!vehicleTypes[vehicle['Tipo de vehículo']]) {
            vehicleTypes[vehicle['Tipo de vehículo']] = 0;
        }
        vehicleTypes[vehicle['Tipo de vehículo']] += vehicle.huellaCarbono;
    });

    vehicleTypeChart.data.labels = Object.keys(vehicleTypes);
    vehicleTypeChart.data.datasets[0].data = Object.values(vehicleTypes);
    vehicleTypeChart.update();
}

function updateFuelTypeChart(data) {
    const fuelTypes = {};
    data.forEach(vehicle => {
        if (!fuelTypes[vehicle['Tipo de combustible']]) {
            fuelTypes[vehicle['Tipo de combustible']] = 0;
        }
        fuelTypes[vehicle['Tipo de combustible']] += vehicle.huellaCarbono;
    });

    fuelTypeChart.data.labels = Object.keys(fuelTypes);
    fuelTypeChart.data.datasets[0].data = Object.values(fuelTypes);
    fuelTypeChart.update();
}

// Funciones de actualización de datos
function updateTotalFootprint(data) {
    const total = data.reduce((sum, row) => sum + (parseFloat(row.huella) || 0), 0);
    document.getElementById('totalFootprint').textContent = total.toFixed(2);
}

function updateReduction(data) {
    // Simular cálculo de reducción
    document.getElementById('reduction').textContent = '-15%';
}

function updateSourcesCount(data) {
    const uniqueSources = new Set(data.map(row => row.fuente)).size;
    document.getElementById('sources').textContent = uniqueSources;
}

function updateMonthlyChart(data) {
    // Procesar datos mensuales
    const monthlyData = processMonthlyData(data);
    monthlyChart.data.labels = monthlyData.labels;
    monthlyChart.data.datasets[0].data = monthlyData.values;
    monthlyChart.update();
}

function updateSourcesChart(data) {
    // Procesar datos por fuente
    const sourcesData = processSourcesData(data);
    sourcesChart.data.labels = sourcesData.labels;
    sourcesChart.data.datasets[0].data = sourcesData.values;
    sourcesChart.update();
}

// Funciones auxiliares para procesar datos
function processMonthlyData(data) {
    // Aquí deberías implementar la lógica para procesar los datos mensuales
    // Este es un ejemplo simplificado
    return {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        values: [10, 15, 12, 8, 9, 11]
    };
}

function calcularHuellaCarbono(vehiculo) {
    // Obtener el consumo promedio según el tipo de vehículo
    const consumoKmL = CONSUMO_PROMEDIO[vehiculo['Tipo de Vehiculo']] || 10;
    
    // Calcular litros consumidos por mes
    // Extraer solo el número de la respuesta de kilómetros
    const kmText = vehiculo['¿Cuántos km recorre por mes? (Ingresen un solo valor por ejemplo 100km)'] || '0';
    const kilometrosMes = parseFloat(kmText.replace(/[^0-9.]/g, '')) || 0;
    const litrosMes = kilometrosMes / consumoKmL;
    
    // Calcular emisiones según el tipo de combustible
    const factorEmision = FACTOR_EMISION[vehiculo['¿Que tipo de combustible usa el carro?']] || 0;
    const huellaCarbono = litrosMes * factorEmision;
    
    // Calcular niveles diarios y mensuales
    const diasPorMes = 30; // Promedio de días por mes
    const huellaCarbonoDiaria = huellaCarbono / diasPorMes;
    const huellaCarbonoMensual = huellaCarbono;
    
    return {
        huellaCarbono,
        huellaCarbonoDiaria,
        huellaCarbonoMensual,
        litrosMes,
        kilometrosMes,
        marca: vehiculo['Modelo / Marca del Vehiculo'],
        tipoVehiculo: vehiculo['Tipo de Vehiculo'],
        tipoCombustible: vehiculo['¿Que tipo de combustible usa el carro?'],
        charlaAmbiental: vehiculo['¿Han tenido charlas ambientales sobre la huella de carbono?']
    };
}

function procesarDatosExcel(data) {
    return data.map(vehiculo => ({
        ...vehiculo,
        ...calcularHuellaCarbono(vehiculo)
    }));
}

function processSourcesData(data) {
    const vehiculosPorTipo = {};
    data.forEach(vehiculo => {
        const tipo = vehiculo['Tipo de vehículo'];
        if (!vehiculosPorTipo[tipo]) {
            vehiculosPorTipo[tipo] = 0;
        }
        vehiculosPorTipo[tipo] += vehiculo.huellaCarbono;
    });

    return {
        labels: Object.keys(vehiculosPorTipo),
        values: Object.values(vehiculosPorTipo)
    };
}

// Configuración de la navegación
function setupNavigation() {
    const menuOptions = document.querySelectorAll('.menu-option');
    const sections = document.querySelectorAll('.section');

    menuOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Actualizar estados activos
            menuOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Mostrar la sección correspondiente
            const targetSection = option.dataset.section;
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });
}

// Configuración del modal
function setupModal() {
    const modal = document.getElementById('infoModal');
    const closeBtn = document.querySelector('.close-modal');
    const infoIcons = document.querySelectorAll('.info-icon');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    infoIcons.forEach(icon => {
        const card = icon.closest('.card');
        const cardType = card.getAttribute('data-card-type');
        
        icon.addEventListener('click', () => {
            const info = INFO_TEXTS[cardType];
            document.getElementById('modalTitle').textContent = info.title;
            document.getElementById('modalContent').textContent = info.content;
            modal.style.display = 'block';
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Configuración de la búsqueda
function setupSearch() {
    const searchInput = document.getElementById('vehicleSearch');
    const searchButton = document.querySelector('.search-button');
    const filterSelect = document.createElement('select');
    filterSelect.id = 'vehicleTypeFilter';
    filterSelect.innerHTML = `
        <option value="">Todos los tipos</option>
        <option value="Automóvil pequeño">Automóvil pequeño</option>
        <option value="Camioneta">Camioneta</option>
        <option value="Moto">Moto</option>
    `;
    
    searchInput.parentElement.insertBefore(filterSelect, searchButton);

    // Mostrar todos los vehículos cuando se cargan los datos
    if (excelData) {
        displaySearchResults(excelData);
    }

    searchButton.addEventListener('click', () => performSearch());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Búsqueda en tiempo real mientras se escribe o se cambia el filtro
    searchInput.addEventListener('input', () => performSearch());
    filterSelect.addEventListener('change', () => performSearch());
}

// Realizar búsqueda
function performSearch() {
    const searchInput = document.getElementById('vehicleSearch');
    const filterSelect = document.getElementById('vehicleTypeFilter');
    const searchTerm = searchInput.value.toLowerCase();
    const filterType = filterSelect.value;

    if (!excelData) {
        alert('Por favor, carga primero el archivo de datos.');
        return;
    }

    let results = excelData;
    
    // Aplicar filtro por tipo de vehículo
    if (filterType) {
        results = results.filter(row => row['Tipo de Vehiculo'] === filterType);
    }
    
    // Si hay término de búsqueda, filtrar los resultados
    if (searchTerm.trim() !== '') {
        results = results.filter(row => {
            const searchableFields = [
                row['Modelo / Marca del Vehiculo'],
                row['Tipo de Vehiculo'],
                row['¿Que tipo de combustible usa el carro?']
            ].map(field => String(field || '').toLowerCase());

            return searchableFields.some(field => field.includes(searchTerm));
        });
    }

    displaySearchResults(results);
}

// Mostrar resultados de búsqueda
function displaySearchResults(results) {
    const tableBody = document.getElementById('vehiclesTableBody');
    tableBody.innerHTML = '';

    if (results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No se encontraron resultados</td></tr>';
        return;
    }

    // Procesar los datos para mostrar la huella de carbono
    const processedResults = results.map(vehicle => calcularHuellaCarbono(vehicle));
    
    processedResults.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.marca || '-'}</td>
            <td>${vehicle.tipoVehiculo || '-'}</td>
            <td>${vehicle.tipoCombustible || '-'}</td>
            <td>${vehicle.kilometrosMes} km</td>
            <td>${vehicle.huellaCarbono.toFixed(2)} kg CO₂</td>
        `;
        tableBody.appendChild(row);
    });
}

// Actualizar la función de lectura de Excel para guardar los datos
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Verificar si hay hojas de cálculo
                if (workbook.SheetNames.length === 0) {
                    throw new Error('El archivo Excel no contiene hojas de cálculo');
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convertir a JSON con opciones específicas
                excelData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false, // Mantener el formato de texto
                    defval: '', // Valor por defecto para celdas vacías
                });

                // Verificar si se obtuvieron datos
                if (!excelData || excelData.length === 0) {
                    throw new Error('No se encontraron datos en la hoja de cálculo');
                }

                // Verificar que los campos necesarios estén presentes
                const requiredFields = [
                    'Modelo / Marca del Vehiculo',
                    'Tipo de Vehiculo',
                    '¿Que tipo de combustible usa el carro?',
                    '¿Cuántos km recorre por mes? (Ingresen un solo valor por ejemplo 100km)',
                    '¿Han tenido charlas ambientales sobre la huella de carbono?'
                ];

                const missingFields = requiredFields.filter(field => 
                    !Object.keys(excelData[0]).includes(field)
                );

                if (missingFields.length > 0) {
                    throw new Error('Faltan columnas requeridas: ' + missingFields.join(', '));
                }

                console.log('Datos cargados exitosamente:', excelData); // Para depuración
                
                // Mostrar todos los datos inmediatamente después de cargar
                displaySearchResults(excelData);
                
                resolve(excelData);
            } catch (error) {
                console.error('Error en la lectura del archivo:', error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error('Error en FileReader:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file); // Cambiar a readAsArrayBuffer para mejor compatibilidad
    });
}

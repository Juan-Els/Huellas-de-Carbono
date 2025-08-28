// Configuración de la búsqueda
function setupSearch() {
    const searchInput = document.getElementById('vehicleSearch');
    const searchButton = document.querySelector('.search-button');
    const filterSelect = document.getElementById('vehicleTypeFilter');
    
    // Mostrar todos los vehículos cuando se cargan los datos
    function updateSearchResults() {
        if (excelData) {
            displaySearchResults(excelData);
        }
    }

    // Realizar búsqueda
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterType = filterSelect.value;

        if (!excelData) {
            return; // No hay datos para buscar
        }

        // Filtrar los datos según el término de búsqueda y el tipo de vehículo
        const results = excelData.filter(vehicle => {
            const matchesSearch = vehicle['Modelo / Marca del Vehiculo']?.toLowerCase().includes(searchTerm);
            const matchesFilter = !filterType || vehicle['Tipo de Vehiculo'] === filterType;
            return matchesSearch && matchesFilter;
        });

        // Mostrar los resultados filtrados
        displaySearchResults(results);
    }

    // Mostrar resultados de búsqueda
    function displaySearchResults(results) {
        const tableBody = document.getElementById('vehiclesTableBody');
        tableBody.innerHTML = '';

        if (!results || results.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5">No se encontraron resultados</td>';
            tableBody.appendChild(emptyRow);
            return;
        }

        results.forEach(vehicle => {
            const processedData = calcularHuellaCarbono(vehicle);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle['Modelo / Marca del Vehiculo'] || ''}</td>
                <td>${vehicle['Tipo de Vehiculo'] || ''}</td>
                <td>${vehicle['¿Que tipo de combustible usa el carro?'] || ''}</td>
                <td>${processedData.kilometrosMes.toFixed(0)} km</td>
                <td>${processedData.huellaCarbono.toFixed(2)} kg CO₂</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Event listeners
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    searchInput.addEventListener('input', performSearch);
    filterSelect.addEventListener('change', performSearch);

    // Mostrar resultados iniciales cuando se cargan datos
    if (excelData) {
        updateSearchResults();
    }
}

// Actualizar la función handleFileUpload para mostrar resultados después de cargar
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    // Verificar el tipo de archivo
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'xlsx' && fileType !== 'xls') {
        alert('Por favor, seleccione un archivo Excel (.xlsx o .xls)');
        return;
    }

    try {
        const data = await readExcelFile(file);
        excelData = procesarDatosExcel(data);
        updateDashboard(excelData);
        displaySearchResults(excelData); // Mostrar todos los resultados después de cargar
    } catch (error) {
        console.error('Error al procesar el archivo:', error);
        alert('Error al procesar el archivo. Por favor, inténtelo de nuevo.');
    }
}

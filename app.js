
let originalData = null;
let processedData = null;
let charts = {};
let currentPage = 1;
let rowsPerPage = 20;
let filteredData = null;
let currentUser = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const manageProjectsBtn = document.getElementById('manageProjectsBtn');
    const projectsManager = document.getElementById('projectsManager');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const searchBtn = document.getElementById('searchBtn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const firebaseConfig = {
    apiKey: "AIzaSyAcDv93ujUfPzIdN9Li6aAILu_0dj4S8SE",
    authDomain: "datark-4c3d0.firebaseapp.com",
    projectId: "datark-4c3d0",
    storageBucket: "datark-4c3d0.firebasestorage.app",
    messagingSenderId: "658626451500",
    appId: "1:658626451500:web:15039275c61c37e7809989"
  };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
// 1. Función para REGISTRAR usuario
function registrarUsuario(email, password) {
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      showMessage("✅ ¡Registro exitoso! Ahora inicia sesión.", "success");
    })
    .catch(error => {
      handleAuthError(error);
    });
}

// 2. Función para INICIAR SESIÓN
function iniciarSesion(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      showMessage("🔓 ¡Bienvenido!", "success");
      document.getElementById('authModal').style.display = 'none';
    })
    .catch(error => {
      handleAuthError(error);
    });
}

// 3. Muestra errores en pantalla
function handleAuthError(error) {
  let message = "";
  switch(error.code) {
    case "auth/email-already-in-use":
      message = "❌ Este correo ya está registrado.";
      break;
    case "auth/invalid-email":
      message = "❌ Ingresa un correo válido.";
      break;
    case "auth/weak-password":
      message = "❌ La contraseña debe tener al menos 6 caracteres.";
      break;
    case "auth/user-not-found":
      message = "❌ Usuario no encontrado. Regístrate primero.";
      break;
    case "auth/wrong-password":
      message = "❌ Contraseña incorrecta.";
      break;
    default:
      message = "❌ Error: " + error.message;
  }
  showMessage(message, "error");
}

// 4. Muestra mensajes en el modal
function showMessage(text, type) {
  const msgElement = document.getElementById('authMessage');
  msgElement.textContent = text;
  msgElement.style.color = (type === "error") ? "red" : "green";
}

// ==================== 🖱 ASIGNAR EVENTOS ==================== //
document.getElementById('registerBtn').addEventListener('click', () => {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value.trim();
  
  if (!email || !password) {
    showMessage("⚠️ Completa todos los campos.", "error");
    return;
  }
  
  registrarUsuario(email, password);
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value.trim();
  
  if (!email || !password) {
    showMessage("⚠️ Completa todos los campos.", "error");
    return;
  }
  
  iniciarSesion(email, password);

  
});

// ==================== 🔄 ESTADO DE AUTENTICACIÓN ==================== //
auth.onAuthStateChanged(user => {
  const authBtn = document.getElementById('authBtn');
  if (user) {
    authBtn.textContent = user.email;  // Muestra el email del usuario
  } else {
    authBtn.textContent = "Iniciar Sesión / Registrarse";
  }
});

// Actualiza la interfaz
function updateUI() {
  const authBtn = document.getElementById('authBtn');
  if (currentUser) {
    authBtn.textContent = currentUser.email;
  } else {
    authBtn.textContent = "Iniciar Sesión";
  }
}

    document.addEventListener('DOMContentLoaded', setupLogout);

    // Configurar paginación
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableData();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil((filteredData || processedData).length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTableData();
        }
    });

    // Configurar búsqueda
    searchBtn.addEventListener('click', filterData);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita enviar formularios si los hay
            filterData(); // Llama a la función de filtrar
        }
    });


    // Botón para mostrar/ocultar el gestor de proyectos
    manageProjectsBtn.addEventListener('click', function() {
        if (projectsManager.classList.contains('hidden')) {
            projectsManager.classList.remove('hidden');
            loadProjectsList(); // Cargar la lista de proyectos
        } else {
            projectsManager.classList.add('hidden');
        }
    });

    // Botón para guardar el proyecto actual
    saveProjectBtn.addEventListener('click', function() {
        const projectName = document.getElementById('projectName').value.trim();
        saveProject(projectName);
    });
    
    // Eventos de arrastrar y soltar
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.style.borderColor = '#4361ee';
        dropArea.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
    }
    
    function unhighlight() {
        dropArea.style.borderColor = '#ddd';
        dropArea.style.backgroundColor = '';
    }
    
    // Manejar el archivo soltado
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            processExcelFile(files[0]);
        }
    });
    
    // Manejar la selección de archivo
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            processExcelFile(fileInput.files[0]);
        }
    });
    
    // Botón de descarga
    downloadBtn.addEventListener('click', function() {
        downloadReport();
    });
    // Configurar modal
    const modal = document.getElementById('detailModal');
    const closeButton = modal.querySelector('.close-button');
    
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
    
    /* ============================================= */
/* Manejador PROFESIONAL de modales (reemplaza todo lo anterior) */
/* ============================================= */
function setupModals() {
    // Lista de TODOS tus modales
    const modals = ['infoModal', 'authModal', 'detailModal'];
    
    // 1. Cerrar con la [X]
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            modal.style.display = 'none';
            console.log(`Modal ${modal.id} cerrado con X`); // Debug
        });
    });

    // 2. Cerrar haciendo click FUERA del contenido
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            console.log(`Modal cerrado por click externo`); // Debug
        }
    });

    // 3. Cerrar con tecla [ESC]
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && modal.style.display === 'block') {
                    modal.style.display = 'none';
                    console.log(`Modal ${modalId} cerrado con ESC`); // Debug
                }
            });
        }
    });
}

// Inicialización (debe estar al final del archivo o en DOMContentLoaded)
document.addEventListener('DOMContentLoaded', setupModals);
    // Función para normalizar datos (nueva versión más robusta)
function normalizeData(data) {
    if (!data || data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Caso especial cuando todos los valores son iguales
    if (min === max) return data.map(() => 0.5);
    
    return data.map(v => (v - min) / (max - min));
}

// Versión simplificada de K-Means sin dependencia de booleanMask
async function simpleKMeans(data, clusters = 3, iterations = 5) {
    try {
        // 1. Inicialización aleatoria de centroides
        let centroids = [];
        for (let i = 0; i < clusters; i++) {
            centroids.push(data[Math.floor(Math.random() * data.length)]);
        }
        
        // 2. Iteraciones
        for (let iter = 0; iter < iterations; iter++) {
            // Asignar puntos a clusters
            const assignments = data.map(point => {
                let minDist = Infinity;
                let cluster = 0;
                
                centroids.forEach((centroid, idx) => {
                    const dist = Math.abs(point - centroid);
                    if (dist < minDist) {
                        minDist = dist;
                        cluster = idx;
                    }
                });
                
                return cluster;
            });
            
            // Recalcular centroides
            const newCentroids = Array(clusters).fill(0);
            const counts = Array(clusters).fill(0);
            
            data.forEach((point, idx) => {
                const cluster = assignments[idx];
                newCentroids[cluster] += point;
                counts[cluster]++;
            });
            
            // Actualizar centroides
            let changed = false;
            centroids = centroids.map((_, idx) => {
                if (counts[idx] === 0) return centroids[idx]; // Mantener si no hay puntos
                
                const newVal = newCentroids[idx] / counts[idx];
                if (newVal !== centroids[idx]) changed = true;
                return newVal;
            });
            
            if (!changed) break; // Convergencia
        }
        
        // Asignación final
        return data.map(point => {
            let minDist = Infinity;
            let cluster = 0;
            
            centroids.forEach((centroid, idx) => {
                const dist = Math.abs(point - centroid);
                if (dist < minDist) {
                    minDist = dist;
                    cluster = idx;
                }
            });
            
            return `Grupo ${cluster + 1}`;
        });
        
    } catch (error) {
        console.error("Error en K-Means:", error);
        throw error;
    }
}

document.getElementById('sendEmailBtn').addEventListener('click', async () => {
    if (!currentUser) {
        alert('Debes iniciar sesión primero');
        document.getElementById('authModal').style.display = 'block';
        return;
    }

    const message = document.getElementById('analysisContent').innerText;
    document.getElementById('emailMessage').value = message;
    document.getElementById('userEmailInput').value = currentUser.email;

    try {
        await emailjs.sendForm('service_lbht95k', 'template_b6bvw1d', '#emailForm');
        alert(`✔ Informe enviado a ${currentUser.email}`);
        
        // Debug: Verifica los datos enviados
        console.log('Datos enviados:', {
            to_email: currentUser.email,
            message: message.substring(0, 50) + '...'
        });
    } catch (error) {
        console.error('Error al enviar:', error);
        alert('❌ Error al enviar. Verifica la consola para detalles.');
    }
});

// Función auxiliar para describir los grupos
function getGroupDescription(group, columnName) {
    const descriptions = {
        'Grupo 1': `Clientes con ${columnName} más bajos. Requieren estrategias de fidelización.`,
        'Grupo 2': `Clientes con ${columnName} intermedios. Oportunidad para crecimiento.`,
        'Grupo 3': `Clientes con ${columnName} más altos. Clientes premium a retener.`
    };
    return descriptions[group] || '';
}
});

// Procesar archivo Excel
function processExcelFile(file) {
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    // Mostrar spinner de carga
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja de trabajo
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        originalData = XLSX.utils.sheet_to_json(worksheet);
        
        // Añadir código incremental
        processedData = originalData.map((row, index) => {
            return {
                Código: index + 1,
                ...row
            };
        });
        
        filteredData = null;
        currentPage = 1;
        
        // Actualizar UI
        setTimeout(() => {
            populateFilterOptions();
            renderTableData();
            createFrequencyTables();
            createBarCharts();
            generateAnalysis();
            
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
        }, 1000);
    };
    
    reader.readAsArrayBuffer(file);
}

// Poblar opciones del filtro
function populateFilterOptions() {
    if (!processedData || processedData.length === 0) return;
    
    const filterColumn = document.getElementById('filterColumn');
    filterColumn.innerHTML = '<option value="all">Todas las columnas</option>';
    
    const headers = Object.keys(processedData[0]);
    
    headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        filterColumn.appendChild(option);
    });
}

// Filtrar datos
function filterData() {
    if (!processedData || processedData.length === 0) return;
    
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filterColumn = document.getElementById('filterColumn').value;
    
    if (!searchInput.trim()) {
        filteredData = null;
        currentPage = 1;
        renderTableData();
        return;
    }
    
    if (filterColumn === 'all') {
        filteredData = processedData.filter(row => {
            return Object.values(row).some(value => 
                String(value).toLowerCase().includes(searchInput)
            );
        });
    } else {
        filteredData = processedData.filter(row => 
            String(row[filterColumn]).toLowerCase().includes(searchInput)
        );
    }
    
    currentPage = 1;
    renderTableData();
}

// Renderizar tabla con paginación
function renderTableData() {
    if (!processedData || processedData.length === 0) return;
    
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const pageInfo = document.getElementById('pageInfo');
    
    const dataToUse = filteredData || processedData;
    const totalPages = Math.ceil(dataToUse.length / rowsPerPage);
    
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Añadir encabezados
    const headers = Object.keys(dataToUse[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
    });
    
    // Añadir filas con colores de grupo
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, dataToUse.length);
    
    dataToUse.slice(startIndex, endIndex).forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = startIndex + index;
        
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            
            // Resaltar la columna de grupo
            if (header === 'Grupo') {
                td.dataset.group = row[header];
            }
            
            tr.appendChild(td);
        });
        
        tr.addEventListener('click', () => showDetailModal(row));
        tableBody.appendChild(tr);
    });
}

// Mostrar modal con detalles del registro
function showDetailModal(rowData) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    // Limpiar contenido anterior
    modalContent.innerHTML = '';
    
    // Crear tabla de detalle
    const table = document.createElement('table');
    table.className = 'detail-table';
    
    Object.entries(rowData).forEach(([key, value]) => {
        const tr = document.createElement('tr');
        
        const thField = document.createElement('th');
        thField.textContent = key;
        tr.appendChild(thField);
        
        const tdValue = document.createElement('td');
        tdValue.textContent = value;
        tr.appendChild(tdValue);
        
        table.appendChild(tr);
    });
    
    modalContent.appendChild(table);
    modal.style.display = 'block';
}

// Crear tablas de frecuencia para columnas con valores repetidos
function createFrequencyTables() {
    if (!processedData || processedData.length === 0) return;
    
    const frequencyTablesContainer = document.getElementById('frequencyTables');
    frequencyTablesContainer.innerHTML = '';
    
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    headers.forEach(column => {
        // Calcular frecuencias
        const frequencies = {};
        
        processedData.forEach(row => {
            const value = row[column];
            frequencies[value] = (frequencies[value] || 0) + 1;
        });
        
        // Verificar si hay valores repetidos
        const hasRepeatedValues = Object.values(frequencies).some(freq => freq > 1);
        
        if (hasRepeatedValues) {
            // Ordenar frecuencias de mayor a menor
            const sortedFreqs = Object.entries(frequencies)
                .sort((a, b) => b[1] - a[1])
                .filter(([_, count]) => count > 1); // Solo mostrar valores que se repiten
            
            if (sortedFreqs.length === 0) return;
            
            // Crear contenedor para esta tabla de frecuencia
            const freqItem = document.createElement('div');
            freqItem.className = 'frequency-item';
            
            // Título
            const title = document.createElement('h3');
            title.textContent = `Frecuencia de ${column}`;
            freqItem.appendChild(title);
            
            // Tabla
            const table = document.createElement('table');
            table.className = 'frequency-table';
            
            // Encabezados
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const thValue = document.createElement('th');
            thValue.textContent = column;
            headerRow.appendChild(thValue);
            
            const thFreq = document.createElement('th');
            thFreq.textContent = 'Frecuencia';
            headerRow.appendChild(thFreq);
            
            const thPercentage = document.createElement('th');
            thPercentage.textContent = 'Porcentaje';
            headerRow.appendChild(thPercentage);
            
            const thAction = document.createElement('th');
            thAction.textContent = 'Acción';
            headerRow.appendChild(thAction);
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Cuerpo de la tabla
            const tbody = document.createElement('tbody');
            
            sortedFreqs.forEach(([value, count]) => {
                const tr = document.createElement('tr');
                
                const tdValue = document.createElement('td');
                tdValue.textContent = value;
                tr.appendChild(tdValue);
                
                const tdCount = document.createElement('td');
                tdCount.textContent = count;
                tr.appendChild(tdCount);
                
                const tdPercentage = document.createElement('td');
                const percentage = (count / processedData.length * 100).toFixed(2);
                tdPercentage.textContent = `${percentage}%`;
                tr.appendChild(tdPercentage);
                
                const tdAction = document.createElement('td');
                const seeMoreBtn = document.createElement('button');
                seeMoreBtn.className = 'see-more-btn';
                seeMoreBtn.textContent = 'Ver más';
                seeMoreBtn.addEventListener('click', () => {
                    // Filtrar registros con este valor
                    // Establecer valores de búsqueda
                    document.getElementById('searchInput').value = value;
                    document.getElementById('filterColumn').value = column;
                    
                    // Aplicar filtro
                    filterData();
                    
                    // Asegurar que la sección de resultados sea visible
                    document.getElementById('resultsSection').classList.remove('hidden');
                    
                    // Desplazar la pantalla hacia la tabla de datos
                    const dataTable = document.getElementById('dataTable');
                    if (dataTable) {
                        dataTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                tdAction.appendChild(seeMoreBtn);
                tr.appendChild(tdAction);
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            freqItem.appendChild(table);
            frequencyTablesContainer.appendChild(freqItem);
        }
    });
}

// Crear gráficos de barras para cada columna
function createBarCharts() {
    if (!processedData || processedData.length === 0) return;
    
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    charts = {}; // Reiniciar objeto de gráficos
    
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';
    
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    headers.forEach((column, index) => {
        // Crear contenedor para este gráfico
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = `Gráfico de ${column}`;
        chartContainer.appendChild(chartTitle);
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart_${index}`;
        chartContainer.appendChild(canvas);
        
        chartsContainer.appendChild(chartContainer);
        
        // Determinar si es columna numérica o categórica
        const isNumeric = processedData.every(row => !isNaN(parseFloat(row[column])));
        
        if (isNumeric) {
            createNumericBarChart(canvas.id, column);
        } else {
            createCategoricalBarChart(canvas.id, column);
        }
    });
}

// Crear gráfico de barras para datos numéricos
function createNumericBarChart(canvasId, column) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Agrupar valores numéricos en intervalos
    const values = processedData.map(row => parseFloat(row[column]));
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Determinar el número de intervalos (bins)
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binSize = (max - min) / binCount;
    
    const bins = Array(binCount).fill(0);
    const binLabels = [];
    
    // Crear etiquetas para los intervalos
    for (let i = 0; i < binCount; i++) {
        const start = min + i * binSize;
        const end = min + (i + 1) * binSize;
        binLabels.push(`${start.toFixed(2)} - ${end.toFixed(2)}`);
    }
    
    // Contar valores en cada intervalo
    values.forEach(value => {
        if (value === max) {
            // El valor máximo va en el último bin
            bins[binCount - 1]++;
        } else {
            const binIndex = Math.floor((value - min) / binSize);
            bins[binIndex]++;
        }
    });
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: `Distribución de ${column}`,
                data: bins,
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Distribución de ${column}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frecuencia'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: column
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// Crear gráfico de barras para datos categóricos
function createCategoricalBarChart(canvasId, column) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Contar frecuencias por categoría
    const freqMap = {};
    processedData.forEach(row => {
        const value = row[column];
        freqMap[value] = (freqMap[value] || 0) + 1;
    });
    
    // Ordenar por frecuencia (de mayor a menor)
    const sortedEntries = Object.entries(freqMap)
        .sort((a, b) => b[1] - a[1]);
    
    // Limitar a 15 categorías más frecuentes para mantener legibilidad
    const topEntries = sortedEntries.slice(0, 15);
    const labels = topEntries.map(entry => entry[0]);
    const data = topEntries.map(entry => entry[1]);
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Frecuencia de ${column}`,
                data: data,
                backgroundColor: 'rgba(76, 201, 240, 0.7)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Categorías más frecuentes de ${column}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frecuencia'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: column
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// Generar análisis de resultados
function generateAnalysis() {
    if (!processedData || processedData.length === 0) return;
    
    const analysisContent = document.getElementById('analysisContent');
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    // Identificar columnas numéricas
    const numericColumns = headers.filter(header => 
        processedData.every(row => !isNaN(parseFloat(row[header])))
    );
    
    // Generar análisis estadístico básico
    let analysis = '<h3>Resumen del Análisis</h3>';
    
    // Información general
    analysis += `<p>Se han analizado <strong>${processedData.length}</strong> registros con <strong>${headers.length}</strong> variables.</p>`;
    
    // Análisis de valores repetidos
    const valueFrequencyMap = {};
    
    headers.forEach(column => {
        valueFrequencyMap[column] = {};
        
        processedData.forEach(row => {
            const value = row[column];
            valueFrequencyMap[column][value] = (valueFrequencyMap[column][value] || 0) + 1;
        });
    });
    
    // Encontrar valores más comunes
    analysis += '<h3>Valores Más Frecuentes</h3>';
    analysis += '<ul>';
    
    headers.forEach(column => {
        const freqMap = valueFrequencyMap[column];
        const sortedValues = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
        
        if (sortedValues.length > 0) {
            const topValue = sortedValues[0];
            const frequency = freqMap[topValue];
            const percentage = ((frequency / processedData.length) * 100).toFixed(1);
            
            // Añadir botón "Ver más" para cada valor más común
            const recordIds = processedData
                .filter(row => row[column] == topValue)
                .map(row => row.Código);
            
            analysis += `<li>
                El valor más común en <strong>${column}</strong> es <strong>${topValue}</strong>, 
                apareciendo <strong>${frequency}</strong> veces (${percentage}% del total).
                <button class="see-more-btn" onclick="showValueRecords('${column}', '${topValue}')">Ver más</button>
            </li>`;
        }
    });
    
    analysis += '</ul>';
    
    // Tendencias identificadas
    analysis += '<h3>Tendencias Identificadas</h3>';
    
    // Análisis simple de tendencia (creciente, decreciente o estable)
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const values = processedData.map(row => parseFloat(row[column]));
        
        // Calcular si la tendencia es creciente o decreciente
        let increasingCount = 0;
        let decreasingCount = 0;
        
        for (let i = 1; i < values.length; i++) {
            if (values[i] > values[i-1]) increasingCount++;
            else if (values[i] < values[i-1]) decreasingCount++;
        }
        
        const totalChanges = increasingCount + decreasingCount;
        
        if (totalChanges > 0) {
            const increasingPercentage = (increasingCount / totalChanges) * 100;
            
            if (increasingPercentage > 60) {
                analysis += `<p>Se observa una <strong>tendencia creciente</strong> en los valores de ${column}, con un ${increasingPercentage.toFixed(1)}% de los cambios siendo incrementos.</p>`;
            } else if (increasingPercentage < 40) {
                analysis += `<p>Se observa una <strong>tendencia decreciente</strong> en los valores de ${column}, con un ${(100 - increasingPercentage).toFixed(1)}% de los cambios siendo decrementos.</p>`;
            } else {
                analysis += `<p>Los valores de ${column} muestran una <strong>tendencia estable</strong> sin una dirección clara, con aproximadamente el mismo número de incrementos y decrementos.</p>`;
            }
        }
    }
    
    // Identificar valores atípicos
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const values = processedData.map(row => parseFloat(row[column]));
        
        // Calcular estadísticas básicas
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Identificar valores atípicos (más de 2 desviaciones estándar)
        const outliers = values.filter(value => Math.abs(value - mean) > 2 * stdDev);
        
        if (outliers.length > 0) {
            const outlierPercentage = (outliers.length / values.length) * 100;
            analysis += `<p>Se identificaron <strong>${outliers.length}</strong> valores atípicos (${outlierPercentage.toFixed(1)}% del total) en ${column}, que podrían representar anomalías o oportunidades en el mercado.</p>`;
        } else {
            analysis += `<p>No se identificaron valores atípicos significativos en ${column}, lo que sugiere un comportamiento estable dentro de los rangos esperados.</p>`;
        }
    }
    
    // Conclusiones
    analysis += '<h3>Conclusiones y Recomendaciones</h3>';
    analysis += '<p>En base al análisis de los datos proporcionados, se pueden extraer las siguientes conclusiones:</p>';
    analysis += '<ul>';
    analysis += '<li>Los datos muestran patrones que podrían indicar tendencias específicas del mercado en el sector analizado.</li>';
    
    // Conclusión personalizada basada en las tendencias identificadas
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const values = processedData.map(row => parseFloat(row[column]));
        
        // Variabilidad
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const variabilityPercentage = (range / min) * 100;
        
        if (variabilityPercentage > 50) {
            analysis += `<li>Se observa una alta variabilidad en ${column} (${variabilityPercentage.toFixed(1)}%), lo que sugiere un mercado volátil con potenciales oportunidades para estrategias de trading activo.</li>`;
        } else if (variabilityPercentage < 20) {
            analysis += `<li>La baja variabilidad en ${column} (${variabilityPercentage.toFixed(1)}%) sugiere un mercado estable, potencialmente más adecuado para estrategias de inversión a largo plazo.</li>`;
        }
    }
    
    analysis += '<li>Se recomienda revisar periódicamente estos indicadores para identificar cambios en las tendencias del mercado.</li>';
    analysis += '<li>Para un análisis más profundo, considere incorporar más variables y datos históricos más extensos.</li>';
    analysis += '</ul>';
    
    analysisContent.innerHTML = analysis;

    // Añadir función global para manejar los botones "Ver más"
    window.showValueRecords = function(column, value) {
        // Establecer valores de búsqueda
        document.getElementById('searchInput').value = value;
        document.getElementById('filterColumn').value = column;
        
        // Aplicar filtro
        filterData();
        
        // Asegurar que la sección de resultados sea visible
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Desplazar la pantalla hacia la tabla de datos
        const dataTable = document.getElementById('dataTable');
        if (dataTable) {
            dataTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
}

// Descargar reporte
function downloadReport() {
    const element = document.createElement('a');
    
    // Crear contenido del reporte
    let reportContent = "# Informe de Análisis de Tendencias de Mercado\n\n";
    reportContent += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
    reportContent += `Total de registros analizados: ${processedData.length}\n\n`;
    
    // Añadir análisis
    reportContent += "## Análisis de Resultados\n\n";
    reportContent += document.getElementById('analysisContent').innerText;
    
    // Crear blob
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Descargar
    element.href = URL.createObjectURL(blob);
    element.download = `analisis_tendencias_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Función para calcular la correlación entre dos arrays numéricos
function calculateCorrelation(array1, array2) {
    if (array1.length !== array2.length) {
        return 0;
    }
    
    const n = array1.length;
    let sum1 = 0;
    let sum2 = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    let pSum = 0;
    
    for (let i = 0; i < n; i++) {
        const x = array1[i];
        const y = array2[i];
        
        sum1 += x;
        sum2 += y;
        sum1Sq += x * x;
        sum2Sq += y * y;
        pSum += x * y;
    }
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    if (den === 0) {
        return 0;
    }
    
    return num / den;
}


// Inicializar la base de datos IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MarketAnalyzerDB', 1);
        
        request.onerror = event => {
            console.error('Error al abrir la base de datos:', event.target.error);
            reject(event.target.error);
        };
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Crear almacén para proyectos
            if (!db.objectStoreNames.contains('projects')) {
                const projectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
                projectStore.createIndex('name', 'name', { unique: false });
                projectStore.createIndex('date', 'date', { unique: false });
            }
        };
        
        request.onsuccess = event => {
            const db = event.target.result;
            resolve(db);
        };
    });
}


// Guardar proyecto actual
async function saveProject(name) {
    if (!processedData || processedData.length === 0) {
        alert('No hay datos para guardar');
        return;
    }
    
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        // Capturar imágenes de los gráficos
        const chartImages = {};
        Object.keys(charts).forEach(key => {
            if (charts[key]) {
                chartImages[key] = charts[key].toBase64Image();
            }
        });
        
        // Crear objeto del proyecto
        const project = {
            name: name || `Proyecto ${new Date().toLocaleString()}`,
            date: new Date().toISOString(),
            originalData: originalData,
            processedData: processedData,
            charts: chartImages,
            analysis: document.getElementById('analysisContent').innerHTML
        };
        
        const request = store.add(project);
        
        request.onsuccess = () => {
            alert('Proyecto guardado correctamente');
            loadProjectsList(); // Actualizar lista de proyectos
        };
        
        request.onerror = event => {
            console.error('Error al guardar el proyecto:', event.target.error);
            alert('Error al guardar el proyecto');
        };
    } catch (error) {
        console.error('Error en saveProject:', error);
        alert('Error al guardar el proyecto');
    }
}

// Cargar lista de proyectos
async function loadProjectsList() {
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const dateIndex = store.index('date');
        
        const request = dateIndex.openCursor(null, 'prev'); // Ordenar por fecha descendente
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = ''; // Limpiar lista
        
        request.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                const project = cursor.value;
                
                // Crear elemento de lista
                const li = document.createElement('li');
                li.className = 'project-item';
                li.innerHTML = `
                    <div class="project-info">
                        <h4>${project.name}</h4>
                        <span>${new Date(project.date).toLocaleString()}</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn-small load-project" data-id="${project.id}">Cargar</button>
                        <button class="btn-small delete-project" data-id="${project.id}">Eliminar</button>
                    </div>
                `;
                
                // Agregar event listeners
                li.querySelector('.load-project').addEventListener('click', () => loadProject(project.id));
                li.querySelector('.delete-project').addEventListener('click', () => deleteProject(project.id));
                
                projectsList.appendChild(li);
                cursor.continue();
            }
        };
        
        request.onerror = event => {
            console.error('Error al cargar proyectos:', event.target.error);
        };
    } catch (error) {
        console.error('Error en loadProjectsList:', error);
    }
}

// Cargar proyecto específico
async function loadProject(id) {
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        
        const request = store.get(id);
        
        request.onsuccess = event => {
            const project = event.target.result;
            if (project) {
                // Restaurar datos
                originalData = project.originalData;
                processedData = project.processedData;
                filteredData = null;
                currentPage = 1;
                
                // Mostrar datos en la interfaz
                populateFilterOptions();
                renderTableData();
                createFrequencyTables();
                createBarCharts();
                
                // Restaurar análisis
                document.getElementById('analysisContent').innerHTML = project.analysis;
                
                // Mostrar sección de resultados
                document.getElementById('loadingSection').classList.add('hidden');
                document.getElementById('resultsSection').classList.remove('hidden');
                
                // Ocultar gestor de proyectos
                document.getElementById('projectsManager').classList.add('hidden');
                
                alert('Proyecto cargado correctamente');
            }
        };
        
        request.onerror = event => {
            console.error('Error al cargar el proyecto:', event.target.error);
            alert('Error al cargar el proyecto');
        };
    } catch (error) {
        console.error('Error en loadProject:', error);
        alert('Error al cargar el proyecto');
    }
}

// Eliminar proyecto
async function deleteProject(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
        return;
    }
    
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        const request = store.delete(id);
        
        request.onsuccess = () => {
            alert('Proyecto eliminado correctamente');
            loadProjectsList(); // Actualizar lista
        };
        
        request.onerror = event => {
            console.error('Error al eliminar el proyecto:', event.target.error);
            alert('Error al eliminar el proyecto');
        };
    } catch (error) {
        console.error('Error en deleteProject:', error);
        alert('Error al eliminar el proyecto');
    }
}
// Ocultar splash screen después de cargar
setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    splash.style.opacity = 0;
    setTimeout(() => splash.style.display = 'none', 1000);
}, 1500); // dura 1.5 segundos
// Función de clasificación K-Means para el navegador
async function classifyWithKMeans(data, columnName) {
    // Extraer valores numéricos
    const values = data.map(row => parseFloat(row[columnName])).filter(v => !isNaN(v));
    
    if (values.length === 0) {
        throw new Error(`La columna "${columnName}" no contiene valores numéricos válidos`);
    }

    // Implementación simplificada de K-Means
    const sortedValues = [...values].sort((a, b) => a - b);
    const groupSize = Math.ceil(sortedValues.length / 3);
    
    return values.map(value => {
        const index = sortedValues.indexOf(value);
        return `Grupo ${Math.floor(index / groupSize) + 1}`;
    });
}

// Manejador del botón actualizado
document.getElementById('clusterBtn').addEventListener('click', async function() {
    const btn = this;
    try {
        btn.disabled = true;
        
        if (!processedData || processedData.length === 0) {
            throw new Error("Primero carga un archivo Excel");
        }

        // Detectar columnas numéricas automáticamente
        const numericColumns = Object.keys(processedData[0]).filter(key => {
            return processedData.some(row => !isNaN(parseFloat(row[key])));
        });

        if (numericColumns.length === 0) {
            throw new Error("No se encontraron columnas numéricas");
        }

        // Seleccionar columna automáticamente (prefiere 'ventas' o 'total')
        const columnToUse = numericColumns.includes('ventas') ? 'ventas' : 
                          numericColumns.includes('total') ? 'total' : 
                          numericColumns[0];

        // Clasificar
        const groups = await classifyWithKMeans(processedData, columnToUse);
        
        // Añadir grupos a los datos
        processedData.forEach((row, i) => {
            row.Grupo = groups[i];
        });

        // Actualizar UI
        populateFilterOptions();
        renderTableData();
        createBarCharts();

        // Mostrar resultados
        showClassificationResults(processedData, columnToUse);

    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    } finally {
        btn.disabled = false;
    }
});

// Mostrar resultados bonitos
function showClassificationResults(data, columnName) {
    const analysisDiv = document.getElementById('analysisContent');
    const groups = {};
    
    data.forEach(row => {
        const group = row.Grupo;
        if (!groups[group]) groups[group] = [];
        groups[group].push({
            nombre: row.nombre || 'Cliente',
            valor: row[columnName],
            codigo: row.Código || ''
        });
    });

    analysisDiv.innerHTML = `
        <h3>Resultados de Clasificación</h3>
        <p>Columna analizada: <strong>${columnName}</strong></p>
        
        <div class="groups-container">
            ${Object.entries(groups).map(([group, clients]) => `
                <div class="group" data-group="${group}">
                    <h4>${group}</h4>
                    <p>${clients.length} clientes</p>
                    <p>Valor promedio: ${(clients.reduce((sum, c) => sum + c.valor, 0) / clients.length).toFixed(2)}</p>
                    
                    <h5>Ejemplos:</h5>
                    <ul>
                        ${clients.slice(0, 5).map(c => `
                            <li>${c.nombre}: ${c.valor}</li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        
        <button class="btn" id="showFullTableBtn">Ver en tabla completa</button>
    `;

    // Event listener CORREGIDO para el botón
    document.getElementById('showFullTableBtn').addEventListener('click', function() {
        // Asegurarse que la tabla principal es visible
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Desplazarse a la tabla
        const tableElement = document.getElementById('dataTable');
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Resaltar la columna de Grupo
        const grupoHeaders = document.querySelectorAll('th');
        grupoHeaders.forEach(header => {
            if (header.textContent === 'Grupo') {
                header.style.backgroundColor = '#2a9d8f';
                setTimeout(() => {
                    header.style.backgroundColor = '';
                }, 2000);
            }
        });
    });
}
// Función mejorada para clasificar clientes con IA (K-Means de TensorFlow)
async function clasificarClientesConIA() {
    if (!processedData || processedData.length === 0) {
        alert("No hay datos cargados para clasificar.");
        return;
    }

    // 1. Preparar datos (ejemplo: usar "compras" o "total" como feature)
    const featureName = processedData[0].compras ? "compras" : "total";
    const valores = processedData.map(row => parseFloat(row[featureName])).filter(v => !isNaN(v));

    if (valores.length === 0) {
        alert("No se encontraron valores numéricos para clasificar.");
        return;
    }

    // 2. Convertir datos a tensores (requerido por TensorFlow)
    const datosTensor = tf.tensor2d(valores, [valores.length, 1]);

    // 3. Ejecutar K-Means (usando tfjs-kmeans o implementación manual)
    const numGrupos = 3; // Clasificar en 3 grupos
    const kmeans = await trainKMeans(datosTensor, numGrupos);

    // 4. Asignar grupos a los datos originales
    processedData.forEach((row, index) => {
        row.Grupo = `Grupo ${kmeans[index] + 1}`; // +1 para evitar "Grupo 0"
    });

    // 5. Mostrar resultados
    mostrarResultadosClasificacion(featureName);
}

// Entrenar K-Means (implementación simplificada con TensorFlow)
async function trainKMeans(dataTensor, numClusters, maxIterations = 10) {
    // 1. Inicializar centroides aleatorios
    const minVal = dataTensor.min().dataSync()[0];
    const maxVal = dataTensor.max().dataSync()[0];
    let centroides = tf.randomUniform([numClusters, 1], minVal, maxVal);

    for (let i = 0; i < maxIterations; i++) {
        // 2. Calcular distancias entre puntos y centroides
        const distancias = tf.tidy(() => {
            return tf.sub(dataTensor, centroides.expandDims(1).transpose())
                  .square()
                  .sum(2)
                  .sqrt();
        });

        // 3. Asignar cada punto al centroide más cercano
        const asignaciones = await distancias.argMin(1).array();
        distancias.dispose();

        // 4. Recalcular centroides (versión corregida)
        const nuevosCentroides = [];
        for (let j = 0; j < numClusters; j++) {
            // Filtrar puntos asignados a este cluster
            const mascara = asignaciones.map(a => a === j);
            const indices = mascara.map((val, idx) => val ? idx : -1).filter(i => i !== -1);
            
            if (indices.length > 0) {
                const puntosCluster = dataTensor.gather(tf.tensor1d(indices, 'int32'));
                const nuevoCentroide = puntosCluster.mean(0);
                nuevosCentroides.push(nuevoCentroide);
            } else {
                // Si un cluster queda vacío, mantener el centroide anterior
                nuevosCentroides.push(centroides.slice([j, 0], [1, 1]));
            }
        }

        // 5. Actualizar centroides
        centroides.dispose();
        centroides = tf.stack(nuevosCentroides);
    }

    // 6. Asignaciones finales
    const distanciasFinales = tf.tidy(() => {
        return tf.sub(dataTensor, centroides.expandDims(1).transpose())
               .square()
               .sum(2)
               .sqrt();
    });
    const asignacionesFinales = await distanciasFinales.argMin(1).array();
    
    // 7. Liberar memoria
    distanciasFinales.dispose();
    centroides.dispose();

    return asignacionesFinales;
}
// Mostrar resultados en la UI
function mostrarResultadosClasificacion(featureName) {
    const analysisDiv = document.getElementById('analysisContent');
    analysisDiv.innerHTML = `
        <h3>Clasificación de Clientes con IA (K-Means)</h3>
        <p>Columna analizada: <strong>${featureName}</strong></p>
        <div class="table-container">
            <table class="client-groups">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>${featureName}</th>
                        <th>Grupo (IA)</th>
                    </tr>
                </thead>
                <tbody>
                    ${processedData.slice(0, 20).map(row => `
                        <tr>
                            <td>${row.nombre || 'Cliente'}</td>
                            <td>${row[featureName]}</td>
                            <td class="group-${row.Grupo.split(' ')[1]}">${row.Grupo}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    renderTableData(); // Actualizar tabla principal
}
async function predecirTendencias() {
    if (!processedData || processedData.length < 10) {
        alert("Se necesitan al menos 10 registros para predecir.");
        return;
    }

    // 1. Preparar datos (ejemplo: usar "fecha" y "ventas")
    const fechas = processedData.map((_, i) => i); // Índices como "tiempo"
    const ventas = processedData.map(row => parseFloat(row.ventas));

    // 2. Normalizar datos
    const { datosX, datosY, minX, maxX, minY, maxY } = normalizarDatos(fechas, ventas);

    // 3. Crear modelo de regresión lineal
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

    // 4. Compilar y entrenar
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
    await model.fit(tf.tensor2d(datosX, [datosX.length, 1]), 
                   tf.tensor2d(datosY, [datosY.length, 1]), 
                   { epochs: 100 });

    // 5. Predecir
    const proximosMeses = 3;
    const predicciones = model.predict(tf.tensor2d(
        Array.from({ length: proximosMeses }, (_, i) => fechas.length + i),
        [proximosMeses, 1]
    )).arraySync();

    // 6. Mostrar resultados
    const analysisDiv = document.getElementById('analysisContent');
    analysisDiv.innerHTML = `
        <h3>Predicción de Ventas (IA)</h3>
        <p>Modelo: Regresión lineal con TensorFlow.js</p>
        <ul>
            ${predicciones.map((pred, i) => `
                <li>Mes ${fechas.length + i + 1}: ${Math.round(pred[0] * (maxY - minY) + minY)} ventas</li>
            `).join('')}
        </ul>
    `;
}

function normalizarDatos(x, y) {
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const minY = Math.min(...y);
    const maxY = Math.max(...y);
    return {
        datosX: x.map(v => (v - minX) / (maxX - minX)),
        datosY: y.map(v => (v - minY) / (maxY - minY)),
        minX, maxX, minY, maxY
    };
}
async function clasificarClientesConIA() {
    if (!processedData || processedData.length === 0) {
        alert("Primero carga un archivo Excel.");
        return;
    }

    // Extraer datos numéricos (ejemplo: columna "total" o "compras")
    const featureName = processedData[0].compras ? "compras" : "total";
    const valores = processedData.map(row => parseFloat(row[featureName])).filter(v => !isNaN(v));

    if (valores.length === 0) {
        alert(`La columna "${featureName}" no contiene valores numéricos.`);
        return;
    }

    // Convertir a tensor
    const datosTensor = tf.tensor2d(valores, [valores.length, 1]);

    // Ejecutar K-Means (versión simplificada)
    const numGrupos = 3;
    const kmeans = await trainKMeans(datosTensor, numGrupos);

    // Asignar grupos
    processedData.forEach((row, index) => {
        row.Grupo = `Grupo ${kmeans[index] + 1}`;
    });

    // Mostrar resultados
    mostrarResultadosClasificacion(featureName);
}
// Mostrar modal de autenticación
function initAuth() {
    checkAuth();
    
    // Verifica si el botón ya existe para no duplicarlo
    let authBtn = document.getElementById('authBtn');
    if (!authBtn) {
        authBtn = document.createElement('button');
        authBtn.className = 'btn auth-btn'; // Clase adicional
        authBtn.id = 'authBtn';
        document.querySelector('header').appendChild(authBtn);
    }
    
    authBtn.textContent = currentUser ? currentUser.email : 'Registrarse/Login';
    authBtn.onclick = () => document.getElementById('authModal').style.display = 'block';
    
    // Agrega botón de logout si está logueado
    if (currentUser) {
    }
}
// Función para mostrar mensajes en el modal
function showAuthMessage(message, type) {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type}`;
    setTimeout(() => messageEl.textContent = '', 5000); // Auto-ocultar después de 5 seg
}

// Actualizar la interfaz (botones, etc.)
function updateUI() {
    const authBtn = document.getElementById('authBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    
    if (currentUser) {
        authBtn.textContent = currentUser.email; // Mostrar email en el botón
        sendEmailBtn.disabled = false; // Habilitar envío de correos
    } else {
        authBtn.textContent = 'Registrarse/Login';
        sendEmailBtn.disabled = true;
    }
}

// Inicializar botones (ejecutar al cargar la página)
function initAuthButtons() {
    document.getElementById('registerBtn').addEventListener('click', () => handleAuth('register'));
    document.getElementById('loginBtn').addEventListener('click', () => handleAuth('login'));
}
// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    initAuthButtons();
    checkAuth();
});
function showAuthMessage(message, type) {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type}`;
    setTimeout(() => messageEl.textContent = '', 3000);
}

function updateUI() {
    const authBtn = document.getElementById('authBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    
    if (currentUser) {
        authBtn.textContent = currentUser.email;
        sendEmailBtn.disabled = false;
        document.getElementById('userEmailInput').value = currentUser.email;
    } else {
        authBtn.textContent = 'Registrarse/Login';
        sendEmailBtn.disabled = true;
    }
}

// Modificar la función de enviar correo
document.getElementById('sendEmailBtn').addEventListener('click', () => {
    if (!currentUser) {
        alert('Por favor inicia sesión primero');
        document.getElementById('authModal').style.display = 'block';
        return;
    }
    
    const message = document.getElementById('analysisContent').innerText;
    document.getElementById('emailMessage').value = message;
    document.getElementById('userEmailInput').value = currentUser.email;

    emailjs.sendForm('service_lbht95k', 'template_b6bvw1d', '#emailForm')
        .then(() => {
            alert(`Informe enviado exitosamente a ${currentUser.email}`);
        }, (error) => {
            console.error('Error al enviar:', error);
            alert('Error al enviar el informe por correo.');
        });
});

// Inicializar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', initAuth);

async function trainKMeans(dataTensor, numClusters, maxIterations = 10) {
    let centroides = tf.randomUniform([numClusters, 1], 0, 1);
    
    for (let i = 0; i < maxIterations; i++) {
        // Asignar puntos al centroide más cercano
        const distancias = tf.tidy(() => {
            return tf.sub(dataTensor, centroides.expandDims(1).transpose())
                  .square()
                  .sum(2)
                  .sqrt();
        });
        const asignaciones = await distancias.argMin(1).array();
        distancias.dispose();

        // Recalcular centroides
        const nuevosCentroides = [];
        for (let j = 0; j < numClusters; j++) {
            const puntosCluster = dataTensor.gather(tf.tensor1d(asignaciones)
                                          .equal(j)
                                          .nonzero()
                                          .squeeze());
            const nuevoCentroide = puntosCluster.mean(0);
            nuevosCentroides.push(nuevoCentroide);
        }
        centroides.dispose();
        centroides = tf.stack(nuevosCentroides);
    }

    // Devolver asignaciones finales
    const distanciasFinales = tf.sub(dataTensor, centroides.expandDims(1).transpose())
                               .square()
                               .sum(2)
                               .sqrt();
    const asignacionesFinales = await distanciasFinales.argMin(1).array();
    distanciasFinales.dispose();
    centroides.dispose();

    return asignacionesFinales;
}

function mostrarResultadosClasificacion(featureName) {
    const analysisDiv = document.getElementById('analysisContent');
    analysisDiv.innerHTML = `
        <h3>Clasificación con IA (K-Means)</h3>
        <p>Se usó la columna <strong>${featureName}</strong> para agrupar clientes.</p>
        <div class="table-container">
            ${processedData.slice(0, 10).map(row => `
                <p>${row.nombre || "Cliente"}: ${row[featureName]} → ${row.Grupo}</p>
            `).join('')}
        </div>
    `;
    renderTableData(); // Actualizar tabla principal
}
// Agrega esto en la sección de event listeners del DOMContentLoaded
document.getElementById('infoBtn').addEventListener('click', function() {
    document.getElementById('infoModal').style.display = 'block';
});

// Cierra el modal al hacer clic en la X
/* ========== [1. CERRAR MODALES CON X] ========== */
function setupModalCloseButtons() {
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

/* ========== [2. CERRAR AL HACER CLIC FUERA] ========== */
function setupModalBackgroundClose() {
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

/* ========== [3. CERRAR CON TECLA ESC] ========== */
function setupEscapeKeyClose() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

/* ========== [4. INICIALIZAR AL CARGAR LA PÁGINA] ========== */
document.addEventListener('DOMContentLoaded', function() {
    setupModalCloseButtons();
    setupModalBackgroundClose();
    setupEscapeKeyClose();
});

// Luego añade esto al DOMContentLoaded:

console.log('Estado inicial:', {
    currentUser,
    users: JSON.parse(localStorage.getItem('users')) || []
});
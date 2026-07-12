// Show page
function showPage(type, id) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(type + "-" + id).classList.add('active');
}

// Add row to table universally
function addRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const row = document.createElement('tr');
    const color = randomGroupColor();

    row.innerHTML = `
        <td><input type="text" class="table-input" placeholder="Category"></td>
        <td><input type="number" class="table-input" placeholder="Frequency"></td>
        <td><input type="color" class="color-input" value="${color}"></td>
        <td><button class="remove-row-button" onclick="removeRow(this)">X</button></td>
    `;
    tbody.appendChild(row);
}

// Remove row from table universally
function removeRow(btn) {
    const row = btn.closest('tr');
    const tbody = row.parentElement;
    if (tbody.rows.length > 1) {
        row.remove();
    }
}

// Import Chart.js universally
// I barely knew anything so I relied heavily on the documentation and examples, but I wrapped it in a function to make it easy to use across different tools. The function reads data from a table, generates the appropriate chart based on user selection, and updates stats accordingly. I also made sure to destroy any existing chart before creating a new one to prevent display issues.

// Register chart color
Chart.register({
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        const bgColor = chart.config.options.plugins.customCanvasBackgroundColor?.color || 'transparent';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
});

// Categorical Cards
//  One Variable Single Group Categorical 
let catOSChart = null;

function generateCatOS() {

    // Read inputs 
    const tbody = document.getElementById('cat-os-tbody');
    const rows = tbody.querySelectorAll('tr');
    const chartType = document.getElementById('cat-os-charttype').value;
    const varName = document.getElementById('cat-os-varname').value.trim() || 'Category';

    // Build data arrays from table rows 
    const labels = [];
    const values = [];
    const colors = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const category = inputs[0].value.trim();
        const frequency = parseFloat(inputs[1].value);
        const color = inputs[2].value;
        if (category && !isNaN(frequency)) {
            labels.push(category);
            values.push(frequency);
            colors.push(color);
        }
    });

    if (labels.length === 0) return;

    const total = values.reduce((a, b) => a + b, 0);

    //  Show canvas, hide placeholder 
    const canvas = document.getElementById('cat-os-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    //  Destroy existing chart before redrawing 
    if (catOSChart) catOSChart.destroy();

    //  Draw chart based on selected type 
    if (chartType === 'bar') {
        catOSChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return `Count: ${ctx.raw}  (${pct}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: varName, color: '#AAAAAA' }, ticks: { color: '#AAAAAA' }, grid: { color: '#2E2E2E' } },
                    y: { title: { display: true, text: 'Frequency', color: '#AAAAAA' }, ticks: { color: '#AAAAAA' }, grid: { color: '#2E2E2E' } }
                }
            }
        });

    } else if (chartType === 'pie') {
        catOSChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: varName, color: '#FFFFFF', font: { size: 16 } },
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return `Count: ${ctx.raw}  (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

    } else if (chartType === 'segmented-bar') {
        // Each category becomes its own dataset so Chart.js can stack them
        catOSChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [''],
                datasets: labels.map((label, i) => ({
                    label: label,
                    data: [((values[i] / total) * 100).toFixed(1)],
                    backgroundColor: colors[i],
                    borderRadius: 0,
                }))
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        max: 100,
                        title: { display: true, text: varName, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA', callback: v => v + '%' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: { stacked: true, ticks: { color: '#AAAAAA' }, grid: { color: '#2E2E2E' } }
                }
            }
        });
    }

    //  Fill stats table and summary 
    const statsTbody = document.getElementById('cat-os-stats-tbody');
    statsTbody.innerHTML = '';
    let mode = labels[0];
    let maxVal = values[0];

    labels.forEach((label, i) => {
        const pct = ((values[i] / total) * 100).toFixed(1);
        statsTbody.innerHTML += `
            <tr>
                <td>${label}</td>
                <td>${values[i]}</td>
                <td>${pct}%</td>
            </tr>`;
        if (values[i] > maxVal) { maxVal = values[i]; mode = label; }
    });

    document.getElementById('cat-os-n').textContent = total;
    document.getElementById('cat-os-categories').textContent = labels.length;
    document.getElementById('cat-os-mode').textContent = mode;

    //  Show stats, hide placeholder 
    document.getElementById('cat-os-stats').style.display = 'block';
    document.querySelector('#cat-os-stats').previousElementSibling.style.display = 'none';
}

// Update Chart CatOS Appearance
function updateCatOSAppearance() {
    if (!catOSChart) return;

    const bg = document.getElementById('cat-os-bg').value;
    const axisColor = document.getElementById('cat-os-axis-color').value;
    const titleColor = document.getElementById('cat-os-title-color').value;
    const gridColor = document.getElementById('cat-os-grid-color').value;

    // Update background through chart.js
    catOSChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    // Axis Label colors
    if (catOSChart.config.options.scales) {
        const scales = catOSChart.config.options.scales;
        if (scales.x) {
            scales.x.ticks.color = axisColor;
            scales.x.grid.color = gridColor;
            if (scales.x.title) scales.x.title.color = titleColor;
        }
        if (scales.y) {
            scales.y.ticks.color = axisColor;
            scales.y.grid.color = gridColor;
            if (scales.y.title) scales.y.title.color = titleColor;
        }
    }

    // Legend and title colors
    if (catOSChart.config.options.plugins.title) {
        catOSChart.config.options.plugins.title.color = titleColor;
    }
    if (catOSChart.config.options.plugins.legend) {
        catOSChart.config.options.plugins.legend.color = axisColor;
    }

    catOSChart.update();
}

// Export CatOS chart
function downloadCatOS() {
    if (!catOSChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = catOSChart.toBase64Image();
    link.click();
}

// Copy CatOS chart to clipboard
async function copyCatOS() {
    if (!catOSChart) return;
    const dataUrl = catOSChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
    ]);
    alert('Chart copied to clipboard!');
}

//  One Variable Multi Group Categorical 
let catOMChart = null;

// Generate Chart
function generateCatOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');
    const rows = tbody.querySelectorAll('tr');
    const chartType = document.getElementById('cat-om-charttype').value;
    const varName = document.getElementById('cat-om-varname').value.trim() || 'Category';

    // Get group names from header (skip Category and X)
    const groupHeaders = Array.from(header.querySelectorAll('th'));
    const groupNames = groupHeaders.slice(1, groupHeaders.length - 1).map(th => {
        const input = th.querySelector('input');
        return input ? input.value.trim() || 'Group' : 'Group';
    });
    const groupCount = groupNames.length;

    // Get group colors from color row
    const groupColorInputs = Array.from(colorRow.querySelectorAll('input[type="color"]'));
    const groupColors = groupColorInputs.map(input => input.value);

    // Build labels and values per group
    const labels = [];
    const groupData = Array.from({ length: groupCount }, () => []);

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const category = inputs[0].value.trim();
        if (!category) return;

        labels.push(category);

        for (let i = 0; i < groupCount; i++) {
            groupData[i].push(parseFloat(inputs[i + 1].value) || 0);
        }
    });

    if (labels.length === 0) return;

    // Show canvas, hide placeholder
    const canvas = document.getElementById('cat-om-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (catOMChart) catOMChart.destroy();

    catOMChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: groupNames.map((name, i) => ({
                label: name,
                data: groupData[i],
                backgroundColor: groupColors[i] || '#5897cb',
                borderRadius: 4,
            }))
        },
        options: {
            responsive: true,
            indexAxis: 'x',
            plugins: {
                legend: { labels: { color: '#AAAAAA' } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
            },
            scales: {
                x: {
                    stacked: chartType === 'stacked-bar',
                    title: { display: true, text: varName, color: '#AAAAAA' },
                    ticks: { color: '#AAAAAA' },
                    grid: { color: '#2E2E2E' }
                },
                y: {
                    stacked: chartType === 'stacked-bar',
                    title: { display: true, text: 'Frequency', color: '#AAAAAA' },
                    ticks: { color: '#AAAAAA' },
                    grid: { color: '#2E2E2E' }
                }
            }
        }
    });

    // Fill stats table
    const statsTbody = document.getElementById('cat-om-stats-tbody');
    statsTbody.innerHTML = '';

    labels.forEach((label, i) => {
        const rowTotal = groupData.reduce((sum, group) => sum + group[i], 0);
        let cells = `<td>${label}</td>`;
        groupData.forEach(group => {
            cells += `<td>${group[i]}</td><td>${rowTotal > 0 ? ((group[i] / rowTotal) * 100).toFixed(1) : 0}%</td>`;
        });
        cells += `<td>${rowTotal}</td>`;
        statsTbody.innerHTML += `<tr>${cells}</tr>`;
    });

    document.getElementById('cat-om-stats').style.display = 'block';
    document.querySelector('#cat-om-stats').previousElementSibling.style.display = 'none';
}

// Add new row
function addRowOM() {
    const tbody = document.getElementById('cat-om-tbody');
    const header = document.getElementById('cat-om-header');
    const groupCount = header.querySelectorAll('th').length - 2;

    let groupInputs = '';
    for (let i = 0; i < groupCount; i++) {
        groupInputs += `<td><input type="number" class="table-input" placeholder="0"></td>`;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="table-input" placeholder="Category"></td>
        ${groupInputs}
        <td><button class="remove-row-button" onclick="removeRow(this)">X</button></td>
    `;
    tbody.appendChild(row);
}

// Add new group
function addGroupOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');
    const groupCount = header.querySelectorAll('th').length - 1;
    const color = randomGroupColor();

    // Add header before last th (the empty X column)
    const lastTh = header.querySelector('th:last-child');
    const newTh = document.createElement('th');
    newTh.innerHTML = `<input type="text" class="table-header-input" placeholder="Group ${groupCount}" value="Group ${groupCount}">`;
    header.insertBefore(newTh, lastTh);

    // Add color picker before last td in color row
    const lastColorTd = colorRow.querySelector('td:last-child');
    const newColorTd = document.createElement('td');
    newColorTd.innerHTML = `<input type="color" class="color-input" value="${color}">`;
    colorRow.insertBefore(newColorTd, lastColorTd);

    // Add number input before last td (X button) in each data row
    tbody.querySelectorAll('tr').forEach(row => {
        const lastTd = row.querySelector('td:last-child');
        const newTd = document.createElement('td');
        newTd.innerHTML = `<input type="number" class="table-input" placeholder="0">`;
        row.insertBefore(newTd, lastTd);
    });
}

// Remove group
function removeGroupOM() {
    const header = document.getElementById('cat-om-header');
    const colorRow = document.getElementById('cat-om-colors');
    const tbody = document.getElementById('cat-om-tbody');

    const groupCount = header.querySelectorAll('th').length - 2;
    if (groupCount <= 1) return;

    // Remove last group header
    const lastTh = header.querySelector('th:nth-last-child(2)');
    lastTh.remove();

    // Remove last color picker
    const lastColorTd = colorRow.querySelector('td:nth-last-child(2)');
    lastColorTd.remove();

    // Remove last number input from each row
    tbody.querySelectorAll('tr').forEach(row => {
        row.querySelector('td:nth-last-child(2)').remove();
    });
}

// Export CatOM chart
function downloadCatOM() {
    if (!catOMChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = catOMChart.toBase64Image();
    link.click();
}

// Copy CatOM chart to clipboard
async function copyCatOM() {
    if (!catOMChart) return;
    const dataUrl = catOMChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
    ]);
    alert('Chart copied to clipboard!');
}

// Update Chart CatOM Appearance
function updateCatOMAppearance() {
    if (!catOMChart) return;

    const bg = document.getElementById('cat-om-bg').value;
    const axisColor = document.getElementById('cat-om-axis-color').value;
    const titleColor = document.getElementById('cat-om-title-color').value;
    const gridColor = document.getElementById('cat-om-grid-color').value;

    // Update background through chart.js
    catOMChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    // Axis Label colors
    if (catOMChart.config.options.scales) {
        const scales = catOMChart.config.options.scales;
        if (scales.x) {
            scales.x.ticks.color = axisColor;
            scales.x.grid.color = gridColor;
            if (scales.x.title) scales.x.title.color = titleColor;
        }
        if (scales.y) {
            scales.y.ticks.color = axisColor;
            scales.y.grid.color = gridColor;
            if (scales.y.title) scales.y.title.color = titleColor;
        }
    }

    // Legend and title colors
    if (catOMChart.config.options.plugins.title) {
        catOMChart.config.options.plugins.title.color = titleColor;
    }
    if (catOMChart.config.options.plugins.legend) {
        catOMChart.config.options.plugins.legend.color = axisColor;
    }

    catOMChart.update();
}

// Two Variables Categorical
let catTVChart = null;

// Add row
function addRowTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const colCount = header.querySelectorAll('th').length - 3;
    const color = randomGroupColor();

    let cells = `<td><input type="text" class="table-input" placeholder="Row"></td>`;
    for (let i = 0; i < colCount; i++) {
        cells += `<td><input type="number" class="table-input" placeholder="0"></td>`;
    }
    cells += `<td><input type="color" class="color-input" value="${color}"></td>`;
    cells += `<td><button class="remove-row-button" onclick="removeRow(this)">X</button></td>`;

    const row = document.createElement('tr');
    row.innerHTML = cells;
    tbody.appendChild(row);
}

// Add column
function addColTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const colCount = header.querySelectorAll('th').length - 2;

    const colorTh = header.querySelector('th:nth-last-child(2)');
    const newTh = document.createElement('th');
    newTh.innerHTML = `<input type="text" class="table-header-input" placeholder="Col ${colCount}" value="Col ${colCount}">`;
    header.insertBefore(newTh, colorTh);

    tbody.querySelectorAll('tr').forEach(row => {
        const colorTd = row.querySelector('td:nth-last-child(2)');
        const newTd = document.createElement('td');
        newTd.innerHTML = `<input type="number" class="table-input" placeholder="0">`;
        row.insertBefore(newTd, colorTd);
    });
}

// Remove column
function removeColTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const colCount = header.querySelectorAll('th').length - 3;

    if (colCount <= 1) return;

    header.querySelector('th:nth-last-child(3)').remove();

    tbody.querySelectorAll('tr').forEach(row => {
        row.querySelector('td:nth-last-child(3)').remove();
    });
}

// Generate chart
function generateCatTV() {
    const header = document.getElementById('cat-tv-header');
    const tbody = document.getElementById('cat-tv-tbody');
    const rows = tbody.querySelectorAll('tr');
    const chartType = document.getElementById('cat-tv-charttype').value;
    const var1 = document.getElementById('cat-tv-var1').value.trim() || 'Variable 1';
    const var2 = document.getElementById('cat-tv-var2').value.trim() || 'Variable 2';

    // Get column names from header
    const headerThs = Array.from(header.querySelectorAll('th'));
    const colNames = headerThs.slice(1, headerThs.length - 2).map(th => {
        const input = th.querySelector('input');
        return input ? input.value.trim() || 'Col' : 'Col';
    });
    const colCount = colNames.length;

    // Read row labels, colors, and data
    const rowLabels = [];
    const rowColors = [];
    const tableData = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const rowLabel = inputs[0].value.trim();
        const color = inputs[inputs.length - 1].value;
        if (!rowLabel) return;

        rowLabels.push(rowLabel);
        rowColors.push(color);

        const rowData = [];
        for (let i = 0; i < colCount; i++) {
            rowData.push(parseFloat(inputs[i + 1].value) || 0);
        }
        tableData.push(rowData);
    });

    if (rowLabels.length === 0) return;

    // Show canvas
    const canvas = document.getElementById('cat-tv-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (catTVChart) catTVChart.destroy();

    if (chartType === 'side-by-side') {
        catTVChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: colNames,
                datasets: rowLabels.map((label, i) => ({
                    label: label,
                    data: tableData[i],
                    backgroundColor: rowColors[i],
                    borderRadius: 4,
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } }
                },
                scales: {
                    x: {
                        title: { display: true, text: var2, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: {
                        title: { display: true, text: 'Frequency', color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    }
                }
            }
        });

    } else if (chartType === 'segmented') {
        const colTotals = colNames.map((_, ci) =>
            tableData.reduce((sum, row) => sum + row[ci], 0)
        );

        catTVChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: colNames,
                datasets: rowLabels.map((label, i) => ({
                    label: label,
                    data: colNames.map((_, ci) =>
                        colTotals[ci] > 0 ? ((tableData[i][ci] / colTotals[ci]) * 100).toFixed(1) : 0
                    ),
                    backgroundColor: rowColors[i],
                    borderRadius: 0,
                }))
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#AAAAAA' } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%` } }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: var2, color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA' },
                        grid: { color: '#2E2E2E' }
                    },
                    y: {
                        stacked: true,
                        max: 100,
                        title: { display: true, text: 'Proportion (%)', color: '#AAAAAA' },
                        ticks: { color: '#AAAAAA', callback: v => v + '%' },
                        grid: { color: '#2E2E2E' }
                    }
                }
            }
        });
    }

    // Stats contingency table
    const statsTbody = document.getElementById('cat-tv-stats-tbody');
    const statsHeader = document.getElementById('cat-tv-stats-header');
    statsTbody.innerHTML = '';

    statsHeader.innerHTML = `<tr>
        <th>${var1} \\ ${var2}</th>
        ${colNames.map(c => `<th>${c}</th>`).join('')}
        <th>Row Total</th>
    </tr>`;

    rowLabels.forEach((label, i) => {
        const rowTotal = tableData[i].reduce((a, b) => a + b, 0);
        statsTbody.innerHTML += `<tr>
            <td>${label}</td>
            ${tableData[i].map(v => `<td>${v}</td>`).join('')}
            <td><strong>${rowTotal}</strong></td>
        </tr>`;
    });

    const colTotals = colNames.map((_, ci) => tableData.reduce((sum, row) => sum + row[ci], 0));
    const grandTotal = colTotals.reduce((a, b) => a + b, 0);
    statsTbody.innerHTML += `<tr>
        <td><strong>Col Total</strong></td>
        ${colTotals.map(v => `<td><strong>${v}</strong></td>`).join('')}
        <td><strong>${grandTotal}</strong></td>
    </tr>`;

    document.getElementById('cat-tv-stats').style.display = 'block';
    document.querySelector('#cat-tv-stats').previousElementSibling.style.display = 'none';
}

// Update chart
function updateCatTVAppearance() {
    if (!catTVChart) return;

    const bg = document.getElementById('cat-tv-bg').value;
    const axisColor = document.getElementById('cat-tv-axis-color').value;
    const titleColor = document.getElementById('cat-tv-title-color').value;
    const gridColor = document.getElementById('cat-tv-grid-color').value;

    catTVChart.config.options.plugins.customCanvasBackgroundColor = { color: bg };

    if (catTVChart.config.options.scales) {
        const scales = catTVChart.config.options.scales;
        if (scales.x) {
            scales.x.ticks.color = axisColor;
            scales.x.grid.color = gridColor;
            if (scales.x.title) scales.x.title.color = titleColor;
        }
        if (scales.y) {
            scales.y.ticks.color = axisColor;
            scales.y.grid.color = gridColor;
            if (scales.y.title) scales.y.title.color = titleColor;
        }
    }

    if (catTVChart.config.options.plugins.legend) {
        catTVChart.config.options.plugins.legend.labels.color = axisColor;
    }

    catTVChart.update();
}

// Download chart
function downloadCatTV() {
    if (!catTVChart) return;
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = catTVChart.toBase64Image();
    link.click();
}

// Copy chart
async function copyCatTV() {
    if (!catTVChart) return;
    const dataUrl = catTVChart.toBase64Image();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}

// Quantitative Cards
// One Variable Single Group Quantitative
let quanOSChart = null;

// Auto-grow textarea
document.getElementById('quan-os-data').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

function generateQuanOS() {
    if (quanOSChart) quanOSChart.destroy();

    const canvas = document.getElementById('quan-os-chart');
    canvas.style.height = '';
    canvas.style.width = '';
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');

    const oldStem = canvas.parentElement.querySelector('.stemplot');
    if (oldStem) oldStem.remove();

    // Read inputs 
    const raw = document.getElementById('quan-os-data').value;
    const varName = document.getElementById('quan-os-varname').value.trim() || 'Variable';
    const chartType = document.getElementById('quan-os-charttype').value;
    const barColor = document.getElementById('quan-os-dot-color').value;

    // Separate
    const values = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Show canvas & hide placeholder
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (quanOSChart) quanOSChart.destroy();
    quanOSChart = null;

    if (canvas._hoverHandler) {
        canvas.removeEventListener('mousemove', canvas._hoverHandler);
        canvas._hoverHandler = null;
    }

    if (canvas._leaveHandler) {
        canvas.removeEventListener('mouseleave', canvas._leaveHandler);
        canvas._leaveHandler = null;
    }

    canvas.style.cursor = 'default';

    if (chartType === 'histogram') {

        const binCount = Math.ceil(Math.log2(n) + 1);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const binWidth = (max - min) / binCount || 1;

        const bins = Array.from({ length: binCount }, (_, i) => ({
            start: min + i * binWidth,
            end: min + (i + 1) * binWidth,
            count: 0
        }));

        values.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
            bins[idx].count++;
        });

        const maxCount = Math.max(...bins.map(b => b.count));

        const margin = { top: 20, right: 30, bottom: 60, left: 50 };
        const parent = canvas.parentElement;
        const W = parent.clientWidth - 40;
        const H = 320;

        canvas.width = W;
        canvas.height = H;
        canvas.style.display = 'block';
        canvas.style.height = 'auto';

        const ctx2d = canvas.getContext('2d');
        const plotW = W - margin.left - margin.right;
        const plotH = H - margin.top - margin.bottom;

        const bg = document.getElementById('quan-os-bg').value;
        const axisColor = document.getElementById('quan-os-axis-color').value;
        const gridColor = document.getElementById('quan-os-grid-color').value;
        const barColor = document.getElementById('quan-os-dot-color').value;

        function drawHistogram(hoveredIdx) {
            ctx2d.clearRect(0, 0, W, H);
            ctx2d.fillStyle = bg;
            ctx2d.fillRect(0, 0, W, H);

            // Horizontal gridlines
            const yTicks = 5;
            ctx2d.strokeStyle = gridColor;
            ctx2d.fillStyle = axisColor;
            ctx2d.font = '11px Montserrat, sans-serif';
            ctx2d.textAlign = 'right';
            for (let i = 0; i <= yTicks; i++) {
                const v = (maxCount / yTicks) * i;
                const y = margin.top + plotH - (v / maxCount) * plotH;
                ctx2d.beginPath();
                ctx2d.moveTo(margin.left, y);
                ctx2d.lineTo(margin.left + plotW, y);
                ctx2d.stroke();
                ctx2d.fillText(Math.round(v), margin.left - 8, y + 4);
            }

            // Bars
            const barW = plotW / binCount;
            bins.forEach((bin, i) => {
                const barH = maxCount > 0 ? (bin.count / maxCount) * plotH : 0;
                const x = margin.left + i * barW;
                const y = margin.top + plotH - barH;
                ctx2d.fillStyle = i === hoveredIdx ? '#ffffff' : barColor;
                ctx2d.fillRect(x + 1, y, barW - 2, barH);
            });

            // X axis line
            ctx2d.strokeStyle = axisColor;
            ctx2d.beginPath();
            ctx2d.moveTo(margin.left, margin.top + plotH);
            ctx2d.lineTo(margin.left + plotW, margin.top + plotH);
            ctx2d.stroke();

            // X tick labels (bin edges)
            ctx2d.fillStyle = axisColor;
            ctx2d.textAlign = 'center';
            bins.forEach((bin, i) => {
                const x = margin.left + i * barW;
                ctx2d.fillText(bin.start.toFixed(1), x, margin.top + plotH + 16);
            });
            ctx2d.fillText(bins[bins.length - 1].end.toFixed(1), margin.left + plotW, margin.top + plotH + 16);

            // Axis titles
            ctx2d.fillStyle = axisColor;
            ctx2d.font = '12px Montserrat, sans-serif';
            ctx2d.fillText(varName, margin.left + plotW / 2, H - 8);

            ctx2d.save();
            ctx2d.translate(14, margin.top + plotH / 2);
            ctx2d.rotate(-Math.PI / 2);
            ctx2d.textAlign = 'center';
            ctx2d.fillText('Frequency', 0, 0);
            ctx2d.restore();

            // Tooltip
            if (hoveredIdx !== null && hoveredIdx !== undefined) {
                const bin = bins[hoveredIdx];
                const pct = ((bin.count / n) * 100).toFixed(1);
                const label = `${bin.count} (${pct}%)`;
                const barX = margin.left + hoveredIdx * barW + barW / 2;
                const barTopY = margin.top + plotH - (maxCount > 0 ? (bin.count / maxCount) * plotH : 0);

                ctx2d.font = '12px Montserrat, sans-serif';
                const tw = ctx2d.measureText(label).width;
                const tx = Math.min(Math.max(barX - tw / 2 - 6, margin.left), margin.left + plotW - tw - 12);
                const ty = Math.max(barTopY - 26, margin.top);

                ctx2d.fillStyle = '#333';
                ctx2d.beginPath();
                ctx2d.roundRect(tx, ty, tw + 12, 20, 4);
                ctx2d.fill();

                ctx2d.fillStyle = '#ffffff';
                ctx2d.textAlign = 'left';
                ctx2d.fillText(label, tx + 6, ty + 14);
            }
        }

        drawHistogram(null);

        canvas._hoverHandler && canvas.removeEventListener('mousemove', canvas._hoverHandler);
        canvas._leaveHandler && canvas.removeEventListener('mouseleave', canvas._leaveHandler);

        const barW = plotW / binCount;
        canvas._hoverHandler = function(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            let hoveredIdx = null;
            if (mx >= margin.left && mx <= margin.left + plotW && my >= margin.top && my <= margin.top + plotH) {
                const idx = Math.floor((mx - margin.left) / barW);
                const bin = bins[idx];
                if (bin) {
                    const barH = maxCount > 0 ? (bin.count / maxCount) * plotH : 0;
                    const barTopY = margin.top + plotH - barH;
                    if (my >= barTopY) hoveredIdx = idx;
                }
            }
            drawHistogram(hoveredIdx);
            canvas.style.cursor = hoveredIdx !== null ? 'pointer' : 'default';
        };

        canvas._leaveHandler = function() {
            drawHistogram(null);
            canvas.style.cursor = 'default';
        };

        canvas.addEventListener('mousemove', canvas._hoverHandler);
        canvas.addEventListener('mouseleave', canvas._leaveHandler);

        // Frequency table
        const statsTbody = document.getElementById('quan-os-stats-tbody');
        statsTbody.innerHTML = '';
        bins.forEach(bin => {
            const pct = ((bin.count / n) * 100).toFixed(1);
            statsTbody.innerHTML += `<tr>
                <td>${bin.start.toFixed(1)} – ${bin.end.toFixed(1)}</td>
                <td>${bin.count}</td>
                <td>${pct}%</td>
            </tr>`;
        });
        
    } else if (chartType === 'dotplot') {

        const freqCounts = {};
        values.forEach(v => freqCounts[v] = (freqCounts[v] || 0) + 1);
        const maxStack = Math.max(...Object.values(freqCounts));
        const uniqueVals = Object.keys(freqCounts).map(Number).sort((a, b) => a - b);

        const dotRadius = parseInt(document.getElementById('quan-os-dot-radius').value);
        const padding = dotRadius * 2 + 2;
        const margin = { top: 20, right: 20, bottom: 40, left: 20 };

        const parent = canvas.parentElement;
        const W = parent.clientWidth - 40;
        const H = margin.top + (maxStack * padding) + dotRadius + margin.bottom;

        canvas.width = W;
        canvas.height = H;
        canvas.style.display = 'block';
        canvas.style.height = 'auto';

        const ctx2d = canvas.getContext('2d');
        const plotW = W - margin.left - margin.right;
        const baseY = H - margin.bottom;

        const minVal = sorted[0];
        const maxVal = sorted[sorted.length - 1];
        const toX = v => margin.left + ((v - minVal) / (maxVal - minVal || 1)) * plotW;

        // Background
        ctx2d.fillStyle = document.getElementById('quan-os-bg').value;
        ctx2d.fillRect(0, 0, W, H);

        // Axis line
        ctx2d.strokeStyle = document.getElementById('quan-os-axis-color').value;
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(margin.left, baseY);
        ctx2d.lineTo(margin.left + plotW, baseY);
        ctx2d.stroke();

        // Ticks and labels with equal intervals
        const tickCount = 10;
        const tickStep = (maxVal - minVal) / tickCount;
        ctx2d.fillStyle = document.getElementById('quan-os-axis-color').value;
        ctx2d.font = '11px Montserrat, sans-serif';
        ctx2d.textAlign = 'center';
        for (let i = 0; i <= tickCount; i++) {
            const v = minVal + i * tickStep;
            const x = toX(v);
            ctx2d.beginPath();
            ctx2d.moveTo(x, baseY);
            ctx2d.lineTo(x, baseY + 5);
            ctx2d.strokeStyle = document.getElementById('quan-os-axis-color').value;
            ctx2d.stroke();
            ctx2d.fillText(v.toFixed(2), x, baseY + 18);
        }

        // X label
        ctx2d.fillStyle = document.getElementById('quan-os-axis-color').value;
        ctx2d.font = '12px Montserrat, sans-serif';
        ctx2d.fillText(varName, margin.left + plotW / 2, H - 4);

        // Dots
        uniqueVals.forEach(v => {
            const x = toX(v);
            for (let i = 0; i < freqCounts[v]; i++) {
                const y = baseY - dotRadius - (i * padding);
                ctx2d.beginPath();
                ctx2d.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx2d.fillStyle = barColor;
                ctx2d.fill();
            }
        });

        document.getElementById('quan-os-stats-tbody').innerHTML = '';

        const dotPositions = [];
        uniqueVals.forEach(v => {
            const x = toX(v);
            for (let i = 0; i < freqCounts[v]; i++) {
                const y = baseY - dotRadius - (i * padding);
                dotPositions.push({ x, y, value: v });
            }
        });

        function drawDotPlot(hoveredDot) {
            ctx2d.clearRect(0, 0, W, H);

            ctx2d.fillStyle = document.getElementById('quan-os-bg').value;
            ctx2d.fillRect(0, 0, W, H);

            ctx2d.strokeStyle = document.getElementById('quan-os-axis-color').value;
            ctx2d.lineWidth = 1;
            ctx2d.beginPath();
            ctx2d.moveTo(margin.left, baseY);
            ctx2d.lineTo(margin.left + plotW, baseY);
            ctx2d.stroke();

            const tickCount = 10;
            const tickStep = (maxVal - minVal) / tickCount;
            ctx2d.fillStyle = document.getElementById('quan-os-axis-color').value;
            ctx2d.font = '11px Montserrat, sans-serif';
            ctx2d.textAlign = 'center';
            for (let i = 0; i <= tickCount; i++) {
                const v = minVal + i * tickStep;
                const x = toX(v);
                ctx2d.beginPath();
                ctx2d.moveTo(x, baseY);
                ctx2d.lineTo(x, baseY + 5);
                ctx2d.strokeStyle = document.getElementById('quan-os-axis-color').value;
                ctx2d.stroke();
                ctx2d.fillText(v.toFixed(2), x, baseY + 18);
            }

            ctx2d.fillStyle = document.getElementById('quan-os-axis-color').value;
            ctx2d.font = '12px Montserrat, sans-serif';
            ctx2d.fillText(varName, margin.left + plotW / 2, H - 4);

            dotPositions.forEach(dot => {
                const isHovered = hoveredDot &&
                    Math.abs(dot.x - hoveredDot.x) < 1 &&
                    Math.abs(dot.y - hoveredDot.y) < 1;

                ctx2d.beginPath();
                ctx2d.arc(dot.x, dot.y, isHovered ? dotRadius * 1.4 : dotRadius, 0, Math.PI * 2);
                ctx2d.fillStyle = isHovered ? '#ffffff' : barColor;
                ctx2d.fill();
            });

            // Show value
            if (hoveredDot) {
                const label = `${hoveredDot.value}`;
                ctx2d.font = '12px Montserrat, sans-serif';
                const tw = ctx2d.measureText(label).width;
                const tx = Math.min(hoveredDot.x - tw / 2 - 6, W - tw - 20);
                const ty = hoveredDot.y - dotRadius - 18;

                ctx2d.fillStyle = '#333';
                ctx2d.beginPath();
                ctx2d.roundRect(tx, ty, tw + 12, 20, 4);
                ctx2d.fill();

                ctx2d.fillStyle = '#ffffff';
                ctx2d.textAlign = 'left';
                ctx2d.fillText(label, tx + 6, ty + 14);
            }
        }

        drawDotPlot(null);

        canvas._hoverHandler && canvas.removeEventListener('mousemove', canvas._hoverHandler);
        canvas._leaveHandler && canvas.removeEventListener('mouseleave', canvas._leaveHandler);

        canvas._hoverHandler = function(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            const hovered = dotPositions.find(dot =>
                Math.sqrt((dot.x - mx) ** 2 + (dot.y - my) ** 2) <= dotRadius + 3
            );
            drawDotPlot(hovered || null);
            canvas.style.cursor = hovered ? 'pointer' : 'default';
        };

        canvas._leaveHandler = function() {
            drawDotPlot(null);
            canvas.style.cursor = 'default';
        };

        canvas.addEventListener('mousemove', canvas._hoverHandler);
        canvas.addEventListener('mouseleave', canvas._leaveHandler);

    } else if (chartType === 'boxplot') {

        const q1 = calcQuartile(sorted, 0.25);
        const median = calcMedian(sorted);
        const q3 = calcQuartile(sorted, 0.75);
        const iqr = q3 - q1;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
        const whiskerLow = sorted.find(v => v >= lowerFence) ?? min;
        const whiskerHigh = [...sorted].reverse().find(v => v <= upperFence) ?? max;

        const margin = { top: 40, right: 40, bottom: 50, left: 40 };
        const parent = canvas.parentElement;
        const W = parent.clientWidth - 40;
        const H = 200;

        canvas.width = W;
        canvas.height = H;
        canvas.style.display = 'block';
        canvas.style.height = 'auto';

        const ctx2d = canvas.getContext('2d');
        const plotW = W - margin.left - margin.right;
        const midY = margin.top + (H - margin.top - margin.bottom) / 2;
        const boxH = 50;

        const bg = document.getElementById('quan-os-bg').value;
        const axisColor = document.getElementById('quan-os-axis-color').value;
        const gridColor = document.getElementById('quan-os-grid-color').value;

        const toX = v => margin.left + ((v - min) / (max - min || 1)) * plotW;

        ctx2d.fillStyle = bg;
        ctx2d.fillRect(0, 0, W, H);

        const tickCount = 8;
        ctx2d.strokeStyle = gridColor;
        ctx2d.lineWidth = 1;
        for (let i = 0; i <= tickCount; i++) {
            const v = min + (i / tickCount) * (max - min);
            const x = toX(v);
            ctx2d.beginPath();
            ctx2d.moveTo(x, margin.top);
            ctx2d.lineTo(x, H - margin.bottom);
            ctx2d.stroke();
        }

        ctx2d.strokeStyle = axisColor;
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(margin.left, H - margin.bottom);
        ctx2d.lineTo(margin.left + plotW, H - margin.bottom);
        ctx2d.stroke();

        ctx2d.fillStyle = axisColor;
        ctx2d.font = '11px Montserrat, sans-serif';
        ctx2d.textAlign = 'center';
        for (let i = 0; i <= tickCount; i++) {
            const v = min + (i / tickCount) * (max - min);
            const x = toX(v);
            ctx2d.beginPath();
            ctx2d.moveTo(x, H - margin.bottom);
            ctx2d.lineTo(x, H - margin.bottom + 5);
            ctx2d.strokeStyle = axisColor;
            ctx2d.stroke();
            ctx2d.fillText(v.toFixed(1), x, H - margin.bottom + 18);
        }

        ctx2d.fillStyle = axisColor;
        ctx2d.font = '12px Montserrat, sans-serif';
        ctx2d.fillText(varName, margin.left + plotW / 2, H - 4);

        ctx2d.strokeStyle = barColor;
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(toX(whiskerLow), midY);
        ctx2d.lineTo(toX(q1), midY);
        ctx2d.stroke();

        ctx2d.beginPath();
        ctx2d.moveTo(toX(q3), midY);
        ctx2d.lineTo(toX(whiskerHigh), midY);
        ctx2d.stroke();

        const capH = boxH * 0.4;
        [whiskerLow, whiskerHigh].forEach(v => {
            ctx2d.beginPath();
            ctx2d.moveTo(toX(v), midY - capH / 2);
            ctx2d.lineTo(toX(v), midY + capH / 2);
            ctx2d.stroke();
        });

        ctx2d.fillStyle = barColor + '44';
        ctx2d.strokeStyle = barColor;
        ctx2d.lineWidth = 2;
        ctx2d.fillRect(toX(q1), midY - boxH / 2, toX(q3) - toX(q1), boxH);
        ctx2d.strokeRect(toX(q1), midY - boxH / 2, toX(q3) - toX(q1), boxH);

        ctx2d.strokeStyle = barColor;
        ctx2d.lineWidth = 3;
        ctx2d.beginPath();
        ctx2d.moveTo(toX(median), midY - boxH / 2);
        ctx2d.lineTo(toX(median), midY + boxH / 2);
        ctx2d.stroke();

        outliers.forEach(v => {
            ctx2d.beginPath();
            ctx2d.arc(toX(v), midY, 5, 0, Math.PI * 2);
            ctx2d.fillStyle = barColor;
            ctx2d.fill();
        });

        document.getElementById('quan-os-stats-tbody').innerHTML = '';

    } else if (chartType === 'stemplot') {

        canvas.style.display = 'none';
        canvas.previousElementSibling.style.display = 'none';

        const stemMap = {};
        sorted.forEach(v => {
            const stem = Math.floor(v / 10);
            const leaf = Math.abs(v % 10);
            if (!stemMap[stem]) stemMap[stem] = [];
            stemMap[stem].push(leaf);
        });

        let html = `<div class="stemplot">
            <p class="input-label" style="margin-bottom:8px;">Stem | Leaf  (${varName})</p>
            <table class="stats-table">`;
        Object.keys(stemMap).sort((a, b) => a - b).forEach(stem => {
            html += `<tr><td style="text-align:right; padding-right:8px; border-right: 1px solid #444;">${stem}</td>
                     <td style="padding-left:8px;">${stemMap[stem].join('  ')}</td></tr>`;
        });
        html += `</table></div>`;

        const outputPanel = canvas.parentElement;
        let stemDiv = outputPanel.querySelector('.stemplot');
        if (stemDiv) stemDiv.remove();
        outputPanel.insertAdjacentHTML('beforeend', html);

        document.getElementById('quan-os-stats-tbody').innerHTML = '';
    }

    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = calcMedian(sorted);
    const q1 = calcQuartile(sorted, 0.25);
    const q3 = calcQuartile(sorted, 0.75);

    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const maxCount = Math.max(...Object.values(counts));
    const modes = Object.keys(counts).filter(k => counts[k] === maxCount).map(Number);
    const modeStr = maxCount === 1 ? 'None' : modes.join(', ');

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);

    document.getElementById('quan-os-n').textContent = n;
    document.getElementById('quan-os-min').textContent = min;
    document.getElementById('quan-os-max').textContent = max;
    document.getElementById('quan-os-range').textContent = (max - min).toFixed(2);
    document.getElementById('quan-os-iqr').textContent = (q3 - q1).toFixed(2);
    document.getElementById('quan-os-q1').textContent = q1.toFixed(2);
    document.getElementById('quan-os-q3').textContent = q3.toFixed(2);
    document.getElementById('quan-os-mean').textContent = mean.toFixed(2);
    document.getElementById('quan-os-median').textContent = median.toFixed(2);
    document.getElementById('quan-os-mode').textContent = modeStr;
    document.getElementById('quan-os-sd').textContent = sd.toFixed(2);

    document.getElementById('quan-os-stats').style.display = 'block';
    document.querySelector('#quan-os-stats').previousElementSibling.style.display = 'none';
}

// Helper functions

function calcMedian(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calcQuartile(sorted, q) {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
}

// Appearance

function updateQuanOSAppearance() {
    const chartType = document.getElementById('quan-os-charttype').value;
    if (chartType === 'dotplot' || chartType === 'histogram' || chartType === 'boxplot') {
        generateQuanOS();
    }
}

// Export

function downloadQuanOS() {
    const chartType = document.getElementById('quan-os-charttype').value;
    if (chartType === 'stemplot') {
        alert('Stem plots are text-based and can\'t be downloaded as an image.');
        return;
    }
    const canvas = document.getElementById('quan-os-chart');
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function copyQuanOS() {
    const chartType = document.getElementById('quan-os-charttype').value;
    if (chartType === 'stemplot') {
        alert('Stem plots are text-based and can\'t be copied as an image.');
        return;
    }
    const canvas = document.getElementById('quan-os-chart');
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}

function calculateQuanOSPercentile() {
    const input = parseFloat(document.getElementById('quan-os-percentile-value').value);
    const result = document.getElementById('quan-os-percentile-result');
    if (isNaN(input)) { result.textContent = 'Enter a valid number.'; return; }

    const raw = document.getElementById('quan-os-data').value;
    const sorted = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) { result.textContent = 'Generate a chart first.'; return; }

    const below = sorted.filter(v => v < input).length;
    const equal = sorted.filter(v => v === input).length;
    const percentile = input >= sorted[sorted.length - 1] ? '100.0' : (((below + 0.5 * equal) / sorted.length) * 100).toFixed(1);

    result.textContent = `${input} is at the ${percentile}th percentile.`;
}

function calculateQuanOSReverse() {
    const input = parseFloat(document.getElementById('quan-os-reverse-value').value);
    const result = document.getElementById('quan-os-reverse-result');
    if (isNaN(input) || input < 0 || input > 100) { result.textContent = 'Enter a percentile between 0 and 100.'; return; }

    const raw = document.getElementById('quan-os-data').value;
    const sorted = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) { result.textContent = 'Generate a chart first.'; return; }

    const value = input === 100 ? sorted[sorted.length - 1] : input === 0 ? sorted[0] : calcQuartile(sorted, input / 100);
    result.textContent = `The ${input}th percentile is ${value.toFixed(2)}.`;
}

//One Variable Multiple Groups Quantitative
let quanOMChart = null;

function addQuanOMGroup() {
    const container = document.getElementById('quan-om-groups');
    const count = container.querySelectorAll('.quan-om-group').length + 1;
    const color = randomGroupColor();

    const div = document.createElement('div');
    div.className = 'quan-om-group';
    div.style.marginTop = '10px';
    div.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <input type="text" class="table-input" placeholder="Group ${count}" value="Group ${count}" style="flex:1;">
            <input type="color" class="color-input" value="${color}">
            <button class="remove-row-button" onclick="removeGroupQuanOM(this)">X</button>
        </div>
        <textarea class="input-field quan-om-data" placeholder="e.g. 1, 1, 3, 5, 8" style="min-height:50px;"></textarea>
    `;
    container.appendChild(div);
}

function removeGroupQuanOM(btn) {
    const container = document.getElementById('quan-om-groups');
    const groups = container.querySelectorAll('.quan-om-group');
    if (groups.length <= 1) return;
    btn.closest('.quan-om-group').remove();
}

function randomGroupColor() {
    const hue = Math.floor(Math.random() * 360);
    const sat = 55 + Math.floor(Math.random() * 25);
    const light = 50 + Math.floor(Math.random() * 15);
    return hslToHex(hue, sat, light);
}

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function readQuanOMGroups() {
    const groupDivs = document.querySelectorAll('.quan-om-group');
    const groups = [];

    groupDivs.forEach(div => {
        const nameInput = div.querySelector('input[type="text"]');
        const colorInput = div.querySelector('input[type="color"]');
        const textarea = div.querySelector('.quan-om-data');

        const name = nameInput.value.trim() || 'Group';
        const color = colorInput.value;
        const values = textarea.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

        if (values.length > 0) {
            const sorted = [...values].sort((a, b) => a - b);
            groups.push({ name, color, values, sorted });
        }
    });

    return groups;
}

function generateQuanOM() {
    const groups = readQuanOMGroups();
    if (groups.length === 0) return;

    const varName = document.getElementById('quan-om-varname').value.trim() || 'Variable';
    const chartType = document.getElementById('quan-om-charttype').value;

    const canvas = document.getElementById('quan-om-chart');
    canvas.style.height = '';
    canvas.style.width = '';
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    if (canvas._hoverHandler) { canvas.removeEventListener('mousemove', canvas._hoverHandler); canvas._hoverHandler = null; }
    if (canvas._leaveHandler) { canvas.removeEventListener('mouseleave', canvas._leaveHandler); canvas._leaveHandler = null; }
    canvas.style.cursor = 'default';

    const bg = document.getElementById('quan-om-bg').value;
    const axisColor = document.getElementById('quan-om-axis-color').value;
    const titleColor = document.getElementById('quan-om-title-color').value;
    const gridColor = document.getElementById('quan-om-grid-color').value;

    const allValues = groups.flatMap(g => g.values);
    const globalMin = Math.min(...allValues);
    const globalMax = Math.max(...allValues);

    if (chartType === 'boxplot') {
        drawQuanOMBoxplots(canvas, groups, varName, globalMin, globalMax, bg, axisColor, titleColor, gridColor);
    } else if (chartType === 'histogram') {
        drawQuanOMHistograms(canvas, groups, varName, globalMin, globalMax, bg, axisColor, titleColor, gridColor);
    } else if (chartType === 'dotplot') {
        drawQuanOMDotplots(canvas, groups, varName, globalMin, globalMax, bg, axisColor, titleColor, gridColor);
    }

    const statsTbody = document.getElementById('quan-om-stats-tbody');
    statsTbody.innerHTML = '';
    groups.forEach(g => {
        const n = g.values.length;
        const mean = g.values.reduce((a, b) => a + b, 0) / n;
        const median = calcMedian(g.sorted);
        const q1 = calcQuartile(g.sorted, 0.25);
        const q3 = calcQuartile(g.sorted, 0.75);
        const min = g.sorted[0];
        const max = g.sorted[g.sorted.length - 1];
        const variance = n > 1 ? g.values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
        const sd = Math.sqrt(variance);

        statsTbody.innerHTML += `<tr>
            <td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${g.color}; margin-right:6px;"></span>${g.name}</td>
            <td>${n}</td>
            <td>${min.toFixed(2)}</td>
            <td>${q1.toFixed(2)}</td>
            <td>${median.toFixed(2)}</td>
            <td>${q3.toFixed(2)}</td>
            <td>${max.toFixed(2)}</td>
            <td>${mean.toFixed(2)}</td>
            <td>${sd.toFixed(2)}</td>
        </tr>`;
    });

    document.getElementById('quan-om-stats').style.display = 'block';
    document.querySelector('#quan-om-stats').previousElementSibling.style.display = 'none';
}

function drawQuanOMBoxplots(canvas, groups, varName, globalMin, globalMax, bg, axisColor, titleColor, gridColor) {
    const margin = { top: 20, right: 40, bottom: 50, left: 120 };
    const laneH = 60;
    const parent = canvas.parentElement;
    const W = parent.clientWidth - 40;
    const H = margin.top + margin.bottom + groups.length * laneH;

    canvas.width = W;
    canvas.height = H;
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    const plotW = W - margin.left - margin.right;
    const range = (globalMax - globalMin) || 1;
    const toX = v => margin.left + ((v - globalMin) / range) * plotW;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const tickCount = 8;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= tickCount; i++) {
        const v = globalMin + (i / tickCount) * range;
        const x = toX(v);
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, H - margin.bottom);
        ctx.stroke();
    }

    ctx.strokeStyle = axisColor;
    ctx.beginPath();
    ctx.moveTo(margin.left, H - margin.bottom);
    ctx.lineTo(margin.left + plotW, H - margin.bottom);
    ctx.stroke();

    ctx.fillStyle = axisColor;
    ctx.font = '11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= tickCount; i++) {
        const v = globalMin + (i / tickCount) * range;
        const x = toX(v);
        ctx.beginPath();
        ctx.moveTo(x, H - margin.bottom);
        ctx.lineTo(x, H - margin.bottom + 5);
        ctx.stroke();
        ctx.fillText(v.toFixed(1), x, H - margin.bottom + 18);
    }

    ctx.fillStyle = titleColor;
    ctx.font = '12px Montserrat, sans-serif';
    ctx.fillText(varName, margin.left + plotW / 2, H - 8);

    groups.forEach((g, i) => {
        const sorted = g.sorted;
        const q1 = calcQuartile(sorted, 0.25);
        const median = calcMedian(sorted);
        const q3 = calcQuartile(sorted, 0.75);
        const iqr = q3 - q1;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
        const whiskerLow = sorted.find(v => v >= lowerFence) ?? min;
        const whiskerHigh = [...sorted].reverse().find(v => v <= upperFence) ?? max;

        const midY = margin.top + i * laneH + laneH / 2;
        const boxH = laneH * 0.5;

        ctx.fillStyle = axisColor;
        ctx.font = '12px Montserrat, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(g.name, margin.left - 12, midY + 4);

        ctx.strokeStyle = g.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(whiskerLow), midY);
        ctx.lineTo(toX(q1), midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toX(q3), midY);
        ctx.lineTo(toX(whiskerHigh), midY);
        ctx.stroke();

        const capH = boxH * 0.4;
        [whiskerLow, whiskerHigh].forEach(v => {
            ctx.beginPath();
            ctx.moveTo(toX(v), midY - capH / 2);
            ctx.lineTo(toX(v), midY + capH / 2);
            ctx.stroke();
        });

        ctx.fillStyle = g.color + '44';
        ctx.strokeStyle = g.color;
        ctx.fillRect(toX(q1), midY - boxH / 2, toX(q3) - toX(q1), boxH);
        ctx.strokeRect(toX(q1), midY - boxH / 2, toX(q3) - toX(q1), boxH);

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(toX(median), midY - boxH / 2);
        ctx.lineTo(toX(median), midY + boxH / 2);
        ctx.stroke();

        outliers.forEach(v => {
            ctx.beginPath();
            ctx.arc(toX(v), midY, 4, 0, Math.PI * 2);
            ctx.fillStyle = g.color;
            ctx.fill();
        });
    });
}

function drawQuanOMHistograms(canvas, groups, varName, globalMin, globalMax, bg, axisColor, titleColor, gridColor) {
    const binCount = Math.ceil(Math.log2(Math.max(...groups.map(g => g.values.length))) + 1);
    const binWidth = (globalMax - globalMin) / binCount || 1;

    const bins = Array.from({ length: binCount }, (_, i) => ({
        start: globalMin + i * binWidth,
        end: globalMin + (i + 1) * binWidth,
        counts: groups.map(() => 0)
    }));

    groups.forEach((g, gi) => {
        g.values.forEach(v => {
            const idx = Math.min(Math.floor((v - globalMin) / binWidth), binCount - 1);
            bins[idx].counts[gi]++;
        });
    });

    const maxCount = Math.max(...bins.flatMap(b => b.counts));
    const totalN = groups.reduce((sum, g) => sum + g.values.length, 0);

    const margin = { top: 30, right: 30, bottom: 60, left: 50 };
    const parent = canvas.parentElement;
    const W = parent.clientWidth - 40;
    const H = 360;

    canvas.width = W;
    canvas.height = H;
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;
    const binSlotW = plotW / binCount;
    const barGap = 1;
    const barW = (binSlotW - barGap * 2) / groups.length;

    const barRects = [];
    bins.forEach((bin, bi) => {
        groups.forEach((g, gi) => {
            const count = bin.counts[gi];
            const x = margin.left + bi * binSlotW + barGap + gi * barW;
            barRects.push({ bi, gi, x, w: barW - 1, count, groupName: g.name, color: g.color });
        });
    });

    function draw(hovered) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const yTicks = 5;
        ctx.strokeStyle = gridColor;
        ctx.fillStyle = axisColor;
        ctx.font = '11px Montserrat, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= yTicks; i++) {
            const v = (maxCount / yTicks) * i;
            const y = margin.top + plotH - (v / maxCount) * plotH;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + plotW, y);
            ctx.stroke();
            ctx.fillText(Math.round(v), margin.left - 8, y + 4);
        }

        barRects.forEach((bar, idx) => {
            const barH = maxCount > 0 ? (bar.count / maxCount) * plotH : 0;
            const y = margin.top + plotH - barH;
            ctx.fillStyle = idx === hovered ? '#ffffff' : bar.color;
            ctx.fillRect(bar.x, y, bar.w, barH);
        });

        ctx.strokeStyle = axisColor;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + plotH);
        ctx.lineTo(margin.left + plotW, margin.top + plotH);
        ctx.stroke();

        ctx.fillStyle = axisColor;
        ctx.textAlign = 'center';
        bins.forEach((bin, i) => {
            const x = margin.left + i * binSlotW;
            ctx.fillText(bin.start.toFixed(1), x, margin.top + plotH + 16);
        });
        ctx.fillText(bins[bins.length - 1].end.toFixed(1), margin.left + plotW, margin.top + plotH + 16);

        ctx.fillStyle = titleColor;
        ctx.font = '12px Montserrat, sans-serif';
        ctx.fillText(varName, margin.left + plotW / 2, H - 28);

        let legendX = margin.left;
        const legendY = 14;
        ctx.font = '11px Montserrat, sans-serif';
        groups.forEach(g => {
            ctx.fillStyle = g.color;
            ctx.fillRect(legendX, legendY - 8, 10, 10);
            ctx.fillStyle = axisColor;
            ctx.textAlign = 'left';
            ctx.fillText(g.name, legendX + 14, legendY + 1);
            legendX += ctx.measureText(g.name).width + 36;
        });

        if (hovered !== null && hovered !== undefined) {
            const bar = barRects[hovered];
            const barH = maxCount > 0 ? (bar.count / maxCount) * plotH : 0;
            const barTopY = margin.top + plotH - barH;
            const pct = totalN > 0 ? ((bar.count / totalN) * 100).toFixed(1) : '0.0';
            const label = `${bar.groupName}: ${bar.count} (${pct}%)`;

            ctx.font = '12px Montserrat, sans-serif';
            const tw = ctx.measureText(label).width;
            const tx = Math.min(Math.max(bar.x + bar.w / 2 - tw / 2 - 6, margin.left), margin.left + plotW - tw - 12);
            const ty = Math.max(barTopY - 26, margin.top);

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.roundRect(tx, ty, tw + 12, 20, 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, tx + 6, ty + 14);
        }
    }

    draw(null);

    canvas._hoverHandler = function(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        let hoveredIdx = null;
        barRects.forEach((bar, idx) => {
            const barH = maxCount > 0 ? (bar.count / maxCount) * plotH : 0;
            const barTopY = margin.top + plotH - barH;
            if (mx >= bar.x && mx <= bar.x + bar.w && my >= barTopY && my <= margin.top + plotH) {
                hoveredIdx = idx;
            }
        });
        draw(hoveredIdx);
        canvas.style.cursor = hoveredIdx !== null ? 'pointer' : 'default';
    };

    canvas._leaveHandler = function() {
        draw(null);
        canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', canvas._hoverHandler);
    canvas.addEventListener('mouseleave', canvas._leaveHandler);
}

function drawQuanOMDotplots(canvas, groups, varName, globalMin, globalMax, bg, axisColor, titleColor, gridColor) {
    const dotRadius = 5;
    const dotPadding = dotRadius * 2 + 2;

    const groupInfo = groups.map(g => {
        const freqCounts = {};
        g.values.forEach(v => freqCounts[v] = (freqCounts[v] || 0) + 1);
        const maxStack = Math.max(...Object.values(freqCounts));
        return { ...g, freqCounts, maxStack };
    });

    const margin = { top: 20, right: 30, bottom: 50, left: 120 };
    const laneGap = 16;
    const laneHeights = groupInfo.map(g => g.maxStack * dotPadding + dotRadius * 2);
    const totalLaneH = laneHeights.reduce((a, b) => a + b + laneGap, 0);

    const parent = canvas.parentElement;
    const W = parent.clientWidth - 40;
    const H = margin.top + margin.bottom + totalLaneH;

    canvas.width = W;
    canvas.height = H;
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    const plotW = W - margin.left - margin.right;
    const range = (globalMax - globalMin) || 1;
    const toX = v => margin.left + ((v - globalMin) / range) * plotW;

    let currentY = margin.top;
    const laneData = [];
    const dotPositions = [];

    groupInfo.forEach(g => {
        const laneH = g.maxStack * dotPadding + dotRadius * 2;
        const baseY = currentY + laneH - dotRadius;
        laneData.push({ ...g, baseY, laneTop: currentY });

        Object.keys(g.freqCounts).map(Number).sort((a, b) => a - b).forEach(v => {
            const x = toX(v);
            for (let i = 0; i < g.freqCounts[v]; i++) {
                const y = baseY - dotRadius - (i * dotPadding);
                dotPositions.push({ x, y, value: v, groupName: g.name, color: g.color });
            }
        });

        currentY += laneH + laneGap;
    });

    const axisY = currentY - laneGap + 10;

    function draw(hoveredDot) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        laneData.forEach(g => {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(margin.left, g.baseY);
            ctx.lineTo(margin.left + plotW, g.baseY);
            ctx.stroke();

            ctx.fillStyle = axisColor;
            ctx.font = '12px Montserrat, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(g.name, margin.left - 12, g.baseY + 4);
        });

        dotPositions.forEach(dot => {
            const isHovered = hoveredDot &&
                Math.abs(dot.x - hoveredDot.x) < 1 &&
                Math.abs(dot.y - hoveredDot.y) < 1;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, isHovered ? dotRadius * 1.4 : dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? '#ffffff' : dot.color;
            ctx.fill();
        });

        ctx.strokeStyle = axisColor;
        ctx.beginPath();
        ctx.moveTo(margin.left, axisY);
        ctx.lineTo(margin.left + plotW, axisY);
        ctx.stroke();

        const tickCount = 8;
        ctx.fillStyle = axisColor;
        ctx.font = '11px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i <= tickCount; i++) {
            const v = globalMin + (i / tickCount) * range;
            const x = toX(v);
            ctx.beginPath();
            ctx.moveTo(x, axisY);
            ctx.lineTo(x, axisY + 5);
            ctx.stroke();
            ctx.fillText(v.toFixed(1), x, axisY + 18);
        }

        ctx.fillStyle = titleColor;
        ctx.font = '12px Montserrat, sans-serif';
        ctx.fillText(varName, margin.left + plotW / 2, H - 8);

        if (hoveredDot) {
            const label = `${hoveredDot.groupName}: ${hoveredDot.value}`;
            ctx.font = '12px Montserrat, sans-serif';
            const tw = ctx.measureText(label).width;
            const tx = Math.min(Math.max(hoveredDot.x - tw / 2 - 6, margin.left), W - tw - 20);
            const ty = hoveredDot.y - dotRadius - 18;

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.roundRect(tx, ty, tw + 12, 20, 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, tx + 6, ty + 14);
        }
    }

    draw(null);

    canvas._hoverHandler = function(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const hovered = dotPositions.find(dot =>
            Math.sqrt((dot.x - mx) ** 2 + (dot.y - my) ** 2) <= dotRadius + 3
        );
        draw(hovered || null);
        canvas.style.cursor = hovered ? 'pointer' : 'default';
    };

    canvas._leaveHandler = function() {
        draw(null);
        canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', canvas._hoverHandler);
    canvas.addEventListener('mouseleave', canvas._leaveHandler);
}

// Export
function downloadQuanOM() {
    const canvas = document.getElementById('quan-om-chart');
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function copyQuanOM() {
    const canvas = document.getElementById('quan-om-chart');
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}

// Two Variable Quantitative
function fitLinear(xs, ys) {
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);
    const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const a = (sumY - b * sumX) / n;
    return {
        predict: x => a + b * x,
        equation: `y = ${a.toFixed(3)} + ${b.toFixed(3)}x`
    };
}

function fitQuadratic(xs, ys) {
    const n = xs.length;
    let Sx = 0, Sx2 = 0, Sx3 = 0, Sx4 = 0, Sy = 0, Sxy = 0, Sx2y = 0;
    for (let i = 0; i < n; i++) {
        const x = xs[i], y = ys[i];
        Sx += x; Sx2 += x*x; Sx3 += x*x*x; Sx4 += x*x*x*x;
        Sy += y; Sxy += x*y; Sx2y += x*x*y;
    }
    const A = [[n, Sx, Sx2], [Sx, Sx2, Sx3], [Sx2, Sx3, Sx4]];
    const B = [Sy, Sxy, Sx2y];
    const [a, b, c] = solve3x3(A, B);
    return {
        predict: x => a + b * x + c * x * x,
        equation: `y = ${a.toFixed(3)} + ${b.toFixed(3)}x + ${c.toFixed(3)}x²`
    };
}

function solve3x3(A, B) {
    const det = m => m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
                    - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
                    + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
    const D = det(A);
    const replaceCol = (m, col, vec) => m.map((row, i) => row.map((v, j) => j === col ? vec[i] : v));
    const Da = det(replaceCol(A, 0, B));
    const Db = det(replaceCol(A, 1, B));
    const Dc = det(replaceCol(A, 2, B));
    return [Da / D, Db / D, Dc / D];
}

function fitExponential(xs, ys) {
    const lnY = ys.map(Math.log);
    const { predict: linPredict } = fitLinear(xs, lnY);
    const lnA = linPredict(0);
    const a = Math.exp(lnA);
    const b = linPredict(1) - lnA;
    return {
        predict: x => a * Math.exp(b * x),
        equation: `y = ${a.toFixed(3)}*e^(${b.toFixed(3)}x)`
    };
}

let quanTV2Model = null;
let quanTV2Data = null;

function generateQuanTV2() {
    const xRaw = document.getElementById('quan-tv-xdata').value;
    const yRaw = document.getElementById('quan-tv-ydata').value;
    const xName = document.getElementById('quan-tv-xname').value.trim() || 'X';
    const yName = document.getElementById('quan-tv-yname').value.trim() || 'Y';
    const modelType = document.getElementById('quan-tv-model').value;
    const chartType = document.getElementById('quan-tv-charttype').value;

    const xs = xRaw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    const ys = yRaw.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return;

    const xsT = xs.slice(0, n);
    const ysT = ys.slice(0, n);

    let model;
    try {
        if (modelType === 'linear') model = fitLinear(xsT, ysT);
        else if (modelType === 'quadratic') model = fitQuadratic(xsT, ysT);
        else if (modelType === 'exponential') model = fitExponential(xsT, ysT);
    } catch (e) {
        alert('Could not fit this model to the data (check for zero/negative values with power or exponential models).');
        return;
    }

    quanTV2Model = model;
    quanTV2Data = { xs: xsT, ys: ysT };

    const meanX = xsT.reduce((a,b)=>a+b,0)/n;
    const meanY = ysT.reduce((a,b)=>a+b,0)/n;
    const num = xsT.reduce((s,x,i)=> s + (x-meanX)*(ysT[i]-meanY), 0);
    const denX = Math.sqrt(xsT.reduce((s,x)=> s + (x-meanX)**2, 0));
    const denY = Math.sqrt(ysT.reduce((s,y)=> s + (y-meanY)**2, 0));
    const r = num / (denX * denY);

    const residuals = xsT.map((x, i) => ysT[i] - model.predict(x));
    const ssRes = residuals.reduce((s, e) => s + e*e, 0);
    const ssTot = ysT.reduce((s,y)=> s + (y-meanY)**2, 0);
    const r2 = 1 - ssRes / ssTot;

    const canvas = document.getElementById('quan-tv2-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';
    canvas.style.height = '';
    canvas.style.width = '';
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');

    if (canvas._hoverHandler) { canvas.removeEventListener('mousemove', canvas._hoverHandler); canvas._hoverHandler = null; }
    if (canvas._leaveHandler) { canvas.removeEventListener('mouseleave', canvas._leaveHandler); canvas._leaveHandler = null; }
    canvas.style.cursor = 'default';

    const bg = document.getElementById('quan-tv2-bg').value;
    const axisColor = document.getElementById('quan-tv2-axis-color').value;
    const titleColor = document.getElementById('quan-tv2-title-color').value;
    const gridColor = document.getElementById('quan-tv2-grid-color').value;
    const pointColor = document.getElementById('quan-tv2-point-color').value;
    const lineColor = document.getElementById('quan-tv2-line-color').value;

    if (chartType === 'scatter' || chartType === 'regression') {
        drawQuanTV2Scatter(canvas, xsT, ysT, xName, yName, model, chartType === 'regression', bg, axisColor, titleColor, gridColor, pointColor, lineColor);
    } else if (chartType === 'residual') {
        drawQuanTV2Residuals(canvas, xsT, residuals, xName, bg, axisColor, titleColor, gridColor, pointColor);
    }

    document.getElementById('quan-tv2-n').textContent = n;
    document.getElementById('quan-tv2-equation').textContent = model.equation;
    document.getElementById('quan-tv2-r').textContent = r.toFixed(4);
    document.getElementById('quan-tv2-r2').textContent = r2.toFixed(4);

    const statsTbody = document.getElementById('quan-tv2-stats-tbody');
    statsTbody.innerHTML = '';
    xsT.forEach((x, i) => {
        const yhat = model.predict(x);
        const resid = ysT[i] - yhat;
        statsTbody.innerHTML += `<tr>
            <td>${x}</td>
            <td>${ysT[i]}</td>
            <td>${yhat.toFixed(2)}</td>
            <td>${resid.toFixed(2)}</td>
        </tr>`;
    });

    document.getElementById('quan-tv2-stats').style.display = 'block';
    document.querySelector('#quan-tv2-stats').previousElementSibling.style.display = 'none';
}

function drawQuanTV2Scatter(canvas, xs, ys, xName, yName, model, showLine, bg, axisColor, titleColor, gridColor, pointColor, lineColor) {
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const parent = canvas.parentElement;
    const W = parent.clientWidth - 40;
    const H = 400;

    canvas.width = W;
    canvas.height = H;
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.1 || 1;
    const yPad = (yMax - yMin) * 0.1 || 1;
    const xLo = xMin - xPad, xHi = xMax + xPad;
    const yLo = yMin - yPad, yHi = yMax + yPad;

    const toX = x => margin.left + ((x - xLo) / (xHi - xLo)) * plotW;
    const toY = y => margin.top + plotH - ((y - yLo) / (yHi - yLo)) * plotH;

    const pointPositions = xs.map((x, i) => ({ x: toX(x), y: toY(ys[i]), xVal: x, yVal: ys[i] }));

    function draw(hoveredIdx) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const tickCount = 8;
        ctx.strokeStyle = gridColor;
        ctx.fillStyle = axisColor;
        ctx.font = '11px Montserrat, sans-serif';
        for (let i = 0; i <= tickCount; i++) {
            const xv = xLo + (i/tickCount)*(xHi-xLo);
            const xpix = toX(xv);
            ctx.beginPath(); ctx.moveTo(xpix, margin.top); ctx.lineTo(xpix, margin.top+plotH); ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillText(xv.toFixed(1), xpix, margin.top+plotH+16);

            const yv = yLo + (i/tickCount)*(yHi-yLo);
            const ypix = toY(yv);
            ctx.beginPath(); ctx.moveTo(margin.left, ypix); ctx.lineTo(margin.left+plotW, ypix); ctx.stroke();
            ctx.textAlign = 'right';
            ctx.fillText(yv.toFixed(1), margin.left-8, ypix+4);
        }

        ctx.strokeStyle = axisColor;
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top+plotH); ctx.lineTo(margin.left+plotW, margin.top+plotH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top+plotH); ctx.stroke();

        if (showLine) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const steps = 60;
            for (let i = 0; i <= steps; i++) {
                const xv = xLo + (i/steps)*(xHi-xLo);
                const yv = model.predict(xv);
                const px = toX(xv), py = toY(yv);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        pointPositions.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, i === hoveredIdx ? 7 : 5, 0, Math.PI*2);
            ctx.fillStyle = i === hoveredIdx ? '#ffffff' : pointColor;
            ctx.fill();
        });

        ctx.fillStyle = titleColor;
        ctx.font = '12px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(xName, margin.left+plotW/2, H-8);
        ctx.save();
        ctx.translate(16, margin.top+plotH/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText(yName, 0, 0);
        ctx.restore();

        if (hoveredIdx !== null && hoveredIdx !== undefined) {
            const p = pointPositions[hoveredIdx];
            const label = `(${p.xVal}, ${p.yVal})`;
            ctx.font = '12px Montserrat, sans-serif';
            const tw = ctx.measureText(label).width;
            const tx = Math.min(Math.max(p.x - tw/2 - 6, margin.left), margin.left+plotW-tw-12);
            const ty = p.y - 22;
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.roundRect(tx, ty, tw+12, 20, 4); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, tx+6, ty+14);
        }
    }

    draw(null);

    canvas._hoverHandler = function(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width/rect.width, scaleY = canvas.height/rect.height;
        const mx = (e.clientX-rect.left)*scaleX, my = (e.clientY-rect.top)*scaleY;
        let hoveredIdx = null;
        pointPositions.forEach((p, i) => {
            if (Math.sqrt((p.x-mx)**2+(p.y-my)**2) <= 7) hoveredIdx = i;
        });
        draw(hoveredIdx);
        canvas.style.cursor = hoveredIdx !== null ? 'pointer' : 'default';
    };
    canvas._leaveHandler = function() { draw(null); canvas.style.cursor = 'default'; };
    canvas.addEventListener('mousemove', canvas._hoverHandler);
    canvas.addEventListener('mouseleave', canvas._leaveHandler);
}

function drawQuanTV2Residuals(canvas, xs, residuals, xName, bg, axisColor, titleColor, gridColor, pointColor) {
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const parent = canvas.parentElement;
    const W = parent.clientWidth - 40;
    const H = 350;

    canvas.width = W;
    canvas.height = H;
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const absMax = Math.max(...residuals.map(Math.abs)) || 1;
    const xPad = (xMax - xMin) * 0.1 || 1;
    const xLo = xMin - xPad, xHi = xMax + xPad;
    const yLo = -absMax * 1.2, yHi = absMax * 1.2;

    const toX = x => margin.left + ((x - xLo) / (xHi - xLo)) * plotW;
    const toY = y => margin.top + plotH - ((y - yLo) / (yHi - yLo)) * plotH;

    const pointPositions = xs.map((x, i) => ({ x: toX(x), y: toY(residuals[i]), xVal: x, resVal: residuals[i] }));

    function draw(hoveredIdx) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const tickCount = 8;
        ctx.strokeStyle = gridColor;
        ctx.fillStyle = axisColor;
        ctx.font = '11px Montserrat, sans-serif';
        for (let i = 0; i <= tickCount; i++) {
            const xv = xLo + (i/tickCount)*(xHi-xLo);
            const xpix = toX(xv);
            ctx.beginPath(); ctx.moveTo(xpix, margin.top); ctx.lineTo(xpix, margin.top+plotH); ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillText(xv.toFixed(1), xpix, margin.top+plotH+16);
        }

        // Zero line (bold)
        const zeroY = toY(0);
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(margin.left, zeroY); ctx.lineTo(margin.left+plotW, zeroY); ctx.stroke();
        ctx.lineWidth = 1;

        ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top+plotH); ctx.stroke();

        pointPositions.forEach((p, i) => {
            ctx.beginPath();
            ctx.moveTo(p.x, zeroY);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = gridColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(p.x, p.y, i === hoveredIdx ? 7 : 5, 0, Math.PI*2);
            ctx.fillStyle = i === hoveredIdx ? '#ffffff' : pointColor;
            ctx.fill();
        });

        ctx.fillStyle = titleColor;
        ctx.font = '12px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(xName, margin.left+plotW/2, H-8);
        ctx.save();
        ctx.translate(16, margin.top+plotH/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('Residual', 0, 0);
        ctx.restore();

        if (hoveredIdx !== null && hoveredIdx !== undefined) {
            const p = pointPositions[hoveredIdx];
            const label = `x=${p.xVal}, R=${p.resVal.toFixed(2)}`;
            ctx.font = '12px Montserrat, sans-serif';
            const tw = ctx.measureText(label).width;
            const tx = Math.min(Math.max(p.x - tw/2 - 6, margin.left), margin.left+plotW-tw-12);
            const ty = p.y - 22;
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.roundRect(tx, ty, tw+12, 20, 4); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, tx+6, ty+14);
        }
    }

    draw(null);

    canvas._hoverHandler = function(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width/rect.width, scaleY = canvas.height/rect.height;
        const mx = (e.clientX-rect.left)*scaleX, my = (e.clientY-rect.top)*scaleY;
        let hoveredIdx = null;
        pointPositions.forEach((p, i) => {
            if (Math.sqrt((p.x-mx)**2+(p.y-my)**2) <= 7) hoveredIdx = i;
        });
        draw(hoveredIdx);
        canvas.style.cursor = hoveredIdx !== null ? 'pointer' : 'default';
    };
    canvas._leaveHandler = function() { draw(null); canvas.style.cursor = 'default'; };
    canvas.addEventListener('mousemove', canvas._hoverHandler);
    canvas.addEventListener('mouseleave', canvas._leaveHandler);
}

function calculateQuanTV2Predict() {
    const input = parseFloat(document.getElementById('quan-tv2-predict-x').value);
    const result = document.getElementById('quan-tv2-predict-result');
    if (isNaN(input)) { result.textContent = 'Enter a valid number.'; return; }
    if (!quanTV2Model || !quanTV2Data) { result.textContent = 'Generate a chart first.'; return; }

    const yhat = quanTV2Model.predict(input);

    // Check if this X value exists in the dataset
    const matchIdx = quanTV2Data.xs.findIndex(x => x === input);

    if (matchIdx !== -1) {
        const actualY = quanTV2Data.ys[matchIdx];
        const residual = actualY - yhat;
        result.textContent = `PREDICTED Y-HAT: ${yhat.toFixed(3)} | ACTUAL Y: ${actualY} | RESIDUAL: ${residual.toFixed(3)}`;
    } else {
        result.textContent = `PREDICTED Y-HAT: ${yhat.toFixed(3)} | ACTUAL Y: (N/A) | RESIDUAL: (N/A)`;
    }
}

function downloadQuanTV2() {
    const canvas = document.getElementById('quan-tv2-chart');
    const link = document.createElement('a');
    link.download = 'chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function copyQuanTV2() {
    const canvas = document.getElementById('quan-tv2-chart');
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}

// Distributions
// Assume it's standardized
let distNormalMean = 0;
let distNormalSD = 1;
let distNormalShade = null;

function generateNormalDistribution() {
    const mean = parseFloat(document.getElementById('dist-normal-mean').value) || 0;
    const sd = parseFloat(document.getElementById('dist-normal-sd').value);
 
    if (isNaN(sd) || sd <= 0) {
        alert('Standard deviation must be a positive number.');
        return;
    }
 
    const changed = mean !== distNormalMean || sd !== distNormalSD;
    distNormalMean = mean;
    distNormalSD = sd;
    if (changed) distNormalShade = null;
 
    document.getElementById('dist-normal-mean-val').textContent = mean;
    document.getElementById('dist-normal-sd-val').textContent = sd;
    if (changed) {
        document.getElementById('dist-normal-prob-result').textContent = '';
        document.getElementById('dist-normal-inverse-result').textContent = '';
    }
 
    const canvas = document.getElementById('dist-normal-chart');
    canvas.style.display = 'block';
    canvas.previousElementSibling.style.display = 'none';

    document.getElementById('dist-normal-stats').style.display = 'block';
    document.querySelector('#dist-normal-stats').previousElementSibling.style.display = 'none';
 
    drawDistNormalChart();
}

function drawDistNormalChart() {
    const mean = distNormalMean;
    const sd = distNormalSD;
    const shade = distNormalShade;
    const canvas = document.getElementById('dist-normal-chart');
 
    canvas.style.height = '';
    canvas.style.width = '';
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
 
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const parent = canvas.parentElement;
    const W = parent.clientWidth - 40;
    const H = 340;
 
    canvas.width = W;
    canvas.height = H;
    canvas.style.display = 'block';
    canvas.style.height = 'auto';
 
    const ctx = canvas.getContext('2d');
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;
 
    const bg = document.getElementById('dist-normal-bg').value;
    const axisColor = document.getElementById('dist-normal-axis-color').value;
    const titleColor = document.getElementById('dist-normal-title-color').value;
    const gridColor = document.getElementById('dist-normal-grid-color').value;
    const curveColor = document.getElementById('dist-normal-curve-color').value;
    const boundaryColor = document.getElementById('dist-normal-boundary-color').value;
    const shadeColor = document.getElementById('dist-normal-shade-color').value;
    const varName = document.getElementById('dist-normal-varname').value.trim() || 'X';
 
    const xLo = mean - 4 * sd;
    const xHi = mean + 4 * sd;
    const toX = x => margin.left + ((x - xLo) / (xHi - xLo)) * plotW;
 
    const peakDensity = normalPDF(mean, mean, sd);
    const toY = y => margin.top + plotH - (y / peakDensity) * plotH * 0.95;
 
    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
 
    // Vertical gridlines at each standard deviation
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let k = -4; k <= 4; k++) {
        const xpix = toX(mean + k * sd);
        ctx.beginPath();
        ctx.moveTo(xpix, margin.top);
        ctx.lineTo(xpix, margin.top + plotH);
        ctx.stroke();
    }
 
    // Shaded probability region (drawn under the curve outline thru shade)
    const showShade = document.getElementById('dist-normal-shade').checked;
    if (shade && showShade) {
        let shadeLo, shadeHi;
        if (shade.type === 'left-tail') {
            shadeLo = xLo; shadeHi = shade.value;
        } else if (shade.type === 'greater-than') {
            shadeLo = shade.value; shadeHi = xHi;
        } else if (shade.type === 'center') {
            const dist = Math.abs(shade.value - mean);
            shadeLo = mean - dist; shadeHi = mean + dist;
        }
        shadeLo = Math.max(shadeLo, xLo);
        shadeHi = Math.min(shadeHi, xHi);
 
        if (shadeHi > shadeLo) {
            ctx.beginPath();
            ctx.moveTo(toX(shadeLo), margin.top + plotH);
            const steps = 80;
            for (let i = 0; i <= steps; i++) {
                const xv = shadeLo + (i / steps) * (shadeHi - shadeLo);
                ctx.lineTo(toX(xv), toY(normalPDF(xv, mean, sd)));
            }
            ctx.lineTo(toX(shadeHi), margin.top + plotH);
            ctx.closePath();
            ctx.fillStyle = shadeColor + '50';
            ctx.fill();
        }
    }
 
    // The bell curve
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
        const xv = xLo + (i / steps) * (xHi - xLo);
        const px = toX(xv), py = toY(normalPDF(xv, mean, sd));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
 
    // Dashed boundary line marking the shaded region
    if (shade && showShade) {
        ctx.strokeStyle = boundaryColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        const drawBoundary = (xv) => {
            if (xv < xLo || xv > xHi) return;
            const px = toX(xv);
            ctx.beginPath();
            ctx.moveTo(px, margin.top);
            ctx.lineTo(px, margin.top + plotH);
            ctx.stroke();
        };
        if (shade.type === 'left-tail' || shade.type === 'greater-than') {
            drawBoundary(shade.value);
        } else if (shade.type === 'center') {
            const dist = Math.abs(shade.value - mean);
            drawBoundary(mean - dist);
            drawBoundary(mean + dist);
        }
        ctx.setLineDash([]);
    }
 
    // X axis line
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();
 
    // X tick labels
    ctx.fillStyle = axisColor;
    ctx.font = '11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    for (let k = -4; k <= 4; k++) {
        const xv = mean + k * sd;
        const xpix = toX(xv);
        ctx.beginPath();
        ctx.moveTo(xpix, margin.top + plotH);
        ctx.lineTo(xpix, margin.top + plotH + 5);
        ctx.stroke();
        ctx.fillText(xv.toFixed(2), xpix, margin.top + plotH + 18);
    }
 
    // Axis titles
    ctx.fillStyle = titleColor;
    ctx.font = '12px Montserrat, sans-serif';
    ctx.fillText(varName, margin.left + plotW / 2, H - 8);
 
    ctx.save();
    ctx.translate(14, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Density', 0, 0);
    ctx.restore();
}

// Helper functions
function normalPDF(x, mean, sd) {
    return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
}

function normalCDF(x, mean, sd) {
    const z = (x - mean) / (sd * Math.sqrt(2));
    return 0.5 * (1 + erf(z));
}

function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
          a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

// invNorm which was pretty confusing and had to use a tutorial using hardcoded constants. This means it's only an approximation and God knows the accuracy lmao
function inverseNormalCDF(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
 
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
                1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
                6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
               -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
 
    const pLow = 0.02425;
    const pHigh = 1 - pLow;
 
    if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
               ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= pHigh) {
        const q = p - 0.5;
        const r = q * q;
        return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
               (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
}

function calculateNormalDistributionProbability() {
    const mean = distNormalMean;
    const sd = distNormalSD;
    const type = document.getElementById('dist-normal-prob-type').value;
    const value = parseFloat(document.getElementById('dist-normal-prob-value').value);
    const result = document.getElementById('dist-normal-prob-result');
 
    if (isNaN(value)) { result.textContent = 'Enter a valid value.'; return; }
 
    let prob;
    if (type === 'left-tail') {
        prob = normalCDF(value, mean, sd);
    } else if (type === 'greater-than') {
        prob = 1 - normalCDF(value, mean, sd);
    } else { // center: area within |value - mean| of the mean
        const dist = Math.abs(value - mean);
        prob = normalCDF(mean + dist, mean, sd) - normalCDF(mean - dist, mean, sd);
    }
 
    distNormalShade = { type, value };
    drawDistNormalChart();
 
    result.textContent = `P = ${prob.toFixed(4)} (${(prob * 100).toFixed(2)}%)`;
}

function calculateInverseNormal() {
    const mean = distNormalMean;
    const sd = distNormalSD;
    const p = parseFloat(document.getElementById('dist-normal-inverse-prob').value);
    const result = document.getElementById('dist-normal-inverse-result');
    const type = document.getElementById('dist-normal-inverse-type').value;

    if (isNaN(p) || p <= 0 || p >= 1) {
        result.textContent = 'Enter a probability strictly between 0 and 1.';
        return;
    }
 
    if (type === 'left-tail') {
        const z = inverseNormalCDF(p);
        const value = mean + z * sd;
 
        distNormalShade = { type: 'left-tail', value };
        drawDistNormalChart();
 
        result.textContent = `x = ${value.toFixed(4)}  (z = ${z.toFixed(4)})`;
 
    } else if (type === 'greater-than') {
        const z = inverseNormalCDF(1 - p);
        const value = mean + z * sd;
 
        distNormalShade = { type: 'greater-than', value };
        drawDistNormalChart();
 
        result.textContent = `x = ${value.toFixed(4)}  (z = ${z.toFixed(4)})`;
 
    } else { // center
        const z = inverseNormalCDF((1 + p) / 2);
        const dist = z * sd;
        const lo = mean - dist;
        const hi = mean + dist;
 
        distNormalShade = { type: 'center', value: hi };
        drawDistNormalChart();
 
        result.textContent = `x = ${lo.toFixed(4)} to ${hi.toFixed(4)}  (|z| = ${z.toFixed(4)})`;
    }
}

function downloadNormalDistribution() {
    const canvas = document.getElementById('dist-normal-chart');
    const link = document.createElement('a');
    link.download = 'normal_distribution.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}
 
async function copyNormalDistribution() {
    const canvas = document.getElementById('dist-normal-chart');
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert('Chart copied to clipboard!');
}
// app.js - Contrôleur principal

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de l'état local
    window.agendaData = {
        config: {
            year: '',
            startDate: '',
            endDate: '',
            cycleDays: 9,
            periodsPerDay: 4
        },
        schedule: {},   // { "day-period": { subject, room, group } }
        holidays: [],   // [ { date, label, type } ]
        colors: {},     // { subjectName: hexColor }
        corrections: {}, // { dateStr: manualCycleDay }
        theme: {
            primary: '#d4a017',
            secondary: '#8a9a5b',
            bg: '#fdfaf5'
        }
    };


    // Sélecteurs
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const cycleDaysSelect = document.getElementById('cycle-days');
    const periodsInput = document.getElementById('periods-per-day');

    // Gestion des onglets
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');

            if (target === 'aperçu') {
                renderAgendaPreview();
            }
        });
    });

    // Mise à jour de la grille d'horaire quand le cycle ou les périodes changent
    cycleDaysSelect.addEventListener('change', (e) => {
        window.agendaData.config.cycleDays = parseInt(e.target.value);
        renderHoraireGrid();
        renderAgendaPreview();
    });

    periodsInput.addEventListener('change', (e) => {
        window.agendaData.config.periodsPerDay = parseInt(e.target.value);
        renderHoraireGrid();
        renderAgendaPreview();
    });

    // Bouton Appliquer Configuration
    const btnApplyConfig = document.getElementById('btn-apply-config');
    btnApplyConfig.addEventListener('click', () => {
        // Forcer la lecture des valeurs
        window.agendaData.config.year = document.getElementById('school-year').value;
        window.agendaData.config.startDate = document.getElementById('start-date').value;
        window.agendaData.config.endDate = document.getElementById('end-date').value;
        window.agendaData.config.cycleDays = parseInt(document.getElementById('cycle-days').value);
        window.agendaData.config.periodsPerDay = parseInt(document.getElementById('periods-per-day').value);
        window.agendaData.config.daysPerPage = parseInt(document.getElementById('days-per-page').value);
        window.agendaData.config.orientation = document.getElementById('page-orientation').value;
        window.agendaData.config.notesHeight = parseInt(document.getElementById('notes-height').value);

        saveToLocal();
        renderHoraireGrid();
        renderAgendaPreview();
        alert("Configuration appliquée et aperçu mis à jour !");
    });

    // Fonction de rendu de la grille d'horaire
    function renderHoraireGrid() {
        const grid = document.getElementById('horaire-grid');
        const cycleDays = window.agendaData.config.cycleDays;
        const periods = window.agendaData.config.periodsPerDay;

        let html = `<table class="horaire-table">`;
        html += `<thead><tr><th>Période</th>`;
        for (let i = 1; i <= cycleDays; i++) {
            html += `<th>Jour ${i}</th>`;
        }
        html += `</tr></thead><tbody>`;

        for (let p = 1; p <= periods; p++) {
            html += `<tr><td><strong>P ${p}</strong></td>`;
            for (let d = 1; d <= cycleDays; d++) {
                const key = `${d}-${p}`;
                const val = window.agendaData.schedule[key] || { subject: '' };

                const subjects = Object.keys(window.agendaData.colors || {});
                let selectHtml = `<select class="subject-select" data-day="${d}" data-period="${p}">`;
                selectHtml += `<option value="">-- Sujet --</option>`;
                subjects.forEach(sub => {
                    selectHtml += `<option value="${sub}" ${val.subject === sub ? 'selected' : ''}>${sub}</option>`;
                });
                selectHtml += `</select>`;

                html += `<td>${selectHtml}</td>`;
            }
            html += `</tr>`;
        }
        html += `</tbody></table>`;
        grid.innerHTML = html;

        // Add event listeners to selects
        document.querySelectorAll('.subject-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const d = e.target.dataset.day;
                const p = e.target.dataset.period;
                window.agendaData.schedule[`${d}-${p}`] = { subject: e.target.value };
                saveToLocal();
                if (typeof renderAgendaPreview === 'function') renderAgendaPreview();
            });
        });
    }

    // Gestion des événements
    const btnAddEvent = document.getElementById('btn-add-event');
    const modalEvent = document.getElementById('modal-event');
    const btnCancelEvent = document.getElementById('btn-cancel-event');
    const btnSaveEvent = document.getElementById('btn-save-event');

    btnAddEvent.addEventListener('click', () => {
        modalEvent.style.display = 'flex';
    });

    btnCancelEvent.addEventListener('click', () => {
        modalEvent.style.display = 'none';
    });

    btnSaveEvent.addEventListener('click', () => {
        const date = document.getElementById('event-date').value;
        const title = document.getElementById('event-title').value;
        const type = document.getElementById('event-type').value;

        if (date && title) {
            window.agendaData.holidays.push({ date, label: title, type });
            renderEventList();
            modalEvent.style.display = 'none';
            saveToLocal();
        }
    });

    function renderEventList() {
        const list = document.getElementById('event-list');
        list.innerHTML = window.agendaData.holidays.map((h, index) => `
            <div class="event-item">
                <small>${h.date}</small>
                <strong>${h.label}</strong>
                <button onclick="removeEvent(${index})">×</button>
            </div>
        `).join('');
    }

    window.removeEvent = (index) => {
        window.agendaData.holidays.splice(index, 1);
        renderEventList();
        saveToLocal();
    };

    // Gestion de la légende
    const btnAddLegend = document.getElementById('btn-add-legend');
    const legendList = document.getElementById('legend-list');

    btnAddLegend.addEventListener('click', () => {
        const name = prompt("Nom de la catégorie (ex: Math, Examen, Sortie):");
        if (name) {
            if (!window.agendaData.colors[name]) {
                window.agendaData.colors[name] = '#197fe6';
                renderLegendList();
                renderHoraireGrid(); // Rafraîchir les dropdowns
                saveToLocal();
            }
        }
    });

    function renderLegendList() {
        legendList.innerHTML = Object.entries(window.agendaData.colors).map(([name, color]) => `
            <div class="legend-item">
                <input type="color" value="${color}" onchange="updateLegendColor('${name}', this.value)">
                <span>${name}</span>
                <button onclick="removeLegend('${name}')">×</button>
            </div>
        `).join('');
    }

    window.updateLegendColor = (name, color) => {
        window.agendaData.colors[name] = color;
        saveToLocal();
        renderAgendaPreview();
    };

    window.removeLegend = (name) => {
        delete window.agendaData.colors[name];
        renderLegendList();
        renderHoraireGrid(); // Rafraîchir les dropdowns
        saveToLocal();
        renderAgendaPreview();
    };

    // Gestion du thème
    const primaryInput = document.getElementById('color-primary');
    const secondaryInput = document.getElementById('color-secondary');
    const bgInput = document.getElementById('color-bg');

    function updateTheme(key, value) {
        window.agendaData.theme[key] = value;
        document.documentElement.style.setProperty(`--${key}-color`, value);
        if (key === 'primary') {
            document.documentElement.style.setProperty('--primary-dark', shadeColor(value, -20));
        }
        const span = document.querySelector(`#color-${key} + .color-val`);
        if (span) span.textContent = value.toUpperCase();
        saveToLocal();
    }

    primaryInput.addEventListener('input', (e) => updateTheme('primary', e.target.value));
    secondaryInput.addEventListener('input', (e) => updateTheme('secondary', e.target.value));
    bgInput.addEventListener('input', (e) => updateTheme('bg', e.target.value));

    function applyThemeToUI() {
        const theme = window.agendaData.theme;
        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}-color`, value);
            if (key === 'primary') {
                document.documentElement.style.setProperty('--primary-dark', shadeColor(value, -20));
            }
            const input = document.getElementById(`color-${key}`);
            const span = document.querySelector(`#color-${key} + .color-val`);
            if (input) input.value = value;
            if (span) span.textContent = value.toUpperCase();
        });
    }

    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }

    // Initialisation
    loadFromLocal();
    applyThemeToUI();
    renderHoraireGrid();
    renderEventList();
    renderLegendList();
});


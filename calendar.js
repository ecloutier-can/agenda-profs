// calendar.js - Logique de génération des dates et rotation des cycles

const Calendar = {
    // Calculer les jours entre deux dates
    getDaysInRange(startDate, endDate) {
        const days = [];
        // On force le parsing en local en utilisant YYYY, MM, DD
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const [ey, em, ed] = endDate.split('-').map(Number);

        let current = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);

        while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    },

    // Vérifier si un jour est un week-end
    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
    },

    // Récupérer l'événement pour une date donnée
    getEventForDate(date, holidays) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        return holidays.find(h => h.date === dateStr);
    },

    // Générer l'agenda complet avec rotation du cycle
    generateFullAgenda(data) {
        const { startDate, endDate, cycleDays, periodsPerDay } = data.config;
        const { holidays, schedule, corrections } = data; // modifications manuelles éventuelles

        if (!startDate || !endDate) return [];

        const allDays = this.getDaysInRange(startDate, endDate);
        const agenda = [];
        let currentCycleDay = 1;

        allDays.forEach(date => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            const isWeekend = this.isWeekend(date);
            const holiday = this.getEventForDate(date, holidays || []);

            // Appliquer une correction manuelle si elle existe pour cette date
            if (corrections && corrections[dateStr] !== undefined) {
                currentCycleDay = corrections[dateStr];
            }

            // Un jour ouvrable est un jour qui n'est pas un week-end ET pas un congé (type 'conge')
            const isOuvrable = !isWeekend && (!holiday || holiday.type !== 'conge');

            let cycleDay = null;
            let periods = [];

            if (isOuvrable) {
                // Si c'est un jour ouvrable mais qu'il y a un événement de type 'pedago', on ne fait pas avancer le cycle
                if (holiday && holiday.type === 'pedago') {
                    cycleDay = 'PÉD';
                } else {
                    cycleDay = currentCycleDay;
                    // Récupérer l'horaire pour ce jour du cycle
                    for (let p = 1; p <= periodsPerDay; p++) {
                        const sched = schedule[`${cycleDay}-${p}`] || { subject: '' };
                        periods.push({
                            number: p,
                            ...sched
                        });
                    }

                    // Avancer le cycle
                    currentCycleDay = (currentCycleDay % cycleDays) + 1;
                }
            }

            agenda.push({
                date: new Date(date),
                dateStr,
                isWeekend,
                holiday,
                cycleDay,
                periods,
                notes: ''
            });
        });

        return agenda;
    },


    // Grouper l'agenda par "page" selon les réglages
    groupAgendaByWeek(agenda, daysPerPage = 5) {
        const pages = [];
        let currentPage = [];

        agenda.forEach(day => {
            if (day.isWeekend) return; // On ne met pas les weekends sur les pages sauf si on implémente une option spécifique

            currentPage.push(day);
            if (currentPage.length >= daysPerPage) {
                pages.push([...currentPage]);
                currentPage = [];
            }
        });

        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }
};

// État de l'aperçu
let currentWeekOffset = 0;

function renderAgendaPreview() {
    const preview = document.getElementById('agenda-preview');
    const agenda = Calendar.generateFullAgenda(window.agendaData);
    const weeks = Calendar.groupAgendaByWeek(agenda, window.agendaData.config.daysPerPage || 5);

    if (weeks.length === 0) {
        preview.innerHTML = "<div class='empty-state'><p>Veuillez configurer les dates de début et de fin dans la barre latérale.</p></div>";
        return;
    }

    if (currentWeekOffset >= weeks.length) currentWeekOffset = weeks.length - 1;
    if (currentWeekOffset < 0) currentWeekOffset = 0;

    const currentWeek = weeks[currentWeekOffset];
    document.getElementById('current-week-label').innerText = `Semaine ${currentWeekOffset + 1} de ${weeks.length}`;

    let html = `<div class="week-preview-container">`;
    currentWeek.forEach(day => {
        if (day.isWeekend) return;

        const dateStrLong = day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        const isPedago = day.cycleDay === 'PÉD';

        html += `
            <div class="preview-day-card ${day.holiday ? 'has-holiday' : ''}">
                <div class="preview-day-header">
                    <div class="date-info">
                        <span class="day-name">${dateStrLong}</span>
                    </div>
                    <div class="cycle-info">
                        <label>Jour:</label>
                        <select class="correction-select" data-date="${day.dateStr}">
                            <option value="">-</option>
                            ${isPedago ? '<option value="PÉD" selected>PÉD</option>' : ''}
                            ${Array.from({ length: window.agendaData.config.cycleDays }, (_, i) => i + 1).map(d =>
            `<option value="${d}" ${day.cycleDay === d ? 'selected' : ''}>${d}</option>`
        ).join('')}
                        </select>
                    </div>
                </div>
                <div class="preview-day-body">
                    ${day.holiday ? `<div class="preview-holiday-banner ${day.holiday.type}">${day.holiday.label}</div>` : ''}
                    <div class="preview-periods" style="grid-template-columns: repeat(auto-fill, minmax(${day.periods.length > 10 ? '140px' : '280px'}, 1fr))">
                        ${day.periods.length > 0 ? day.periods.map(p => {
            const color = window.agendaData.colors[p.subject] || '#f1f3f4';
            const isColored = !!window.agendaData.colors[p.subject];
            const isCompact = day.periods.length > 10;
            return `
                                <div class="preview-period" style="border-top: 4px solid ${isColored ? color : '#ccc'}; min-height: ${isCompact ? '60px' : (window.agendaData.config.notesHeight || 30) + 'mm'}">
                                    <div class="p-header" style="${isCompact ? 'padding: 0.3rem;' : ''}">
                                        <span class="p-num" style="${isCompact ? 'font-size: 0.65rem;' : ''}">P${p.number}</span>
                                        <span class="p-subject" style="${isCompact ? 'font-size: 0.75rem;' : ''}">${p.subject || '---'}</span>
                                    </div>
                                    ${!isCompact ? '<div class="p-color-bar" style="background-color: ' + (isColored ? color + '22' : 'transparent') + '"></div>' : ''}
                                    ${!isCompact ? '<div class="p-notes-body"></div>' : ''}
                                </div>
                            `;
        }).join('') : '<div class="no-periods">Aucun cours prévu</div>'}
                    </div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    preview.innerHTML = html;

    // Listeners for corrections
    document.querySelectorAll('.correction-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const dateStr = e.target.dataset.date;
            const newVal = e.target.value;

            if (!window.agendaData.corrections) window.agendaData.corrections = {};

            if (newVal === "") {
                delete window.agendaData.corrections[dateStr];
            } else {
                window.agendaData.corrections[dateStr] = parseInt(newVal);
            }

            saveToLocal();
            renderAgendaPreview(); // Re-render to propagate changes
        });
    });
}

// Event listeners for pagination
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentWeekOffset > 0) {
                currentWeekOffset--;
                renderAgendaPreview();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentWeekOffset++;
            renderAgendaPreview();
        });
    }
});


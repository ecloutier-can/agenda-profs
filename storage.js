// storage.js - Persistance locale et Import/Export JSON

function saveToLocal() {
    localStorage.setItem('agenda_pro_data', JSON.stringify(window.agendaData));
}

function loadFromLocal() {
    const saved = localStorage.getItem('agenda_pro_data');
    if (saved) {
        try {
            window.agendaData = JSON.parse(saved);
            // Re-remplir les champs de config
            document.getElementById('school-year').value = window.agendaData.config.year || '';
            document.getElementById('start-date').value = window.agendaData.config.startDate || '';
            document.getElementById('end-date').value = window.agendaData.config.endDate || '';
            document.getElementById('cycle-days').value = window.agendaData.config.cycleDays || 9;
            document.getElementById('periods-per-day').value = window.agendaData.config.periodsPerDay || 4;
            document.getElementById('days-per-page').value = window.agendaData.config.daysPerPage || 5;
            document.getElementById('page-orientation').value = window.agendaData.config.orientation || 'portrait';
            document.getElementById('notes-height').value = window.agendaData.config.notesHeight || 30;
            document.getElementById('notes-height-val').innerText = (window.agendaData.config.notesHeight || 30) + " mm";
        } catch (e) {
            console.error("Erreur lors du chargement des données locales", e);
        }
    }
}

// Export de fichier .agenda (JSON)
document.getElementById('btn-export').addEventListener('click', () => {
    const dataStr = JSON.stringify(window.agendaData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda_${window.agendaData.config.year || 'config'}.agenda`;
    link.click();

    URL.revokeObjectURL(url);
});

// Import de fichier .agenda
document.getElementById('btn-import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.agenda, .json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                window.agendaData = importedData;
                saveToLocal();
                location.reload(); // Recharger pour rafraîchir tout l'UI
            } catch (err) {
                alert("Erreur lors de l'import : Fichier invalide.");
            }
        };
        reader.readAsText(file);
    };

    input.click();
});

// Listeners pour les changements de config directe
['school-year', 'start-date', 'end-date', 'days-per-page', 'page-orientation', 'notes-height'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        let field = id.replace('school-', '')
            .replace('start-', 'start')
            .replace('end-', 'end')
            .replace('days-per-page', 'daysPerPage')
            .replace('page-orientation', 'orientation')
            .replace('notes-height', 'notesHeight');

        if (id === 'notes-height') {
            document.getElementById('notes-height-val').innerText = e.target.value + " mm";
        }

        window.agendaData.config[field] = (id === 'days-per-page' || id === 'notes-height') ? parseInt(e.target.value) : e.target.value;
        saveToLocal();

        // Rafraîchir l'UI si on change les dates ou le cycle
        if (typeof renderAgendaPreview === 'function') renderAgendaPreview();
    });
});

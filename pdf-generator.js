// pdf-generator.js - Génération de l'agenda au format PDF

document.getElementById('btn-generate-pdf').addEventListener('click', async () => {
    try {
        if (!window.agendaData || !window.agendaData.config) {
            alert("Données d'agenda manquantes.");
            return;
        }

        const jsPDF = window.jspdf.jsPDF;
        const config = window.agendaData.config;
        const orientation = config.orientation === 'landscape' ? 'l' : 'p';

        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });

        const agenda = Calendar.generateFullAgenda(window.agendaData);
        const weeks = Calendar.groupAgendaByWeek(agenda, config.daysPerPage || 5);

        if (weeks.length === 0) {
            alert("Veuillez d'abord configurer les dates de l'agenda.");
            return;
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - 35; // Espace après l'en-tête

        // --- Page de Couverture ---
        doc.setFontSize(28);
        doc.setTextColor(25, 127, 230);
        doc.text("AGENDA SCOLAIRE", pageWidth / 2, pageHeight / 3, { align: "center" });

        doc.setFontSize(18);
        doc.setTextColor(100, 100, 100);
        doc.text(config.year || "Année Scolaire", pageWidth / 2, pageHeight / 3 + 15, { align: "center" });

        // --- Légende ---
        const colors = Object.entries(window.agendaData.colors);
        if (colors.length > 0) {
            doc.setFontSize(12);
            doc.text("Légende des catégories :", pageWidth / 2, pageHeight / 2, { align: "center" });

            let lx = margin + (contentWidth / 6);
            let ly = pageHeight / 2 + 10;
            colors.forEach(([name, color], i) => {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                doc.setFillColor(r, g, b);
                doc.rect(lx, ly - 4, 10, 5, 'F');
                doc.setTextColor(51, 51, 51);
                doc.text(name, lx + 12, ly);
                lx += 50;
                if ((i + 1) % 3 === 0) { lx = margin + (contentWidth / 6); ly += 8; }
            });
        }

        doc.addPage();

        // --- Génération des pages ---
        weeks.forEach((week, weekIndex) => {
            const firstDay = week[0].date;
            const lastDay = week[week.length - 1].date;
            const weekTitle = `Période du ${firstDay.toLocaleDateString('fr-FR')} au ${lastDay.toLocaleDateString('fr-FR')}`;

            doc.setFontSize(14);
            doc.setTextColor(25, 127, 230);
            doc.text(weekTitle, margin, 15);

            const daysInPage = week.length;
            const dayBoxHeight = (contentHeight / daysInPage) - 5;
            let yPos = 25;

            week.forEach(day => {
                // Box pour le jour
                doc.setDrawColor(224, 224, 224);
                doc.setFillColor(248, 249, 250);
                doc.rect(margin, yPos, contentWidth, dayBoxHeight, 'F');
                doc.rect(margin, yPos, contentWidth, dayBoxHeight, 'S');

                // Date
                doc.setFontSize(11);
                doc.setTextColor(51, 51, 51);
                doc.setFont("helvetica", "bold");
                const dayLabel = day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                doc.text(dayLabel.toUpperCase(), margin + 5, yPos + 6);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text(`Jour ${day.cycleDay || '-'}`, margin + contentWidth - 20, yPos + 6);

                // Périodes
                if (day.holiday) {
                    doc.setFontSize(12);
                    doc.setTextColor(220, 53, 69);
                    doc.text(day.holiday.label, margin + 10, yPos + 15);
                } else if (day.periods.length > 0) {
                    const dayHeaderHeight = 10;
                    const periodGap = 2;
                    const availableHeightForPeriods = dayBoxHeight - dayHeaderHeight - 5;
                    const periodBoxHeight = (availableHeightForPeriods / day.periods.length) - periodGap;

                    let currentY = yPos + dayHeaderHeight;

                    day.periods.forEach((p) => {
                        let color = window.agendaData.colors[p.subject] || '#cccccc';
                        if (!color.startsWith('#')) color = '#cccccc';
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);

                        // Box de la période
                        doc.setDrawColor(230, 230, 230);
                        doc.setFillColor(255, 255, 255);
                        doc.rect(margin + 2, currentY, contentWidth - 4, periodBoxHeight, 'FS');

                        // En-tête de la période (barre de couleur)
                        doc.setFillColor(r, g, b);
                        doc.rect(margin + 2, currentY, 4, periodBoxHeight, 'F');

                        // Texte de la période
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(9);
                        doc.setTextColor(51, 51, 51);
                        doc.text(`P${p.number}: ${p.subject || '---'}`, margin + 10, currentY + 5);

                        // Lignes de notes dans la période
                        doc.setDrawColor(240, 240, 240);
                        const notesStartY = currentY + 8;
                        const notesLineGap = 6;
                        for (let h = 0; h < periodBoxHeight - 10; h += notesLineGap) {
                            doc.line(margin + 10, notesStartY + h, margin + contentWidth - 5, notesStartY + h);
                        }

                        currentY += periodBoxHeight + periodGap;
                    });
                } else {
                    doc.setFontSize(10);
                    doc.setTextColor(150, 150, 150);
                    doc.text("Aucun cours prévu", margin + 10, yPos + 15);
                }

                yPos += dayBoxHeight + 5;
            });

            if (weekIndex < weeks.length - 1) doc.addPage();
        });

        doc.save(`Agenda_${config.year || 'Scolaire'}.pdf`);
    } catch (error) {
        console.error("Erreur PDF:", error);
        alert("Une erreur est survenue lors de la génération du PDF : " + error.message);
    }
});

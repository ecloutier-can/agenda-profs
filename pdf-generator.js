// pdf-generator.js - Génération de l'agenda au format PDF

document.getElementById('btn-generate-pdf').addEventListener('click', async () => {
    try {
        if (!window.agendaData || !window.agendaData.config) {
            alert("Données d'agenda manquantes.");
            return;
        }

        // Vérification de jsPDF
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("La bibliothèque PDF (jsPDF) n'est pas chargée. Veuillez vérifier votre connexion.");
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

        // Génération de l'agenda via Calendar (défini dans calendar.js)
        const agenda = Calendar.generateFullAgenda(window.agendaData);
        // Filtrer pour ne garder que les jours de semaine
        const weekdayAgenda = agenda.filter(d => !d.isWeekend);
        const weeks = Calendar.groupAgendaByWeek(weekdayAgenda, config.daysPerPage || 5);

        if (weeks.length === 0) {
            alert("Veuillez d'abord configurer les dates de l'agenda (début et fin).");
            return;
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);

        // --- Page de Couverture ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.setTextColor(25, 127, 230);
        doc.text("AGENDA SCOLAIRE", pageWidth / 2, pageHeight / 3, { align: "center" });

        doc.setFontSize(20);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(config.year || "Année Scolaire", pageWidth / 2, pageHeight / 3 + 15, { align: "center" });

        // --- Légende sur la couverture ---
        const colorEntries = Object.entries(window.agendaData.colors || {});
        if (colorEntries.length > 0) {
            let ly = pageHeight / 2 + 10;
            doc.setFontSize(14);
            doc.setTextColor(51, 51, 51);
            doc.text("Légende des catégories :", margin, ly);
            ly += 8;

            let lx = margin;
            colorEntries.forEach(([name, color], i) => {
                const r = parseInt(color.slice(1, 3), 16) || 200;
                const g = parseInt(color.slice(3, 5), 16) || 200;
                const b = parseInt(color.slice(5, 7), 16) || 200;

                doc.setFillColor(r, g, b);
                doc.rect(lx, ly - 4, 8, 5, 'F');
                doc.setFontSize(10);
                doc.text(name, lx + 10, ly);

                lx += 50;
                if ((i + 1) % 3 === 0) { lx = margin; ly += 8; }
            });
        }

        // --- Génération des pages d'agenda ---
        weeks.forEach((week, weekIndex) => {
            doc.addPage();

            const firstDay = week[0].date;
            const lastDay = week[week.length - 1].date;
            const weekTitle = `Période du ${firstDay.toLocaleDateString('fr-FR')} au ${lastDay.toLocaleDateString('fr-FR')}`;

            // En-tête de page
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(25, 127, 230);
            doc.text(weekTitle, margin, 15);

            // Ligne de séparation
            doc.setDrawColor(25, 127, 230);
            doc.setLineWidth(0.5);
            doc.line(margin, 18, pageWidth - margin, 18);

            const daysInPage = week.length;
            const headerHeight = 22;
            const footerHeight = 10;
            const availablePageHeight = pageHeight - headerHeight - footerHeight;

            // Calculer la hauteur d'un bloc jour
            // On essaie de respecter config.notesHeight (qui est par période)
            const periodsPerDay = config.periodsPerDay || 1;
            const dayHeaderHeight = 8;
            const requestedDayHeight = dayHeaderHeight + (periodsPerDay * (config.notesHeight || 30));

            // Mais on doit faire tenir X jours par page
            const maxDayHeight = (availablePageHeight / daysInPage) - 2;
            const dayHeight = Math.min(requestedDayHeight, maxDayHeight);

            let yPos = headerHeight;

            week.forEach(day => {
                // Box pour le jour
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.setFillColor(245, 247, 249);
                doc.rect(margin, yPos, contentWidth, dayHeight, 'F');
                doc.rect(margin, yPos, contentWidth, dayHeight, 'S');

                // En-tête du jour (Date)
                doc.setFillColor(230, 235, 240);
                doc.rect(margin, yPos, contentWidth, dayHeaderHeight, 'F');
                doc.rect(margin, yPos, contentWidth, dayHeaderHeight, 'S');

                doc.setFontSize(10);
                doc.setTextColor(40, 40, 40);
                doc.setFont("helvetica", "bold");
                const dayLabel = day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                doc.text(dayLabel.toUpperCase(), margin + 3, yPos + 5.5);

                doc.setFontSize(9);
                doc.text(`Jour ${day.cycleDay || '-'}`, margin + contentWidth - 5, yPos + 5.5, { align: "right" });

                // Contenu du jour
                if (day.holiday) {
                    doc.setFontSize(12);
                    doc.setTextColor(220, 53, 69);
                    doc.setFont("helvetica", "bold");
                    doc.text(day.holiday.label, margin + (contentWidth / 2), yPos + (dayHeight / 2) + 2, { align: "center" });
                } else if (day.periods.length > 0) {
                    const availableHeightForPeriods = dayHeight - dayHeaderHeight;
                    const periodBoxHeight = availableHeightForPeriods / day.periods.length;

                    let currentY = yPos + dayHeaderHeight;

                    day.periods.forEach((p, pIdx) => {
                        let color = (window.agendaData.colors && window.agendaData.colors[p.subject]) ? window.agendaData.colors[p.subject] : '#cccccc';
                        if (!color.startsWith('#')) color = '#cccccc';
                        const r = parseInt(color.slice(1, 3), 16) || 200;
                        const g = parseInt(color.slice(3, 5), 16) || 200;
                        const b = parseInt(color.slice(5, 7), 16) || 200;

                        // Petite barre de couleur à gauche de la période
                        doc.setFillColor(r, g, b);
                        doc.rect(margin + 0.5, currentY + 0.5, 3, periodBoxHeight - 1, 'F');

                        // Texte de la période
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(9);
                        doc.setTextColor(51, 51, 51);
                        doc.text(`P${p.number}: ${p.subject || '---'}`, margin + 6, currentY + 4.5);

                        // Lignes de notes
                        doc.setDrawColor(230, 230, 230);
                        const notesStartY = currentY + 7;
                        const notesLineGap = 6;
                        for (let h = 0; h < periodBoxHeight - 8; h += notesLineGap) {
                            doc.line(margin + 6, notesStartY + h, margin + contentWidth - 3, notesStartY + h);
                        }

                        // Ligne de séparation entre périodes si pas la dernière
                        if (pIdx < day.periods.length - 1) {
                            doc.setDrawColor(220, 220, 220);
                            doc.line(margin, currentY + periodBoxHeight, margin + contentWidth, currentY + periodBoxHeight);
                        }

                        currentY += periodBoxHeight;
                    });
                } else {
                    doc.setFontSize(10);
                    doc.setTextColor(150, 150, 150);
                    doc.setFont("helvetica", "italic");
                    doc.text("Aucun cours prévu", margin + (contentWidth / 2), yPos + (dayHeight / 2) + 2, { align: "center" });
                }

                yPos += dayHeight + 2;
            });
        });

        // Sauvegarde du fichier
        const fileName = `Agenda_${config.year || 'Scolaire'}.pdf`.replace(/[^a-z0-9_\-\.]/gi, '_');
        doc.save(fileName);

    } catch (error) {
        console.error("Erreur critique PDF:", error);
        alert("Une erreur technique empêche la génération du PDF. Consultez la console (F12) pour plus de détails.\nErreur: " + error.message);
    }
});

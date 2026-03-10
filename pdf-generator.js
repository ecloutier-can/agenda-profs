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
            const headerOverallHeight = 22;
            const footerHeight = 10;
            const availablePageHeight = pageHeight - headerOverallHeight - footerHeight;

            // Hauteur d'un bloc jour
            const daySpacing = 4;
            const dayHeight = (availablePageHeight / daysInPage) - daySpacing;

            let yPos = headerOverallHeight;

            week.forEach(day => {
                // Box principale du jour
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.setFillColor(255, 255, 255);
                doc.rect(margin, yPos, contentWidth, dayHeight, 'S');

                // En-tête du jour (Date)
                const dayHeaderHeight = 7;
                doc.setFillColor(245, 247, 249);
                doc.rect(margin, yPos, contentWidth, dayHeaderHeight, 'F');
                doc.line(margin, yPos + dayHeaderHeight, margin + contentWidth, yPos + dayHeaderHeight);

                doc.setFontSize(9);
                doc.setTextColor(40, 40, 40);
                doc.setFont("helvetica", "bold");
                const dayLabel = day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                doc.text(dayLabel.toUpperCase(), margin + 3, yPos + 5);

                doc.setFontSize(8);
                doc.text(`Jour ${day.cycleDay || '-'}`, margin + contentWidth - 3, yPos + 5, { align: "right" });

                // Contenu du jour (Périodes en GRILLE comme l'aperçu)
                if (day.holiday) {
                    doc.setFontSize(11);
                    doc.setTextColor(220, 53, 69);
                    doc.text(day.holiday.label, margin + (contentWidth / 2), yPos + (dayHeight / 2) + 3, { align: "center" });
                } else if (day.periods.length > 0) {
                    const availableWidthForContent = contentWidth;
                    const availableHeightForPeriods = dayHeight - dayHeaderHeight;

                    // Déterminer le nombre de colonnes (2 par défaut si assez de place, sinon 1)
                    const numCols = (orientation === 'l' || contentWidth > 150) ? 2 : 1;
                    const numRows = Math.ceil(day.periods.length / numCols);

                    const colWidth = availableWidthForContent / numCols;
                    const rowHeight = availableHeightForPeriods / numRows;

                    day.periods.forEach((p, pIdx) => {
                        const col = pIdx % numCols;
                        const row = Math.floor(pIdx / numCols);

                        const px = margin + (col * colWidth);
                        const py = yPos + dayHeaderHeight + (row * rowHeight);

                        // Bordures de la cellule de période
                        doc.setDrawColor(230, 230, 230);
                        if (col > 0) doc.line(px, py, px, py + rowHeight);
                        if (row > 0) doc.line(px, py, px + colWidth, py);

                        // Couleur du sujet
                        let color = (window.agendaData.colors && window.agendaData.colors[p.subject]) ? window.agendaData.colors[p.subject] : '#cccccc';
                        const r = parseInt(color.slice(1, 3), 16) || 200;
                        const g = parseInt(color.slice(3, 5), 16) || 200;
                        const b = parseInt(color.slice(5, 7), 16) || 200;

                        // Barre de couleur en haut de la période
                        doc.setFillColor(r, g, b);
                        doc.rect(px, py, colWidth, 1.5, 'F');

                        // En-tête de période (Numéro + Titre)
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(8);
                        doc.setTextColor(51, 51, 51);
                        doc.text(`P${p.number}`, px + 2, py + 5);

                        doc.setFontSize(8);
                        const subjectText = p.subject?.substring(0, 25) || '---';
                        doc.text(subjectText, px + 8, py + 5);

                        // Lignes de notes
                        doc.setDrawColor(240, 240, 240);
                        const notesStartY = py + 7.5;
                        const notesLineGap = 5; // Plus serré pour les notes pour gagner de la place
                        for (let h = 0; h < rowHeight - 9; h += notesLineGap) {
                            doc.line(px + 2, notesStartY + h, px + colWidth - 2, notesStartY + h);
                        }
                    });
                } else {
                    doc.setFontSize(9);
                    doc.setTextColor(150, 150, 150);
                    doc.setFont("helvetica", "italic");
                    doc.text("Aucun cours prévu", margin + (contentWidth / 2), yPos + (dayHeight / 2) + 3, { align: "center" });
                }

                yPos += dayHeight + daySpacing;
            });
        });

        // Sauvegarde du fichier
        const fileName = `Agenda_${config.year || 'Scolaire'}.pdf`.replace(/[^a-z0-9_\-\.]/gi, '_');
        doc.save(fileName);

    } catch (error) {
        console.error("Erreur critique PDF:", error);
        alert("Erreur technique: " + error.message);
    }
});

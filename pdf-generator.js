// pdf-generator.js - Génération Premium "Tournesol"
// Basé sur le modèle Planificateur Tournesol 2025-2026

document.getElementById('btn-generate-pdf').addEventListener('click', async () => {
    try {
        if (!window.agendaData || !window.agendaData.config) {
            alert("Données d'agenda manquantes.");
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("jsPDF non chargé.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const config = window.agendaData.config;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;

        // Helper: Charger une image
        const loadImage = (url) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });

        // Helper: Dessiner un footer standard
        const drawFooter = (d, pageNum, totalPages) => {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        };

        // --- 1. PAGE DE COUVERTURE ---
        try {
            const coverImg = await loadImage('cover.png');
            doc.addImage(coverImg, 'PNG', 0, 0, pageWidth, pageHeight);

            // Bandeau de titre blanc semi-transparent ou propre
            doc.setFillColor(255, 255, 255);
            doc.rect(0, pageHeight * 0.75, pageWidth, 25, 'F');

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(40);
            doc.text("Tournesol", margin + 5, pageHeight * 0.81);

            doc.setFontSize(30);
            doc.text(config.year || "2025-2026", pageWidth - margin - 5, pageHeight * 0.81, { align: 'right' });
        } catch (e) {
            console.warn("Image de couverture manquante", e);
            doc.setFontSize(40);
            doc.text("AGENDA", pageWidth / 2, pageHeight / 2, { align: 'center' });
        }

        // --- 2. PAGES INTERCALAIRES (Optionnel mais joli) ---
        doc.addPage();
        // Page de points (Bullet journal style)
        for (let x = 10; x < pageWidth; x += 10) {
            for (let y = 10; y < pageHeight; y += 10) {
                doc.setFillColor(200, 200, 200);
                doc.circle(x, y, 0.2, 'F');
            }
        }

        // --- 3. GRILLE HORAIRE TYPE (20 Périodes) ---
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(100, 100, 100);
        doc.text("HORAIRE TYPE DU CYCLE", margin, 15);

        const cycleDays = config.cycleDays || 9;
        const periodsPerDay = config.periodsPerDay || 4;

        const tableTop = 25;
        const colWidth = (pageWidth - (margin * 2)) / (cycleDays + 1);
        const rowHeight = (pageHeight - tableTop - 20) / periodsPerDay;

        // En-têtes
        doc.setFontSize(9);
        doc.setFillColor(240, 235, 220);
        doc.rect(margin, tableTop, pageWidth - (margin * 2), 7, 'F');
        for (let i = 1; i <= cycleDays; i++) {
            doc.text(`${i}`, margin + (i * colWidth) + (colWidth / 2), tableTop + 5, { align: 'center' });
        }

        // Cellules
        for (let p = 1; p <= periodsPerDay; p++) {
            const y = tableTop + 7 + ((p - 1) * rowHeight);
            doc.setFont("helvetica", "bold");
            doc.text(`P${p}`, margin + (colWidth / 2), y + (rowHeight / 2), { align: 'center' });

            for (let d = 1; d <= cycleDays; d++) {
                const x = margin + (d * colWidth);
                doc.setDrawColor(230, 220, 200);
                doc.rect(x, y, colWidth, rowHeight, 'S');

                const sched = window.agendaData.schedule[`${d}-${p}`];
                if (sched && sched.subject) {
                    const color = window.agendaData.colors[sched.subject] || '#cccccc';
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    doc.setFillColor(r, g, b);
                    doc.rect(x + 0.5, y + 0.5, colWidth - 1, 2, 'F');

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.text(sched.subject.substring(0, 12), x + (colWidth / 2), y + (rowHeight / 2) + 2, { align: 'center' });
                }
            }
        }

        // --- 4. PAGES D'AGENDA HEBDOMADAIRE ---
        const agenda = Calendar.generateFullAgenda(window.agendaData);
        const weekdayAgenda = agenda.filter(d => !d.isWeekend);
        const weeks = Calendar.groupAgendaByWeek(weekdayAgenda, config.daysPerPage || 5);

        for (const week of weeks) {
            doc.addPage();

            // Header: Mois
            const monthName = week[0].date.toLocaleDateString('fr-FR', { month: 'long' });
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(212, 160, 23); // Yellow
            doc.text(monthName.toUpperCase(), margin, 20);

            // Déco
            try {
                const decoImg = await loadImage('decoration.png');
                doc.addImage(decoImg, 'PNG', pageWidth - 60, 5, 50, 50);
            } catch (e) { }

            let xPos = margin;
            const dayWidth = (pageWidth - (margin * 2) - 40) / week.length; // 40mm pour la sidebar

            week.forEach((day, i) => {
                const dx = margin + (i * dayWidth);

                // Date Bubble
                doc.setFillColor(253, 245, 230);
                doc.roundedRect(dx + 2, 30, dayWidth - 4, 15, 5, 5, 'F');

                doc.setTextColor(184, 134, 11);
                doc.setFontSize(14);
                doc.text(day.date.getDate().toString(), dx + (dayWidth / 2), 38, { align: 'center' });
                doc.setFontSize(8);
                doc.text(day.date.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase(), dx + (dayWidth / 2), 43, { align: 'center' });

                // Grille de périodes
                const pTop = 50;
                const pHeight = (pageHeight - pTop - 20) / (day.periods.length || 1);

                day.periods.forEach((p, pi) => {
                    const py = pTop + (pi * pHeight);
                    doc.setDrawColor(240, 230, 210);
                    doc.rect(dx, py, dayWidth, pHeight, 'S');

                    if (p.subject) {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(7);
                        doc.text(`P${p.number}: ${p.subject}`, dx + 2, py + 4);
                    }

                    // Lignes de notes
                    doc.setDrawColor(245, 240, 230);
                    for (let ly = py + 8; ly < py + pHeight - 2; ly += 6) {
                        doc.line(dx + 2, ly, dx + dayWidth - 2, ly);
                    }
                });
            });

            // Sidebar Note (Example: Cork style or colored box)
            const sidebarX = pageWidth - margin - 35;
            doc.setFillColor(250, 240, 220);
            doc.roundedRect(sidebarX, 50, 35, 150, 5, 5, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("NOTES", sidebarX + 17.5, 60, { align: 'center' });
        }

        doc.save(`Agenda_Tournesol_${config.year || '2025'}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Erreur: " + error.message);
    }
});

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { TripItem, TripDetails, Budget } from '@/store/trip-store'
import { getActiveCities } from '@/services/auth/city.service'

/**
 * Utility to export trip to PDF
 */
export const exportTripToPDF = async (
    tripDetails: TripDetails,
    items: TripItem[],
    budget: Budget | null,
    totalSpent: number
) => {
    const doc = new jsPDF()

    // --- Header ---
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text(tripDetails.title || 'Plan de Călătorie', 14, 20)

    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    const dateRange = tripDetails.startDate && tripDetails.endDate
        ? `${format(new Date(tripDetails.startDate), "d MMM yyyy", { locale: ro })} - ${format(new Date(tripDetails.endDate), "d MMM yyyy", { locale: ro })}`
        : 'Date nesetate'

    doc.text(tripDetails.cityName || 'Destinație', 14, 28)
    doc.text(dateRange, 14, 34)

    // --- Budget Section ---
    if (budget) {
        doc.setDrawColor(200, 200, 200)
        doc.line(14, 42, 196, 42) // Horizontal line

        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Buget', 14, 52)

        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        const budgetText = `Total: ${budget.total} ${budget.currency}  |  Cheltuit: ${totalSpent} ${budget.currency}  |  Rămas: ${budget.total - totalSpent} ${budget.currency}`
        doc.text(budgetText, 14, 59)
    }

    // --- Itinerary Section ---
    const startY = budget ? 70 : 50
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Itinerar', 14, startY)

    // Group items by day
    const itemsByDay = items.reduce((acc, item) => {
        const day = item.day_index + 1
        if (!acc[day]) acc[day] = []
        acc[day].push(item)
        return acc
    }, {} as Record<number, TripItem[]>)

    // Flatten for table
    const tableRows: any[] = []

    // Sort days
    const sortedDays = Object.keys(itemsByDay).map(Number).sort((a, b) => a - b)

    sortedDays.forEach(day => {
        // Add Day Header Row
        tableRows.push([{ content: `Ziua ${day}`, colSpan: 3, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }])

        // Sort items by block/time (assuming insertion order for now or block if available)
        const dayItems = itemsByDay[day]

        if (dayItems.length === 0) {
            tableRows.push(['-', 'Nicio activitate', '-'])
        } else {
            dayItems.forEach(item => {
                tableRows.push([
                    item.block === 'morning' ? 'Dimineață' : item.block === 'afternoon' ? 'Prânz' : 'Seară',
                    item.business_name || 'Activitate',
                    `${item.estimated_cost} RON`
                ])
            })
        }
    })

    if (tableRows.length === 0) {
        tableRows.push([{ content: 'Nicio activitate planificată încă.', colSpan: 3 }])
    }

    autoTable(doc, {
        startY: startY + 5,
        head: [['Perioada', 'Activitate', 'Cost Estimat']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30, halign: 'right' }
        }
    })

    // --- Footer ---
    const pageCount = doc.internal.pages.length - 1
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(`Generat cu Travel App - Pagina ${i} din ${pageCount}`, 14, doc.internal.pageSize.height - 10)
    }

    // Save
    doc.save(`plan-${tripDetails.cityName || 'calatorie'}-${Date.now()}.pdf`)
}

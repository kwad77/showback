import { useState } from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0)

export default function ExportPDF({ summary }) {
  const [generating, setGenerating] = useState(false)

  const handleExport = async () => {
    if (!summary) return
    setGenerating(true)

    try {
      // Lazy-load jsPDF so it doesn't bloat the initial bundle
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      // ── Cover header ─────────────────────────────────────────────────────────
      doc.setFillColor(99, 102, 241)  // brand-500
      doc.rect(0, 0, pageW, 28, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Employee TCO Showback Report', 14, 12)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${today}`, 14, 20)
      doc.text(`${summary.total_employees} employees analysed`, pageW - 14, 20, { align: 'right' })

      // ── KPI summary boxes ────────────────────────────────────────────────────
      doc.setTextColor(30, 30, 30)
      const kpis = [
        { label: 'Total Annual TCO',       value: fmt(summary.total_annual_tco) },
        { label: 'Avg Cost / Employee',    value: fmt(summary.avg_tco_per_employee) },
        { label: 'Birthright Total',       value: fmt(summary.birthright_total) },
        { label: 'Outlier Adjustments',    value: fmt(summary.outlier_total) },
      ]
      const boxW = (pageW - 28) / 2
      kpis.forEach((kpi, i) => {
        const x = 14 + (i % 2) * (boxW + 4)
        const y = 34 + Math.floor(i / 2) * 18
        doc.setFillColor(245, 245, 255)
        doc.roundedRect(x, y, boxW, 14, 2, 2, 'F')
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 150)
        doc.text(kpi.label.toUpperCase(), x + 3, y + 5)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(kpi.value, x + 3, y + 11)
        doc.setFont('helvetica', 'normal')
      })

      let cursor = 74

      // ── TCO by Department table ───────────────────────────────────────────────
      if (summary.by_domain?.length) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text('TCO by Department', 14, cursor)
        cursor += 2

        autoTable(doc, {
          startY: cursor,
          head: [['Department', 'Employees', 'Total Annual', 'Avg / Employee']],
          body: summary.by_domain.map((d) => [
            d.department,
            d.employee_count,
            fmt(d.total_annual),
            fmt(d.avg_per_employee),
          ]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 248, 255] },
          margin: { left: 14, right: 14 },
        })
        cursor = doc.lastAutoTable.finalY + 8
      }

      // ── TCO by Persona table ──────────────────────────────────────────────────
      if (summary.by_persona?.length) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('TCO by Persona', 14, cursor)
        cursor += 2

        autoTable(doc, {
          startY: cursor,
          head: [['Persona', 'Employees', 'Total Annual', 'Avg / Employee']],
          body: summary.by_persona.map((p) => [
            p.persona_name,
            p.employee_count,
            fmt(p.total_annual),
            fmt(p.avg_per_employee),
          ]),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 248, 255] },
          margin: { left: 14, right: 14 },
        })
        cursor = doc.lastAutoTable.finalY + 8
      }

      // ── Employee detail table ─────────────────────────────────────────────────
      if (summary.employee_details?.length) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Employee Cost Detail', 14, cursor)
        cursor += 2

        autoTable(doc, {
          startY: cursor,
          head: [['Employee', 'Department', 'Persona', 'Birthright', 'Persona', 'Outliers', 'Total']],
          body: summary.employee_details.map((e) => [
            e.employee_name,
            e.department ?? '—',
            e.persona_name,
            fmt(e.birthright_annual),
            fmt(e.persona_annual),
            fmt(e.outlier_annual),
            fmt(e.total_annual),
          ]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 248, 255] },
          columnStyles: { 6: { fontStyle: 'bold' } },
          margin: { left: 14, right: 14 },
        })
      }

      // ── Footer on each page ───────────────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(180, 180, 180)
        doc.text(
          `Page ${i} of ${totalPages} — Showback TCO Analyzer`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' },
        )
      }

      doc.save(`TCO_Showback_Report_${today.replace(/,?\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={!summary || generating}
      className="btn-secondary"
      title={!summary ? 'No TCO data to export yet' : 'Export Showback Report as PDF'}
    >
      <DocumentArrowDownIcon className="w-4 h-4" />
      {generating ? 'Generating…' : 'Export PDF'}
    </button>
  )
}

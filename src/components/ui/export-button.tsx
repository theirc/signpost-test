import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useCallback } from "react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { utils, writeFile } from "xlsx"
import { format } from "date-fns"

export interface ExportConfig {
    filename: string
    headers: string[]
    getRowData: (item: any) => any[]
}

interface ExportButtonProps {
    data: any[]
    config: ExportConfig
    disabled?: boolean
}

export function ExportButton({ data, config, disabled = false }: ExportButtonProps) {
    const handleExportPdf = useCallback(() => {
        const doc = new jsPDF()

        const body = data.map(config.getRowData);

        (doc as any).autoTable({
            head: [config.headers],
            body: body,
        })

        doc.save(`${config.filename}.pdf`)
    }, [data, config])

    const handleExportExcel = useCallback(() => {
        const worksheet = utils.aoa_to_sheet([config.headers, ...data.map(config.getRowData)])
        const workbook = utils.book_new()
        utils.book_append_sheet(workbook, worksheet, "Sheet1")
        writeFile(workbook, `${config.filename}.xlsx`)
    }, [data, config])

    const handleExportJson = useCallback(() => {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${config.filename}.json`
        link.click()
    }, [data, config])

    const handleExportXml = useCallback(() => {
        const getXmlContent = (item: any) => {
            const rowData = config.getRowData(item)
            return config.headers
                .map((header, index) => {
                    const value = rowData[index]
                    const tag = header.toLowerCase().replace(/\s+/g, '')
                    return `        <${tag}>${value}</${tag}>`
                })
                .join('\n')
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<data>
${data.map(item => `    <item>\n${getXmlContent(item)}\n    </item>`).join('\n')}
</data>`

        const blob = new Blob([xml], { type: "application/xml" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${config.filename}.xml`
        link.click()
    }, [data, config])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || data.length === 0}
                >
                    Export
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40" align="end">
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportPdf}
                        className="justify-start"
                    >
                        Export as PDF
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportExcel}
                        className="justify-start"
                    >
                        Export as Excel
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportJson}
                        className="justify-start"
                    >
                        Export as JSON
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportXml}
                        className="justify-start"
                    >
                        Export as XML
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
} 
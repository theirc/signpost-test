import { ReactNode } from "react"
import { ExportButton, type ExportConfig } from "./export-button"

interface TableActionsProps {
    selectedData: any[]
    exportConfig?: ExportConfig
    children?: ReactNode
    className?: string
}

export function TableActions({
    selectedData,
    exportConfig,
    children,
    className = ""
}: TableActionsProps) {
    return (
        <div className={`flex items-center justify-end gap-4 ${className}`}>
            {exportConfig && selectedData.length > 0 && (
                <ExportButton
                    data={selectedData}
                    config={exportConfig}
                    disabled={selectedData.length === 0}
                />
            )}
            {children}
        </div>
    )
} 
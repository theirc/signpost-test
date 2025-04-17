import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface EntityFormProps {
    title: string
    isLoading: boolean
    isFetching: boolean
    onSubmit: (e: React.FormEvent) => void
    onCancel: () => void
    children: ReactNode
    submitLabel?: string
    cancelLabel?: string
}

export function EntityForm({
    title,
    isLoading,
    isFetching,
    onSubmit,
    onCancel,
    children,
    submitLabel = "Save",
    cancelLabel = "Cancel"
}: EntityFormProps) {
    if (isFetching) {
        return (
            <div className="container mx-auto py-8">
                <div className="max-w-2xl mx-auto flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">{title}</h1>
                <form onSubmit={onSubmit} className="space-y-6">
                    {children}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            {cancelLabel}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
} 
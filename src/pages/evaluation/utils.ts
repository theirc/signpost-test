import { ConversationFilterService } from "./services/conversationFilterService"
import { CSVExportService } from "./services/csvExportService"

// Re-export services for backward compatibility
export { ConversationFilterService, CSVExportService }

// Backward compatibility exports
export const buildFilters = ConversationFilterService.buildSupabaseFilters
export const hasActiveFilters = ConversationFilterService.hasActiveFilters
export const clearFilters = (setFilters: any) => setFilters(ConversationFilterService.getDefaultFilters())
export const exportToCSV = CSVExportService.exportExecutionLogsToCSV
export const exportConversationsToCSV = CSVExportService.exportConversationsToCSV
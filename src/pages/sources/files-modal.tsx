import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FolderOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderCrawler } from "./folder-crawler"
import { FileUploadTab } from "./file-upload-tab"

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export default function FilesModal({ open, onOpenChange, onSourcesUpdated }: FilesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Files</DialogTitle>
          <DialogDescription>
            Import files or folders to add to your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Single Files</span>
            </TabsTrigger>
            <TabsTrigger value="folder" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>Folder Import</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            <FileUploadTab
              onSourcesUpdated={onSourcesUpdated}
              onOpenChange={onOpenChange}
            />
          </TabsContent>

          <TabsContent value="folder">
            <FolderCrawler
              open={true}
              onOpenChange={onOpenChange}
              onSourcesUpdated={onSourcesUpdated}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export const availableSources: any[] = [];
export const updateAvailableSources = (_sources?: any) => {};

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    Papa: any;
  }
} 
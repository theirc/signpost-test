import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Pencil, Trash, Book } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { availableSources } from "../components/forms/files-modal"
import { SourcesTable } from "@/components/sources-table"

interface Collection {
  id: string
  name: string
  sources: typeof availableSources
  createdAt: string
}

export function CollectionsManagement() {
  const [sources] = React.useState(availableSources)
  const [selectedSources, setSelectedSources] = React.useState<string[]>([])
  const [newCollectionName, setNewCollectionName] = React.useState("")
  const [collections, setCollections] = React.useState<Collection[]>([])
  const [editingCollection, setEditingCollection] = React.useState<Collection | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) 
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSources(event.target.checked ? sources.map(source => source.id) : [])
  }

  const handleSaveCollection = () => {
    if (newCollectionName && selectedSources.length > 0) {
      const selectedSourcesData = sources.filter(source => 
        selectedSources.includes(source.id)
      )
      
      const newCollection: Collection = {
        id: crypto.randomUUID(),
        name: newCollectionName,
        sources: selectedSourcesData,
        createdAt: new Date().toISOString()
      }
      
      setCollections(prev => [...prev, newCollection])
      setNewCollectionName("")
      setSelectedSources([])
    }
  }

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    setSelectedSources(collection.sources.map(s => s.id))
    setNewCollectionName(collection.name)
    setIsEditModalOpen(true)
  }

  const handleUpdateCollection = () => {
    if (editingCollection && newCollectionName && selectedSources.length > 0) {
      const selectedSourcesData = sources.filter(source => 
        selectedSources.includes(source.id)
      )
      
      const updatedCollection: Collection = {
        ...editingCollection,
        name: newCollectionName,
        sources: selectedSourcesData,
      }
      
      setCollections(prev => 
        prev.map(c => c.id === editingCollection.id ? updatedCollection : c)
      )
      
      resetEditState()
    }
  }

  const resetEditState = () => {
    setNewCollectionName("")
    setSelectedSources([])
    setEditingCollection(null)
    setIsEditModalOpen(false)
  }

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col space-y-1.5">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">Collections</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage your data collections
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              className="max-w-sm"
            />
            <Button 
              variant="default" 
              disabled={!newCollectionName}
              onClick={() => setIsEditModalOpen(true)}
            >
              Create Collection
            </Button>
          </div>

          {collections.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Sources</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                    <th className="h-12 px-4 text-left align-middle font-medium w-[100px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection) => (
                    <tr key={collection.id} className="border-b">
                      <td className="p-4">{collection.name}</td>
                      <td className="p-4">{collection.sources.length} sources</td>
                      <td className="p-4">{new Date(collection.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCollection(collection)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCollection(collection.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                <Book className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Collections</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  Create your first collection to start organizing your knowledge sources.
                </p>
                <Button 
                  variant="default"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Create Your First Collection
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Collection Modal */}
      <Dialog 
        open={isEditModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            resetEditState()
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingCollection ? 'Edit' : 'Create'} Collection</DialogTitle>
            <DialogDescription>
              {editingCollection ? 'Modify' : 'Create'} a collection by selecting sources and providing a name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </div>
            <SourcesTable 
              sources={sources}
              selectedSources={selectedSources}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              showCheckboxes={true}
              showActions={false}
              showAddButton={false}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditState}>
              Cancel
            </Button>
            <Button 
              onClick={editingCollection ? handleUpdateCollection : handleSaveCollection}
              disabled={!newCollectionName || selectedSources.length === 0}
            >
              {editingCollection ? 'Save Changes' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
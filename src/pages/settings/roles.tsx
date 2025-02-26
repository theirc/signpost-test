import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckedState } from "@radix-ui/react-checkbox"
import { Eye, Pencil, Plus, Share2, Trash2 } from "lucide-react"
import { useState } from "react"

interface CollectionPermissions {
    collection: string
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    share: boolean
}

export function Roles() {
    const [permissions, setPermissions] = useState<CollectionPermissions[]>([
        {
            collection: "Users",
            create: false,
            read: true,
            update: false,
            delete: false,
            share: false,
        },
        {
            collection: "Products",
            create: true,
            read: true,
            update: true,
            delete: false,
            share: false,
        },
        {
            collection: "Orders",
            create: false,
            read: true,
            update: false,
            delete: false,
            share: false,
        },
    ])

    const handlePermissionChange = (
        collection: string,
        permission: keyof Omit<CollectionPermissions, "collection">,
        checked: CheckedState
    ) => {
        const checkedBoolean = checked === true

        setPermissions((prevPermissions) =>
            prevPermissions.map((p) =>
                p.collection === collection ? { ...p, [permission]: checkedBoolean } : p
            )
        )
    }

    return (
        <div className="px-8 space-y-4">
            <div className="py-6">
                <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
            </div>
            <div className="border rounded-md">
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/2">Collection</TableHead>
                                <TableHead className="px-3">
                                    <Tooltip>
                                        <TooltipTrigger className="cursor-default"><Plus /></TooltipTrigger>
                                        <TooltipContent>Create</TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead className="px-3">
                                    <Tooltip>
                                        <TooltipTrigger className="cursor-default"><Eye /></TooltipTrigger>
                                        <TooltipContent>Read</TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead className="px-3">
                                    <Tooltip>
                                        <TooltipTrigger className="cursor-default"><Pencil /></TooltipTrigger>
                                        <TooltipContent>Update</TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead className="px-3">
                                    <Tooltip>
                                        <TooltipTrigger className="cursor-default"><Trash2 /></TooltipTrigger>
                                        <TooltipContent>Delete</TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead className="px-3">
                                    <Tooltip>
                                        <TooltipTrigger className="cursor-default"><Share2 /></TooltipTrigger>
                                        <TooltipContent>Share</TooltipContent>
                                    </Tooltip>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {permissions.map((permission) => (
                                <TableRow key={permission.collection}>
                                    <TableCell className="font-medium">
                                        {permission.collection}
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={permission.create}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(
                                                    permission.collection,
                                                    "create",
                                                    checked
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={permission.read}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(permission.collection, "read", checked)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={permission.update}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(
                                                    permission.collection,
                                                    "update",
                                                    checked
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={permission.delete}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(
                                                    permission.collection,
                                                    "delete",
                                                    checked
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={permission.share}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(
                                                    permission.collection,
                                                    "share",
                                                    checked
                                                )
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </div>
        </div>
    )
}
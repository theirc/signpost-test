import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, } from "@/components/ui/sidebar"
import Chat from "@/components/ui/chat"
import { FlowDesigner } from "./components/flow/flow"
import { useEffect, useState } from "react"

export function App() {
  const [activePage, setActivePage] = useState("designer"); 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search) 
    const view = params.get("view") || "designer"
    setActivePage(view)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar /> 
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Designer</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{activePage === "chatbot" ? "Chatbot Playground" : "RAG Bot"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {activePage === "designer" && <FlowDesigner />}
          {activePage === "chatbot" && <Chat />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );

}



import { Skeleton } from "../ui/skeleton"
import { Page } from "./page"
import { PageTitle } from "./title"

export function CRUDLoader() {

  return <Page>
    <PageTitle />
    <div className="">
      <div className="flex flex-col space-y-4 pt-16 px-4">
        <div className="row">
          <Skeleton className="h-8 rounded-md rc-4" />
          <Skeleton className="h-8 rounded-md rc-4" />
          <Skeleton className="h-8 rounded-md rc-4" />
        </div>
        <Skeleton className="h-32 w-full rounded-md" />
        <div className="row">
          <Skeleton className="h-8 rounded-md rc-4" />
          <Skeleton className="h-8 rounded-md rc-8" />
        </div>
        <div className="row">
          <Skeleton className="h-8 rounded-md rc-2" />
          <Skeleton className="h-8 rounded-md rc-2" />
          <Skeleton className="h-8 rounded-md rc-8" />
        </div>
        <div className="row">
          <Skeleton className="h-8 rounded-md rc-2" />
          <Skeleton className="h-8 rounded-md rc-2" />
          <Skeleton className="h-8 rounded-md rc-8" />
        </div>
        <div className="row">
          <div className="rc-10" />
          <Skeleton className="h-8 rounded-md rc-2" />
        </div>
      </div>
    </div>
  </Page>

}
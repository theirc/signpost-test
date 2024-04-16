import { useParams } from "react-router-dom"
import { app, translate } from "../app"


export function Article() {

  let { id } = useParams()

  const a: ZendeskArticle = app.data.zendesk.articles[id]

  if (!a) {
    return <div>Article {id} not found</div>
  }


  const title = translate(a.name)
  const body = translate(a.description)

  return <div className={`py-16 w-full flex justify-center text-black bg-white h-full overflow-y-auto`}>
    <div className="sm:w-full px-4 md:w-2/3">
      <h1>{title}</h1>
      {a && <div className="service mt-10" dangerouslySetInnerHTML={{ __html: body }} />}
    </div>
  </div>

}
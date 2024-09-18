import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { app } from "../app"
import { languages } from "../locale"
import { Loader } from "./loader"

export function Redirect() {
    const navigate = useNavigate()
    const { sectionid } = useParams()
    const locale = languages[app.locale]?.zendesk as string ?? app.locale
    const sections = Object.values(app.data.zendesk.sections)

    useEffect(() => {
        if (sections.length) {
            const section = sections.find(x => x.id === +sectionid)
            if (section) {
                navigate(`/${locale.toLowerCase()}/categories/${section.category}/${section.id}`)
            } else {
                navigate('/404')
            }
        }
    }, [sections, locale, navigate])

    return (
        <div className="flex overflow-y-scroll flex-col">
            <div className="mt-10">
                <Loader size={72} width={12} />
            </div>
        </div>
    );
}

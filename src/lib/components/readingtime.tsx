import React, { useMemo } from "react";
import { translate } from "../app"


interface ReadTimeProps {
    content: string;
}


export function ReadTime ({content }: ReadTimeProps) {
    const readTime = useMemo(() => {
        const wordCount = countWords(content);
        const minutes = Math.ceil(wordCount / 300);
    return formatReadTimeText(minutes);
    }, [content]);

    return <span className="text-sm font-bold">{readTime}</span>
}

function countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, '');
    return text.trim().split(/\s+/).length;
}

function formatReadTimeText(minutes: number): string {
    return translate({
        "en-US": `${minutes} min read`,
         "ar-SA": `${minutes} دقيقة قراءة`,
         "fr-FR": `${minutes} min de lecture`,
         "de-DE": `${minutes} min Lesezeit`,
         "es-ES": `${minutes} min de lectura`,
    })
}

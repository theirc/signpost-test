import React, {createContext, useContext, ReactNode} from 'react'
import {Helmet} from 'react-helmet'

interface MetaTagsContextProps {
    title: string;
    description: string;
    image: string;
    url: string;
}

const MetaTagsContext = createContext<MetaTagsContextProps | undefined>(undefined);

export const MetaTagsProvider = ({children, metaTags}: {children: ReactNode, metaTags: MetaTagsContextProps}) => {
    return(
        <MetaTagsContext.Provider value={metaTags}>
            <Helmet>
                <title>{metaTags.title}</title>
                <link rel='cannical' href={metaTags.url}/>
                <meta property='og:title' content={metaTags.title} />
                <meta property='og:description' content={metaTags.description} />
                <meta property='og:image' content={metaTags.image} />
                <meta property='og:url' content={metaTags.url} />
                <meta property='og:type' content='website' />
                <meta name='twitter:card' content='summary_large_image'/>
                <meta name='twitter:title' content={metaTags.title} />
                <meta name='twitter:description' content={metaTags.description} />
                <meta name='twitter:image' content={metaTags.image} />
            </Helmet>
            {children}
        </MetaTagsContext.Provider>

    )
}

export const useMetaTags =() => {
    const context = useContext(MetaTagsContext);
    if(!context) {
        throw new Error('useMetaTags must be used within a metagsprovider')
    }
    return context
}
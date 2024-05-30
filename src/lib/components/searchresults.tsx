import { useNavigate, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { Input, Pagination, Tabs, Typography, type TabsProps } from 'antd';
import { app, translate } from "../app";
import { useState } from "react";

const { Text, Title, Paragraph } = Typography;
const { Search } = Input;

export function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const navigate = useNavigate()

    const paramValue = searchParams.get('query');
    const articles: ZendeskArticle[] = Object.values(app.data.zendesk.articles);
    const services = Object.values(app.data.services).filter(
        (x) => x.status !== "archived"
    );

    const isZendeskArticle = (object: any): object is ZendeskArticle =>
        'section' in object || 'category' in object;


    const flattenZendeskData = (data: ZendeskArticle[]) => {
        return data.flatMap(item => {
            const nameEntries = Object.entries(item.name).map(([lang, text]) => ({
                id: item.id,
                section: item.section,
                category: item.category,
                lang,
                type: 'name',
                text,
            }));

            const descriptionEntries = Object.entries(item.description).map(([lang, text]) => ({
                id: item.id,
                section: item.section,
                category: item.category,
                lang,
                type: 'description',
                text,
            }));

            return [...nameEntries, ...descriptionEntries];
        });
    }

    const flattenServiceData = (data: Service[]) => {
        return data.flatMap(item => {
            const nameEntries = item?.name ? Object.entries(item?.name).map(([lang, text]) => ({
                id: item.id,
                status: item.status,
                lang,
                type: 'name',
                text,
            })) : [];

            const descriptionEntries = item?.description ? Object.entries(item.description).map(([lang, text]) => ({
                id: item.id,
                status: item.status,
                lang,
                type: 'description',
                text,
            })) : [];

            const otherProperties = {
                date_created: item.date_created,
                hasLocation: item.hasLocation,
                address: item.address,
                location: item.location,
                provider: item.provider,
                region: item.region,
                city: item.city,
                contactName: item.contactName,
                contactLastName: item.contactLastName,
                contactTitle: item.contactTitle,
                contactEmail: item.contactEmail,
                contactPhone: item.contactPhone,
                contactInfo: item.contactInfo,
                addHours: item.addHours,
                categories: item.categories,
                subcategories: item.subcategories,
                Accessibility: item.Accessibility,
                Populations: item.Populations,
            };

            const combinedEntries = [...nameEntries, ...descriptionEntries].map(entry => ({
                ...entry,
                ...otherProperties,
            }));

            return combinedEntries;
        });
    }

    const options = {
        includeMatches: true,
        keys: ['text', 'address', 'city', 'contactInfo.contact_details', 'description', 'name', 'region', 'id'],
        shouldSort: true,
        customSortFn: (a, b) => {
            return a.score - b.score;
        }
    }
    const articleSearch = new Fuse(flattenZendeskData(articles), options)
    const articleSearchResult = articleSearch.search(paramValue || '').map(result => result.item)
    const uniqueArticlesIds = [...new Set(articleSearchResult.map(result => result.id))];
    const aggregatedArticlesResults = uniqueArticlesIds.map(id => articles.find(item => item.id === id));
    const serviceSearch = new Fuse(flattenServiceData(services), options)
    const serviceSearchResult = serviceSearch.search(paramValue || '').map(result => result.item)
    const uniqueServicesIds = [...new Set(serviceSearchResult.map(result => result.id))];
    const aggregatedServicesResults = uniqueServicesIds.map(id => services.find(item => item.id === id));

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleTabChange = () => {
        setCurrentPage(1);
    };

    const formatContent = (description: string) => {
        const decodeHtmlEntities = (str: string) => {
            const element = document.createElement('div');
            if (str) {
                element.innerHTML = str;
                return element.textContent || element.innerText || "";
            }
            return "";
        };
        const textOnly = description.replace(/<\/?[^>]+(>|$)/g, "");
        const decodedText = decodeHtmlEntities(textOnly);
        const truncatedText = decodedText.slice(0, 200);
        return decodedText.length > 200 ? `${truncatedText}...` : decodedText;
    }

    const getTabItem = (hits: ZendeskArticle[] | Service[]) => {
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = currentPage * pageSize;
        const paginatedHits = hits.slice(startIdx, endIdx);

        return (
            <>
                <Paragraph className='mt-2'>
                    {hits.length > 0 ? <Text type="secondary">
                        {hits.length} results for {paramValue}
                    </Text> : <Text type="secondary">
                        No results to display
                    </Text>}
                </Paragraph>
                <div>
                    {paginatedHits.map((hit: ZendeskArticle | Service) => (
                        <Paragraph key={`${hit.id}-${hit.name}`}>
                            <a
                                href={`${isZendeskArticle(hit)
                                    ? `/article/${hit.id}`
                                    : `/service/${hit.id}`
                                    }`}
                            >
                                <Title level={5}>{translate(hit.name)}</Title>
                                <Text type="secondary">{formatContent(translate(hit.description))}</Text>
                            </a>
                            <hr className="divider" />
                        </Paragraph>
                    ))}
                </div>
                <div className="my-16 text-center">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={hits.length}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </div>
            </>
        );
    }


    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'All search results',
            children: getTabItem([...aggregatedArticlesResults, ...aggregatedServicesResults]),
        },
        {
            key: '2',
            label: 'Information results',
            children: getTabItem(aggregatedArticlesResults),
        },
        {
            key: '3',
            label: 'Service results',
            children: getTabItem(aggregatedServicesResults),
        },
    ];

    const handleSearch = (value: string) => {
        setCurrentPage(1)
        navigate(`/search-results?query=${value}`)
    }

    return (
        <div className="w-full flex flex-wrap justify-center text-black bg-white overflow-y-auto h-full">
            <div className="w-full px-4 md:w-2/3 py-16">
                <div>
                    <Search
                        placeholder="input search text"
                        allowClear
                        enterButton="Search"
                        size="large"
                        onSearch={handleSearch}
                        defaultValue={paramValue}
                    />
                </div>
                <div>
                    <Tabs defaultActiveKey="1" items={items} onChange={handleTabChange} />
                </div>
            </div>
        </div>
    )
}

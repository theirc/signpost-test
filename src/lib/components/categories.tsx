import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { app, translate } from "../app";
import { ReadTime } from "./readingtime";
import { Button, Input, Pagination, Tag, Card, Empty, Breadcrumb } from "antd";
import { useState, useEffect, useCallback, useMemo } from "react";
import { RightOutlined } from "@ant-design/icons";
import Fuse from "fuse.js";

const { Search } = Input;

const allOption = {
  description: {}, id: 0, name: {
    "ar-SA": "All",
    "fa-FA": "All",
    "fr-FR": "All",
    "uk-UK": "All",
    "ur-UR": "All",
    "en-US": "All"
  }
};

export function Categories() {
  const navigate = useNavigate();
  const { id, sectionid } = useParams();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<ZendeskArticle[]>([]);
  const [paginatedArticles, setPaginatedArticles] = useState<ZendeskArticle[]>([]);
  const [initialized, setInitialized] = useState(false);
  const pageSize = 12;


  const c = app.data.zendesk.categories[id];
  const s = app.data.zendesk.sections[sectionid];

  const categories: ZendeskCategory[] = useMemo(() => {
    const cat = Object.values(app.data.zendesk.categories)
    cat.unshift(allOption)
    return cat
  }, [c, id, initialized]);

  let categorySections: ZendeskSection[] = useMemo(() => {
    if (c) {
      const sections = Object.values(c.sections);
      sections.unshift(allOption);
      return sections;
    }
    return [allOption];
  }, [c, allOption]);

  const a = useMemo(() => Object.values(app.data.zendesk.articles), [initialized]);

  const filterArticles = useCallback(() => {
    if (c) {
      if (s) {
        return a.filter(article => article.section === s.id && translate(article.name));
      } else {
        return a.filter(article => article.category === c.id && translate(article.name));
      }
    } else {
      return a;
    }
  }, [a, c, s]);

  const stripHtmlTags = (html) => {
    const regex = /<[^>]*>|&[^;]+;|<img\s+.*?>|<span\s+style="[^"]*">.*?<\/span>|&[A-Za-z]+;/g;
    return html.replace(regex, '');
  };

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
  };

  const performSearch = useCallback((articles) => {
    const options = {
      includeMatches: true,
      keys: ['text'],
      shouldSort: true,
      customSortFn: (a, b) => a.score - b.score,
    };
    const articleSearch = new Fuse(flattenZendeskData(articles), options);
    const articleSearchResult = articleSearch.search(searchTerm || '').map(result => result.item);
    const uniqueArticlesIds = [...new Set(articleSearchResult.map(result => result.id))];
    return uniqueArticlesIds.map(id => articles.find(item => item.id === id));
  }, [searchTerm]);

  useEffect(() => {
    const articles = filterArticles()
    if (searchTerm) {
      const searchResults = performSearch(articles)
      setFilteredArticles(searchResults)
    } else {
      setFilteredArticles(articles)
    }
    setCurrentPage(1)
  }, [id, sectionid, searchTerm, filterArticles, performSearch])

  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedArticles(filteredArticles.slice(startIndex, endIndex))
  }, [filteredArticles, currentPage])

  useEffect(() => {
    if(Object.values(app.data.zendesk.categories).length) {
      setInitialized(true)
    }
  }, [app.data.zendesk.categories]);

  return (
    <div className="flex overflow-y-scroll flex-col">
      <div className="text-white flex justify-center bg-[#163020]">
        <div className="sm:w-full px-4 py-20 md:w-4/5 flex flex-col lg:flex-row lg:gap-16">
          <div className="flex-1 mb-20 lg:mb-0 text-6xl font-bold">Resource Center</div>
          <div className="flex flex-1 gap-4 lg:gap-x-8 flex-col lg:flex-row">
            <div>
              <span className="material-icons text-5xl">lightbulb</span>
              <p className="text-xl font-bold">Essential Guides and How-Tos</p>
              <p className="text-base">Access our carefully curated guides and how-to articles that provide practical advice and step-by-step instructions tailored for refugees navigating life in Greece</p>
            </div>
            <div>
              <span className="material-icons text-5xl">list_alt</span>
              <p className="text-xl font-bold">Comprehensive Information</p>
              <p className="text-base">Find comprehensive resources on various categories and topics, helping refugees in Greece understand their legal status and access crucial support services.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="py-16 w-full flex justify-center text-black bg-white h-auto">
        <div className="sm:w-full px-4 md:w-4/5 h-fit">
        <Breadcrumb className="mb-8" separator=">" items={[{title: <a href="/">{t('home')}</a>}, {title: "Resource Center"}]} />
          <div className="bg-[#F7F7F7] px-4 pb-4 pt-[1px] mb-4">
            <h1>{t('category')}</h1>
            <div className="flex gap-4 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category.id}
                  className={`category-filter-button ${category.id === +id || (category.id === 0 && !id) ? 'active' : ''}`}
                  onClick={() => category.id === 0 ? navigate(`/categories/`) : navigate(`/categories/${category.id}/`)}
                >
                  {translate(category.name)}
                </Button>
              ))}
            </div>
          </div>
          <div className="bg-[#F7F7F7] px-4 pb-4 pt-[1px]">
            <h1>{t('topic')}</h1>
            <div className="flex gap-4 flex-wrap">
              {categorySections.map(section => (
                <Button
                  key={section.id}
                  className={`category-filter-button ${section.id === +sectionid || (section.id === 0 && !sectionid) ? 'active' : ''}`}
                  onClick={() => !c ? navigate('/categories/') : section.id === 0 ? navigate(`/categories/${c.id}/`) : navigate(`/categories/${c.id}/${section.id}/`)}
                >
                  {translate(section.name)}
                </Button>
              ))}
            </div>
          </div>
          <div className="my-12">
            <Search
              placeholder={t('search for information')}
              allowClear
              size="large"
              className="lg:w-2/5"
              onSearch={(value) => setSearchTerm(value)}
            />
          </div>
          <div className={`${paginatedArticles.length ? 'grid lg:grid-cols-4 md:grid-cols-3 gap-6 mt-10' : ''}`}>
            {paginatedArticles?.length ? paginatedArticles.map(article => (
              <Card key={article.id} className="articles-card">
                <Tag color="green">{translate(categories.find(category => category.id === article.category)?.name)}</Tag>
                <ReadTime content={translate(article.description)}/>
                <h3>{translate(article.name)}</h3>
                <p>{`${stripHtmlTags(translate(article.description))?.slice(0, 100)}...`}</p>
                <p>{new Date(article.updated_at).toLocaleDateString('en-GB')}</p>
                <Link to={`/article/${article.id}`} className="text-black underline hover:underline">
                  <strong>{t('read more')} <RightOutlined /></strong>
                </Link>
              </Card>
            )) : <Empty />}
          </div>
          <Pagination
            className="my-10 text-center"
            current={currentPage}
            pageSize={pageSize}
            total={filteredArticles.length}
            onChange={page => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      </div>
    </div>
  );
}

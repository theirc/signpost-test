import { useNavigate, useParams } from "react-router-dom";
import { app, translate } from "../app";
import TopicWithArticles from "./topic-with-articles";

export function Categories() {
  const navigate = useNavigate();

  let { id } = useParams();

  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );
  const c: ZendeskCategory = app.data.zendesk.categories[id];

  if (!c) {
    return <div>Category {id} not found</div>;
  }

  const s: ZendeskSection[] = Object.values(app.data.zendesk.sections).filter(
    (x) => x.category === c.id
  );
  const a: ZendeskArticle[] = Object.values(app.data.zendesk.articles);
  const sections = s.map((section) => {
    const articles = a
      .filter((x) => x.section === section.id)
      .map((x) => {
        return {
          id: x.id,
          title: translate(x.name),
          lastEdit: {
            label: "lastupdatedLabel",
            value: x.updated_at,
          },
        };
      });

    return { id: section.id, name: translate(section.name), articles };
  });

  const categoryItems = Object.values(categories)?.map((category) => {
    return {
      name: translate(category.name),
      value: category.id,
      iconName: "help_outline",
      link: `/categories/${category.id}`,
    };
  });

  return (
    <div
      className={`py-16 w-full flex justify-center text-black bg-white h-full overflow-y-auto`}
    >
      <div className="sm:w-full px-4 md:w-2/3">
        <TopicWithArticles
          topicId={c.id}
          topicItems={categoryItems}
          sections={sections}
          selectTopicLabel={"selectTopicLabel"}
          onSelectChange={(val) => {
            navigate(`/categories/${val}`);
          }}
        />
      </div>
    </div>
  );
}

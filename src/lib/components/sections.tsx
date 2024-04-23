import { useNavigate, useParams } from "react-router-dom";
import { app, translate } from "../app";
import TopicWithArticles from "./topic-with-articles";

export function Sections() {
  const navigate = useNavigate();

  let { id } = useParams();

  const sections: ZendeskSection[] = Object.values(app.data.zendesk.sections);
  const s: ZendeskSection = app.data.zendesk.sections[id];

  if (!s) {
    return <div>Section {id} not found</div>;
  }
  const a: ZendeskArticle[] = Object.values(app.data.zendesk.articles);
  const articles = a
    .filter((x) => x.section === s.id)
    .map((x) => {
      return {
        id: x.id,
        title: translate(x.name),
      };
    });
  const section = { id: s.id, name: translate(s.name), articles };

  const sectionItems = Object.values(sections)?.map((section) => {
    return {
      name: translate(section.name),
      value: section.id,
      iconName: "help_outline",
      link: `/sections/${section.id}`,
    };
  });

  return (
    <div
      className={`py-16 w-full flex justify-center text-black bg-white h-full overflow-y-auto`}
    >
      <div className="sm:w-full px-4 md:w-2/3">
        <TopicWithArticles
          topicId={s.id}
          topicItems={sectionItems}
          sections={[section]}
          selectTopicLabel={"selectTopicLabel"}
          onSelectChange={(val) => {
            navigate(`/sections/${val}`);
          }}
        />
      </div>
    </div>
  );
}

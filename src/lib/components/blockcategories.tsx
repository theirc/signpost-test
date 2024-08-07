import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props;
  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );

  return (
    <Container block={block}>
      <h1 className="text-4xl font-normal pt-0 mt-0">{translate(block.title)} </h1>
      <h2 className="text-2xl font-medium">
        {translate(block.subtitle)}{" "}
      </h2>
        <HomePageCards
          cards={categories?.map((category) => {
            return {
              title: translate(category.name),
              subtitle: translate(category.description),
              iconName: category.icon,
              href: `/categories/${category.id}`,
            };
          })}
        />
    </Container>
  );
}

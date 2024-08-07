import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";
import { languages } from "../locale"

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props;
  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );

  const isRTL = languages[app.locale]?.rtl;

  return (
    <Container block={block} className={isRTL ? 'rtl' : ''}>
      <h1 className={isRTL ? 'text-right' : 'text-left'}>{translate(block.title)} </h1>
      <h2 className={isRTL ? 'text-right' : 'text-left'}>
        {translate(block.subtitle)}
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

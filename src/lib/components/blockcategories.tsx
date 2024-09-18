import { app, translate } from "../app";
import { Container } from "./container";
import HomePageCards from "./home-page-cards";
import { languages } from "../locale"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

const colors = [ '#D8BB41', '#CC8723', '#2C6040', '#609292', '#31437C', '#563077', '#575757' ]

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props;
  useAnimateOnScroll();
  const locale = languages[app.locale]?.zendesk as string ?? app.locale

  const categories: ZendeskCategory[] = Object.values(
    app.data.zendesk.categories
  );
  
  const isRTL = languages[app.locale]?.rtl;

  return (
    <Container block={block} className={isRTL ? 'rtl' : ''}>
      <h1 className={`fade-up-0 text-4xl font-normal leading-snug ${isRTL ? 'text-right' : 'text-left'}`}
      data-animation="animate__fadeInUp">{translate(block.title)} </h1>
      <h2 className={`fade-up-1 text-3xl font-medium leading-normal ${isRTL ? 'text-right' : 'text-left'}`}
      data-animation="animate__fadeInUp">
        {translate(block.subtitle)}
      </h2>
      <div className="fade-up-2"
      data-animation="animate__fadeInUp">
        <HomePageCards
          cards={categories?.map((category, index) => {
            return {
              title: translate(category.name),
              subtitle: translate(category.description),
              iconName: category.icon,
              href: `/${locale.toLowerCase()}/categories/${category.id}`,
              color: colors[index % colors.length]
            };
          })}
        />
        </div>
    </Container>
  );
}

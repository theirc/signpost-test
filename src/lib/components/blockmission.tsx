import { CSSProperties } from "react"
import { useNavigate } from "react-router-dom";
import { languages } from "../locale"
import { Button} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { app, translate } from "../app"
import { Container } from "./container"
import Search from "antd/es/input/Search";
import { translations } from "../../translations";
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockMission(props: { block: BlockMission}) {
  const { block } = props
  const navigate = useNavigate();
  const isRTL = languages[app.locale]?.rtl;
  useAnimateOnScroll();


  const handleSearch = (value: string) => {
      navigate(`/search-results?query=${value}`);
  };

  return <Container block={block}>
    <div className="py-12 px-4 max-w-4xl mx-auto container-center">
    <h1 className={`fade-up-0 font-normal mission-heading ${isRTL ? 'text-right' : 'text-left'}`}          
    data-animation="animate__fadeInUp">{translate(block.title)}</h1>
    <div className={`header-search-input fade-up-1 ${isRTL ? 'rtl' : ''}`}
  data-animation="animate__fadeInUp">
 <Search
  placeholder={translate(translations.searchForInformation)}
  enterButton={<Button type="primary" icon={<SearchOutlined />}>{translate(translations.search)}</Button>}
  size="large"
  onSearch={handleSearch}
/>
</div>
   </div>
  </Container>
} 
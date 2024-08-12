import { translate } from "../app"
import { Container } from "./container"

const IMAGE_BASE_URL = "https://signpostdirectus.file.core.windows.net/uploads/";
const IMAGE_QUERY_PARAMS = "sv=2022-11-02&ss=f&srt=sco&sp=rl&se=2026-08-01T00:42:50Z&st=2024-07-24T16:42:50Z&spr=https&sig=5biYblkoUN9mmjiEwdKihbOOtH%2FmcpVXYrHRGH%2BFJ8s%3D";

export function BlockImage(props: { block: BlockImage }) {
  const { block } = props

  const getImageUrl = (filename: string) => {
    if (!filename) return '';
    const filenameWithExtension = filename.includes('.') ? filename : `${filename}.png`;
    const url = `${IMAGE_BASE_URL}${filenameWithExtension}?${IMAGE_QUERY_PARAMS}`;
    return url;
  };

  return <Container block={block}>
    <div className="image-container">
    <img 
        src={getImageUrl(props.block.image)}
        />
        </div>
  </Container>

}
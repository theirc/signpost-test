import { Card, Typography } from "antd";
import { languages } from "../locale"
import { app, translate } from "../app";
import React from "react";
import { Link } from "react-router-dom";


const { Title, Text } = Typography;

export interface CardsProps {
  title: string;
  subtitle: string;
  iconName: string;
  href: string | (() => void);
  passHref?: boolean;
  target?: "_blank" | "_self" | "_parent" | "_top";
  color: string;
}

export interface HomePageCards {
  cards: CardsProps[];
}

function Cards({
  title,
  subtitle,
  iconName,
  href,
  target,
  color,
}: CardsProps) {
  const isRTL = languages[app.locale]?.rtl;

  const cardStyle = {
    backgroundColor: color,
    transition: 'background-color 0.3s, color 0.3s',
  }

  const cardContent = (
    <Card hoverable style={cardStyle} className="home-page-card">
      <Card.Meta
        avatar={<span className="material-icons card-icon">{iconName}</span>}
        title={
          <Title level={1} className={`card-title ${isRTL ? 'text-right' : 'text-left'}`}>
            {title}
          </Title>
        }
        description={<Text type="secondary" className={isRTL ? 'text-right' : 'text-left'}>{subtitle}</Text>}
      />
    </Card>
  );

  return typeof href === "string" ? (
    <Link to={href} tabIndex={0} target={target} className="card-wrapper">
      {cardContent}
    </Link>
  ) : (
    <div
      className="card-wrapper"
      tabIndex={0}
      onClick={href}
      onKeyDown={(e) => {
        if (e.key === "Enter") href();
      }}
    >
      {cardContent}
    </div>
  );
}

export default function HomePageCards({
  cards,
}: HomePageCards) {
  return (
    <div className="card-list-wrapper">
      {cards.map((c) => (
        <Cards key={c.title} {...c} />
      ))}
    </div>
  );
}

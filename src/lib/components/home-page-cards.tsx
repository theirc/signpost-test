import { Card, Typography } from "antd";
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
}: CardsProps) {
  const cardContent = (
    <Card hoverable className="home-page-card">
      <Card.Meta
        avatar={<span className="material-icons card-icon">{iconName}</span>}
        title={
          <Title level={4} className="card-title">
            {title}
          </Title>
        }
        description={<Text type="secondary">{subtitle}</Text>}
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

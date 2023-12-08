import { Affix, Layout as AntLayout, ConfigProvider } from 'antd';
import type { DirectionType } from 'antd/lib/config-provider/context';
import React from 'react';

import Header, { HeaderProps } from './header';

interface LayoutProps {
  // The children to be placed inside of this layout.
  children: React.ReactNode;
  // The header's props.
  headerProps: HeaderProps;
  // The direction of the layout.
  layoutDirection?: DirectionType;
  // The footer component.
  footerComponent?: JSX.Element;
  // The sticky cookie banner.
  cookieBanner?: React.ReactNode;
  // Whether to apply padding to main content.
  disableMainPadding?: boolean;
}

/** The layout that will be used on every page of the website.
 * The current page's main content will be placed inside of this layout.
 */
export default function Layout({
  children,
  headerProps,
  layoutDirection,
  footerComponent,
  cookieBanner,
  disableMainPadding,
}: LayoutProps) {
  return (
    <ConfigProvider direction={layoutDirection}>
      <AntLayout style={{ backgroundColor: 'transparent', height: '100%' }}>
        <Affix offsetTop={0}>
          <AntLayout.Header className={'content-wrapper header-wrapper'}>
            <div className={'content content--padding'}>
              <Header {...headerProps} />
            </div>
          </AntLayout.Header>
        </Affix>
        <AntLayout.Content className={'content-wrapper'}>
          <div
            className={
              'content' + (disableMainPadding ? '' : ' content--padding')
            }
          >
            {children}
          </div>
        </AntLayout.Content>
        {cookieBanner && (
          <div className={'content content--padding'}>{cookieBanner}</div>
        )}
        <AntLayout.Footer className={'content-wrapper'}>
          <div className={'content content--padding'}>{footerComponent}</div>
        </AntLayout.Footer>
      </AntLayout>
    </ConfigProvider>
  );
}

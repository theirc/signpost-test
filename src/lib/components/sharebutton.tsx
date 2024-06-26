import { ShareAltOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { Button, Dropdown, notification } from 'antd';
import {
  FacebookIcon,
  FacebookShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from 'react-share';
import React, { useEffect, useState } from 'react';

export interface ShareButtonProps {
  label: string;
  notificationText: string;
  linkShareButton: string;
}
export default function ShareButton() {
  const [url, setUrl] = useState('');

  const menu = (
    <Menu className='test-menu'>
      <Menu.Item key="1" className='menu-item-button'>
        <FacebookShareButton url={url}>
          <FacebookIcon size={20} round className='menu-item-icon' />
          Facebook
        </FacebookShareButton>
      </Menu.Item>
      <Menu.Item key="2" className='menu-item-button'>
        <TwitterShareButton url={url}>
          <TwitterIcon size={20} round className='menu-item-icon' />
          Twitter
        </TwitterShareButton>
      </Menu.Item>
      <Menu.Item key="3" className='menu-item-button'>
        <WhatsappShareButton url={url}>
          <WhatsappIcon size={20} round className='menu-item-icon' />
          Whatsapp
        </WhatsappShareButton>
      </Menu.Item>
      <Menu.Item key="4" className='menu-item-button'>
        <button onClick={openShareOptions}>
          <i className='fa-solid fa-link menu-item-icon' /> Shareable Link
        </button>
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function openShareOptions() {
    if (navigator.canShare?.({ url })) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      notification['success']({
        message: 'Link copied!',
        duration: 2,
      });
    }
  }

  return (
    <Dropdown overlay={menu} className='ml-auto h-auto py-1 border-2 border-solid border-black rounded-[10px]'>
      <Button
        size="small"
        icon={<ShareAltOutlined />}
        style={{ width: '100px' }}
      >
        Share
      </Button>
    </Dropdown>
  );
}

/* eslint no-var: 0 */

import { Typography } from 'antd';
import React, { useLayoutEffect, useState } from 'react';

const { Text } = Typography;

interface TextReaderProps {
  currentLocale?: string;
}

//Interface definition
interface IReadSpeaker {
  ui: {
    addClickEvents: () => void;
    getActivePlayer: () => { show: () => void; close: () => void };
  };
  p: (cb: (...args: any) => any) => void;
  q: (cb: (...args: any) => any) => void;
  init: () => void;
}

declare var ReadSpeaker: IReadSpeaker;

function TextReader({ currentLocale }: TextReaderProps) {
  const [showTextReader, setShowTextReader] = useState(true);
  const [url, setUrl] = useState('');
  const [lang, setLang] = useState('');

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      ReadSpeaker.p(function () {
        ReadSpeaker.init();
      });
    }

    switch (currentLocale) {
      case 'ar':
        setLang('ar_ar');
        setShowTextReader(true);
        break;
      case 'cs':
        setLang('cs_cz');
        setShowTextReader(true);
        break;
      case 'en-us':
        setLang('en_us');
        setShowTextReader(true);
        break;
      case 'es':
        setLang('es_mx');
        setShowTextReader(true);
        break;
      case 'fa':
        setLang('fa_ir');
        setShowTextReader(true);
        break;
      case 'fr':
        setLang('fr_be');
        setShowTextReader(true);
        break;
      case 'hu':
        setLang('hu_hu');
        setShowTextReader(true);
        break;
      case 'pl':
        setLang('pl_pl');
        setShowTextReader(true);
        break;
      case 'ru':
        setLang('ru_ru');
        setShowTextReader(true);
        break;
      case 'uk':
        setLang('uk_ua');
        setShowTextReader(true);
        break;
      default:
        setShowTextReader(true);
        break;
    }

    ReadSpeaker.q(function () {
      ReadSpeaker.ui.addClickEvents();
    });
    setUrl(encodeURIComponent(window.location.href));

    return () => {
      ReadSpeaker.q(function () {
        if (ReadSpeaker.ui && ReadSpeaker.ui.getActivePlayer()) {
          ReadSpeaker.ui.getActivePlayer().close();
        }
      });
    };
  }, [currentLocale]);

  return (
    <div className="readspeaker-container">
      {showTextReader && (
        <div
          id="readspeaker_button1"
          className="rs_skip rsbtn rs_preserve m-0"
        >
          <a
            rel="nofollow"
            className="rsbtn_play readspeaker"
            title="ReadSpeaker webReader إستمع إلى هذه الصفحةِ مستخدماً"
            href={`https://app-eu.readspeaker.com/cgi-bin/rsent?customerid=11950&amp;lang=${lang}&amp;readid=main-content&amp;url=${url}`}
          >
            <span className="rsbtn_left rsimg rspart">
              <span className="rsbtn_text">
                <Text type="secondary">Listen</Text>
              </span>
            </span>
            <span className="rsbtn_right rsimg rsplay rspart"></span>
          </a>
        </div>
      )}
    </div>
  );
}

export default TextReader;

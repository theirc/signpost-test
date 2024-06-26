import { useState, useRef, useEffect } from 'react';

import MegaMenu from './megamenu';
import { CloseOutlined } from '@ant-design/icons';

const MobileNavigationDrawer = ({
  isDrawerOpen,
  setIsDrawerOpen,
  drawerButtonRef,
  menuData
}) => {
  const [clicked, setClicked] = useState(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isDrawerOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isDrawerOpen]);

  const handleToggle = (index) => {
    if (clicked === index) {
      return setClicked(null);
    }

    setClicked(index);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsDrawerOpen(false);
      if (drawerButtonRef.current) {
        drawerButtonRef.current.focus();
      }
    }
  };

  return (
    <div
      className="mobile_navigation"
      ref={drawerRef}
      tabIndex={isDrawerOpen ? 0 : -1}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`drawer_content ${isDrawerOpen ? 'active' : ''}`}
      >
        <div className="close_drawer py-2">
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              if (drawerButtonRef.current) {
                drawerButtonRef.current.focus();
              }
            }}
          >
            <CloseOutlined className='text-2xl' />
          </button>
        </div>
        <div>
          <MegaMenu
            handleToggle={handleToggle}
            clicked={clicked}
            setIsDrawerOpen={setIsDrawerOpen}
            menuData={menuData}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileNavigationDrawer;
import { Avatar, Select, Space, Typography } from 'antd';
import type { SizeType } from 'antd/lib/config-provider/SizeContext';
import { LabeledValue } from 'antd/lib/select';
import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

const { Option } = Select;

/* Interface for select menu item. */
export interface MenuItem {
  name: string;
  value: any;
  iconName?: string;
  link?: string;
  iconColor?: string;
  category?: number;
}

export type IconType = 'filled' | 'outlined' | 'fontAwesome';

interface OptionLabelProps {
  item: MenuItem;
  showIcon: boolean;
  iconType?: IconType;
}

function renderIcon(item: MenuItem, iconType?: IconType) {
  if (iconType === 'fontAwesome') {
    return (
      <i
        className={`fa fa-${item.iconName}`}
        style={{ color: item.iconColor }}
      />
    );
  } else {
    return (
      <span
        className={`${
          iconType === 'outlined' ? 'material-icons-outlined' : 'material-icons'
        } select__optionIcon`}
      >
        {item.iconName}
      </span>
    );
  }
}

function OptionLabel({ item, showIcon, iconType }: OptionLabelProps) {
  return (
    <span className="select__option--verticalCenter">
      {showIcon && (
        <Avatar
          shape="square"
          size="small"
          style={{ background: 'transparent' }}
          icon={renderIcon(item, iconType)}
        />
      )}
      <span className="select__optionText--shiftInlineStart">{item.name}</span>
    </span>
  );
}

interface SelectMenuProps {
  // Label to be displayed above select menu.
  label: string;
  // Items representing all select options.
  items: MenuItem[];
  // Whether to show a prefix icon on every option.
  // If true, the material icon name is expected to be present in MenuItem.
  showIcon: boolean;
  // Material icon type, defaults to filled.
  iconType?: IconType;
  // On select change action.
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  onSelectChange?: (newValue: any) => void;
  // On change action.
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  onChange?: (newValue: any) => void;
  // Initial value of select menu.
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  initialValue?: any;
  // Select menu size.
  size?: SizeType;
  // Whether an input is required.
  required?: boolean;
  // Whether to show an error message for select input.
  showError?: boolean;
  // The error message to be displayed if showError is true.
  invalidMessage?: string;
  // Class of the top level element.
  className?: string;
  // Styles to be applied to the top level element of select menu component.
  style?: CSSProperties;
  // If true the size of select menu will shrink on tablet size, defaults to true.
  shrinkOnTablet?: boolean;
  // value of select menu.
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  value?: any;
  // Text to display if there's no options to select and the select is disabled
  disabledMessage?: string;
}

/* Select menu component with its menu items. */
export default function SelectMenu({
  label,
  items,
  showIcon,
  iconType,
  onSelectChange,
  initialValue,
  size,
  required,
  showError,
  invalidMessage,
  className,
  style,
  shrinkOnTablet,
  value,
  onChange,
  disabledMessage,
}: SelectMenuProps) {
  const preselectedItem = items.find((i) => i.value === initialValue);
  const newValue = items.find((i) => i.value === value);
  const setSelectMaxWidth = shrinkOnTablet ?? true;

  function menuItemToLabeledValue(
    item: MenuItem,
    showIcon: boolean
  ): LabeledValue {
    return {
      value: item.value,
      label: OptionLabel({ item, showIcon, iconType }),
    };
  }

  return (
    <Space
      direction="vertical"
      style={{ display: 'flex', ...style }}
      className={className}
    >
      <div>
        {label}
        {required && '*'}
      </div>
      <Select
        placeholder={disabledMessage && !items.length ? disabledMessage : label}
        onSelect={onSelectChange}
        defaultValue={
          preselectedItem
            ? menuItemToLabeledValue(preselectedItem, showIcon)
            : undefined
        }
        value={
          newValue ? menuItemToLabeledValue(newValue, showIcon) : undefined
        }
        size={size}
        className={`select ${
          setSelectMaxWidth ? 'select--tabletMaxWidth' : ''
        }`}
        optionLabelProp="label"
        onChange={onChange}
        disabled={!items.length}
      >
        {items.map((menuItem) => (
          <Option
            value={menuItem.value}
            key={menuItem.value}
            className="select__option--verticalCenter select__optionLink--padding"
            label={
              <OptionLabel
                item={menuItem}
                showIcon={showIcon}
                iconType={iconType}
              />
            }
          >
            {menuItem.link ? (
              <Link to={menuItem.link} className='select__option--verticalCenter'>
                  <OptionLabel
                    item={menuItem}
                    showIcon={showIcon}
                    iconType={iconType}
                  />
              </Link>
            ) : (
              <OptionLabel
                item={menuItem}
                showIcon={showIcon}
                iconType={iconType}
              />
            )}
          </Option>
        ))}
      </Select>
      {showError && (
        <Typography.Text style={{ display: 'block' }} type="danger">
          {invalidMessage}
        </Typography.Text>
      )}
    </Space>
  );
}

import { Cascader, Typography } from 'antd';
import { DefaultOptionType } from 'antd/lib/cascader';
import type { SizeType } from 'antd/lib/config-provider/SizeContext';
import React, { CSSProperties } from 'react';

/* Interface for tree select item. */
export interface MenuItem {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
  // Determines if this is a leaf node(effective when `loadData` is specified).
  // `false` will force trade TreeNode as a parent node.
  // Show expand icon even if the current node has no children.
  isLeaf?: boolean;
}

export type IconType = 'filled' | 'outlined' | 'fontAwesome';

interface TreeSelectProps {
  // Label to be displayed above tree select.
  label: string;
  // Items representing all select options.
  items: MenuItem[];
  // Items representing all tag options.
  tagItems?: MenuItem[];
  // On change action.
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  onChange: (newValue: any, selectedOptions: any) => void;
  // tree select size.
  size?: SizeType;
  // Whether an input is required.
  required?: boolean;
  // Whether to show an error message for select input.
  showError?: boolean;
  // The error message to be displayed if showError is true.
  invalidMessage?: string;
  // Class of the top level element.
  className?: string;
  // Styles to be applied to the top level element of tree select component.
  style?: CSSProperties;
  // If true the size of tree select will shrink on tablet size, defaults to true.
  shrinkOnTablet?: boolean;
  // If true the tree select will also show tags for the user to select.
  showTags?: boolean;
  // The initial default value of the component
  defaultValue?: number[][];
  value?: number[][];
  onClear?: () => void;
  onDropdownVisibleChange?: (open: boolean) => void;
}

export default function TreeSelect({
  label,
  items,
  size,
  showError,
  invalidMessage,
  className,
  onChange,
  defaultValue,
  value,
  onClear,
  onDropdownVisibleChange,
}: TreeSelectProps) {
  function menuItemToLabeledValue(): DefaultOptionType[] {
    console.log('ITEMS ', items);
    return items.map((item) => {
      return {
        value: item.value,
        label: item.label,
        children: item.children,
      };
    });
  }

  const dropdownRender = (menus: React.ReactNode) => <>{menus}</>;

  const filter = (inputValue: string, path: DefaultOptionType[]) =>
    path.some(
      (option) =>
        (option.label as string)
          .toLowerCase()
          .indexOf(inputValue.toLowerCase()) > -1
    );

  return (
    <div className={className}>
      <div>{label}</div>
      <Cascader
        placeholder={label}
        size={size}
        className="w-full"
        onChange={onChange}
        dropdownMatchSelectWidth={false}
        options={menuItemToLabeledValue()}
        defaultValue={defaultValue}
        dropdownRender={dropdownRender}
        multiple
        maxTagCount={'responsive'}
        value={value}
        showSearch={{ filter }}
        onClear={onClear}
        onDropdownVisibleChange={onDropdownVisibleChange}
        removeIcon={<></>}
      />
      {showError && (
        <Typography.Text style={{ display: 'block' }} type="danger">
          {invalidMessage}
        </Typography.Text>
      )}
    </div>
  );
}

import { TreeSelect as AntTreeSelect, Typography } from 'antd';
import React, { CSSProperties } from 'react';

const { SHOW_PARENT } = AntTreeSelect;

export interface MenuItem {
  value: number;
  label: string | React.ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
  isLeaf?: boolean;
}

interface TreeSelectProps {
  label: string;
  items: MenuItem[];
  onChange: (newValue: any, selectedOptions?: any) => void;
  size?: 'small' | 'middle' | 'large';
  showError?: boolean;
  invalidMessage?: string;
  className?: string;
  style?: CSSProperties;
  defaultValue?: number[];
  value?: number[];
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
  function menuItemToTreeData(): any[] {
    return items.map((item) => ({
      title: item.label,
      value: item.value,
      children: item.children ? menuItemToTreeDataRecursive(item.children, item) : undefined,
    }));
  }

  function menuItemToTreeDataRecursive(children: MenuItem[], parent: MenuItem): any[] {
    return children.map((child) => ({
      title: child.label,
      value: `${parent.value}-${child.value}`,
    }));
  }

  return (
    <div className={className}>
      <div>{label}</div>
      <AntTreeSelect
        treeCheckable={true}
        showCheckedStrategy={SHOW_PARENT}
        placeholder={label}
        size={size}
        className="w-full"
        onChange={onChange}
        treeData={menuItemToTreeData()}
        defaultValue={defaultValue}
        value={value}
        showSearch={true}
        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
        onClear={onClear}
        onDropdownVisibleChange={onDropdownVisibleChange}
        treeDefaultExpandAll={true}
      />
      {showError && (
        <Typography.Text style={{ display: 'block' }} type="danger">
          {invalidMessage}
        </Typography.Text>
      )}
    </div>
  );
}

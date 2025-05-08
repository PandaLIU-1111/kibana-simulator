import React, { useState, useEffect, useRef } from 'react';

/**
 * 可过滤的选择列表组件
 * 
 * @param {Object} props
 * @param {Array} props.options - 选项数组，每个选项应包含 value 和 label 属性
 * @param {string} props.value - 当前选中的值
 * @param {Function} props.onChange - 值变化时的回调函数
 * @param {string} props.placeholder - 输入框占位符
 * @param {string} props.id - DOM id
 * @param {string} props.className - 额外的CSS类
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.emptyMessage - 无选项时显示的消息
 */
const FilterableSelect = ({ 
  options = [], 
  value = '',
  onChange,
  placeholder = '搜索...',
  id,
  className = '',
  disabled = false,
  emptyMessage = '没有可用选项'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);
  
  // 处理选项过滤
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);
  
  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 获取当前选中选项的文本
  const getSelectedLabel = () => {
    const selected = options.find(option => option.value === value);
    return selected ? selected.label : '';
  };
  
  // 选择选项
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // 清除选择
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };
  
  // 切换下拉菜单
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };
  
  return (
    <div 
      className={`filterable-select ${className}`} 
      ref={wrapperRef}
    >
      <div 
        className={`filterable-select-header ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
      >
        <div className="selected-value">
          {value ? getSelectedLabel() : placeholder}
        </div>
        <div className="actions">
          {value && !disabled && (
            <button 
              type="button" 
              className="clear-btn"
              onClick={handleClear}
              title="清除选择"
            >
              ×
            </button>
          )}
          <span className="arrow-down">▼</span>
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div className="filterable-select-dropdown">
          <div className="search-container">
            <input
              type="text"
              id={id ? `${id}-search` : undefined}
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="输入关键词搜索..."
              autoFocus
            />
          </div>
          
          <div className="options-container">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`option ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="no-options">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterableSelect; 
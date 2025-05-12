import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FilterableSelect from './common/FilterableSelect';

const Discover = () => {
  const [indices, setIndices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [query, setQuery] = useState(JSON.stringify({
    query: {
      match_all: {}
    },
    size: 20
  }, null, 2));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 });
  const textareaRef = useRef(null);

  useEffect(() => {
    const fetchIndices = async () => {
      setIndicesLoading(true);
      try {
        const response = await axios.get('/api/indices');
        if (response.data.success) {
          setIndices(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedIndex(response.data.data[0].index);
          }
        }
      } catch (err) {
        setError('获取索引失败: ' + (err.response?.data?.message || err.message));
      } finally {
        setIndicesLoading(false);
      }
    };

    fetchIndices();
  }, []);

  // 将索引数据转换为FilterableSelect所需的格式
  const getIndexOptions = () => {
    return indices.map(index => ({
      value: index.index,
      label: index.index
    }));
  };

  // 处理JSON格式化
  const handleFormatJson = () => {
    try {
      const parsedJson = JSON.parse(query);
      setQuery(JSON.stringify(parsedJson, null, 2));
    } catch (error) {
      setError('JSON格式化失败: ' + error.message);
    }
  };

  // 支持Tab键在文本区域内使用
  const handleKeyDown = (e) => {
    // Tab键处理
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // 在光标位置插入2个空格
      const newValue = query.substring(0, start) + '  ' + query.substring(end);
      setQuery(newValue);
      
      // 移动光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    
    // 格式化快捷键: Ctrl+Shift+F
    if (e.key === 'f' && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      handleFormatJson();
    }
    
    // ESC键关闭建议
    if (e.key === 'Escape' && isSuggestionOpen) {
      e.preventDefault();
      setIsSuggestionOpen(false);
    }
    
    // 使用上下键选择建议
    if (isSuggestionOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // 此处可以添加选择建议项的逻辑
      }
      
      // 按Enter键选择当前建议
      if (e.key === 'Enter' && isSuggestionOpen) {
        e.preventDefault();
        // 选择第一个建议
        if (suggestions.length > 0) {
          selectSuggestion(suggestions[0]);
        }
      }
    }
  };

  // 处理输入变化，自动显示建议
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    // 自动检测是否需要显示建议
    if (textareaRef.current) {
      const cursorPos = e.target.selectionStart;
      setCursorPosition({
        start: cursorPos,
        end: cursorPos
      });
      
      // 获取当前光标位置前的字符
      const textBeforeCursor = newValue.substring(0, cursorPos);
      
      // 检查最后输入的字符
      const lastChar = textBeforeCursor.charAt(textBeforeCursor.length - 1);
      
      // 智能判断是否应该显示建议
      const shouldShowSuggestions = 
        // 在输入以下字符后可能需要建议
        lastChar === '{' || 
        lastChar === '"' || 
        lastChar === ':' || 
        lastChar === ',' ||
        // 或者刚刚删除了一个字符，可能也需要更新建议
        (cursorPosition.start > cursorPos && 
         ['{', '"', ':', ','].includes(
           query.charAt(Math.min(cursorPosition.start, query.length - 1))
         ));
      
      if (shouldShowSuggestions) {
        const suggestions = getEsSuggestions(newValue, cursorPos);
        if (suggestions.length > 0) {
          setSuggestions(suggestions);
          setIsSuggestionOpen(true);
        } else {
          setIsSuggestionOpen(false);
        }
      } else if (lastChar === '}' || lastChar === ']') {
        // 关闭括号时隐藏建议
        setIsSuggestionOpen(false);
      }
    }
  };
  
  // 处理光标位置变化
  const handleCursorPositionChange = (e) => {
    const cursorPos = e.target.selectionStart;
    setCursorPosition({
      start: cursorPos,
      end: e.target.selectionEnd
    });
    
    // 当光标移动后检查是否需要显示建议
    const suggestions = getEsSuggestions(query, cursorPos);
    if (suggestions.length > 0) {
      setSuggestions(suggestions);
      setIsSuggestionOpen(true);
    } else {
      setIsSuggestionOpen(false);
    }
  };

  // 自动完成建议的Elasticsearch查询关键词
  const getEsSuggestions = (currentText, cursorPos) => {
    // 获取光标位置前的文本
    const textBeforeCursor = currentText.substring(0, cursorPos);
    
    // 检查最后一个打开的 { 或 " 后的内容
    const lastOpenBracePos = textBeforeCursor.lastIndexOf('{');
    const lastQuotePos = textBeforeCursor.lastIndexOf('"');
    const lastColonPos = textBeforeCursor.lastIndexOf(':');
    
    // 判断当前上下文
    let context = 'none';
    let lastPos = -1;
    
    // 确定上下文类型：键名输入、值输入或大括号后
    if (lastQuotePos > lastColonPos && lastQuotePos > lastOpenBracePos) {
      // 可能在输入键名
      context = 'key';
      lastPos = lastQuotePos;
    } else if (lastColonPos > -1 && lastColonPos > Math.max(lastQuotePos, lastOpenBracePos)) {
      // 冒号后，可能在输入值
      context = 'value';
      lastPos = lastColonPos;
    } else if (lastOpenBracePos > -1) {
      // 大括号后，可能是新对象的开始
      context = 'object';
      lastPos = lastOpenBracePos;
    }
    
    if (lastPos === -1) return [];
    
    // 获取从上下文开始到当前光标的片段
    const contextFragment = textBeforeCursor.substring(lastPos).trim();
    
    // 分析当前所处的嵌套层级和路径
    const path = [];
    let queryContext = '';
    let i = lastPos;
    let depth = 0;
    let currentKey = '';
    let inQuote = false;
    
    // 向前搜索以确定当前上下文
    while (i >= 0) {
      const char = textBeforeCursor.charAt(i);
      if (char === '"' && (i === 0 || textBeforeCursor.charAt(i-1) !== '\\')) {
        inQuote = !inQuote;
        if (!inQuote && currentKey) {
          // 结束一个键名
          if (currentKey.endsWith(':')) {
            currentKey = currentKey.substring(0, currentKey.length - 1);
          }
          path.unshift(currentKey);
          currentKey = '';
        }
      } else if (!inQuote) {
        if (char === '{') depth--;
        else if (char === '}') depth++;
        
        // 搜索最近的上下文关键字
        if (depth === 0 && (textBeforeCursor.substring(i-8, i) === '"query":' || 
                            textBeforeCursor.substring(i-7, i) === '"aggs":' ||
                            textBeforeCursor.substring(i-7, i) === '"sort":')) {
          queryContext = textBeforeCursor.substring(i-8, i).replace(/"/g, '').replace(/:$/, '');
          break;
        }
      } else if (inQuote) {
        currentKey = char + currentKey;
      }
      i--;
    }
    
    // 如果没找到明确上下文，尝试通过简单字符串匹配查找
    if (!queryContext) {
      if (textBeforeCursor.includes('"query":', Math.max(0, lastPos - 30)))
        queryContext = 'query';
      else if (textBeforeCursor.includes('"aggs":', Math.max(0, lastPos - 30)) ||
               textBeforeCursor.includes('"aggregations":', Math.max(0, lastPos - 30)))
        queryContext = 'aggs';
      else if (textBeforeCursor.includes('"sort":', Math.max(0, lastPos - 30)))
        queryContext = 'sort';
    }
    
    // 根据上下文返回不同的建议
    if (context === 'key' || context === 'object') {
      // 键名或对象开始的建议
      if (queryContext === 'query') {
        // 查询上下文
        return [
          { value: '"match":', description: '匹配查询' },
          { value: '"match_all":', description: '匹配所有文档' },
          { value: '"match_phrase":', description: '短语匹配' },
          { value: '"term":', description: '精确值匹配' },
          { value: '"terms":', description: '多值精确匹配' },
          { value: '"range":', description: '范围查询' },
          { value: '"exists":', description: '字段存在查询' },
          { value: '"bool":', description: '布尔查询组合' },
          { value: '"must":', description: '必须匹配(AND)' },
          { value: '"should":', description: '应该匹配(OR)' },
          { value: '"must_not":', description: '必须不匹配(NOT)' },
          { value: '"filter":', description: '过滤查询' }
        ];
      } else if (queryContext === 'aggs') {
        // 聚合上下文
        return [
          { value: '"terms":', description: '按字段值分组' },
          { value: '"range":', description: '按范围分组' },
          { value: '"date_histogram":', description: '日期直方图' },
          { value: '"avg":', description: '平均值' },
          { value: '"sum":', description: '求和' },
          { value: '"min":', description: '最小值' },
          { value: '"max":', description: '最大值' },
          { value: '"count":', description: '计数' }
        ];
      } else if (queryContext === 'sort') {
        // 排序上下文
        return [
          { value: '"asc"', description: '升序排序' },
          { value: '"desc"', description: '降序排序' }
        ];
      } else {
        // 顶层关键字
        return [
          { value: '"query":', description: '查询条件' },
          { value: '"aggs":', description: '聚合分析' },
          { value: '"aggregations":', description: '聚合分析' },
          { value: '"sort":', description: '结果排序' },
          { value: '"size":', description: '返回文档数量' },
          { value: '"from":', description: '分页起始位置' },
          { value: '"_source":', description: '指定返回字段' },
          { value: '"highlight":', description: '高亮匹配文本' }
        ];
      }
    } else if (context === 'value') {
      // 值的建议，例如布尔值、数字等
      const lastFragment = textBeforeCursor.substring(lastColonPos + 1).trim();
      if (lastFragment === '') {
        // 空值建议
        return [
          { value: 'true', description: '布尔值:真' },
          { value: 'false', description: '布尔值:假' },
          { value: 'null', description: '空值' },
          { value: '{}', description: '空对象' },
          { value: '[]', description: '空数组' }
        ];
      }
    }
    
    return [];
  };

  // 选择建议
  const selectSuggestion = (suggestion) => {
    const newQuery = 
      query.substring(0, cursorPosition.start) + 
      suggestion.value + 
      query.substring(cursorPosition.end);
    
    setQuery(newQuery);
    setIsSuggestionOpen(false);
    
    // 设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursorPosition.start + suggestion.value.length;
        textareaRef.current.focus();
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        
        // 延迟一小段时间再允许显示新的建议
        setTimeout(() => {
          // 检查是否需要继续显示建议
          const newSuggestions = getEsSuggestions(newQuery, newCursorPos);
          if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions);
            setIsSuggestionOpen(true);
          }
        }, 500);
      }
    }, 0);
  };

  // 插入查询模板
  const insertTemplate = (templateType) => {
    let template = '';
    
    switch (templateType) {
      case 'match':
        template = `{
  "query": {
    "match": {
      "field_name": "value"
    }
  }
}`;
        break;
      case 'term':
        template = `{
  "query": {
    "term": {
      "field_name": "value"
    }
  }
}`;
        break;
      case 'bool':
        template = `{
  "query": {
    "bool": {
      "must": [
        { "match": { "field1": "value1" } }
      ],
      "must_not": [
        { "match": { "field2": "value2" } }
      ],
      "should": [
        { "match": { "field3": "value3" } }
      ],
      "filter": [
        { "term": { "field4": "value4" } }
      ]
    }
  }
}`;
        break;
      case 'aggs':
        template = `{
  "size": 0,
  "aggs": {
    "group_by_field": {
      "terms": {
        "field": "field_name",
        "size": 10
      }
    }
  }
}`;
        break;
      default:
        template = `{
  "query": {
    "match_all": {}
  },
  "size": 20
}`;
    }
    
    setQuery(template);
  };

  const handleSearch = async () => {
    if (!selectedIndex) {
      setError('请选择一个索引');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      let parsedQuery;
      try {
        parsedQuery = JSON.parse(query);
      } catch (parseErr) {
        setError('查询语法错误: ' + parseErr.message);
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/search', {
        index: selectedIndex,
        query: parsedQuery
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message || '查询失败');
      }
    } catch (err) {
      setError('查询失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (json) => {
    if (!json) return '';
    
    const replacer = (match, p1, p2, p3, p4) => {
      const cls = {
        '{': 'json-bracket',
        '}': 'json-bracket',
        '[': 'json-bracket',
        ']': 'json-bracket'
      };
      return `<span class="${cls[match] || ''}">${match}</span>`;
    };

    return JSON.stringify(json, null, 2)
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
            match = match.replace(/:$/, '');
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/{|}|\[|\]/g, replacer);
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="results-container">
        <h5 className="mb-3">搜索结果</h5>
        <div className="mb-3">
          <strong>总命中数:</strong> {results.hits?.total?.value || 0}
          <span className="ms-3">
            <strong>耗时:</strong> {results.took || 0} ms
          </span>
        </div>

        {results.hits?.hits?.length > 0 ? (
          <div>
            {results.hits.hits.map((hit, index) => (
              <div key={index} className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><strong>ID:</strong> {hit._id}</span>
                  <span><strong>得分:</strong> {hit._score}</span>
                </div>
                <div className="card-body">
                  <pre dangerouslySetInnerHTML={{ __html: formatJson(hit._source) }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">没有找到匹配的文档</div>
        )}
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">数据探索</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="dashboard-card">
        <div className="mb-3">
          <label htmlFor="indexSelect" className="form-label">选择索引</label>
          {indicesLoading ? (
            <div className="spinner-border spinner-border-sm ms-2" role="status">
              <span className="visually-hidden">加载中...</span>
            </div>
          ) : (
            <FilterableSelect
              id="indexSelect"
              value={selectedIndex}
              onChange={setSelectedIndex}
              options={getIndexOptions()}
              placeholder="请选择一个索引..."
              disabled={indicesLoading}
              emptyMessage="没有可用的索引"
            />
          )}
        </div>
        
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label htmlFor="queryEditor" className="form-label mb-0">查询 (JSON)</label>
            <div>
              <div className="btn-group me-2 dropdown">
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  插入模板
                </button>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={() => insertTemplate('match')}>Match查询</button></li>
                  <li><button className="dropdown-item" onClick={() => insertTemplate('term')}>Term查询</button></li>
                  <li><button className="dropdown-item" onClick={() => insertTemplate('bool')}>Bool查询</button></li>
                  <li><button className="dropdown-item" onClick={() => insertTemplate('aggs')}>聚合查询</button></li>
                </ul>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleFormatJson}
                title="格式化JSON (Ctrl+Shift+F)"
              >
                格式化JSON
              </button>
            </div>
          </div>
          <div className="position-relative">
            <textarea
              ref={textareaRef}
              id="queryEditor"
              className="form-control json-editor"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onClick={handleCursorPositionChange}
              onSelect={handleCursorPositionChange}
              rows="8"
              spellCheck="false"
            />
            {isSuggestionOpen && suggestions.length > 0 && (
              <div className="es-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="es-suggestion-item"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <span className="suggestion-value">{suggestion.value}</span>
                    <span className="suggestion-description">{suggestion.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-text">
            提示: 按Tab键缩进2个空格, 输入时会自动显示相关建议, Ctrl+Shift+F格式化JSON
          </div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || !selectedIndex}
        >
          {loading ? '查询中...' : '执行查询'}
        </button>
      </div>
      
      {loading ? (
        <div className="d-flex justify-content-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
        </div>
      ) : (
        renderResults()
      )}
    </div>
  );
};

export default Discover; 
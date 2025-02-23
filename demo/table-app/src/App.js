import React, { useEffect, useState } from 'react';
import './App.css';
import {expandCategories, superordinateCategory} from './categories.js';

function App() {
  const BASE_URL = 'https://ja.wikipedia.org';
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState([]);

  useEffect(() => {
    // JSONデータを取得する: カテゴリの定義
    fetch('/data/categories.json')
      .then(response => response.json())
      .then(categories => {
        setCategories(categories);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);
  useEffect(() => {
    // JSONデータを取得する: 表のデータ
    fetch('/data/items.json')
      .then(response => response.json())
      .then(items => {
        items.forEach(obj => {
          obj.category_set = new Set(obj.category);
          });
        setData(items);
        setFilteredData(items);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const filterByCategory = (category) => {
    setSelectedCategory(category);

    const expandedCategories = expandCategories(categories, category);
    setExpandedCategories(expandedCategories);
    const filterFunction = category === '' ? (item) => {return true} : (item) => {
      const is = expandedCategories.intersection(item.category_set);
      console.log(is);
      return is.size > 0;
    };

    // setFilteredData(data.filter(item => item.category.includes(category)));
    setFilteredData(data.filter(filterFunction));
  };

  const clearFilter = () => {
    setSelectedCategory('');
    setFilteredData(data);
    setExpandedCategories([]);
  };

  const comma = (index) => {
    if (index !== 0) {
      return (
        <>
          ,
          &nbsp;
        </>
      );
    } else {
      return <></>
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>カテゴリによる絞り込みのデモ</h1>
        <ul>
          <li>
          Wikipediaのページのうちプログラミング言語に関連したものをいくつか集めてカテゴリを付与しています。
          </li>
          <li>
          カテゴリをクリックすると、絞り込まれます。
          </li>
          <li>
          ページをクリックすると、Wikipediaのページを別タブで表示します。
          </li>
        </ul>
        <div>
          {filteredData.length} 件
        </div>
        {selectedCategory && (
          <div>
            <button onClick={clearFilter}>絞り込み解除</button>
            <p>カテゴリ: {selectedCategory}</p>
            <p>(上位カテゴリ: {Array.from(superordinateCategory(categories, selectedCategory)).join(', ')})</p>
            <p>(該当範囲: { Array.from(expandedCategories).join(', ') /* Array.from(expandCategories(categories, selectedCategory)).join(', ') */ })</p>
          </div>
        )}
        <table>
          <thead>
            <tr key={-1}>
              <th>ページ</th>
              <th>カテゴリ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td><a href={BASE_URL + item.url} target="_blank" rel="noopener noreferrer">{item.text}</a></td>
                <td>
                  {item.category.map((cat, idx) => (
                    <>
                      <>
                      {comma(idx)}
                      </>
                      <span key={idx} onClick={() => filterByCategory(cat)} style={{ cursor: 'pointer', color: 'blue' }}>
                        {cat}
                      </span>
                    </>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;

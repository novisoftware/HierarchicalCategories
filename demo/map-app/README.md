# 名古屋市交通局の市バスの情報を見るReactアプリ

## 説明

記号を処理するアプリケーションの例として、名古屋市交通局の市バスデータを使用して経路の探索を行っています。

付加的に以下を行っています。
- バス停留所の地図への表示
- バス系統の地図への表示

## 経路の探索について

バス停留所は、「バス停留所＋乗降場所」で識別されています。
乗降場所を含まない「バス停留所」を辿る処理を繰り返しています。
乗降場所が異なっている場合、徒歩での移動を含んだ経路になっています。

地図上には「バス停留所＋乗降場所」の情報をプロットします。
また、経路の探索結果の表示は「バス停留所＋乗降場所」を直線で結びます。
これは、道路上のどの場所をバスが走行するかの情報は特に入手していないためです。

## 使用データのライセンス

このReactアプリは名古屋市交通局による以下のデータセットを使用しています。

```
Creative Commons Attribution 4.0 International

This license requires that reusers give credit to the creator. It allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, even for commercial purposes.

BY: 名古屋市交通局(Transportation Bureau, City of Nagoya)
```

- 市バス停留所並順
https://data.bodik.jp/dataset/231002_7109030000_busstop-order

- 市バス停留所一覧
https://data.bodik.jp/dataset/231002_7109030000_busstop-latitude-longitude

- 市バス系統一覧
https://data.bodik.jp/dataset/231002_7109030000_bus-startend

- 市バス停留所URL
https://data.bodik.jp/dataset/231002_7101020000_busstop-url


(参考)

- 名古屋市におけるオープンデータの取組みについて
https://www.city.nagoya.jp/shisei/category/388-1-0-0-0-0-0-0-0-0.html

- 名古屋市オープンデータ利用規約
https://www.city.nagoya.jp/somu/page/0000056954.html

## create-react-app で配置されたコマンド

このプロジェクトディレクトリでは以下が実行できます。

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

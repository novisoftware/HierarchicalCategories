/*
 * 可視化ユーティリティ
 */

const { makeDict } = require('./categories.js'); 
const { readFileSync } = require('fs');

if (process.argv.length == 3) {
    try {
        // filenameで指定されたパス名からファイルをJSON形式で読み込む
        const filename = process.argv[2];
        const data = readFileSync(filename, 'utf8')
        const json = JSON.parse(data);

        if (!Array.isArray( json )) {
            console.error("JSONデータが配列ではありません。");
            return;
        }

        // パス名からファイル名を取り出す
        const path = require('path');
        const basename = path.basename(filename);

        console.log("### " + basename);
        console.log("```mermaid");
        // 注:
        // TB (または TD )で上から下へのグラフ
        // LR で左から右へのグラフになります
        console.log("graph RL;");

        // 空白をアンダーバーに置き換える関数を定義する
        const replaceSpace = (str) => {
            return str.replace(/ /g, "_").replace(/・/g, "_")
        };

        const dict = makeDict(json);
        const parentDict = dict["parentDict"];
        for (let [cateName, parentNameSet] of Object.entries(parentDict)) {
            parentNameSet.forEach(parentName => {
                console.log("    " + replaceSpace(cateName) + "-->" + replaceSpace(parentName) + ";");
            });
        }
        console.log("```");  
    } catch (e) {
        console.error('処理中にエラーが発生しました:', e);
    }
} else {
    console.error('引数が不正です。', process.argv.length);
}

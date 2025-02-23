/*
 * DAG チェックユーティリティ
 *
 * 理由
 * カテゴリの定義を行うために、DAG（有向非巡回グラフ; Directed Acyclic Graph）かどうかをチェックします。
 * DAGでない場合はカテゴリの定義に不備があります。
 * (処理はDAGでなくても構わないのですが、循環がある箇所は同値クラスと判定されます)
 * 
 * DAGは、トポロジカルソートが可能なグラフです。
 * 
 */

const { topologicalSort } = require('./categories.js'); 
const { readFileSync } = require('fs');

if (process.argv.length == 3) {
    try {
        // filenameで指定されたパス名からファイルをJSON形式で読み込む
        const filename = process.argv[2];
        const data = readFileSync(filename, 'utf8')
        console.log('ファイルを読み込みました。');
        const json = JSON.parse(data);
        console.log('JSONデータ:', json);

        const ts_result = topologicalSort(json);
        if (ts_result["leftSet"].size == 0) {
            console.log("DAG です。");
        } else {
            console.log("DAG ではありません。");
        }
        console.log("トポロジカルソート結果:", ts_result["sortedList"]);
        console.log("未ソートのノード:", ts_result["leftSet"]);
    } catch (e) {
        console.error('処理中にエラーが発生しました:', e);
    }
} else {
    console.error('引数が不正です。', process.argv.length);
}

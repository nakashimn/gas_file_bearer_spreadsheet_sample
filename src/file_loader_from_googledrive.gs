/**
* GoogleDriveからファイルを取得するクラス
*/
class FileLoaderFromGoogleDrive {
    /**
    * コンストラクタ
    * @param folder_id 検索対象のフォルダID
    */
    constructor(folder_id) {
        Logger.log(`${this.constructor.name}: init.`);
        Logger.log(`${this.constructor.name}: folder_id is "${folder_id}".`);

        this.folder_ = DriveApp.getFolderById(folder_id);
    }

    /**
    * ファイル探索処理
    * @param filename 抽出対象のファイル名(正規表現可)
    * @return 抽出結果のリスト [{name: ファイル名, blob: blob形式のファイル実体}, ...]
    */
    load_files(filename) {
        const all_files = this.folder_.getFiles();
        var files = [];

        // ディレクトリ以下のファイルからファイル名(正規表現可)に当てはまるものを抽出
        while(all_files.hasNext()) {
            const file = all_files.next();
            if (file.getName().match(filename)) {
                Logger.log(`${this.constructor.name}: find "${file.getName()}".`);

                const content = file.getBlob();
                files.push({id: file.getId(), name: file.getName(), content: content});
             }
        }

        Logger.log(`${this.constructor.name}: load ${files.length} files.`);
        return files;
    }
}

/**
* 送付後のファイルをoldフォルダに移動させるクラス
**/
class FolderForOldFiles {
    /**
    * コンストラクタ
    * @param root_folder_id oldフォルダの親フォルダ
    */
    constructor(root_folder_id) {
        Logger.log(`${this.constructor.name}: init.`);
        const root_folder = DriveApp.getFolderById(root_folder_id);
        const iter_folders = root_folder.getFolderByName("old");
        // あれば利用, なければ作成
        if (iter_folders.hasNext()) {
            this.folder = iter_folder.next();
        } else {
            this.folder = root_folder.createFolder("old");
            Logger.log(`${this.constructor.name}: create \"old\" folder.`);
        }
        // prefix用の日付取得
        this.prefix_today = utilities.formatDate(new Date(), "JST", "yyyymmdd");
    }

    /**
     * ファイル移動処理
     * @param file oldフォルダに移動させるファイル(Blob形式)
     */
    collect(file) {
        this.add_processed_date_(file);
        file.moveTo(this.folder);
        Logger.log(`${this.constructor.name}: move ${file.getName()} to \"old\" folder.`);
    }

    /**
    * ファイルの名称に処理日を付与する処理
    * @param file 対象ファイル(Blob形式)
    */
    add_processed_date_(file) {
        return file.setName(`${this.prefix_today}_${file.getName()}`);
    }
}

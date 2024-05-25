/**
* GoogleSpreadSheetの内容に応じてトリガーをセットするクラス
*/
class TriggerSettingSheet {
    /**
    * コンストラクタ
    * @param sheet_id GoogleSpreadSheetのID
    */
    constructor(sheet_id) {
        Logger.log(`${this.constructor.name}: init.`);

        this.sheet_id = sheet_id;
        this.sheet_name = "main";
        this.spreadSheets = SpreadsheetApp.openById(this.sheet_id);
        this.sheet = this.spreadSheets.getSheetByName(this.sheet_name);
        this.values = this.sheet.getDataRange().getValues();
        this.header = this.values[0]; // カラム名取得: ["トリガー名", "定期実行", "送信元GoogleDriveFolderID", "送信先AWSS3バケット名", "送信先AWSS3フォルダ名", "ファイル名(正規表現可)", "実行頻度", "実行曜日", "実行時", "実行分"]

        this.selectable_frequency = ["毎週", "毎日", "毎時"];
        this.day_of_week = {
            "日": ScriptApp.WeekDay.SUNDAY,
            "月": ScriptApp.WeekDay.MONDAY,
            "火": ScriptApp.WeekDay.TUESDAY,
            "水": ScriptApp.WeekDay.WEDNESDAY,
            "木": ScriptApp.WeekDay.THURSDAY,
            "金": ScriptApp.WeekDay.FRIDAY,
            "土": ScriptApp.WeekDay.SATURDAY
        }
        this.records = [];

        Logger.log(`${this.constructor.name}: SheetID is "${this.sheet_id}".`);
    }

    /**
    * GoogleSpreadSheetを読み込む処理
    */
    read_sheet_() {
        this.records = [];
        for (var row=1; row<this.values.length; row++){
            if (this.values[row][0] == "") { // トリガー名がない場合スキップ
                continue;
            }

            if (!this.values[row][1]) { // 定期実行フラグがない場合はスキップ
                continue;
            }

            var record = {"row": row};
            for (var col=0; col<this.values[row].length; col++) {
                record[this.header[col]] = this.values[row][col];
            }
            this.records.push(record);
        }
        return this.records;
    }

    /**
    * トリガー全削除処理
    */
    delete_all_trigger_() {
        const existing_triggers = ScriptApp.getProjectTriggers();
        for (var i = 0; i < existing_triggers.length; i++) {
            ScriptApp.deleteTrigger(existing_triggers[i]);
        }

        // トリガーID全削除
        for (var row=2; row<this.values.length; row++){
            this.sheet.getRange(row, 11).setValue("");
        }
    }

    /**
    * パラメータの有効判定
    * @param record パラメータ群の連想配列
    */
    has_valid_params_(record) {
        var valid = true;
        if (!record["送信元GoogleDriveFolderID"]) { valid = false; };
        if (!record["送信先AWSS3バケット名"]) { valid = false; };
        if (!record["送信先AWSS3フォルダ名"]) { valid = false; };
        if (!record["ファイル名(正規表現可)"]) { valid = false; };
        if (!this.selectable_frequency.includes(record["実行頻度"])) { valid = false; };
        if (record["実行頻度"] == "毎週") {
            if (!Object.keys(this.day_of_week).includes(record["実行曜日"])) { valid = false; };
            if ((record["実行時"] < 0) | (record["実行時"] > 23)) { valid = false; };
        };
        if (record["実行頻度"] == "毎日") {
            if ((record["実行時"] < 0) | (record["実行時"] > 23)) { valid = false; };
        };
        if (record["実行頻度"] == "毎時") {
            if ((record["実行分"] < 0) | (record["実行分"] > 60)) { valid = false; };
        };

        if (!valid) {
            Logger.log(`${this.constructor.name}: Trigger ${record["トリガー名"]} is invalid.`);
        }

        return valid;
    }

    /**
    * トリガー単体作成処理
    */
    set_trigger_(record) {
        if (!this.has_valid_params_(record)) {
            return;
        }

        Logger.log(`${this.constructor.name}: set trigger "${record["トリガー名"]}".`);

        var trigger;
        if (record["実行頻度"] == "毎週") {
            trigger = ScriptApp.newTrigger("send_file").timeBased().onWeekDay(this.day_of_week[record["実行曜日"]]).atHour(record["実行時"]).create();
        }
        if (record["実行頻度"] == "毎日") {
            trigger = ScriptApp.newTrigger("send_file").timeBased().everyDays(1).atHour(record["実行時"]).create();
        }
        if (record["実行頻度"] == "毎時") {
            trigger = ScriptApp.newTrigger("send_file").timeBased().everyHours(1).nearMinute((record["実行分"]+15) % 60).create();
        }

        const trigger_id = trigger.getUniqueId();
        this.sheet.getRange(record["row"]+1, 11).setValue(trigger_id);
    }

    /**
    * トリガー作成処理
    * @note 外部から呼ばれる想定
    */
    set_triggers() {
        this.read_sheet_();
        this.delete_all_trigger_();
        this.records.forEach(record => { this.set_trigger_(record); });
    }

    /**
    * トリガー単体作成処理
    * @param trigger_id トリガーのUniqueID
    * @note トリガー内で呼ばれる想定
    */
    get_record_by_trigger_id(trigger_id) {
        Logger.log(`${this.constructor.name}: triggerID is "${trigger_id}".`);

        for (var row=1; row<this.values.length; row++){
            if (this.values[row][10] != trigger_id) { // トリガーIDが異なる場合スキップ
                continue;
            }
            var record = {"row": row};
            for (var col=0; col<this.values[row].length; col++) {
                record[this.header[col]] = this.values[row][col];
            }
            return record;
        }

        Logger.log(`${this.constructor.name}: No Valid trigger.`);
        return null;
    }
}

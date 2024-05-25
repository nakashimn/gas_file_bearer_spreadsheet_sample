/**
* トリガー登録関数
*/
function main() {
    Logger.log("==== start. ====");
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheet_id = scriptProperties.getProperty("GOOGLE_SPREADSHEET_ID");
    const trigger_setting_sheet = new TriggerSettingSheet(spreadsheet_id);
    trigger_setting_sheet.set_triggers();
    Logger.log("==== done. ====");

}

/**
* トリガー関数
* @param e トリガーイベント
*/
function send_file(e) {
    ////////////////////////////////////////////////////////////////////////////
    // Read Params
    ////////////////////////////////////////////////////////////////////////////
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheet_id = scriptProperties.getProperty("GOOGLE_SPREADSHEET_ID");
    const trigger_setting_sheet = new TriggerSettingSheet(spreadsheet_id);
    const record = trigger_setting_sheet.get_record_by_trigger_id(e.triggerUid);

    const google_drive_folder_id = record["送信元GoogleDriveFolderID"]
    const aws_s3_bucket = record["送信先AWSS3バケット名"]
    const dest_dirname = record["送信先AWSS3フォルダ名"]
    const filename = new RegExp(`${record["ファイル名(正規表現可)"]}`)
    const compress = true;

    ////////////////////////////////////////////////////////////////////////////
    // Main Process
    ////////////////////////////////////////////////////////////////////////////
    Logger.log("==== start. ====");

    // get env from property service
    const aws_access_key = scriptProperties.getProperty("AWS_ACCESS_KEY");
    const aws_secret_access_key = scriptProperties.getProperty("AWS_SECRET_ACCESS_KEY");
    const aws_region = scriptProperties.getProperty("AWS_REGION");

    // load files from GoogleDrive
    Logger.log("==== load files from GoogleDrive ====");
    const loader = new FileLoaderFromGoogleDrive(google_drive_folder_id);
    const files = loader.load_files(filename);

    // send files to AWS S3 bucket
    Logger.log("==== send files to AWS S3 bucket ====");
    const bearer = new TextBearerToAwsS3(aws_access_key, aws_secret_access_key, aws_region, aws_s3_bucket);
    const folder_for_old_files = new FolderForOldFiles(google_drive_folder_id);
    files.forEach(file => {
        try {
            bearer.send(file.content, encodeURI(decodeURI(`${dest_dirname}/${file.name}`)), compress);
            folder_for_old_files.collect(file.id); // 送付後のファイルをoldディレクトリへ移動
        } catch(e) {
            throw(e);
        }
    })

    Logger.log("==== done. ====");
}

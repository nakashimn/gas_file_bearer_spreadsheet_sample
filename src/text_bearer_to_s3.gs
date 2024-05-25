/**
* textをAWS S3バケットに送付するクラス
*/
class TextBearerToAwsS3 {
    /**
    * コンストラクタ
    * @param access_key AWSのアクセスキー
    * @param secret_access_key AWSのシークレットアクセスキー
    * @param region 送付先S3バケットのリージョン
    * @param bucket 送付先S3のバケットの名前
    */
    constructor(access_key, secret_access_key, region, bucket) {
        Logger.log(`${this.constructor.name}: init.`);
        Logger.log(`${this.constructor.name}: bucket name is "${bucket}".`);

        AWS.init(access_key, secret_access_key);
        this.region = region;
        this.bucket = bucket;
    }

    /**
    * text送付処理
    * @param src_blob 送付対象のファイル(blob形式)
    * @param dst_key 送付先のkey名(ディレクトリ/ファイル名)
    * @param compress 圧縮の有無
    */
    send(src_blob, dst_key, compress) {
        if (compress == null) {
            compress = false;
        }

        var options = {
            "Content-Type": src_blob.getContentType(),
            // "X-Amz-Acl": "bucket-owner-full-control"
        };
        if (compress) {
            options["Content-Encoding"] = "gzip";
            dst_key = dst_key + ".gz";
        }

        const res = AWS.request(
            "s3", this.region, "PutObject", {}, "PUT", src_blob, options,
            `/${dst_key}`, { Bucket: this.bucket }
        );

        this.check_error_(res);
        Logger.log(`${this.constructor.name}: send to "${this.bucket}/${dst_key}".`);
    }

    /**
    * エラーチェック処理
    * @param res AWS.request()のレスポンス
    */
    check_error_(res) {
        const code = res.getResponseCode();
        const text = res.getContentText();
        if (code < 200 || code >= 300) {
            throw Error(`${this.constructor.name}: AWS.request failed. ${code} - ${text}`);
        }
    }
}

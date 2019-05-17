import shortId from 'short-uuid';
import { dateYMD, xAmzDate } from "./Date";
import { IConfig, DeleteResponse, UploadResponse } from "./types";
import { throwError } from "./ErrorThrower";
import GetUrl from "./Url";
import Policy from "./Policy";
import Signature from "./Signature";


class S3FileUpload {
  static async uploadFile(file, config) {

    // Error Thrower :x:
    throwError(config, file);

    const fd = new FormData();
    const key = `${config.dirName ? config.dirName + "/" : ""}${file.name}`;
    const url = `https://${config.bucketName}.s3.amazonaws.com/`;
    fd.append("key", key);
    fd.append("acl", "public-read");
    fd.append("Content-Type", file.type);
    fd.append("x-amz-meta-uuid", "14365123651274");
    fd.append("x-amz-server-side-encryption", "AES256");
    fd.append("X-Amz-Credential", `${config.accessKeyId}/${dateYMD}/${config.region}/s3/aws4_request`);
    fd.append("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    fd.append("X-Amz-Date", xAmzDate);
    fd.append("x-amz-meta-tag", "");
    fd.append("Policy", Policy.getPolicy(config));
    fd.append("X-Amz-Signature", Signature.getSignature(config, dateYMD, Policy.getPolicy(config)));
    fd.append("file", file);
    const params1 = {
      method: "post",
      headers: {
        fd
      },
      body: fd
    };
    const params = {
      url: url,
      method: "post",
      headers: {
        fd
      },
      ['data']: fd,
      onUploadProgress: function (progressEvent) {
        let progress = progressEvent.loaded * 100 / progressEvent.total;
        console.log(localStorage.getItem('progress'),'onprogress')
        localStorage.getItem('progress') >= 100 ?localStorage.setItem('progress', 0) :
            localStorage.setItem('progress', progress.toFixed(0));
        // localStorage.setItem('progress', progress.toFixed(0));

        console.log(localStorage.getItem('progress'), 'react s3')
      }
    };
    const data = await axios.request(params)

    console.log('Responxe', data)
    if (!data) return Promise.reject(data);
    return Promise.resolve({
      bucket: config.bucketName,
      key: `${config.dirName ? config.dirName + "/" : ""}${file.name}`,
      location: `${url}${config.dirName ? config.dirName + "/" : ""}${file.name}`,
      result: data
    });
  }

  static async deleteFile(fileName, config) {
    const fd = new FormData();
    const url = `https://${config.bucketName}.s3-${config.region}.amazonaws.com/${config.dirName ? config.dirName + "/" : ""}${fileName}`;
    fd.append("Date", xAmzDate);
    fd.append("X-Amz-Date", xAmzDate);
    fd.append("Authorization", Signature.getSignature(config, dateYMD, Policy.getPolicy(config)));
    fd.append("Content-Type", "text/plain");

    const params = {
      method: "delete",
      headers: {
        fd
      }
    };


    await performRequest('post', url, params)


    // const deleteResult = await fetch(url, params);
    const deleteResult = await performRequest('post', url, params);
    if (!deleteResult.ok) return Promise.reject(deleteResult);
    return Promise.resolve({
      ok: deleteResult.ok,
      status: deleteResult.status,
      message: "File Deleted",
      fileName: fileName
    });
  }
}

export default S3FileUpload;
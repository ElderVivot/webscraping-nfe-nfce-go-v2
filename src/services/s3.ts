import 'dotenv/config'
import { config, S3, ConfigurationOptions } from 'aws-sdk'
import { Readable } from 'stream'
import { v4 as uuid } from 'uuid'

const configAws: ConfigurationOptions = {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION,
    signatureVersion: 'v4'
}

export type IUploadAwsS3 = S3.ManagedUpload.SendData
export type IDeleteAwsS3 = S3.DeleteObjectOutput

export class AwsS3 {
    private connection: S3
    constructor () {
        if (!this.connection) {
            config.update(configAws)
            this.connection = new S3()
        }
    }

    async upload (dataUpload: Buffer | string | Readable, folder: string, extension: string, contentType: string, s3BucketName: string, keyToSaveInBucket = ''): Promise<IUploadAwsS3> {
        let buffer: Buffer | Readable
        if (dataUpload instanceof Buffer) {
            buffer = dataUpload
        } else if (dataUpload instanceof Readable) {
            buffer = dataUpload
        } else {
            try {
                buffer = Buffer.from(dataUpload.replace(/^data:image\/\w+;base64,/, ''), 'base64')
            } catch (error) {
                buffer = Buffer.from(dataUpload, 'base64')
            }
        }

        try {
            const result = await this.connection.upload({
                Bucket: s3BucketName,
                Body: buffer,
                ContentEncoding: 'base64',
                ContentType: contentType,
                Key: keyToSaveInBucket || `${folder}/${uuid()}.${extension}`,
                ACL: 'public-read'
            }).promise()
            return result
        } catch (error) {
            console.error({ error, __filename, method: 'upload' })
        }
    }

    async delete (key: string, s3BucketName: string): Promise<IDeleteAwsS3> {
        try {
            const result = await this.connection.deleteObject({
                Bucket: s3BucketName,
                Key: key
            }).promise()

            return result
        } catch (error) {
            console.error({ error, __filename, method: 'delete' })
        }
    }
}

export const s3Factory = (): AwsS3 => {
    return new AwsS3()
}
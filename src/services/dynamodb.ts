import AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid'

import { logger } from '@common/log'
import { AwsConfig } from '@config/dynamodb'
import { ISettingsNFeGoias } from '@scrapings/_interfaces'

const tableName = 'log-webscraping-notes-go'
AWS.config.update(AwsConfig)
const dynamoDb = new AWS.DynamoDB.DocumentClient()

export async function saveLogDynamo (dataToSave: ISettingsNFeGoias): Promise<void> {
    try {
        /*
        var params = {
            TableName: tableName,
            Item: {
                ...dataToSave,
                id: uuid(),
                tenant: process.env.TENANT,
                timeLog: new Date().toISOString(),
                timeLogNumber: new Date().getTime(),
                dateStartDown: dataToSave.dateStartDown ? new Date(dataToSave.dateStartDown).toISOString() : null,
                dateEndDown: dataToSave.dateEndDown ? new Date(dataToSave.dateEndDown).toISOString() : null
            }
        }

        await dynamoDb.put(params).promise()
        */
    } catch (err) {
        logger.error({ error: err })
    }
}
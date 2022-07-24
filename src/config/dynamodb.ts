import 'dotenv/config'

const awsRegion = process.env.AWS_REGION || 'us-east-2'

export const AwsConfig = {
    region: awsRegion,
    endpoint: `http://dynamodb.${awsRegion}.amazonaws.com`,
    accessKeyId: process.env.AWS_DYNAMODB_USER,
    secretAccessKey: process.env.AWS_DYNAMODB_PASS
}
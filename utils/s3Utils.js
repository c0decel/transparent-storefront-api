const crypto = require('crypto');
require('dotenv').config();

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

module.exports= {
    randomImageName,
    bucketName,
    bucketRegion,
    accessKey,
    secretAccessKey
}
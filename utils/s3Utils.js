const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

require('dotenv').config();

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const upload = multer({
    limits: { fileSize: 500000000 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file format`), false);
        }
    },
});

const uploadToS3 = async (file, folderPath, imageDimension, s3) => {
    const newFileName = randomImageName();
    const key = `${folderPath}${newFileName}`;

    const buffer = await sharp(file.buffer).resize(imageDimension).toBuffer();

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    }

    const command = new PutObjectCommand(params);
    await s3.send(command);

    return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
};


module.exports= {
    randomImageName,
    bucketName,
    bucketRegion,
    accessKey,
    secretAccessKey,
    upload,
    uploadToS3
}
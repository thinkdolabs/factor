import { addFilter, addCallback } from "@factor/tools"
import AWS from "aws-sdk"

addFilters()

function addFilters(): void {
  if (
    !process.env.AWS_ACCESS_KEY ||
    !process.env.AWS_ACCESS_KEY_SECRET ||
    !process.env.AWS_S3_BUCKET
  ) {
    addFilter("setup-needed", _ => {
      const item = {
        title: "Plugin: S3 Storage Credentials",
        value: "The S3 storage plugin requires AWS S3 information to run correctly.",
        location: ".env/AWS_ACCESS_KEY, AWS_ACCESS_KEY_SECRET, AWS_S3_BUCKET"
      }

      return [..._, item]
    })

    return
  }

  addFilter("storage-attachment-url", ({ buffer, key }) => {
    const { bucket, S3 } = setConfig()
    return new Promise((resolve, reject) => {
      const params = { Bucket: bucket, Key: key, Body: buffer, ACL: "public-read" }
      S3.upload(params, (err, data) => {
        if (err) reject(err)

        const { Location } = data || {}

        resolve(Location)
      })
    })
  })

  addCallback("delete-attachment", async doc => {
    const { bucket, S3 } = setConfig()
    const key = doc.url.split("amazonaws.com/")[1]

    if (key) {
      const params = { Bucket: bucket, Key: key }
      return await S3.deleteObject(params).promise()
    }
  })
}

function setConfig(): { S3: AWS.S3; bucket: string } {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
  })

  const bucket = process.env.AWS_S3_BUCKET
  const S3 = new AWS.S3()
  return { S3, bucket }
}
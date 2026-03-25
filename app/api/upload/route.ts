import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to Cloudinary using a promise to handle the callback
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'carx-products', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    }) as any

    return NextResponse.json({ url: result.secure_url })
  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 })
  }
}

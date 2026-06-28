import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream'; // FIX: Node.js Readable, not Web ReadableStream

export async function POST(request) {
    try {
        const { folderName, wallpapers } = await request.json();

        if (!folderName || !wallpapers || !Array.isArray(wallpapers)) {
            return NextResponse.json(
                { message: "Missing required payload parameters: folderName or wallpapers array." },
                { status: 400 }
            );
        }

        // 1. Extract the user's OAuth Access Token
        const authHeader = request.headers.get('authorization');
        const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!accessToken) {
            return NextResponse.json(
                { message: "Unauthorized. Missing valid Google Access Token scope authorization header." },
                { status: 401 }
            );
        }

        // 2. Initialize the Google Drive Client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 3. Create or Locate the Root Parent App Folder ("Puffy Wallpapers")
        let rootFolderId = null;
        const rootSearch = await drive.files.list({
            q: "name = 'Puffy Wallpapers' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id)',
            spaces: 'drive'
        });

        if (rootSearch.data.files.length > 0) {
            rootFolderId = rootSearch.data.files[0].id;
        } else {
            const rootFolder = await drive.files.create({
                requestBody: {  // FIX: 'requestBody' is correct in googleapis v4+, not 'resource'
                    name: 'Puffy Wallpapers',
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });
            rootFolderId = rootFolder.data.id;
        }

        // 4. Create or Locate the Collection Subfolder inside Root App Folder
        let targetFolderId = null;
        const subfolderSearch = await drive.files.list({
            q: `name = '${folderName.replace(/'/g, "\\'")}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        if (subfolderSearch.data.files.length > 0) {
            targetFolderId = subfolderSearch.data.files[0].id;
        } else {
            const subfolder = await drive.files.create({
                requestBody: {  // FIX: 'requestBody' not 'resource'
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [rootFolderId]
                },
                fields: 'id'
            });
            targetFolderId = subfolder.data.id;
        }

        // 5. Process uploads in chunks of 5 to avoid Drive API rate limits
        const CHUNK_SIZE = 5;
        const results = [];

        for (let i = 0; i < wallpapers.length; i += CHUNK_SIZE) {
            const chunk = wallpapers.slice(i, i + CHUNK_SIZE);

            const chunkResults = await Promise.all(
                chunk.map(async (wallpaper) => {
                    try {
                        // Abort fetch after 15 seconds to avoid hanging on slow CDN assets
                        const controller = new AbortController();
                        const timeout = setTimeout(() => controller.abort(), 15000);

                        const imageResponse = await fetch(wallpaper.url, { signal: controller.signal });
                        clearTimeout(timeout);

                        if (!imageResponse.ok) throw new Error(`Failed to fetch source binary asset image.`);

                        // FIX: use actual Content-Type from CDN response, not hardcoded 'image/jpeg'
                        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

                        const arrayBuffer = await imageResponse.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        // Check for duplicates before uploading
                        const fileCheck = await drive.files.list({
                            q: `name = '${wallpaper.filename.replace(/'/g, "\\'")}' and '${targetFolderId}' in parents and trashed = false`,
                            fields: 'files(id)'
                        });

                        if (fileCheck.data.files.length > 0) {
                            return { filename: wallpaper.filename, status: 'already_exists', id: fileCheck.data.files[0].id };
                        }

                        const uploadedFile = await drive.files.create({
                            requestBody: {   // FIX: 'requestBody' not 'resource'
                                name: wallpaper.filename,
                                parents: [targetFolderId]
                            },
                            media: {
                                mimeType,           // FIX: dynamic MIME type
                                body: Readable.from(buffer) // FIX: Node.js Readable stream, not ReadableStream.from()
                            },
                            fields: 'id'
                        });

                        return { filename: wallpaper.filename, status: 'success', id: uploadedFile.data.id };
                    } catch (err) {
                        console.error(`Upload error for ${wallpaper.filename}:`, err);
                        return { filename: wallpaper.filename, status: 'failed', error: err.message };
                    }
                })
            );

            results.push(...chunkResults);
        }

        return NextResponse.json({
            message: "Batch collection folder integration processes resolved successfully.",
            details: results
        }, { status: 200 });

    } catch (error) {
        console.error("Critical Google Drive upload exception:", error);
        return NextResponse.json(
            { message: "Internal server error during Google Drive transmission.", error: error.message },
            { status: 500 }
        );
    }
}
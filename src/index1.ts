import { GoogleGenAI, } from '@google/genai';

import dotenv from 'dotenv';
import mime from 'mime';
import * as fs from 'fs';

dotenv.config();

function saveBinaryFile(fileName: string, content: Buffer) {
    fs.writeFile(fileName, content, 'utf8', (err) => {
        if (err) {
            console.error(`Error writing file ${fileName}:`, err);
            return;
        }
        console.log(`File ${fileName} saved to file system.`);
    });
}

async function main() {
    const model = "gemini-3-pro-image-preview";
    const city = process.env.CITY;
    const location = process.env.LOCATION;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const tools = [{ googleSearch: {} }];
    const config = {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { imageSize: '1K', aspectRatio: "16:9" },
        tools,
    };
    const contents = [
        {
            role: 'user',
            parts: [
                {
                    text: `
Present a clear, 45° top-down isometric miniature 3D cartoon scene of ${location}, featuring its most iconic landmarks and architectural elements. 
Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. 
Integrate the current weather conditions directly into the city environment to create an immersive atmospheric mood.
Use a clean, minimalistic composition with a soft, solid-colored background.
At the top-center, place the title “${city}” in large bold text, a prominent weather icon beneath it, then the date (small text) and temperature (medium text).
All text must be centered with consistent spacing, and may subtly overlap the tops of the buildings. Keep the image as 1116 width x 522 height pixels dimension.`
                },
            ],
        },
    ];

    const response = await ai.models.generateContentStream({ model, config, contents });
    let fileIndex = 0;
    for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0]?.content || !chunk.candidates[0].content.parts) {
            continue;
        }
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            /// Create the YYYYMMD file and save it as output folder
            const yyyymmdd = new Date().toISOString().split('T')[0];
            const outputDir = `./output/${yyyymmdd}`;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const fileName = `${outputDir}/${city}-weather-${yyyymmdd}-pro`;
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            const fileExtension = mime.getExtension(inlineData.mimeType || '');
            const buffer = Buffer.from(inlineData.data || '', 'base64');
            saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
        }
        else {
            console.log(chunk.text);
        }
    }
}

main();

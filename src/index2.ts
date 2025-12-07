import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import mime from 'mime';

import dotenv from 'dotenv';

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
    const ai = new GoogleGenAI({});
    const model = "gemini-2.5-flash-image";
    const city = process.env.CITY;
    const date = process.env.DATE;
    const location = process.env.LOCATION;
    const weather = process.env.WEATHER;
    const temperature = process.env.TEMPERATURE;
    const prompt = [
        {
            text: `Present a clear, 45° top-down isometric miniature 3D cartoon scene of ${location}, featuring its most iconic landmarks and architectural elements. 
Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. 
Today is ${date} and weather conditions is ${weather}. Temperature is ${temperature} degrees Celsius.
Integrate this weather conditions directly into the city environment to create an immersive atmospheric mood.
Use a clean, minimalistic composition with a soft, solid-colored background.
At the top-center, place the title “${city}” in large bold text, a prominent weather icon beneath it, then the date (small text) and temperature (medium text).
All text must be centered with consistent spacing, and may subtly overlap the tops of the buildings. Keep the image as 1116 width x 522 height pixels dimension.` },
    ];

    const config = {
        responseModalities: ["IMAGE"],
        imageConfig: {
            aspectRatio: "16:9",
        }
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        config,
        contents: prompt,
    });
    for (const part of response!.candidates![0]!.content!.parts!) {
        if (part.text) {
            console.log(part.text);
        } else if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            /// Create the YYYYMMD file and save it as output folder
            const yyyymmdd = new Date().toISOString().split('T')[0];
            const outputDir = `./output/${yyyymmdd}`;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const fileName = `${outputDir}/${city}-weather-${yyyymmdd}-lite`;
            const inlineData = part.inlineData;
            const fileExtension = mime.getExtension(inlineData.mimeType || '');
            const buffer = Buffer.from(inlineData.data || '', 'base64');
            saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
        }
    }
}

main();
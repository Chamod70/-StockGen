export const generateMetadataWithGrok = async (apiKey, base64Image, filename, selectedModelString, config) => {
  const isVector = filename.toLowerCase().includes('.eps') || filename.toLowerCase().includes('vector');
  const includeKeywordsInstruction = config?.includeKeywords 
    ? ` MUST INCLUDE THESE EXACT KEYWORDS: ${config.includeKeywords}. ` 
    : '';
    
  const targetTitleLen = config?.titleLength || 120;
  const targetKeywordsCount = config?.keywordCount || 49;
  
  const systemPrompt = `You are an expert Adobe Stock metadata creator. Analyze the image and generate a JSON object with:
  - "title": A highly descriptive, search-optimized title. CRITICAL RULE: The title MUST be extremely long, at least ${targetTitleLen + 60} characters! Describe every visible detail, colors, mood, lighting, and actions. Keep adding descriptive adjectives until it is very long. Do NOT use commas.
  - "keywords": A comma-separated string of at least ${targetKeywordsCount + 25} keywords. CRITICAL RULE: You MUST provide at least ${targetKeywordsCount + 25} keywords! Brainstorm every possible related concept, object, color, emotion, and background element. No duplicates, no technical data. ${includeKeywordsInstruction}${isVector ? 'Include: vector, illustration, editable, template, isolated.' : ''}
  - "category": A single number representing the most appropriate Adobe Stock category from this list:
    1 Animals, 2 Buildings and Architecture, 3 Business, 4 Drinks, 5 The Environment, 6 States of Mind, 7 Food, 8 Graphic Resources, 9 Hobbies and Leisure, 10 Industry, 11 Landscape, 12 Lifestyle, 13 People, 14 Plants and Flowers, 15 Culture and Religion, 16 Science, 17 Social Issues, 18 Sports, 19 Technology, 20 Transport, 21 Travel
  - "confidence": A number from 0-100 indicating how confident you are in the category selection.
  
  Do not include markdown blocks, output purely the JSON object.`;

  const apiModelId = selectedModelString || "llama-3.2-11b-vision-preview";
  
  // Determine if it's likely a vision model based on ID string
  const isVisionModel = apiModelId.toLowerCase().includes('vision') || apiModelId.toLowerCase().includes('scout');

  // Format content appropriately: text models crash if given an array with image_url
  const userContent = isVisionModel 
    ? [
        {
          type: "image_url",
          image_url: {
            url: base64Image
          }
        },
        {
          type: "text",
          text: `Generate metadata for this image file named ${filename}.`
        }
      ]
    : `Generate metadata for an image file named "${filename}". Note: This is a text-only model so you cannot see the image. Do your best to guess keywords, title, and category based purely on the filename.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: apiModelId,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errMsg = `HTTP ${response.status}`;
    try {
      const err = JSON.parse(errorText);
      errMsg = err.error?.message || errorText;
    } catch {
      errMsg = errorText || errMsg;
    }
    // Truncate if too long to fit in UI
    const truncatedMsg = errMsg.length > 100 ? errMsg.substring(0, 100) + '...' : errMsg;
    throw new Error(truncatedMsg);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Try to parse JSON from the response. Sometimes models wrap in markdown.
  let cleanContent = content;
  const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleanContent = jsonMatch[1];
  } else {
    // If no markdown block, ensure we start and end with { }
    const startIndex = cleanContent.indexOf('{');
    const endIndex = cleanContent.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      cleanContent = cleanContent.substring(startIndex, endIndex + 1);
    }
  }

  try {
    const parsed = JSON.parse(cleanContent);
    // Parse keywords into an array
    let keywordArray = [];
    if (Array.isArray(parsed.keywords)) {
      keywordArray = parsed.keywords.map(k => String(k).trim());
    } else if (typeof parsed.keywords === 'string') {
      keywordArray = parsed.keywords.split(',').map(k => k.trim()).filter(k => k);
    }

    // Strictly enforce keyword count from config
    const targetCount = config?.keywordCount || 49;
    if (keywordArray.length > targetCount) {
      keywordArray = keywordArray.slice(0, targetCount);
    }
    parsed.keywords = keywordArray.join(', ');

    // Strictly enforce title length from config
    const maxTitleLen = config?.titleLength || 120;
    if (parsed.title && parsed.title.length > maxTitleLen) {
      parsed.title = parsed.title.substring(0, maxTitleLen).trim();
      // Clean up any trailing commas or spaces if we cut a word
      parsed.title = parsed.title.replace(/[, ]+$/, '');
    }
    return parsed;
  } catch (err) {
    console.error("Failed to parse JSON from API response:", content);
    throw new Error("Failed to parse metadata from AI response.", { cause: err });
  }
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG to save payload size
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = e.target.result;
    };
    reader.onerror = error => reject(error);
  });
};

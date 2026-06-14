import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === '') {
      return NextResponse.json(
        { 
          error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in your .env.local file.' 
        }, 
        { status: 400 }
      );
    }

    // Initialize the official Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `以下の料理レシピテキストから、料理名、何人前か、下ごしらえ時間、調理時間、材料リスト（分量・単位に分解）、手順リストを解析して構造化してください。

【重要な指示】:
1. テキストの「材料」セクションに調味料などの具体的な分量が記載されていなくても、「手順（ステップ）」セクションの中に具体的な使用量（例: 「醤油大さじ1」「砂糖小さじ1」など）が記述されていることがあります。手順を含めたテキスト全体から各材料の分量を注意深く抽出し、材料リスト（ingredients）に必ず反映させてください。
2. 同じ材料がレシピ内（手順内など）で複数回、異なる分量や異なるステップで登場する場合（例: 手順3で「醤油小さじ1/2」、手順5で「醤油大さじ1」など）は、それらを1つに合算しようとせず、**使用するステップごとに別の材料アイテムとして分けて材料リスト（ingredients）に抽出してください**。その際、区別できるように材料名に「醤油（下味用）」や「醤油（仕上げ用）」のように用途を付記してください。
3. レシピテキストの冒頭や途中に「朝の仕込み」「事前準備」「下準備」などの工程が書かれている場合は、それらを見落とさず、**作り方の手順リスト（steps）の最初のステップ（ステップ1）として必ず手順に含めてください**。その際、後続の手順のステップ番号（stepNumber）が1から順番に連番（1, 2, 3...）になるよう、正しく番号を調整してください。
4. 材料名、分量、単位を適切に分離してください。分量（amount）には数値または分数（例: "1", "2.5", "1/2", "少々"）のみを入れ、単位（unit）には単位名（例: "大さじ", "小さじ", "枚", "本", "g"）を入れてください。分量の中に「大さじ」などの単位の文字を混入させないでください。

【入力テキスト】:
${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'あなたはレシピ情報を整理して構造化JSONにする専門のAIです。与えられたレシピテキスト全体（材料リスト、ナンバリングされた手順だけでなく、テキスト冒頭にある「朝の仕込み」「下準備」などの記述も含めて）から、料理名（title）、人数（servings）、材料リスト（ingredients）、調理手順（steps）を正確に抽出してください。「朝の仕込み」などがあれば手順の最初のステップとして組み込み、連番を正しく調整してください。同じ材料が複数回登場する場合はステップごとに分けて材料リストに抽出し、分量と単位の分離を徹底してください。',
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: '料理名。料理名が明確でない場合は「AI解析レシピ」などとする。' },
            servings: { type: 'INTEGER', description: '何人前か。テキストに記載がない場合はデフォルトで 2 とする。' },
            description: { type: 'STRING', description: 'レシピのメモや概要、コツなどがあれば。ない場合は空文字列とする。' },
            prepTime: { type: 'INTEGER', description: '下ごしらえ時間（分単位の数値）。不明な場合は 0 または null とする。' },
            cookTime: { type: 'INTEGER', description: '調理時間（分単位の数値）。不明な場合は 0 または null とする。' },
            ingredients: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING', description: '材料名（例: 豚バラ肉、キャベツ、しょうゆ）' },
                  amount: { type: 'STRING', description: '分量の数値（例: 200、1/2、3）' },
                  unit: { type: 'STRING', description: '分量の単位（例: g、個、大さじ、適量）。単位がない場合は空文字列とする。' }
                },
                required: ['name', 'amount', 'unit']
              }
            },
            steps: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  stepNumber: { type: 'INTEGER', description: 'ステップの順番（1, 2, 3...）' },
                  instruction: { type: 'STRING', description: '手順の説明文。' }
                },
                required: ['stepNumber', 'instruction']
              }
            }
          },
          required: ['title', 'servings', 'ingredients', 'steps']
        }
      }
    });

    const parsedText = response.text;
    if (!parsedText) {
      return NextResponse.json({ error: 'AI failed to generate a response' }, { status: 500 });
    }

    const recipeData = JSON.parse(parsedText);
    return NextResponse.json(recipeData);

  } catch (error: any) {
    console.error('Error parsing recipe with Gemini:', error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

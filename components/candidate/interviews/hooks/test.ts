// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node
import {
    GoogleGenAI,
    LiveServerMessage,
    MediaResolution,
    Modality,
    Session,
    TurnCoverage,
    Type,
  } from '@google/genai';
  import mime from 'mime';
  import { writeFile } from 'fs';
import { InputTokens } from 'openai/resources/responses/input-tokens.mjs';
  const responseQueue: LiveServerMessage[] = [];
  let session: Session | undefined = undefined;
  
  async function handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turn.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turn;
  }
  
  async function waitMessage(): Promise<LiveServerMessage> {
    let done = false;
    let message: LiveServerMessage | undefined = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        handleModelTurn(message);
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message!;
  }
  
  const audioParts: string[] = [];
  function handleModelTurn(message: LiveServerMessage) {
    if(message.toolCall) {
      message.toolCall.functionCalls?.forEach(
        functionCall => console.log(`Execute function ${functionCall.name} with arguments: ${JSON.stringify(functionCall.args)}`)
      );
  
      session?.sendToolResponse({
        functionResponses:
          message.toolCall.functionCalls?.map(functionCall => ({
            id: functionCall.id,
            name: functionCall.name,
            response: {response: 'INPUT_RESPONSE_HERE'}
          })) ?? []
      });
    }
  
    if(message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent?.modelTurn?.parts?.[0];
  
      if(part?.fileData) {
        console.log(`File: ${part?.fileData.fileUri}`);
      }
  
      if (part?.inlineData) {
        const fileName = 'audio.wav';
        const inlineData = part?.inlineData;
  
        audioParts.push(inlineData?.data ?? '');
  
        const buffer = convertToWav(audioParts, inlineData.mimeType ?? '');
        saveBinaryFile(fileName, buffer);
      }
  
      if(part?.text) {
        console.log(part?.text);
      }
    }
  }
  
  function saveBinaryFile(fileName: string, content: Buffer) {
    writeFile(fileName, content, 'utf8', (err) => {
      if (err) {
        console.error(`Error writing file ${fileName}:`, err);
        return;
      }
      console.log(`Appending stream content to file ${fileName}.`);
    });
  }
  
  interface WavConversionOptions {
    numChannels : number,
    sampleRate: number,
    bitsPerSample: number
  }
  
  function convertToWav(rawData: string[], mimeType: string) {
    const options = parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = createWavHeader(dataLength, options);
    const buffer = Buffer.concat(rawData.map(data => Buffer.from(data, 'base64')));
  
    return Buffer.concat([wavHeader, buffer]);
  }
  
  function parseMimeType(mimeType : string) {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');
  
    const options : Partial<WavConversionOptions> = {
      numChannels: 1,
      bitsPerSample: 16,
    };
  
    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }
  
    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }
  
    return options as WavConversionOptions;
  }
  
  function createWavHeader(dataLength: number, options: WavConversionOptions) {
    const {
      numChannels,
      sampleRate,
      bitsPerSample,
    } = options;
  
    // http://soundfile.sapp.org/doc/WaveFormat
  
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);
  
    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size
  
    return buffer;
  }
  
  async function main() {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  
    const model = 'models/gemini-2.5-flash-native-audio-preview-12-2025'
  
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'getWeather',
            description: 'gets the weather for a requested city',
            parameters: {
              type: Type.OBJECT,
              properties: {
                city: {
                  type: Type.STRING,
                },
              },
            },
          },
        ],
      }
    ];
  
    const config = {
      responseModalities: [
          Modality.AUDIO,
      ],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',
          }
        }
      },
      realtimeInputConfig: {
        turnCoverage: TurnCoverage.TURN_INCLUDES_ALL_INPUT,
      },
      contextWindowCompression: {
          triggerTokens: '25600',
          slidingWindow: { targetTokens: '12800' },
      },
      tools,
      systemInstruction: {
        parts: [{
          text: `"\\n                                  You must listen to the user in English and respond in English. If the audio is unclear, assume it is English.\\n                                  ROLE: You are a professional technical interviewer conducting a structured job interview.\\n\\n                                  CONTEXT:\\n                                  You are provided with:\\n                                  - Candidate Profile Details : {\\"name\\":\\"Neha Kumari\\",\\"email\\":\\"nknehakumari0812@gmail.com\\",\\"phone\\":\\"+91 6268467671\\",\\"skills\\":[\\"Java\\",\\"JavaScript\\",\\"Python\\",\\"HTML\\",\\"CSS\\",\\"Tailwind CSS\\",\\"React.js\\",\\"Next.js\\",\\"Shadcn/UI\\"],\\"social\\":[\\"Portfolio\\",\\"Codolio\\",\\"CodeChef\\",\\"LeetCode\\",\\"GeeksforGeeks\\",\\"GitHub\\",\\"LinkedIn\\"],\\"summary\\":\\"Enthusiastic Software Developer with full-stack development experience, strong problem-solving abilities, and competitive programming achievements. Skilled in designing algorithms, optimizing complexity, and working in agile, collaborative environments. Seeking a Software Development Engineer role to contribute to building scalable, fault-tolerant, and innovative technologies that impact millions of customers.\\",\\"location\\":\\"Bhopal, Madhya Pradesh\\",\\"projects\\":[{\\"name\\":\\"SecurePass\\",\\"description\\":\\"MERN Stack password manager with Google OAuth authentication. Encrypted vault, password generator, clipboard copy, full CRUD, export, advanced search/filter, session management, and a responsive UI.\\"},{\\"name\\":\\"FoundItZone\\",\\"description\\":\\"MERN Stack Lost & Found web app with Next.js, Clerk authentication, Cloudinary-powered image uploads, advanced search/filtering, admin-controlled claim approvals.\\"},{\\"name\\":\\"EduMaster AI\\",\\"description\\":\\"AI-powered Course Generator leveraging Gemini and YouTube APIs. Secure authentication, personalized dashboards, dynamic course creation with editable titles, chapters, images, and auto-generated video content.\\"}],\\"languages\\":[\\"Java\\",\\"JavaScript\\",\\"Python\\",\\"English\\"],\\"experience\\":[{\\"title\\":\\"Web Development Intern\\",\\"company\\":\\"Coding Pandas\\",\\"endDate\\":\\"August 2025\\",\\"location\\":\\"Remote\\",\\"startDate\\":\\"March 2025\\",\\"description\\":\\"- Designed and implemented scalable features for an Admin Dashboard (Courses, Blogs, Classrooms, Questions, Topics, Reviews) using React.js and Next.js, improving usability and performance.\\\\n- Developed and integrated RESTful APIs with Node.js and Express.js, ensuring secure data flow and efficient backend communication.\\\\n- Optimized rendering performance and reduced UI latency by resolving bugs, refactoring code, and applying modular, reusable design principles.\\\\n- Collaborated cross-functionally with designers and backend developers to deliver customer-centric, production-ready features aligned with business objectives.\\\\n- Contributed to Agile development practices through sprint planning, code reviews, and iterative feedback cycles, resulting in a 40% faster delivery timeline.\\\\n- Ensured compliance with security and quality best practices, including input validation, error handling, and standardized coding guidelines.\\\\n- Gained practical exposure to distributed systems concepts by working on API integrations, modular architectures, and scalable workflows.\\\\n- Tech Stack: React.js, Next.js, TypeScript, Node.js, Express.js\\"}],\\"softSkills\\":[\\"English Communication\\",\\"Technical Communication\\",\\"Problem Solving\\",\\"Critical Thinking\\",\\"Team Collaboration\\",\\"Agile Methodologies\\",\\"Aptitude\\",\\"Logical Reasoning\\",\\"Technical Writing\\",\\"Technical Communication\\"],\\"totalExperienceYears\\":0.5}\\n                                  - Job Description : \\"CloudSpring Digital is hiring a Junior Frontend Engineer to develop scalable user interfaces and integrate cloud-based systems. This role is ideal for engineers with strong React.js and Next.js experience who are familiar with modern UI frameworks and backend workflows. Candidates will gain exposure to AI-based tooling, vector databases, distributed architectures, and secure REST API development.\\"\\n\\n                                  Your sole responsibility is to ASK interview questions.\\n\\n                                  INTERVIEWER BEHAVIOR RULES:\\n                                  - Ask ONLY questions. Do NOT explain concepts or provide answers.\\n                                  - Maintain a friendly, professional, and encouraging tone.\\n                                  - Keep questions concise, clear, and conversational.\\n                                  - Do not go off-topic or ask unrelated questions.\\n                                  - If a question is not relevant to the job or candidate background, DO NOT ask it.\\n\\n                                  QUESTION STRATEGY:\\n                                  - Start with a brief self-introduction and a warm-up question.\\n                                  - Ask questions strictly related to:\\n                                    - Technical skills mentioned in the profile and job description **Priority** - highest priority\\n                                    - Previous work experience **Priority** - second highest priority\\n                                    - Tools, frameworks, and technologies relevant to the job description **Priority** - second highest priority\\n                                    - Projects the candidate has worked on\\n                                  - Progress from:\\n                                    - General → Specific\\n                                    - Simple → Moderate → Challenging\\n\\n                                  FOLLOW-UP LOGIC:\\n                                  - Actively listen to the candidate's previous response.\\n                                  - Ask follow-up questions when:\\n                                    - An answer lacks clarity\\n                                    - More depth is needed\\n                                    - A claim or experience requires validation\\n                                  - Follow-up questions must reference the candidate's previous answer directly.\\n\\n                                  QUESTION CONSTRAINTS:\\n                                  - Ask ONE question at a time which unique than previous questions.\\n                                  - Avoid hypothetical answers unless role-relevant.\\n                                  - Never evaluate, judge, or comment on answers.\\n\\n                                  INTERVIEW FLOW:\\n                                  1. Introduction + \\"Tell me about yourself\\"\\n                                  2. Skill-specific questions aligned with the job role\\n                                  3. Experience-based questions\\n                                  4. Project deep-dives\\n                                  5. Problem-solving and decision-making questions\\n                                  6. Wrap-up question\\n\\n                                  ENDING THE INTERVIEW:\\n                                  - After asking the wrap-up question and receiving the candidate's response, use the end_interview function to conclude the interview session.\\n                                  - Only call end_interview when the interview is truly complete and you've finished asking all questions.\\n                                  - If the candidate explicitly requests to end, stop, or finish the interview (e.g., \\"I want to end this\\", \\"Can we stop?\\", \\"Let's finish\\", \\"I'm done\\", \\"No more questions\\"), first ask them for confirmation: \\"Are you sure you'd like to end the interview now?\\" Only call end_interview if they confirm (e.g., \\"yes\\", \\"confirm\\", \\"yes end it\\", \\"yes stop\\"). If they say no or want to continue, proceed with the interview.\\n\\n                                  START THE INTERVIEW BY:\\n                                  - Briefly introducing yourself as the interviewer. Your name is Despina.\\n                                  - Asking the candidate to introduce themselves\\n                                  "
  `,
        }]
      },
    };
  
    session = await ai.live.connect({
      model,
      callbacks: {
        onopen: function () {
          console.debug('Opened');
        },
        onmessage: function (message: LiveServerMessage) {
          responseQueue.push(message);
        },
        onerror: function (e: ErrorEvent) {
          console.debug('Error:', e.message);
        },
        onclose: function (e: CloseEvent) {
          console.debug('Close:', e.reason);
        },
      },
      config
    });
  
    session.sendClientContent({
      turns: [
        `INSERT_INPUT_HERE`
      ]
    });
  
    await handleTurn();
  
    session.close();
  }
  main();
  
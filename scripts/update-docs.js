#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename, extname } from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getChangedFiles() {
  try {
    const output = execSync('git diff --name-status origin/main...HEAD', {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [status, path] = line.split('\t');
        return { path, status };
      })
      .filter(file => file.path.endsWith('.ts') || file.path.endsWith('.tsx'));
  } catch (error) {
    console.error('Error getting changed files:', error);
    return [];
  }
}

async function generateDocumentation(filePath, fileContent) {
  const prompt = `You are contributing to the existing documentation of this web application, which is built with fumadocs.dev. Follow these strict rules:

1. **Preserve Structure & Styling**
   - Do not alter the overall structure, folder organization, or formatting style of the documentation.
   - Follow the same headings, component usage, Markdown/MDX conventions, and tone already established.

2. **Content Accuracy**
   - Only document functionality, workflows, or APIs that are explicitly present in the source code, configuration, or screenshots.
   - If you are unsure about a detail, do NOT invent or speculate. Instead, write a clear TODO note:
     \`\`\`
     <!-- TODO: Needs confirmation of behavior/parameters -->
     \`\`\`
   - Never describe features, behaviors, or integrations unless they are directly supported by evidence.

3. **Clarity for All Users**
   - Explanations must be clear for both technical and non-technical users.
   - Provide real examples, edge cases, and error scenarios ONLY if you see them defined in the codebase or screenshots.
   - Use consistent terminology with the rest of the documentation.

4. **Screenshots**
   - If relevant screenshots exist in \`/public/images/screenshots/<section>/\`, embed them directly in the correct section using Markdown image syntax:
     \`\`\`
     ![Descriptive alt text](/images/screenshots/<section>/<filename>.png)
     \`\`\`
   - Select the screenshot whose title best matches the described functionality.
   - Do not add screenshots unless they directly illustrate existing functionality.

5. **Voice & Style**
   - Maintain the current documentation's professional, helpful, and approachable tone.
   - Write step-by-step guides where useful.
   - Include code snippets ONLY if they are present in the codebase or add proven technical clarity.

6. **Do Not Overwrite**
   - Do not modify or delete existing sections unless explicitly instructed.
   - Only add or extend documentation in the appropriate section.

7. **Evidence-First Rule**
   - For every claim, ensure it is grounded in code or screenshots.
   - If evidence is missing, mark with a TODO and do not invent behavior.
   - Prefer incomplete but correct documentation over inaccurate or speculative documentation.

---
Task: Create or update documentation for: ${filePath}
Here is the code:
${fileContent}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`Error generating documentation for ${filePath}:`, error);
    return '';
  }
}

function saveDocumentation(filePath, content) {
  const fileName = basename(filePath, extname(filePath));
  const docsDir = join(process.cwd(), 'docs', 'sections');

  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = join(docsDir, `${fileName}.md`);
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`📝 Generated documentation: ${outputPath}`);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🔍 Detecting changed TypeScript files...');
  const changedFiles = await getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('✅ No TypeScript files have been changed');
    return;
  }

  console.log(`📋 Found ${changedFiles.length} changed file(s):`);
  changedFiles.forEach(file => {
    console.log(`  ${file.status} ${file.path}`);
  });

  for (const file of changedFiles) {
    try {
      console.log(`\n🔄 Processing ${file.path}...`);

      const fileContent = readFileSync(file.path, 'utf-8');
      const documentation = await generateDocumentation(file.path, fileContent);

      if (documentation.trim()) {
        saveDocumentation(file.path, documentation);
      } else {
        console.log(`⚠️ No documentation generated for ${file.path}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file.path}:`, error);
    }
  }

  console.log('\n🎉 Documentation update complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

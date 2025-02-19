import markdownIt from "markdown-it"
const md = new markdownIt()

function getMarkdownAST(markdownText) {
    const tokens = md.parse(markdownText, {})

    function processToken(token) {
        const node = {
            type: token.type,
            tag: token.tag,
            content: token.content,
            level: token.level,
            children: [],
        }

        // Add additional properties if they exist
        if (token.markup) node.markup = token.markup
        if (token.info) node.info = token.info
        if (token.attrs) node.attrs = token.attrs

        // Process nested tokens
        if (token.children && token.children.length > 0) {
            node.children = token.children.map((child) =>
                processToken(child)
            )
        }

        return node
    }

    const ast = tokens.map((token) => processToken(token))
    return ast
}

// Example usage
const markdownText = `# Hello World
This is a **bold** paragraph with *italic* text.

- List item 1
- List item 2
  - Nested item

\`\`\`javascript
console.log('Hello');
\`\`\`
`

const ast = getMarkdownAST(markdownText)
console.log(JSON.stringify(ast, null, 2))

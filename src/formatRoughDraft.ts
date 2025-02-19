import markdownIt from "markdown-it"
import prettier from "prettier"
import markdownItFootnote from "markdown-it-footnote"
import parseHtmlToReact from "html-react-parser"


// Parse markdown to tokens

const properNouns = new Set([
    "john",
    "mary",
    "london",
    "paris",
    "google",
    "microsoft",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
])

const pronouns = new Set([
    "i",
    // 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    // 'me', 'him', 'her', 'us', 'them',
    // 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves'
])

const titles = new Set(["mr", "mrs", "dr", "ms", "prof"])

// Main function to process markdown-it AST
function capitalizeMarkdownAST(tokens) {
    let capitalizeNext = true // Start of document should be capitalized

    // Process each token in the AST
    function processToken(token) {
        // Only process text content in text nodes
        if (token.type === "text" && token.content) {
            token.content = capitalizeTextContent(
                token.content,
                capitalizeNext,
            )
            // Update capitalizeNext based on how this content ended
            capitalizeNext = /[.!?]+["']?\s*$/.test(
                token.content,
            )
        }

        // Process children if they exist
        if (token.children && Array.isArray(token.children)) {
            token.children.forEach((child) => {
                processToken(child)
            })
        }
    }

    // Process the entire token array
    tokens.forEach((token) => {
        processToken(token)
    })

    return tokens
}

// Function to capitalize text content
function capitalizeTextContent(text, startWithCapital) {
    let result = ""
    let capitalizeNext = startWithCapital
    let inQuote = false

    // Split text while preserving sentence boundaries
    const sentences = text.split(/([.!?]+["']?\s+|\n+)/)

    for (const sentence of sentences) {
        // Split into words while preserving quotes and spaces
        const words = sentence.split(/(\s+|["'])/)

        for (const word of words) {
            // Skip empty strings and whitespace
            if (!word || /^\s+$/.test(word)) {
                result += word
                continue
            }

            // Handle quotes
            if (word === '"') {
                inQuote = !inQuote
                result += word
                continue
            }

            const lower = word.toLowerCase()
            let shouldCapitalize = false

            // Apply capitalization rules
            if (
                capitalizeNext || // Start of sentence
                pronouns.has(lower) || // Pronouns
                properNouns.has(lower) || // Proper nouns
                titles.has(lower.replace(/\.?$/, "")) // Titles
            ) {
                shouldCapitalize = true
            }

            // Apply capitalization
            result += shouldCapitalize
                ? word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
                : word

            // Reset capitalizeNext
            capitalizeNext = false

            // Check if next word should be capitalized
            if (/[.!?]+["']?\s*$/.test(word)) {
                capitalizeNext = true
            }

            if (word.includes("\n")) {
                capitalizeNext = true
            }
        }
    }

    return result
}

//
const markdown = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
}).use(markdownItFootnote)

function format(s) {
    const tokens = markdown.parse(s, {})
    const capitalizedTokens = capitalizeMarkdownAST(tokens)
    const result = markdown.renderer.render(
        capitalizedTokens,
        markdown.options,
    )
    // console.log(
    const html = prettier.format(result, { parser: "html" })
    console.log("html", html)
}


const s = `
hello! i'm dr. smith from london.

"how are you?" he asked mary on monday.

* i think this list.
* should work properly.
* even with mr. jones here.
`

function renderToStandaloneHtml(root: React.ReactNode) {
  const raw = ReactDOMServer.renderToString(root);
  return "<!DOCTYPE html>\n" + prettier.format(raw, { parser: "html" })
}

// console.log(format(s))

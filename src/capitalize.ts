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

// Common English pronouns to be capitalized
const pronouns = new Set([
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "myself",
    "yourself",
    "himself",
    "herself",
    "itself",
    "ourselves",
    "themselves",
])

// Honorific titles that should be capitalized (e.g., Mr., Dr.)
const titles = new Set(["mr", "mrs", "dr", "ms"])

function capitalize(text) {
    let result = ""
    let capitalizeNext = true // Controls if next word should be capitalized
    let inQuote = false // Tracks if we're inside quotation marks

    // Split text into chunks that preserve sentence boundaries and delimiters
    const sentences = text.split(/([.!?]+["']?\s+|\n+)/)

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i]
        // Split each sentence into words while preserving quotes and spaces
        const words = sentence.split(/(\s+|["'])/)

        for (let j = 0; j < words.length; j++) {
            let word = words[j]

            // Skip empty strings and pure whitespace
            if (!word || /^\s+$/.test(word)) {
                result += word
                continue
            }

            // Handle quote marks - toggle inQuote state
            if (word === '"') {
                inQuote = !inQuote
                result += word
                // Don't capitalize after closing quote unless at sentence start
                if (!inQuote) {
                    capitalizeNext = false
                }
                continue
            }

            const lower = word.toLowerCase()
            let shouldCapitalize = false

            // Check various capitalization rules
            if (
                capitalizeNext || // Start of sentence or after punctuation
                pronouns.has(lower) || // Is a pronoun
                properNouns.has(lower) // Is a proper noun
            ) {
                shouldCapitalize = true
            } else {
                // Check if word is a title (with or without period)
                const baseName = lower.replace(/\.?$/, "")
                if (titles.has(baseName)) {
                    shouldCapitalize = true
                }
            }

            // Apply capitalization if needed
            if (shouldCapitalize) {
                word = word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
            }

            result += word

            // Reset capitalizeNext flag
            capitalizeNext = false

            // Set capitalizeNext to true if this word ends with sentence-ending punctuation
            if (/[.!?]+["']?\s*$/.test(word)) {
                capitalizeNext = true
            }

            // Set capitalizeNext to true if word contains newline
            if (word.includes("\n")) {
                capitalizeNext = true
            }
        }
    }

    return result
}

if Deno.impo
// Test cases
const tests = [
    `hello! i'm dr. smith from london.`,
    `"how are you?" he asked mary on monday.`,
    `mr. jones went to paris. she liked it there.`,
    `i think, therefore i am. "am i?" she asked.`,
    `hello!\ni'm dr. smith.\n"how are you?" he asked.`,
]

// Run tests
tests.forEach((test) => {
    console.log("Input:", test)
    console.log("Output:", capitalize(test))
    console.log("---")
})

/*
Expected outputs:
"Hello! I'm Dr. Smith from London."
"How are you?" He asked Mary on Monday.
"Mr. Jones went to Paris. She liked it there."
"I think, therefore I am. "Am I?" She asked."
"Hello!
I'm Dr. Smith.
"How are you?" He asked."
*/

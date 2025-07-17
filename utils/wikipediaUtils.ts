/**
 * Get a random Wikipedia article URL.
 */
async function getRandomArticleUrl(): Promise<string> {
    const res = await fetch("https://en.wikipedia.org/wiki/Special:Random", { redirect: "follow" });
    return res.url;
}

function getTitleFromUrl(url: string): string {
    const parts = url.split("/wiki/");
    return decodeURIComponent(parts[1] || "");
}

type WikipediaLinkResponse = {
    query: {
        pages: {
            [pageId: string]: {
                links?: { title: string }[];
            };
        };
    };
    continue?: {
        plcontinue: string;
    };
}

/**
 * Get outgoing article URLs linked from a given Wikipedia page.
 */
export async function getOutgoingArticleUrls(articleUrl: string): Promise<string[]> {
    const articleTitle = getTitleFromUrl(articleUrl);
    const baseUrl = `https://en.wikipedia.org/w/api.php`;
    const allLinks: string[] = [];
    let plcontinue: string | undefined;

    do {
        const params = new URLSearchParams({
            action: "query",
            prop: "links",
            pllimit: "max",
            format: "json",
            origin: "*",
            titles: articleTitle,
        });

        if (plcontinue) {
            params.set("plcontinue", plcontinue);
        }

        const res = await fetch(`${baseUrl}?${params}`);
        const data = await res.json() as WikipediaLinkResponse;

        const page = Object.values(data.query.pages)[0] as { links?: { title: string }[] };
        const links = page.links ?? [];

        for (const link of links) {
            if (!link.title.startsWith("List of") && !link.title.includes(":")) {
                allLinks.push(`https://en.wikipedia.org/wiki/${encodeURIComponent(link.title)}`);
            }
        }

        plcontinue = data.continue?.plcontinue;
    } while (plcontinue);

    return allLinks;
}

/**
 * Given a starting article, walk exactly `steps` random hops and return the ending article URL.
 */
async function walkRandomPath(startUrl: string, steps: number): Promise<string> {
    const visited = new Set<string>();
    let currentUrl = startUrl;

    for (let i = 0; i < steps; i++) {
        visited.add(currentUrl);

        const links = await getOutgoingArticleUrls(currentUrl);
        const candidates = links.filter(url => !visited.has(url));

        if (candidates.length === 0) {
            console.log(`Dead end at step ${i} for URL: ${currentUrl}`);
            throw new Error(`Dead end after ${i} steps at ${currentUrl}`);
        }

        currentUrl = candidates[Math.floor(Math.random() * candidates.length)];
    }

    console.log(visited);

    return currentUrl;
}

/**
 * Get a random start and end article URL, where the end is 3-5 steps away.
 */
export async function getRandomStartAndEnd(): Promise<{ startingArticleUrl: string, endingArticleUrl: string, minSteps: number }> {
    let startingArticleUrl = await getRandomArticleUrl();
    let endingArticleUrl: string;
    let minSteps = 0;

    while (true) {
        try {
            minSteps = Math.floor(Math.random() * 3) + 3; // 3 to 5 inclusive
            endingArticleUrl = await walkRandomPath(startingArticleUrl, minSteps);
            break;
        } catch (err) {
            console.error(err);
            startingArticleUrl = await getRandomArticleUrl();
            console.log(`Retrying with new start article: ${startingArticleUrl}`);
        }
    }

    return {
        startingArticleUrl,
        endingArticleUrl,
        minSteps
    };
}

/**
 * Extracts and normalizes a Wikipedia article title from a URL.
 */
function getNormalizedTitle(url: string): string {
    const parts = url.split("/wiki/");
    if (parts.length < 2) {
        console.log(`Invalid Wikipedia URL: ${url}`);
        throw new Error(`Invalid Wikipedia URL: ${url}`);
    }
    // Decode and convert underscores to spaces
    return decodeURIComponent(parts[1]).replace(/_/g, " ").trim();
}

/**
 * Compares two Wikipedia article URLs to see if they point to the same article.
 */
export function areArticlesTheSame(urlA: string, urlB: string): boolean {
    const titleA = getNormalizedTitle(urlA).toLowerCase();
    const titleB = getNormalizedTitle(urlB).toLowerCase();
    return titleA === titleB;
}

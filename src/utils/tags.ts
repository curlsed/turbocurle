
import {getCollection} from "astro:content";

export const getTags = async () => {
    const posts = (await getCollection('blog')).sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );

    const allTags = posts.map((post) => post.data.tags).flat();
    let tagMap: Record<string, number> = {};

    allTags.forEach((tag) => {
        if (tagMap[tag]) {
            tagMap[tag]++;
        } else {
            tagMap[tag] = 1;
        }
    });

    return Object.entries(tagMap).map(([name, count]) => ({
        name,
        count,
    }));
}




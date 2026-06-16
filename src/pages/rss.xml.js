import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
  const posts = await getCollection('blog');
  const projects = await getCollection('projects');
  const notes = await getCollection('notes');

  const items = [...posts, ...projects, ...notes]
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((entry) => {
      if (projects.includes(entry)) {
        return { ...entry.data, link: `/projects/${entry.id}/` };
      }
      if (notes.includes(entry)) {
        return { ...entry.data, link: `/notes/${entry.id}/` };
      }
      return { ...entry.data, link: `/blog/${entry.id}/` };
    });

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
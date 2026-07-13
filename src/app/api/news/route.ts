import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'Tecnologia';
  const subtopic = searchParams.get('subtopic') || '';
  const sourceType = searchParams.get('sourceType') || 'google';
  const customRssUrl = searchParams.get('customRssUrl') || '';
  const refreshInterval = parseInt(searchParams.get('refreshInterval') || '1', 10);

  const revalidate = refreshInterval * 3600;

  try {
    const items = [];

    if (sourceType === 'tabnews') {
      // Fetch from TabNews API
      const res = await fetch(`https://www.tabnews.com.br/api/v1/contents?strategy=relevant`, {
        next: { revalidate }
      });
      if (res.ok) {
        const data = await res.json();
        for (let i = 0; i < Math.min(10, data.length); i++) {
          const item = data[i];
          items.push({
            title: item.title,
            link: `https://www.tabnews.com.br/${item.owner_username}/${item.slug}`,
            pubDate: item.published_at,
            source: "TabNews",
            description: `Publicado por ${item.owner_username} • ${item.tabcoins} tabcoins`,
          });
        }
      }
    } else {
      // Fetch RSS (Google or Custom)
      let rssUrl = "";
      let sourceName = "RSS";
      
      if (sourceType === 'custom_rss' && customRssUrl) {
        rssUrl = customRssUrl;
        sourceName = "Custom Feed";
      } else {
        const query = subtopic ? `"${topic}" "${subtopic}"` : `"${topic}"`;
        rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        sourceName = "Google News";
      }

      const response = await fetch(rssUrl, { next: { revalidate } });
      
      if (response.ok) {
        const xml = await response.text();
        
        // Simple XML parser with Regex
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 10) {
          const itemContent = match[1];
          const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
          const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
          const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);

          if (titleMatch && linkMatch) {
            let title = titleMatch[1].replace("<![CDATA[", "").replace("]]>", "").trim();
            if (sourceType === 'google') {
              title = title.split(" - ")[0]; // Remove source from title
            }
            
            let description = descMatch ? descMatch[1].replace("<![CDATA[", "").replace("]]>", "").replace(/<[^>]*>?/gm, '').trim() : "";
            if (description.length > 150) description = description.substring(0, 150) + "...";
            
            let specificSource = sourceName;
            if (sourceMatch) {
              specificSource = sourceMatch[1].replace("<![CDATA[", "").replace("]]>", "").trim();
            }

            items.push({
              title,
              link: linkMatch[1].trim(),
              pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
              description,
              source: specificSource
            });
            count++;
          }
        }
      } else {
         throw new Error(`Failed to fetch RSS: ${response.status}`);
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ items: [], error: String(error) }, { status: 500 });
  }
}

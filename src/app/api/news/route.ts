import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'Tecnologia';
  const subtopic = searchParams.get('subtopic') || '';

  const query = subtopic ? `"${topic}" "${subtopic}"` : `"${topic}"`;

  try {
    // Busca do Google News Brasil
    const response = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, {
      next: { revalidate: 3600 } // cache por 1 hora
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }
    
    const xml = await response.text();
    const items = [];
    
    // Parser simples com Regex para não depender de libs externas no Edge/Node
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 5) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        let title = titleMatch[1].replace("<![CDATA[", "").replace("]]>", "").trim();
        // Remove a fonte do título se vier com "- Fonte" no final
        title = title.split(" - ")[0];

        items.push({
          title,
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
        });
        count++;
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
